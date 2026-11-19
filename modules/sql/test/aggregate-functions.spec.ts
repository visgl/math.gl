// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DateDay, Field, Float64, TimestampMicrosecond, tableFromArrays} from 'apache-arrow';
import {expect, test} from 'vitest';
import {queryArrowSQL, queryArrowSQLWithMetadata, type AggregateFunction} from '@math.gl/sql';
import {VISUALIZATION_FUNCTIONS} from '@math.gl/sql/scales';

const SPREAD = {
  kind: 'aggregate',
  name: 'SPREAD',
  bind({arguments: fields}) {
    if (fields.length !== 1) throw new Error('SPREAD requires one argument');
    return {
      outputField: new Field('spread', new Float64(), true),
      metadata: {kind: 'spread', unit: 'degrees'},
      createAccumulator() {
        let min = Infinity;
        let max = -Infinity;
        return {
          update([values]) {
            for (const value of values!) {
              if (value === null) continue;
              min = Math.min(min, Number(value));
              max = Math.max(max, Number(value));
            }
          },
          finalize: () => (max === -Infinity ? null : max - min)
        };
      }
    };
  }
} satisfies AggregateFunction<{kind: 'spread'; unit: string}>;

test('nested aggregate expressions use independent group results', () => {
  const a = tableFromArrays({g: ['a', 'b', 'a'], x: [1, 10, 4]});
  const b = tableFromArrays({g: ['b', 'a', 'c'], x: [20, null, null]});
  const tables = new Map([['data', a.concat(b)]]);
  const {table, columnMetadata} = queryArrowSQLWithMetadata(
    'SELECT g, MAX(x) - MIN(x) AS delta, SPREAD(x) + 1 AS custom, COUNT(*) - COUNT(x) AS missing FROM data GROUP BY g ORDER BY g',
    tables,
    {functions: [[SPREAD]]}
  );
  expect(Array.from(table.getChild('delta')!)).toEqual([3, 10, null]);
  expect(Array.from(table.getChild('custom')!)).toEqual([4, 11, null]);
  expect(Array.from(table.getChild('missing')!)).toEqual([1n, 0n, 1n]);
  expect(columnMetadata['custom']).toEqual([{kind: 'spread', unit: 'degrees'}]);
});

test('ungrouped empty reductions produce a row and SQL scope errors are explicit', () => {
  const tables = new Map([['data', tableFromArrays({x: [1, 2]})]]);
  const options = {functions: [[SPREAD]]};
  const result = queryArrowSQL(
    'SELECT COUNT(*) + COUNT(x) AS n, SPREAD(x) AS spread FROM data WHERE x > 2',
    tables,
    options
  );
  expect(result.getChild('n')?.get(0)).toBe(0n);
  expect(result.getChild('spread')?.get(0)).toBeNull();
  expect(() => queryArrowSQL('SELECT x + MAX(x) FROM data', tables)).toThrow('GROUP BY');
  expect(() => queryArrowSQL('SELECT SUM(MAX(x)) FROM data', tables)).toThrow(
    'aggregate arguments'
  );
  expect(() => queryArrowSQL('SELECT x FROM data WHERE MAX(x) > 0', tables)).toThrow('WHERE');
});

test('scale and aggregate metadata follow expression nesting order', () => {
  const tables = new Map([['data', tableFromArrays({x: [1, 4]})]]);
  const {columnMetadata} = queryArrowSQLWithMetadata(
    "SELECT SCALE_COLOR(SPREAD(x), DOMAIN(0, 10), PALETTE('viridis')) AS color FROM data",
    tables,
    {functions: [[VISUALIZATION_FUNCTIONS, SPREAD]]}
  );
  expect(columnMetadata['color']?.map(entry => entry.kind)).toEqual(['scale', 'spread']);
});

test('custom aggregate output preserves Arrow date days and timestamp microseconds', () => {
  const DAY = {
    kind: 'aggregate',
    name: 'DAY',
    bind() {
      return {
        outputField: new Field('day', new DateDay(), false),
        createAccumulator: () => ({update() {}, finalize: () => 1})
      };
    }
  } satisfies AggregateFunction;
  const TICK = {
    kind: 'aggregate',
    name: 'TICK',
    bind() {
      return {
        outputField: new Field('tick', new TimestampMicrosecond(), false),
        createAccumulator: () => ({update() {}, finalize: () => 1234n})
      };
    }
  } satisfies AggregateFunction;
  const input = tableFromArrays({x: [1]});
  const result = queryArrowSQL(
    'SELECT DAY() AS day, TICK() AS tick FROM data',
    new Map([['data', input]]),
    {functions: [[DAY, TICK]]}
  );
  expect(result.getChild('day')!.data[0]!.values[0]).toBe(1);
  expect(result.getChild('tick')!.data[0]!.values[0]).toBe(1234n);
});
