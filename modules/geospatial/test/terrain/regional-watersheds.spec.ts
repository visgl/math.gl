// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import sierra from './fixtures/sierra-nodata-streaming.json';
import {HeightField} from '../../src/terrain/height-field';
import {createTerrainRegionalWatersheds} from '../../src/terrain/regional-watersheds';
import {fillTerrainDepressions} from '../../src/terrain/depression-fill';

/** Build a test tile in the shared unit cell lattice. */
function tile(column: number, values: number[]) {
  return {
    column,
    row: 0,
    field: new HeightField({
      width: 2,
      height: 2,
      registration: 'cell',
      origin: [column, 0],
      heights: Float64Array.from(values)
    })
  };
}

test('regional watershed fills across a seam and matches monolithic routing', () => {
  const tiles = [tile(0, [0, 5, 9, 9]), tile(2, [1, 2, 9, 9])];
  const options = {width: 4, height: 2, origin: [0, 0] as const, outlets: [0]};
  const result = createTerrainRegionalWatersheds(tiles.reverse(), options);
  const reference = fillTerrainDepressions(
    new HeightField({
      width: 4,
      height: 2,
      registration: 'cell',
      heights: Float64Array.of(0, 5, 1, 2, 9, 9, 9, 9)
    }),
    options
  );
  expect(result.receiver).toEqual(reference.receiver);
  expect(result.field.getHeight(3, 0)).toBe(5);
  expect(result.contributingCells[0]).toBe(8);
  expect([...result.terminal]).toEqual(Array(8).fill(0));
  expect(result.touchesUnknown.some(Boolean)).toBe(false);
});

test('absent cells and nodata have distinct coverage and only gaps mark uncertainty', () => {
  const options = {width: 5, height: 2, origin: [0, 0] as const, outlets: [0]};
  const tiles = [tile(0, [0, NaN, 1, NaN]), tile(3, [2, 3, 4, 5])];
  const result = createTerrainRegionalWatersheds(tiles, options);
  expect([...result.coverage]).toEqual([2, 1, 0, 2, 2, 2, 1, 0, 2, 2]);
  expect([...result.touchesUnknown]).toEqual([0, 0, 0, 1, 1, 0, 0, 0, 1, 1]);
  expect(result.contributingCells[0]).toBe(2);
  expect(result.receiver[3]).toBe(-2);
  expect(() => createTerrainRegionalWatersheds(tiles, {...options, outlets: [2]})).toThrow();
  expect(() => createTerrainRegionalWatersheds(tiles, {...options, maxCells: 9})).toThrow();
  expect(() => createTerrainRegionalWatersheds([tiles[0], tiles[0]], options)).toThrow();
  expect(() => createTerrainRegionalWatersheds([{...tiles[0], column: 1}], options)).toThrow();
});

test('a tiled Sierra window preserves monolithic spill elevations and outlet conservation', () => {
  const width = 16;
  const height = 16;
  const values = Float64Array.from(
    {length: width * height},
    (_, i) => sierra.heights[(80 + Math.floor(i / width)) * sierra.width + 48 + (i % width)] ?? NaN
  );
  const outlets = [values.findIndex(Number.isFinite), values.findLastIndex(Number.isFinite)];
  expect(outlets[0]).toBeGreaterThanOrEqual(0);
  expect(outlets[1]).toBeGreaterThan(outlets[0]);
  const tiles = [];
  for (const row of [0, 8]) {
    for (const column of [0, 8]) {
      tiles.push({
        row,
        column,
        field: new HeightField({
          width: 8,
          height: 8,
          registration: 'cell',
          origin: [column, row],
          heights: values,
          offset: row * width + column,
          stride: width
        })
      });
    }
  }
  const reference = fillTerrainDepressions(
    new HeightField({width, height, registration: 'cell', heights: values}),
    {outlets}
  );
  const result = createTerrainRegionalWatersheds(tiles, {width, height, origin: [0, 0], outlets});
  expect(result.field.copyData()).toEqual(reference.field.copyData());
  expect(result.receiver).toEqual(reference.receiver);
  expect(outlets.reduce((sum, index) => sum + result.contributingCells[index], 0)).toBe(
    reference.field.validCount - reference.disconnectedCells
  );
});
