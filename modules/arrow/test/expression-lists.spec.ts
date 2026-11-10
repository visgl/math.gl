// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Bool,
  DataType,
  Field,
  FixedSizeList,
  Float32,
  Float64,
  Int32,
  List,
  Table,
  Uint8,
  Utf8,
  Vector,
  makeData,
  makeVector,
  vectorFromArray
} from 'apache-arrow';
import {
  compileArrowExpression,
  compileArrowFunction,
  type ArrowTableFunction
} from '../src/expressions';

const rgba = new FixedSizeList(4, new Field('channel', new Float32(), false));
const rgba8 = new FixedSizeList(4, new Field('channel', new Uint8(), false));
const input = () => new Table({x: vectorFromArray([1, null, 3, 4], new Int32())});
const decode = (vector: Vector) =>
  Array.from(vector, value => (value === null ? null : Array.from(value)));
function color(type = rgba): ArrowTableFunction {
  return {
    name: 'color',
    prototypes: [
      {
        arguments: [new Field('x', new Int32(), true)],
        result: new Field('rgba', type, false, new Map([['color-space', 'srgb']])),
        evaluate: ([values], {length, activeRows}) => {
          const channels = new type.children[0]!.type.ArrayType(length * 4);
          for (let row = 0; row < length; row++)
            if (activeRows[row]) {
              channels.set([values!.get(row), 0, 0, 1], row * 4);
            }
          return makeVector(
            makeData({
              type,
              length,
              child: makeData({type: type.children[0]!.type, data: channels, length: length * 4})
            })
          );
        }
      }
    ]
  };
}

test.each([rgba, rgba8])(
  'numeric tuple results preserve nulls, metadata, masks and ordered table chunks: %s',
  type => {
    const table = input().slice(1).concat(input().slice(0, 1));
    const expression = compileArrowFunction('color', ['x'], {
      inputSchema: table.schema,
      functions: [color(type)]
    });
    expect(decode(expression.evaluateTable(table))).toEqual([
      null,
      [3, 0, 0, 1],
      [4, 0, 0, 1],
      [1, 0, 0, 1]
    ]);
    const result = expression.evaluateTable(table, {activeRows: new Uint8Array([1, 1, 0, 1])});
    expect(decode(result)).toEqual([null, [3, 0, 0, 1], null, [1, 0, 0, 1]]);
    expect(result.data.map(data => data.length)).toEqual([3, 1]);
    expect(expression.outputField.metadata.get('color-space')).toBe('srgb');
    const empty = expression.evaluateTable(new Table(table.schema, []));
    expect(empty.length).toBe(0);
    expect(empty.type).toEqual(type);
  }
);

test('tuple projection and kernel masking reuse numeric buffers on sliced arrays', () => {
  const source = vectorFromArray([[9, 9, 9, 9], [1, 2, 3, 4], null, [5, 6, 7, 8]], rgba).slice(1);
  const table = new Table({rgba: source});
  const expression = compileArrowExpression('rgba', {inputSchema: table.schema});
  const result = expression.evaluateTable(table, {activeRows: new Uint8Array([1, 1, 0])});
  expect(decode(result)).toEqual([[1, 2, 3, 4], null, null]);
  expect(result.data[0]!.children[0]!.values.buffer).toBe(
    source.data[0]!.children[0]!.values.buffer
  );
  expect(decode(source)).toEqual([[1, 2, 3, 4], null, [5, 6, 7, 8]]);
});

test('tuple conditionals mask kernels and support null and contextual array branches', () => {
  const table = input();
  const seen: number[][] = [];
  const fn = color();
  const functions = [
    {
      name: fn.name,
      prototypes: [
        {
          ...fn.prototypes[0]!,
          evaluate: (args, context) => {
            seen.push(Array.from(context.activeRows));
            return fn.prototypes[0]!.evaluate(args, context);
          }
        }
      ]
    }
  ] satisfies ArrowTableFunction[];
  const options = {inputSchema: table.schema, functions};
  expect(
    decode(compileArrowExpression('x > 2 ? color(x) : [0, 0, 0, 1]', options).evaluateTable(table))
  ).toEqual([
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [3, 0, 0, 1],
    [4, 0, 0, 1]
  ]);
  expect(seen).toEqual([[0, 0, 1, 1]]);
  expect(
    decode(compileArrowExpression('x > 2 ? null : color(x)', options).evaluateTable(table))
  ).toEqual([[1, 0, 0, 1], null, null, null]);
  expect([...compileArrowExpression('isNull(color(x))', options).evaluateTable(table)]).toEqual([
    false,
    true,
    false,
    false
  ]);
});

test('tuple functions compose with vector arguments and skip entirely inactive calls', () => {
  const table = input();
  let calls = 0;
  const red: ArrowTableFunction = {
    name: 'red',
    prototypes: [
      {
        arguments: [new Field('rgba', rgba, true)],
        result: new Field('red', new Float32(), true),
        evaluate: ([values], {activeRows, length}) => {
          calls++;
          return vectorFromArray(
            Array.from({length}, (_, row) => (activeRows[row] ? values!.get(row).get(0) : null)),
            new Float32()
          );
        }
      }
    ]
  };
  const compiled = compileArrowExpression('red(color(x))', {
    inputSchema: table.schema,
    functions: [color(), red]
  });
  expect([...compiled.evaluateTable(table)]).toEqual([1, null, 3, 4]);
  expect([...compiled.evaluateTable(table, {activeRows: new Uint8Array(4)})]).toEqual([
    null,
    null,
    null,
    null
  ]);
  expect(calls).toBe(1);
});

test('typed list literals broadcast one dictionary value for numeric bins and text categories', () => {
  const table = input();
  for (const [type, expression, expected] of [
    [new Float64(), '[-1, +2, 3.5]', [-1, 2, 3.5]],
    [new Utf8(), '["road", "水"]', ['road', '水']],
    [new Bool(), '[true, false, null]', [true, false, null]],
    [new Float64(), '[]', []]
  ] as const) {
    const list = new List(new Field('item', type, true));
    let seen: Vector | undefined;
    const fn: ArrowTableFunction = {
      name: 'bins',
      prototypes: [
        {
          arguments: [new Field('bins', list, false)],
          result: new Field('size', new Int32(), false),
          evaluate: ([values], {length}) => {
            seen = values;
            expect(DataType.isDictionary(values!.type)).toBe(true);
            expect(values!.data[0]!.dictionary!.length).toBe(1);
            expect(Array.from(values!.get(0))).toEqual(expected);
            return vectorFromArray(new Int32Array(length).fill(expected.length), new Int32());
          }
        }
      ]
    };
    const compiled = compileArrowExpression(`bins(${expression})`, {
      inputSchema: table.schema,
      functions: [fn]
    });
    expect([...compiled.evaluateTable(table)]).toEqual(new Array(4).fill(expected.length));
    const first = seen;
    compiled.evaluateTable(table);
    expect(seen).toBe(first);
  }
});

test('typed array literals reject incompatible values, untyped arrays and dynamic syntax during compilation', () => {
  const table = input();
  const bins: ArrowTableFunction = {
    name: 'bins',
    prototypes: [
      {
        arguments: [new Field('bins', new List(new Field('item', new Uint8(), false)), false)],
        result: new Field('x', new Int32()),
        evaluate: () => vectorFromArray([], new Int32())
      }
    ]
  };
  const options = {inputSchema: table.schema, functions: [bins, color()]};
  for (const expression of [
    '[]',
    '[1,2]',
    'bins([256])',
    'bins([-1])',
    'bins([null])',
    'bins(["1"])',
    'bins([x])',
    'bins([[1]])',
    'bins([1,,2])',
    `bins([${new Array(4097).fill(1).join(',')}])`,
    'x > 2 ? color(x) : [1,2]'
  ])
    expect(() => compileArrowExpression(expression, options), expression).toThrow();
});

test('tuple result contracts reject wrong layouts, null components and scalar implementations', () => {
  const table = input();
  const base = color();
  expect(() =>
    compileArrowExpression('color(x)', {
      inputSchema: table.schema,
      functions: [
        {name: base.name, prototypes: [{...base.prototypes[0]!, evaluateScalar: () => 1}]}
      ]
    })
  ).toThrow('vector-only');
  for (const vector of [
    vectorFromArray([1, 2, 3, 4], new Int32()),
    vectorFromArray([[1, 2, 3, 4], null, [1, 2, 3, 4], [1, 2, 3, 4]], rgba8),
    vectorFromArray([[1, 2, null, 4], null, [1, 2, 3, 4], [1, 2, 3, 4]], rgba),
    vectorFromArray([null, null, null, null], rgba)
  ]) {
    const compiled = compileArrowExpression('color(x)', {
      inputSchema: table.schema,
      functions: [{name: base.name, prototypes: [{...base.prototypes[0]!, evaluate: () => vector}]}]
    });
    expect(() => compiled.evaluateTable(table)).toThrow();
  }
});

test('vector calls retain primitive conditional semantics and bind tuple literal arguments', () => {
  const table = input();
  const fn = color();
  const options = {inputSchema: table.schema, functions: [fn]};
  expect(
    decode(compileArrowExpression('color(x > 2 ? x : 0)', options).evaluateTable(table))
  ).toEqual([
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [3, 0, 0, 1],
    [4, 0, 0, 1]
  ]);
  const identity: ArrowTableFunction = {
    name: 'identity',
    prototypes: [
      {
        arguments: [new Field('rgba', rgba, true)],
        result: new Field('rgba', rgba, true),
        evaluate: ([vector]) => vector!
      }
    ]
  };
  expect(
    decode(
      compileArrowExpression('identity(x > 2 ? [1,2,3,4] : [4,3,2,1])', {
        inputSchema: table.schema,
        functions: [identity]
      }).evaluateTable(table)
    )
  ).toEqual([
    [4, 3, 2, 1],
    [4, 3, 2, 1],
    [1, 2, 3, 4],
    [1, 2, 3, 4]
  ]);
});

test('empty and wholly inactive tuple batches preserve type without calling kernels', () => {
  const table = input();
  let calls = 0;
  const fn = color();
  const compiled = compileArrowExpression('color(x)', {
    inputSchema: table.schema,
    functions: [
      {
        name: fn.name,
        prototypes: [
          {
            ...fn.prototypes[0]!,
            evaluate: (args, context) => {
              calls++;
              return fn.prototypes[0]!.evaluate(args, context);
            }
          }
        ]
      }
    ]
  });
  expect(decode(compiled.evaluate(table.batches[0]!, {activeRows: new Uint8Array(4)}))).toEqual([
    null,
    null,
    null,
    null
  ]);
  expect(compiled.evaluate(table.batches[0]!.slice(0, 0)).type).toEqual(rgba);
  expect(calls).toBe(0);
});

test('array type contracts reject non-list arguments, nullable tuple channels and sparse AST literals', () => {
  const table = input();
  const fn = color();
  const options = {inputSchema: table.schema, functions: [fn]};
  expect(() => compileArrowExpression('color([1])', options)).toThrow('List');
  const unsupported = new FixedSizeList(4, new Field('channel', new Float32(), true));
  const bad: ArrowTableFunction = {
    name: 'bad',
    prototypes: [
      {
        arguments: [new Field('input', unsupported)],
        result: new Field('x', new Int32()),
        evaluate: () => vectorFromArray([], new Int32())
      }
    ]
  };
  expect(() =>
    compileArrowExpression('bad([1,2,3,4])', {inputSchema: table.schema, functions: [bad]})
  ).toThrow('non-nullable');
  const list = new List(new Field('item', new Int32(), false));
  const bins = {
    name: bad.name,
    prototypes: [{...bad.prototypes[0]!, arguments: [new Field('input', list)]}]
  };
  expect(() =>
    compileArrowFunction('bad', [{type: 'ArrayExpression', elements: Array(1)} as never], {
      inputSchema: table.schema,
      functions: [bins]
    })
  ).toThrow('scalar literals');
});

test('conditional variable-list literals retain dictionary broadcast semantics', () => {
  const table = input();
  const list = new List(new Field('item', new Int32(), false));
  const fn: ArrowTableFunction = {
    name: 'bins',
    prototypes: [
      {
        arguments: [new Field('bins', list, false)],
        result: new Field('first', new Int32(), false),
        evaluate: ([values], {length, activeRows}) =>
          vectorFromArray(
            Array.from({length}, (_, row) => (activeRows[row] ? values!.get(row).get(0) : null)),
            new Int32()
          )
      }
    ]
  };
  expect([
    ...compileArrowExpression('bins(x > 2 ? [10,20] : [30,40])', {
      inputSchema: table.schema,
      functions: [fn]
    }).evaluateTable(table)
  ]).toEqual([30, 30, 10, 10]);
});

test('nested list conditionals retain their chosen dictionary indices', () => {
  const table = input();
  const list = new List(new Field('item', new Int32(), false));
  const fn: ArrowTableFunction = {
    name: 'bins',
    prototypes: [
      {
        arguments: [new Field('bins', list, false)],
        result: new Field('first', new Int32(), false),
        evaluate: ([v], {length}) =>
          vectorFromArray(
            Array.from({length}, (_, i) => v!.get(i).get(0)),
            new Int32()
          )
      }
    ]
  };
  expect([
    ...compileArrowExpression('bins(x > 2 ? (x > 3 ? [1] : [2]) : [3])', {
      inputSchema: table.schema,
      functions: [fn]
    }).evaluateTable(table)
  ]).toEqual([3, 3, 2, 1]);
});

test('outer short circuit suppresses scalar callbacks inside tuple conditions', () => {
  const table = new Table({
    x: vectorFromArray([1, 2], new Int32()),
    rgba: vectorFromArray(
      [
        [1, 2, 3, 4],
        [4, 3, 2, 1]
      ],
      rgba
    )
  });
  const check: ArrowTableFunction = {
    name: 'check',
    prototypes: [
      {
        arguments: [new Field('x', new Int32())],
        result: new Field('yes', new Bool()),
        evaluate: () => {
          throw new Error('skipped');
        },
        evaluateScalar: () => {
          throw new Error('skipped');
        }
      }
    ]
  };
  expect([
    ...compileArrowExpression('false && isNull(check(x) ? rgba : rgba)', {
      inputSchema: table.schema,
      functions: [check]
    }).evaluateTable(table)
  ]).toEqual([false, false]);
});

test('conditionals select sliced tuple source components in logical row order', () => {
  const table = new Table({
    rgba: vectorFromArray(
      [
        [9, 9, 9, 9],
        [1, 2, 3, 4],
        [5, 6, 7, 8]
      ],
      rgba
    ),
    yes: vectorFromArray([true, true, false], new Bool())
  }).slice(1);
  const compiled = compileArrowExpression('yes ? rgba : [0,0,0,1]', {inputSchema: table.schema});
  expect(decode(compiled.evaluateTable(table))).toEqual([
    [1, 2, 3, 4],
    [0, 0, 0, 1]
  ]);
});
