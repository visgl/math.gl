// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original targeted AST guard; runtime numeric boxing requires separate profiling.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const root = new URL('../../../', import.meta.url);
const scopes = new Map([
  [
    'modules/core/src/local-frame.ts',
    new Set([
      'eastNorthUpBasis',
      'eastNorthUpBasisFromDirections',
      'localToFixed',
      'fixedToLocal',
      'localFrameToMatrix',
      'axisCode',
      'commitBasis',
      'commitPoint'
    ])
  ],
  [
    'modules/geospatial/src/ellipsoid-helpers/ellipsoid-transform.ts',
    new Set(['localFrameToFixedFrame'])
  ],
  ['modules/projection/src/experimental/spatial-deformation.ts', new Set(['displacement', 'apply'])]
]);
const violations = [],
  found = new Set();
for (const [path, names] of scopes) {
  const source = ts.createSourceFile(
    path,
    readFileSync(fileURLToPath(new URL(path, root)), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  function visit(node, scope) {
    const functionNode =
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node);
    const name =
      ts.isArrowFunction(node) && ts.isVariableDeclaration(node.parent)
        ? node.parent.name.getText(source)
        : functionNode
          ? node.name?.getText(source)
          : undefined;
    const scopeRoot = !scope && names.has(name);
    if (scopeRoot) {
      scope = name;
      found.add(path + ':' + scope);
    }
    if (scope) {
      const allocation =
        ts.isArrayLiteralExpression(node) ||
        ts.isObjectLiteralExpression(node) ||
        ts.isNewExpression(node) ||
        (functionNode && !scopeRoot) ||
        (ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ['map', 'slice', 'subarray', 'from', 'assign'].includes(node.expression.name.text));
      let parent = node,
        failure = false;
      while (parent) {
        if (ts.isThrowStatement(parent)) {
          failure = true;
          break;
        }
        parent = parent.parent;
      }
      if (allocation && !failure) {
        const {line} = source.getLineAndCharacterOfPosition(node.getStart(source));
        violations.push(`${path}:${line + 1} (${scope})`);
      }
    }
    ts.forEachChild(node, child => visit(child, scope));
  }
  visit(source);
}
assert.equal(
  found.size,
  [...scopes.values()].reduce((total, names) => total + names.size, 0),
  'Guarded functions must remain present'
);
assert.deepEqual(
  violations,
  [],
  'Explicit successful coordinate allocations: ' + violations.join(', ')
);
console.log(
  `Local-frame allocation guard passed for ${found.size} functions; failure errors are excluded. Runtime boxing is not covered.`
);
