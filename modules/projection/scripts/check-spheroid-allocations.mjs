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
    'modules/projection/src/bulk.ts',
    new Set([
      'isBuffer',
      'shared',
      'overlap',
      'capacity',
      'projectFlatTo',
      'unprojectFlatTo',
      'projectColumnsTo',
      'unprojectColumnsTo',
      'range',
      'epochStorage',
      'aliases',
      'epochAlias',
      'transform',
      'floatRange',
      'flat',
      'columns'
    ])
  ],
  [
    'modules/geospatial/src/ellipsoid.ts',
    new Set(['cartesianToCartographic', 'cartographicToCartesian'])
  ],
  [
    'modules/geospatial/src/ellipsoid-helpers/scale-to-geodetic-surface.ts',
    new Set(['scaleToGeodeticSurface', 'writeResult'])
  ],
  [
    'modules/core/src/spheroid.ts',
    new Set([
      'spheroidToCartesian',
      'cartesianToSpheroid',
      'exteriorInverse',
      'interiorInverse',
      'sumError',
      'productError',
      'commit'
    ])
  ],
  [
    'modules/projection/src/analysis.ts',
    new Set([
      'contains',
      'projectTo',
      'unprojectTo',
      'jacobian',
      'factors',
      'sample',
      'difference',
      'calculate'
    ])
  ],
  [
    'modules/projection/src/experimental/common/meridian-distance.ts',
    new Set(['radius', 'pair', 'meridianDistance', 'inverseMeridianDistance'])
  ],
  ['modules/geospatial/src/type-utils.ts', new Set(['toCartographicFromRadiansComponents'])],
  [
    'modules/projection/src/experimental/datum.ts',
    new Set(['geodeticToGeocentricInPlace', 'geocentricToGeodeticInPlace'])
  ]
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
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      scope = names.has(node.name?.getText(source)) ? node.name.getText(source) : undefined;
      if (scope) found.add(path + ':' + scope);
    }
    if (scope) {
      const allocation =
        ts.isArrayLiteralExpression(node) ||
        ts.isObjectLiteralExpression(node) ||
        ts.isNewExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
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
      const ownedResult =
        ts.isArrayLiteralExpression(node) &&
        ts.isParameter(node.parent) &&
        node.parent.name.getText(source) === 'result';
      if (allocation && !failure && !ownedResult) {
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
  `Spheroid allocation guard passed for ${found.size} functions; owned default results and failure errors are excluded. Runtime boxing is not covered.`
);
