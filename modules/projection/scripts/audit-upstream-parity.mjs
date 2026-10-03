// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original audit harness. Tolerance semantics follow proj4js 2.22.0 test/proj4.test.mjs
// (MIT; copyright (c) 2014, proj4js authors; see ../PROJ4-LICENSE.md).
// Reads external tagged fixture files as literal data; never executes upstream test code.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {parseArgs} from 'node:util';
import ts from 'typescript';
import proj4 from 'proj4';
import * as native from '@math.gl/projection/experimental';

const {values} = parseArgs({
  options: {
    'upstream-tests': {type: 'string'},
    output: {type: 'string'},
    'fixtures-output': {type: 'string'}
  }
});
assert(values['upstream-tests'], 'Supply --upstream-tests /path/to/proj4js/test from tag v2.22.0');
assert.equal(proj4.version, '2.22.0', 'Review the audit when upgrading the reference');
const hashes = {
  'testData.js': 'd39e13b963eece8774cf8fa07290e85a7b3454a2579188865f46c1838fca1136',
  'proj4.test.mjs': '584c01e8046e153a50aae41d03cf214fd54e982a0dbdafc396d5288c9008d66b'
};
function readSource(name) {
  const contents = readFileSync(join(values['upstream-tests'], name), 'utf8');
  assert.equal(
    createHash('sha256').update(contents).digest('hex'),
    hashes[name],
    'Use unmodified v2.22.0 ' + name
  );
  return ts.createSourceFile(name, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
}
function literal(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map(property => {
        assert(ts.isPropertyAssignment(property), 'Only literal fixture properties are supported');
        return [property.name.text, literal(property.initializer)];
      })
    );
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken)
    return -literal(node.operand);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  throw new Error('Unsupported fixture expression: ' + node.getText().slice(0, 100));
}
const data = readSource('testData.js'),
  suite = readSource('proj4.test.mjs');
const initializer = data.statements
  .filter(ts.isVariableStatement)
  .flatMap(statement => [...statement.declarationList.declarations])
  .find(declaration => declaration.name.getText() === 'testPoints')?.initializer;
assert(initializer && ts.isArrayLiteralExpression(initializer));
const fixtures = literal(initializer),
  aliases = {};
// Match only the registrations at suite scope, before individual test callbacks run.
for (const statement of suite.statements) {
  if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue;
  const call = statement.expression;
  if (call.expression.getText() !== 'proj4.defs') continue;
  const args = call.arguments.map(literal);
  for (const [name, definition] of args.length === 1 ? args[0] : [args]) {
    aliases[name] = definition;
    proj4.defs(name, definition);
  }
}
// Export only unchanged upstream inputs/expectations, never native outputs.
if (values['fixtures-output']) {
  writeFileSync(
    values['fixtures-output'],
    JSON.stringify(
      {
        source: {
          version: proj4.version,
          url: 'https://github.com/proj4js/proj4js/blob/v2.22.0/test/testData.js',
          hashes,
          license: 'MIT; copyright (c) 2014, proj4js authors. See ../../PROJ4-LICENSE.md.'
        },
        aliases,
        fixtures: fixtures.map((fixture, index) => ({
          index,
          sourceLine:
            data.getLineAndCharacterOfPosition(initializer.elements[index].getStart()).line + 1,
          ...fixture
        }))
      },
      null,
      2
    ) + '\n'
  );
}
const plugins = Object.values(native).filter(
  value => value && typeof value === 'object' && typeof value.create === 'function'
);
function options(to) {
  const wrapped = JSON.stringify(to).match(/\+o_proj=([\w]+)/)?.[1] || 'longlat';
  const plugin = plugins.find(value => value.name === wrapped || value.aliases?.includes(wrapped));
  assert(
    plugin || ['longlat', 'latlong', 'latlon', 'lonlat'].includes(wrapped),
    'Unresolved ob_tran dependency: ' + wrapped
  );
  return {
    to,
    aliases,
    projections: [...plugins, native.obliqueTransformation(plugin || 'longlat')],
    parsers: [native.wktCRSParser, native.projJSONCRSParser]
  };
}
const finite = point =>
  Array.isArray(point) &&
  point.length >= 2 &&
  Number.isFinite(point[0]) &&
  Number.isFinite(point[1]);
const delta = (a, b) =>
  finite(a) && finite(b) ? Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) : null;
function attempt(callback) {
  try {
    return {value: callback()};
  } catch (error) {
    return {error: String(error?.message || error), reason: error?.reason};
  }
}
function run(factory, fixture) {
  const instance = attempt(factory);
  if (instance.error) return {constructionError: instance.error, reason: instance.reason};
  const forward = attempt(() => instance.value.forward([...fixture.ll]));
  const inverse = attempt(() => instance.value.inverse([...fixture.xy]));
  const forwardTolerance = 10 ** -(fixture.acc?.xy ?? 2),
    inverseTolerance = 10 ** -(fixture.acc?.ll ?? 6);
  const forwardDelta = delta(forward.value, fixture.xy),
    inverseDelta = delta(inverse.value, fixture.ll);
  return {
    forward,
    inverse,
    forwardDelta,
    inverseDelta,
    forwardTolerance,
    inverseTolerance,
    pass:
      forwardDelta !== null &&
      inverseDelta !== null &&
      forwardDelta <= forwardTolerance &&
      inverseDelta <= inverseTolerance
  };
}
const rows = fixtures.map((fixture, index) => {
  const code = fixture.code;
  const kind =
    typeof code === 'object'
      ? 'PROJJSON'
      : code.startsWith('+')
        ? 'PROJ'
        : /^[A-Z0-9_]+\s*\[/.test(code)
          ? 'WKT'
          : 'alias';
  const nativeOptions = options(code); // Harness configuration failures must not count as engine rejections.
  const upstream = run(() => proj4('WGS84', code), fixture);
  const result = run(() => {
    const projection = new native.ProjectionEngine(nativeOptions);
    return {forward: projection.project, inverse: projection.unproject};
  }, fixture);
  return {
    index,
    line: data.getLineAndCharacterOfPosition(initializer.elements[index].getStart()).line + 1,
    kind,
    label: typeof code === 'object' ? code.name : code.slice(0, 110),
    code,
    ll: fixture.ll,
    xy: fixture.xy,
    upstream,
    native: result,
    liveForwardDelta: delta(result.forward?.value, upstream.forward?.value),
    liveInverseDelta: delta(result.inverse?.value, upstream.inverse?.value)
  };
});
function counts(group) {
  return {
    fixtures: group.length,
    upstreamPass: group.filter(row => row.upstream.pass).length,
    nativePass: group.filter(row => row.native.pass).length,
    constructionRejected: group.filter(row => row.native.constructionError).length,
    executionRejected: group.filter(row => row.native.forward?.error || row.native.inverse?.error)
      .length,
    numericMismatch: group.filter(
      row =>
        !row.native.pass &&
        !row.native.constructionError &&
        !row.native.forward?.error &&
        !row.native.inverse?.error
    ).length
  };
}
const summary = {
  all: counts(rows),
  byKind: Object.fromEntries(
    ['PROJ', 'WKT', 'PROJJSON', 'alias'].map(kind => [
      kind,
      counts(rows.filter(row => row.kind === kind))
    ])
  )
};
const report = {
  metadata: {
    engineRevision: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
    upstream: proj4.version,
    hashes,
    fixtureCount: fixtures.length,
    methodology:
      'Both directions against unchanged upstream fixture coordinates at each fixture tolerance. Default axis policy. All native plugins/readers and upstream suite aliases registered. Coordinate X/Y only, matching upstream fixture assertions. This is an audit, not a passing parity gate.'
  },
  summary,
  rows
};
console.log(JSON.stringify(summary, null, 2));
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
