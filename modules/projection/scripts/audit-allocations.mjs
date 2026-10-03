// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original source audit: explicit allocation sites are evidence, not a heap-allocation proof.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import ts from 'typescript';
import {codeFingerprint} from './benchmark-metadata.mjs';

const {values} = parseArgs({options: {check: {type: 'boolean'}, output: {type: 'string'}}});
const root = fileURLToPath(new URL('../src/', import.meta.url));
const setupHelpers = new Set(['common/authset.ts', 'common/pj_enfn.ts']);
const coordinateFunctions = new Set([
  'run',
  'interpolate',
  'shiftSubgrid',
  'shiftInPlace',
  'getOffset',
  'sample',
  'applyDatumGrids',
  'geodeticToGeocentricInPlace',
  'geocentricToGeodeticInPlace',
  'velocity',
  'apply',
  'coordinateEpoch',
  'forwardInPlace',
  'inverseInPlace',
  'validateScalarOutput',
  'writeScalarOutput',
  'projectToSync',
  'unprojectToSync'
]);
const arrayMethods = new Set([
  'map',
  'flatMap',
  'filter',
  'slice',
  'concat',
  'split',
  'match',
  'matchAll',
  'bind',
  'from',
  'of',
  'entries',
  'keys',
  'values',
  'assign'
]);
function files(directory) {
  return readdirSync(directory, {withFileTypes: true})
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry =>
      entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]
    )
    .filter(path => path.endsWith('.ts') && !path.endsWith('.d.ts'));
}
function scopeName(node, source) {
  if (node.name) return node.name.getText(source);
  if (ts.isVariableDeclaration(node.parent)) return node.parent.name.getText(source);
  return '<callback>';
}
function coordinateScope(node, path, source) {
  let inLoop = false;
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (
      ts.isForStatement(parent) ||
      ts.isForOfStatement(parent) ||
      ts.isWhileStatement(parent) ||
      ts.isDoStatement(parent)
    )
      inLoop = true;
    if (!ts.isFunctionLike(parent) || !parent.body) continue;
    const name = scopeName(parent, source);
    if (path.startsWith('experimental/kernels/') || path.startsWith('experimental/common/')) {
      if (path === 'experimental/kernels/omerc.ts' && name === 'isTypeA') return false;
      if (
        path === 'experimental/kernels/robin.ts' &&
        ts.isArrowFunction(parent) &&
        ts.isCallExpression(parent.parent)
      ) {
        let outerFunction = false;
        for (let outer = parent.parent; outer; outer = outer.parent)
          if (ts.isFunctionLike(outer) && outer.body) outerFunction = true;
        if (!outerFunction) return false;
      }
      if (setupHelpers.has(path.replace('experimental/', ''))) return false;
      if (name === 'createState' || name === 'initialize') return false;
      return true;
    }
    // Equation callbacks are created at construction, but their bodies run per coordinate.
    if (
      ts.isCallExpression(parent.parent) &&
      parent.parent.expression.getText(source) === 'createProjection'
    )
      return true;
    if (coordinateFunctions.has(name)) return true;
    if (inLoop && ['flat', 'transformInPlace', 'createFlatOperation'].includes(name)) return true;
  }
  return false;
}
function failurePath(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isThrowStatement(parent)) return true;
    if (ts.isFunctionLike(parent)) break;
  }
  return false;
}
const inventory = [],
  violations = [],
  paths = files(root);
for (const absolute of paths) {
  const path = relative(root, absolute).replaceAll('\\', '/');
  const source = ts.createSourceFile(
    path,
    readFileSync(absolute, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  function visit(node) {
    let kind;
    if (ts.isObjectLiteralExpression(node)) kind = 'object';
    else if (ts.isArrayLiteralExpression(node)) kind = 'array';
    else if (ts.isNewExpression(node)) kind = 'new';
    else if (ts.isRegularExpressionLiteral(node)) kind = 'regexp';
    else if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) kind = 'function';
    else if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      arrayMethods.has(node.expression.name.text)
    )
      kind = 'allocating-call';
    if (kind) {
      const scopes = [];
      for (let parent = node.parent; parent; parent = parent.parent)
        if (ts.isFunctionLike(parent) && parent.body) scopes.push(scopeName(parent, source));
      const coordinate = coordinateScope(node, path, source),
        failure = failurePath(node);
      const row = {
        path,
        line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        kind,
        scopes,
        coordinate,
        failure
      };
      inventory.push(row);
      // Module-level functions/constants and construction helpers are intentionally permitted.
      // A callback passed to createProjection is constructed once, not inside its own body.
      if (coordinate && !failure) violations.push(row);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const report = {
  schemaVersion: 1,
  sourceSHA256: codeFingerprint(),
  files: paths.length,
  methodology:
    'All projection source files parsed as TypeScript. Inventory includes object/array/regexp literals, new, function expressions and common allocating methods. Coordinate check covers numerical kernels/helpers, mutable equation callbacks and named per-coordinate dispatch/samplers. Constructor/module initialization, Oblique Mercator type selection, Robinson coefficient-table rounding and two coefficient builders are excluded from the check; thrown error arguments are failure-only. Public scalar results, lazy snapshots, per-batch scratch, custom hooks, JIT boxing, iterators, built-in internals and external code require separate review. This is a source regression guard, not a call-graph or zero-GC proof.',
  inventory,
  violations
};
console.log(
  `Audited ${paths.length} projection source files; ${inventory.length} explicit potential allocation sites; ${violations.length} coordinate-path violations.`
);
for (const row of violations)
  console.log(`${row.path}:${row.line} ${row.kind} in ${row.scopes.join('/')}`);
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
if (values.check)
  assert.equal(violations.length, 0, 'Per-coordinate explicit allocations require review');
