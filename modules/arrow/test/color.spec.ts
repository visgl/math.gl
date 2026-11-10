// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  Dictionary,
  Int8,
  Field,
  List,
  FixedSizeList,
  Float32,
  Float64,
  Table,
  Utf8,
  vectorFromArray
} from 'apache-arrow';
import {compileArrowExpression} from '../src/expressions';
import * as colors from '../src/color';
const functions = Object.values(colors);
function run(
  expression: string,
  table = new Table({x: vectorFromArray([0, 0.5, 1, null], new Float64())})
) {
  return compileArrowExpression(expression, {inputSchema: table.schema, functions}).evaluateTable(
    table
  );
}
const rows = (vector: ReturnType<typeof run>) =>
  Array.from(vector, value =>
    value === null ? null : typeof value === 'string' ? value : Array.from(value)
  );
test('RGBA constructors clamp, propagate nulls and convert rendering channels', () => {
  expect(rows(run('COLOR_TO_RGBA8(COLOR_RGBA(x, 0.5, 2, 1))'))).toEqual([
    [0, 128, 255, 255],
    [128, 128, 255, 255],
    [255, 128, 255, 255],
    null
  ]);
  expect(rows(run('COLOR_TO_HEX(COLOR_RGB(x, 0, 0))'))).toEqual([
    '#000000ff',
    '#800000ff',
    '#ff0000ff',
    null
  ]);
});
test.each([
  ['#123', '#112233ff'],
  ['#1234', '#11223344'],
  ['#ABCDEF', '#abcdefff'],
  ['#00000000', '#00000000'],
  ['bad', null]
])('hex %s roundtrips', (input, expected) => {
  expect([...run(`COLOR_TO_HEX(COLOR_FROM_HEX("${input}"))`)]).toEqual(new Array(4).fill(expected));
});
test('mixing premultiplies alpha and keeps transparent distinct from missing', () => {
  expect(
    rows(run('COLOR_TO_HEX(COLOR_MIX(COLOR_FROM_HEX("#f000"), COLOR_FROM_HEX("#00ff"), 0.5))'))
  ).toEqual(new Array(4).fill('#0000ff80'));
  expect([...run('COLOR_TO_HEX(COLOR_WITH_ALPHA(COLOR_FROM_HEX("#f00"), 0))')]).toEqual(
    new Array(4).fill('#ff000000')
  );
});
test('continuous and diverging functions use explicit domains and clamp', () => {
  expect([...run('COLOR_TO_HEX(COLOR_SCALE(x, 0, 1, "grayscale"))')]).toEqual([
    '#000000ff',
    '#808080ff',
    '#ffffffff',
    null
  ]);
  expect([...run('COLOR_TO_HEX(COLOR_DIVERGING(x, 0, 0.5, 1, "blueRed"))')]).toEqual([
    '#2166acff',
    '#f7f7f7ff',
    '#b2182bff',
    null
  ]);
  expect([
    ...run('COLOR_TO_HEX(COLOR_RAMP(x, 0, 1, COLOR_FROM_HEX("#000"), COLOR_FROM_HEX("#fff")))')
  ]).toEqual(['#000000ff', '#808080ff', '#ffffffff', null]);
});
test('bins use exact thresholds and category lists use literal names', () => {
  expect([...run('COLOR_TO_HEX(COLOR_BINS(x, [0.5], ["#000", "#fff"]))')]).toEqual([
    '#000000ff',
    '#ffffffff',
    '#ffffffff',
    null
  ]);
  const table = new Table({kind: vectorFromArray(['road', '水', 'missing', null], new Utf8())});
  expect([
    ...run('COLOR_TO_HEX(COLOR_CATEGORY(kind, ["road", "水"], ["#f00", "#00f"]))', table)
  ]).toEqual(['#ff0000ff', '#0000ffff', null, null]);
});
test('invalid configuration and nonfinite values yield null without partial colors', () => {
  for (const expression of [
    'COLOR_SCALE(x, 1, 0, "viridis")',
    'COLOR_SCALE(x, 0, 1, "missing")',
    'COLOR_BINS(x, [1,0], ["#fff"])',
    'COLOR_CATEGORY("a", ["a","a"], ["#fff","#000"])',
    'COLOR_DIVERGING(x, 0, 0, 1, "blueRed")'
  ])
    expect(rows(run(expression))).toEqual([null, null, null, null]);
  expect(
    rows(
      run(
        'COLOR_RGB(x, 0, 0)',
        new Table({x: vectorFromArray([NaN, Infinity, -Infinity], new Float64())})
      )
    )
  ).toEqual([null, null, null]);
});
test('sliced multi-batch inputs, masks and empty tables preserve output shape', () => {
  const table = new Table({x: vectorFromArray([0, 0.5, 1], new Float64())})
    .slice(1)
    .concat(new Table({x: vectorFromArray([0], new Float64())}));
  const compiled = compileArrowExpression('COLOR_TO_RGBA8(COLOR_RGB(x, 0, 0))', {
    inputSchema: table.schema,
    functions
  });
  expect(rows(compiled.evaluateTable(table, {activeRows: new Uint8Array([1, 0, 1])}))).toEqual([
    [128, 0, 0, 255],
    null,
    [0, 0, 0, 255]
  ]);
  expect(compiled.evaluateTable(new Table(table.schema, [])).length).toBe(0);
});

test('palette endpoints clamp, invalid channels stay null, and direct kernels honor masks', () => {
  const table = new Table({x: vectorFromArray([-2, 0.5, 2], new Float64())});
  expect([...run('COLOR_TO_HEX(COLOR_SCALE(x, 0, 1, "viridis"))', table)]).toEqual([
    '#440154ff',
    '#21918cff',
    '#fde725ff'
  ]);
  expect([...run('COLOR_TO_HEX(COLOR_SCALE(x, 0, 1, "toString"))', table)]).toEqual([
    null,
    null,
    null
  ]);
  expect([
    ...run('COLOR_TO_HEX(COLOR_MIX(COLOR_FROM_HEX("#0000"), COLOR_FROM_HEX("#fff0"), 0.5))', table)
  ]).toEqual(['#00000000', '#00000000', '#00000000']);
  const vectors = [
    vectorFromArray([1, 0], new Float64()),
    vectorFromArray([0, 1], new Float64()),
    vectorFromArray([0, 0], new Float64())
  ];
  expect(
    rows(
      colors.COLOR_RGB.prototypes[0]!.evaluate(vectors, {
        length: 2,
        activeRows: new Uint8Array([0, 1])
      })
    )
  ).toEqual([null, [0, 1, 0, 1]]);
});

test('dictionary colors and row-dependent list configurations resolve logical values', () => {
  const rgba = new FixedSizeList(4, new Field('channel', new Float32(), false));
  const table = new Table({
    c: vectorFromArray([[1, 0, 0, 1], null, [0, 0, 1, 0.5]], new Dictionary(rgba, new Int8()))
  });
  expect([...run('COLOR_TO_HEX(c)', table)]).toEqual(['#ff0000ff', null, '#0000ff80']);
  const input = new Table({
    x: vectorFromArray([1, 1], new Float64()),
    breaks: vectorFromArray([[0], [2]], new List(new Field('item', new Float64(), false))),
    palette: vectorFromArray(
      [
        ['#000', '#fff'],
        ['#f00', '#00f']
      ],
      new List(new Field('item', new Utf8(), false))
    )
  });
  expect([...run('COLOR_TO_HEX(COLOR_BINS(x, breaks, palette))', input)]).toEqual([
    '#ffffffff',
    '#ff0000ff'
  ]);
});

test('large finite domains preserve endpoints and midpoint without overflow', () => {
  const table = new Table({x: vectorFromArray([-1e308, 0, 1e308], new Float64())});
  for (const expression of [
    'COLOR_SCALE(x, -1e308, 1e308, "grayscale")',
    'COLOR_RAMP(x, -1e308, 1e308, COLOR_FROM_HEX("#000"), COLOR_FROM_HEX("#fff"))'
  ])
    expect([...run(`COLOR_TO_HEX(${expression})`, table)]).toEqual([
      '#000000ff',
      '#808080ff',
      '#ffffffff'
    ]);
  expect([
    ...run('COLOR_TO_HEX(COLOR_DIVERGING(x, -1e308, 0, 1e308, "grayscale"))', table)
  ]).toEqual(['#000000ff', '#808080ff', '#ffffffff']);
});

test('an invalid unselected palette entry invalidates bins and categories', () => {
  for (const expression of [
    'COLOR_BINS(0, [1], ["#fff", "bad"])',
    'COLOR_CATEGORY("a", ["a","b"], ["#fff","bad"])'
  ])
    expect(rows(run(expression))).toEqual([null, null, null, null]);
});

test('null list configurations propagate through direct and conditional arguments', () => {
  for (const expression of [
    'COLOR_BINS(x, null, ["#fff"])',
    'COLOR_BINS(x, [], null)',
    'COLOR_CATEGORY("a", null, ["#fff"])',
    'COLOR_CATEGORY("a", ["a"], null)'
  ])
    expect(rows(run(expression))).toEqual([null, null, null, null]);
  expect([...run('COLOR_TO_HEX(COLOR_BINS(x, x > 0 ? null : [], ["#fff"]))')]).toEqual([
    '#ffffffff',
    null,
    null,
    null
  ]);
});
