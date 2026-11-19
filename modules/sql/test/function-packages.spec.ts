// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Field, Float64, tableFromArrays, vectorFromArray} from 'apache-arrow';
import {expect, expectTypeOf, test} from 'vitest';
import {
  queryArrowSQL,
  queryArrowSQLWithMetadata,
  type PreparedScalarFunction,
  type ScalarFunction
} from '@math.gl/sql';
import {ABS} from '@math.gl/sql/math-functions';
import {VISUALIZATION_FUNCTIONS, type ScaleProjectionMetadata} from '@math.gl/sql/scales';

type BinMetadata = {kind: 'bins'; edges: readonly number[]};

const BINS = {
  kind: 'scalar',
  name: 'BINS',
  prepare(call) {
    const metadata: BinMetadata = {kind: 'bins', edges: [0, 10]};
    return {expression: call.arguments[0]!, metadata};
  }
} satisfies PreparedScalarFunction<BinMetadata>;

test('nested readonly packages keep typed metadata in expression and compound input order', () => {
  const functions = [[ABS], [VISUALIZATION_FUNCTIONS, [[BINS]]]] as const;
  const tables = new Map([['data', tableFromArrays({value: [-100, 2, 6, 8]})]]);
  const {table, columnMetadata} = queryArrowSQLWithMetadata(
    "SELECT value, SCALE_COLOR(BINS(ABS(value)), DOMAIN(value), PALETTE('Blues')) AS color FROM data WHERE value > 0 UNION ALL SELECT value, SCALE_COLOR(value, DOMAIN(value), PALETTE('Blues')) AS second FROM data WHERE value < 0 ORDER BY value LIMIT 1",
    tables,
    {functions}
  );
  expectTypeOf(columnMetadata['color']?.[0]).toEqualTypeOf<
    ScaleProjectionMetadata | BinMetadata | undefined
  >();
  expect(table.numRows).toEqual(1);
  expect(columnMetadata['value']).toEqual([]);
  expect(columnMetadata['color']?.map(entry => entry.kind)).toEqual(['scale', 'bins', 'scale']);
  const scale = columnMetadata['color']?.[0];
  expect(scale?.kind === 'scale' && scale.scale.descriptor.domain).toEqual([2, 8]);
});

test('nested legacy functions remain available from the table-only entry point', () => {
  const tables = new Map([['data', tableFromArrays({value: [-3]})]]);
  const table = queryArrowSQL('SELECT ABS(value) AS v FROM data', tables, {
    functions: [[[ABS]]]
  });
  expect(table.getChild('v')?.get(0)).toBe(3);
});

test('duplicate prepared names and cyclic packages fail at registration', () => {
  const tables = new Map([['data', tableFromArrays({value: [3]})]]);
  expect(() =>
    queryArrowSQL('SELECT value FROM data', tables, {functions: [BINS, [BINS]]})
  ).toThrow('Duplicate Arrow prepared function');
  const cyclic: import('@math.gl/sql').ArrowFunctionPackage[] = [];
  cyclic.push(cyclic);
  expect(() => queryArrowSQL('SELECT value FROM data', tables, {functions: cyclic})).toThrow(
    'Cyclic Arrow function package'
  );
});

test('a deck example can package a custom Arrow transform and use SQL parameters', () => {
  const type = new Float64();
  const HEIGHT_OFFSET = {
    kind: 'scalar',
    name: 'HEIGHT_OFFSET',
    prototypes: [
      {
        arguments: [new Field('height', type, true), new Field('offset', type, true)],
        result: new Field('elevation', type, true),
        evaluate([heights, offsets], {length, activeRows}) {
          return vectorFromArray(
            Array.from({length}, (_, row) =>
              activeRows[row] ? Number(heights!.get(row)) + Number(offsets!.get(row)) : null
            ),
            type
          );
        }
      }
    ]
  } satisfies ScalarFunction;
  const EXAMPLE_TRANSFORMS = [HEIGHT_OFFSET] as const;
  const tables = new Map([['features', tableFromArrays({height: [0, 50, null]})]]);
  const {table, columnMetadata} = queryArrowSQLWithMetadata(
    'SELECT SCALE_LINEAR(ABS(HEIGHT_OFFSET(height, :offset)), DOMAIN(0, 100), RANGE(0, 200)) AS elevation FROM features',
    tables,
    {functions: [EXAMPLE_TRANSFORMS, VISUALIZATION_FUNCTIONS, [ABS]], parameters: {offset: 5}}
  );
  const elevation = table.getChild('elevation')!;
  expect(elevation.get(0)).toBeCloseTo(10);
  expect(elevation.get(1)).toBeCloseTo(110);
  expect(elevation.get(2)).toBeNull();
  expectTypeOf(columnMetadata['elevation']?.[0]).toEqualTypeOf<
    ScaleProjectionMetadata | undefined
  >();
  expect(columnMetadata['elevation']?.[0]?.scale.descriptor.range).toEqual({
    type: 'numeric',
    values: [0, 200]
  });
});
