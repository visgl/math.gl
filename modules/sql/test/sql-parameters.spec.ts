// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  Binary,
  DateDay,
  TimestampMicrosecond,
  Field,
  FixedSizeList,
  Float64,
  Float32,
  List,
  Table,
  Utf8,
  tableFromArrays,
  vectorFromArray
} from 'apache-arrow';
import {
  parseSQLExpression,
  parseSQLQuery,
  parseSQLSelect,
  parseSQLSelectStatement,
  parseSQLSelectCompound,
  SQLParseError,
  type SQLParameters
} from '../src/parser';
import {parseSQLScaleExpression} from '../src/scales';
import {compileArrowExpression, type ArrowTableFunction} from '../src/arrow';
import {compileArrowScale} from '../src/scales/arrow-scales';
import {queryArrowSQL} from '../src/arrow/query-arrow-sql';

/** Converts Arrow scalar and list rows to ordinary JavaScript values. */
function rows(table: Table): unknown[] {
  return table.toArray().map(row => row.toJSON());
}

test('named parameters bind projections, arithmetic and scalar WHERE predicates', () => {
  const parameters = {minimum: 2, increment: 10, label: "it's :safe; DROP TABLE t"};
  const query = parseSQLQuery(
    'SELECT x + :increment AS value, :label AS label WHERE x >= :minimum',
    {parameters}
  );
  expect(query).toMatchObject({where: {op: '>=', args: [{property: 'x'}, 2]}});
  const table = tableFromArrays({x: [1, 2, 3]});
  expect(
    rows(
      queryArrowSQL(
        'SELECT x + :increment AS value, :label AS label FROM t WHERE x >= :minimum',
        new Map([['t', table]]),
        {parameters}
      )
    )
  ).toEqual([
    {value: 12, label: parameters.label},
    {value: 13, label: parameters.label}
  ]);
  expect(parseSQLExpression("':missing'")).toMatchObject({type: 'Literal', value: ':missing'});
  expect(parseSQLExpression(':n + :n', {parameters: {n: 1, unused: 0}})).toMatchObject({
    left: {value: 1},
    right: {value: 1}
  });
});

test('structural, relational and compound parsers share binding options', () => {
  const options = {parameters: {value: 7}};
  expect(parseSQLSelect('SELECT :value AS value', options)).toMatchObject({
    select: [{expression: {value: 7}}]
  });
  expect(parseSQLSelectStatement('SELECT :value FROM t WHERE x = :value', options)).toMatchObject({
    where: {right: {value: 7}}
  });
  expect(
    parseSQLSelectCompound('SELECT :value FROM t UNION ALL SELECT :value FROM t', options).inputs
  ).toHaveLength(2);
  expect(() => parseSQLSelect('SELECT * FROM :value', options)).toThrow();
});

test.each([
  [
    [1, 3],
    [1, 3]
  ],
  [[], []]
])('numeric membership lists execute with %j', (values, expected) => {
  const tables = new Map([['t', tableFromArrays({x: [1, 2, 3, null]})]]);
  const result = queryArrowSQL('SELECT x FROM t WHERE x IN (:values)', tables, {
    parameters: {values}
  });
  expect(Array.from(result.getChild('x')!)).toEqual(expected);
  const excluded = queryArrowSQL('SELECT x FROM t WHERE x NOT IN (:values)', tables, {
    parameters: {values}
  });
  expect(Array.from(excluded.getChild('x')!)).toEqual(values.length ? [2] : [1, 2, 3, null]);
  expect(parseSQLQuery('SELECT x WHERE x IN (:values)', {parameters: {values}})).toHaveProperty(
    'where.expression'
  );
});

test('membership preserves precedence, null behavior, string lists and mixed scalar entries', () => {
  const tables = new Map([['t', tableFromArrays({x: ['a', 'b', 'c', null]})]]);
  const result = queryArrowSQL("SELECT x FROM t WHERE x IN (:values, 'b') AND x != 'c'", tables, {
    parameters: {values: ['a', 'c']}
  });
  expect(Array.from(result.getChild('x')!)).toEqual(['a', 'b']);
  expect(() => parseSQLExpression('x IN (:values)', {parameters: {values: [[1, 2]]}})).toThrow(
    'scalar'
  );
  expect(() => parseSQLExpression('x IN ()')).toThrow();
});

test('array parameters bind to fixed tuples and variable numeric/string list signatures', () => {
  const table = tableFromArrays({x: [1, 2]});
  for (const [type, value] of [
    [new FixedSizeList(3, new Field('item', new Float64(), false)), [1, 2, 3]],
    [new List(new Field('item', new Float64(), false)), [1, 2]],
    [new List(new Field('item', new Utf8(), false)), ['a', 'b']],
    [new List(new Field('item', new Float64(), false)), []]
  ] as const) {
    const fn: ArrowTableFunction = {
      name: 'size',
      prototypes: [
        {
          arguments: [new Field('values', type, false)],
          result: new Field('size', new Float64(), false),
          evaluate: ([values], {length}) =>
            vectorFromArray(
              Array.from({length}, (_, row) => values!.get(row).length),
              new Float64()
            )
        }
      ]
    };
    const compiled = compileArrowExpression(
      parseSQLExpression('size(:values)', {parameters: {values: value}}),
      {inputSchema: table.schema, functions: [fn]}
    );
    expect(Array.from(compiled.evaluateTable(table))).toEqual([value.length, value.length]);
  }
});

test('hex and numeric palettes produce matching descriptors and Arrow colors', () => {
  const table = tableFromArrays({value: [0, 50, 100, null]});
  const explicit = parseSQLScaleExpression(
    "SCALE_COLOR(value, DOMAIN(0, 100), PALETTE('#000000', '#ffffff'))"
  );
  for (const colors of [
    ['#000000', '#ffffff'],
    [
      [0, 0, 0],
      [1, 1, 1, 1]
    ]
  ] as const) {
    const bound = parseSQLScaleExpression('SCALE_COLOR(value, DOMAIN(:domain), PALETTE(:colors))', {
      parameters: {domain: [0, 100], colors}
    });
    expect(bound).toEqual(explicit);
    const actual = compileArrowScale(table, bound);
    const expected = compileArrowScale(table, explicit);
    expect(actual.scale.descriptor).toEqual(expected.scale.descriptor);
    expect(
      Array.from(actual.evaluate(table), row => (row === null ? null : Array.from(row)))
    ).toEqual(Array.from(expected.evaluate(table), row => (row === null ? null : Array.from(row))));
  }
});

test('numeric domains/ranges and fixed categories accept list parameters', () => {
  expect(
    parseSQLScaleExpression('SCALE_LINEAR(x, DOMAIN(:domain), RANGE(:range))', {
      parameters: {domain: [0, 10], range: [2, 20]}
    })
  ).toEqual(parseSQLScaleExpression('SCALE_LINEAR(x, DOMAIN(0, 10), RANGE(2, 20))'));
  expect(
    parseSQLScaleExpression('SCALE_ORDINAL(x, CATEGORIES(:keys), PALETTE(:colors))', {
      parameters: {keys: ['a'], colors: ['#ff0000']}
    }).scale.domain
  ).toEqual({type: 'fixed', values: ['a']});
  for (const colors of [[], [[1, 2]], ['viridis']]) {
    expect(() =>
      parseSQLScaleExpression('SCALE_COLOR(x, DOMAIN(0, 1), PALETTE(:colors))', {
        parameters: {colors} as SQLParameters
      })
    ).toThrow();
  }
});

test('bound arrays and mutable scalars are detached from caller values', () => {
  const colors = [
    [0, 0, 0],
    [1, 1, 1]
  ];
  const options = {parameters: {colors}};
  const expression = parseSQLExpression(':colors', options);
  const scale = parseSQLScaleExpression('SCALE_COLOR(x, DOMAIN(0, 1), PALETTE(:colors))', options);
  colors[0]![0] = 1;
  colors.push([0, 1, 0]);
  expect(expression).toMatchObject({
    elements: [
      {elements: [{value: 0}, {value: 0}, {value: 0}]},
      {elements: [{value: 1}, {value: 1}, {value: 1}]}
    ]
  });
  expect(scale.scale.range).toEqual({
    type: 'colors',
    values: [
      [0, 0, 0, 1],
      [1, 1, 1, 1]
    ]
  });
  const date = new Date(0);
  const bytes = new Uint8Array([1]);
  const boundDate = parseSQLExpression(':date', {parameters: {date}});
  const boundBytes = parseSQLExpression(':bytes', {parameters: {bytes}});
  date.setTime(10);
  bytes[0] = 2;
  expect(boundDate).toMatchObject({value: new Date(0)});
  expect(boundBytes).toMatchObject({value: new Uint8Array([1])});
  expect(parseSQLExpression(':value', {parameters: {value: 1n}})).toMatchObject({value: 1n});
  expect(parseSQLExpression(':value', {parameters: {value: null}})).toMatchObject({value: null});
});

test('missing and invalid bindings report the placeholder and SQL offset', () => {
  const sql = 'SELECT x WHERE x + :missing > 0';
  try {
    parseSQLQuery(sql);
    throw new Error('Expected failure');
  } catch (error) {
    expect(error).toBeInstanceOf(SQLParseError);
    expect(error).toMatchObject({offset: sql.indexOf(':missing')});
    expect(String(error)).toContain(':missing');
  }
  expect(() => parseSQLExpression(':value', {parameters: Object.create({value: 1})})).toThrow(
    'requires a value'
  );
  for (const value of [undefined, {}, NaN, Infinity, [1, 'a'], [[['a']]], new Array(2)]) {
    expect(() => parseSQLExpression(':value', {parameters: {value} as SQLParameters})).toThrow(
      ':value'
    );
  }
  expect(() => parseSQLExpression(':')).toThrow('require a name');
});

test('custom callbacks remain available and cannot be combined with a map', () => {
  const options = {parseParameter: (name: string) => ({type: 'Identifier' as const, name})};
  expect(parseSQLSelectStatement('SELECT :value FROM t', options).select?.[0]?.expression).toEqual({
    type: 'Identifier',
    name: 'value'
  });
  expect(parseSQLQuery('SELECT x WHERE x > :value', options)).toMatchObject({
    where: {expression: {right: {name: 'value'}}}
  });
  expect(() => parseSQLExpression('1', {...options, parameters: {}})).toThrow('mutually exclusive');
  expect(() => parseSQLQuery('SHOW SOURCES', {...options, parameters: {}})).toThrow(
    'mutually exclusive'
  );
});

test('fixed numeric parameters can be projected with an explicit tuple width', () => {
  const table = tableFromArrays({x: [1, 2]});
  const result = queryArrowSQL(
    'SELECT :position::FLOAT32[3] AS position FROM t',
    new Map([['t', table]]),
    {parameters: {position: [1, 2, 3]}}
  );
  expect(Array.from(result.getChild('position')!, row => Array.from(row))).toEqual([
    [1, 2, 3],
    [1, 2, 3]
  ]);
  expect(() =>
    parseSQLExpression(':position::FLOAT32[2]', {parameters: {position: [1, 2, 3]}})
  ).toThrow('length');
});

test('UTF-8 parameters encode at compilation and compare byte ranges across batches', () => {
  const table = tableFromArrays({text: ['é', 'a', 'z', null]});
  const ast = parseSQLExpression('text IN (:values) OR text = :last', {
    parameters: {values: ['é', 'a'], last: 'z'}
  });
  const encode = vi.spyOn(TextEncoder.prototype, 'encode');
  const decode = vi.spyOn(TextDecoder.prototype, 'decode');
  try {
    const compiled = compileArrowExpression(ast, {inputSchema: table.schema});
    const conversions = encode.mock.calls.length;
    expect(conversions).toBeGreaterThanOrEqual(3);
    for (let pass = 0; pass < 2; pass++) {
      expect(Array.from(compiled.evaluateTable(table.slice(0, 2)))).toEqual([true, true]);
      expect(Array.from(compiled.evaluateTable(table.slice(2)))).toEqual([true, null]);
    }
    expect(encode).toHaveBeenCalledTimes(conversions);
    expect(decode).not.toHaveBeenCalled();
  } finally {
    encode.mockRestore();
    decode.mockRestore();
  }
});

test('list substitutions reuse compiled typed UTF-8 buffers across batches', () => {
  const table = tableFromArrays({x: [1, 2, 3]});
  const buffers: unknown[] = [];
  const type = new List(new Field('item', new Utf8(), false));
  const fn: ArrowTableFunction = {
    name: 'size',
    prototypes: [
      {
        arguments: [new Field('values', type, false)],
        result: new Field('size', new Float64(), false),
        evaluate: ([values], {length}) => {
          const dictionary = values!.data[0]!.dictionary!;
          buffers.push(dictionary.data[0]!.children[0]!.values);
          return vectorFromArray(Array(length).fill(2), new Float64());
        }
      }
    ]
  };
  const compiled = compileArrowExpression(
    parseSQLExpression('size(:values)', {parameters: {values: ['é', 'a']}}),
    {inputSchema: table.schema, functions: [fn]}
  );
  compiled.evaluateTable(table.slice(0, 2));
  compiled.evaluateTable(table.slice(2));
  expect(buffers).toHaveLength(2);
  expect(buffers[0]).toBeInstanceOf(Uint8Array);
  expect(buffers[1]).toBe(buffers[0]);
});

test('binary parameter comparisons and membership compare contents rather than object identity', () => {
  const table = new Table({
    value: vectorFromArray(
      [new Uint8Array([1, 2]), new Uint8Array([3]), new Uint8Array([]), null],
      new Binary()
    )
  });
  for (const sql of ['value = :bytes', 'value IN (:bytes)']) {
    const expression = compileArrowExpression(
      parseSQLExpression(sql, {parameters: {bytes: new Uint8Array([1, 2])}}),
      {inputSchema: table.schema}
    );
    expect(Array.from(expression.evaluateTable(table))).toEqual([true, false, false, null]);
  }
  const expression = compileArrowExpression(
    parseSQLExpression('value IN (:bytes, :empty, NULL)', {
      parameters: {bytes: new Uint8Array([1, 2]), empty: new Uint8Array([])}
    }),
    {inputSchema: table.schema}
  );
  expect(Array.from(expression.evaluateTable(table))).toEqual([true, null, true, null]);
});

test('Date parameters convert once to schema-specific epoch values', () => {
  const date = new Date('2026-01-02T00:00:00Z');
  for (const type of [new DateDay(), new TimestampMicrosecond('UTC')]) {
    const table = new Table({value: vectorFromArray([date, new Date(0), null], type)});
    const compiled = compileArrowExpression(
      parseSQLExpression('value = :date', {parameters: {date}}),
      {inputSchema: table.schema}
    );
    expect(Array.from(compiled.evaluateTable(table))).toEqual([true, false, null]);
  }
  expect(() => parseSQLExpression(':date', {parameters: {date: new Date(NaN)}})).toThrow(
    'unsupported'
  );
});

test('pre-encoded UTF-8 parameters retain byte comparisons without text encoding', () => {
  const table = tableFromArrays({text: ['é', 'other', null]});
  const input = new Uint8Array([0xc3, 0xa9]);
  const encode = vi.spyOn(TextEncoder.prototype, 'encode');
  try {
    const ast = parseSQLExpression('text IN (:text)', {
      parameters: {text: {type: 'utf8', value: input}}
    });
    input.fill(0);
    const compiled = compileArrowExpression(ast, {inputSchema: table.schema});
    const decode = vi.spyOn(TextDecoder.prototype, 'decode');
    try {
      expect(Array.from(compiled.evaluateTable(table))).toEqual([true, false, null]);
      expect(Array.from(compiled.evaluateTable(table))).toEqual([true, false, null]);
      expect(encode).not.toHaveBeenCalled();
      expect(decode).not.toHaveBeenCalled();
    } finally {
      decode.mockRestore();
    }
  } finally {
    encode.mockRestore();
  }
  expect(() =>
    parseSQLExpression(':text', {parameters: {text: {type: 'utf8', value: new Uint8Array([0xff])}}})
  ).toThrow('UTF-8');
});

test('numeric typed parameters and explicitly tagged byte arrays use typed list storage', () => {
  const table = tableFromArrays({x: [1, 2]});
  const input = new Float32Array([1.5, 2.5]);
  const type = new List(new Field('value', new Float32(), false));
  const buffers: unknown[] = [];
  const fn: ArrowTableFunction = {
    name: 'first',
    prototypes: [
      {
        arguments: [new Field('values', type, false)],
        result: new Field('first', new Float64(), false),
        evaluate: ([values], {length}) => {
          const physical = values!.data[0]!.dictionary!.data[0]!.children[0]!.values;
          buffers.push(physical);
          return vectorFromArray(Array(length).fill(physical[0]), new Float64());
        }
      }
    ]
  };
  const ast = parseSQLExpression('first(:values)', {parameters: {values: input}});
  input.fill(0);
  const compiled = compileArrowExpression(ast, {inputSchema: table.schema, functions: [fn]});
  expect(Array.from(compiled.evaluateTable(table))).toEqual([1.5, 1.5]);
  compiled.evaluateTable(table);
  expect(buffers[0]).toBeInstanceOf(Float32Array);
  expect(buffers[1]).toBe(buffers[0]);
  expect(buffers[0]).not.toBe(input);
  for (const values of [
    new Float64Array([1, 2]),
    new Int8Array([1, 2]),
    new Uint8ClampedArray([1, 2]),
    new Int16Array([1, 2]),
    new Uint16Array([1, 2]),
    new Int32Array([1, 2]),
    new Uint32Array([1, 2]),
    {type: 'array' as const, value: new Uint8Array([1, 2])}
  ]) {
    expect(parseSQLExpression(':values', {parameters: {values}})).toMatchObject({
      type: 'ArrayExpression',
      elements: [{value: 1}, {value: 2}]
    });
  }
  const binary = {type: 'binary' as const, value: new Uint8Array([1, 2])};
  expect(parseSQLExpression(':value', {parameters: {value: binary}})).toMatchObject({
    type: 'Literal',
    value: binary.value
  });
  expect(() =>
    parseSQLExpression(':value', {parameters: {value: new Float32Array([Infinity])}})
  ).toThrow('numeric array');
  expect(() =>
    parseSQLExpression(':value', {
      parameters: {value: {type: 'utf8', value: 'text'}}
    } as unknown as {parameters: SQLParameters})
  ).toThrow('binary format');
});

test('UTF-8 scalar substitutions materialize projections without re-encoding', () => {
  const table = tableFromArrays({x: [1, 2, 3]});
  const ast = parseSQLExpression(':text', {
    parameters: {text: {type: 'utf8', value: new Uint8Array([0xc3, 0xa9])}}
  });
  const encode = vi.spyOn(TextEncoder.prototype, 'encode');
  try {
    const compiled = compileArrowExpression(ast, {inputSchema: table.schema});
    expect(Array.from(compiled.evaluateTable(table))).toEqual(['é', 'é', 'é']);
    expect(
      Array.from(compiled.evaluateTable(table, {activeRows: new Uint8Array([1, 0, 1])}))
    ).toEqual(['é', null, 'é']);
    expect(encode).not.toHaveBeenCalled();
  } finally {
    encode.mockRestore();
  }
});

test('computed quantile scales bind class counts, expressions and explicit palettes', () => {
  const table = tableFromArrays({value: [1, 2, 3, 4, null]});
  const bound = parseSQLScaleExpression(
    'SCALE_QUANTILE(value * :factor, :classes, PALETTE(:colors))',
    {parameters: {factor: 2, classes: 3, colors: ['#000000', '#808080', '#ffffff']}}
  );
  const explicit = parseSQLScaleExpression(
    "SCALE_QUANTILE(value * 2, 3, PALETTE('#000000', '#808080', '#ffffff'))"
  );
  expect(bound).toEqual(explicit);
  const actual = compileArrowScale(table, bound);
  const expected = compileArrowScale(table, explicit);
  expect(actual.scale.descriptor).toEqual(expected.scale.descriptor);
  expect(
    Array.from(actual.evaluate(table), row => (row === null ? null : Array.from(row)))
  ).toEqual(Array.from(expected.evaluate(table), row => (row === null ? null : Array.from(row))));
});

test('query parser routes Date and binary filters to Arrow expressions', () => {
  for (const value of [new Date(0), new Uint8Array([1])]) {
    expect(parseSQLQuery('SELECT x WHERE x = :value', {parameters: {value}})).toHaveProperty(
      'where.expression'
    );
    expect(parseSQLQuery('SELECT x WHERE x IN (:value)', {parameters: {value}})).toHaveProperty(
      'where.expression'
    );
  }
});
