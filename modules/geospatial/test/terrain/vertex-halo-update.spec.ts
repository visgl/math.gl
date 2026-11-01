// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createTerrainVertexTileHalos,
  updateTerrainVertexTileHalos
} from '@math.gl/geospatial/terrain';

test.each([2, 3, 4])(
  'incremental vertex halos agree with a full rebuild for tile size %i',
  width => {
    const options = {width, height: width, maxSamples: 10000};
    const tile = (column: number, row: number) => ({
      column,
      row,
      heights: Float64Array.from(
        {length: width * width},
        (_, i) =>
          column * (width - 1) + (i % width) + 5 * (row * (width - 1) + Math.floor(i / width))
      )
    });
    let resident = Array.from({length: 7}, (_, column) => tile(column - 3, 0));
    let previous = createTerrainVertexTileHalos(resident, options).tiles;
    for (const column of [0, -1, 2]) {
      const changed = [{column, row: 0}];
      resident = resident.filter(t => t.column !== column);
      const update = updateTerrainVertexTileHalos(previous, resident, changed, {
        ...options,
        previousOptions: options
      });
      expect(update.tiles).toEqual(createTerrainVertexTileHalos(resident, options).tiles);
      expect(update.removed).toEqual(changed);
      for (const tile of update.tiles)
        if (!update.rebuilt.some(t => t.column === tile.column && t.row === tile.row))
          expect(tile).toBe(previous.find(t => t.column === tile.column && t.row === tile.row));
      previous = update.tiles;
      resident = [...resident, tile(column, 0)];
      const restored = updateTerrainVertexTileHalos(previous, resident, changed, {
        ...options,
        previousOptions: options
      });
      expect(restored.tiles).toEqual(createTerrainVertexTileHalos(resident, options).tiles);
      previous = restored.tiles;
    }
  }
);

test('updates reject unreported arrivals, evictions and conflicting shared values', () => {
  const options = {width: 2, height: 2};
  const a = {column: 0, row: 0, heights: new Float64Array([0, 0, 0, 0])};
  const b = {column: 1, row: 0, heights: new Float64Array([0, 0, 0, 0])};
  const initial = createTerrainVertexTileHalos([a], options).tiles;
  expect(() =>
    updateTerrainVertexTileHalos(initial, [a, b], [], {...options, previousOptions: options})
  ).toThrow(/arrival/);
  expect(() =>
    updateTerrainVertexTileHalos(initial, [], [], {...options, previousOptions: options})
  ).toThrow(/eviction/);
  b.heights[0] = 1;
  expect(() =>
    updateTerrainVertexTileHalos(initial, [a, b], [b], {...options, previousOptions: options})
  ).toThrow(/disagreement/);
  expect(initial[0].field.heights[5]).toBe(0);
});

test('replacement invalidates diagonal halos without mutating the old snapshot', () => {
  const options = {width: 3, height: 3};
  const resident = Array.from({length: 9}, (_, i) => ({
    column: i % 3,
    row: Math.floor(i / 3),
    heights: new Float64Array(9),
    validity: new Uint8Array(9).fill(1)
  }));
  const previous = createTerrainVertexTileHalos(resident, options).tiles;
  const next = resident.map(t => ({...t, validity: t.validity.slice()}));
  next[4].validity[4] = 0;
  const result = updateTerrainVertexTileHalos(previous, next, [{column: 1, row: 1}], {
    ...options,
    previousOptions: options
  });
  expect(result.tiles).toEqual(createTerrainVertexTileHalos(next, options).tiles);
  expect(result.rebuilt).toHaveLength(9);
  expect(previous[0].statuses[24]).toBe(2);
  expect(result.tiles[0].statuses[24]).toBe(1);
});

test('global semantic changes require a full rebuild, including distant reusable tiles', () => {
  const prior = {width: 3, height: 3};
  const resident = [0, 10].map(column => ({column, row: 0, heights: new Float64Array(9)}));
  const previous = createTerrainVertexTileHalos(resident, prior).tiles;
  for (const change of [
    {origin: [100, 100] as const},
    {columnStep: [2, 0] as const},
    {rowStep: [0, 2] as const},
    {heightReference: 'ellipsoid'},
    {maxHeightDifference: 1},
    {width: 4}
  ]) {
    expect(() =>
      updateTerrainVertexTileHalos(previous, resident, [{column: 0, row: 0}], {
        ...prior,
        ...change,
        previousOptions: prior
      })
    ).toThrow(/full snapshot/);
  }
  const same = updateTerrainVertexTileHalos(previous, resident, [], {
    ...prior,
    origin: [0, 0],
    previousOptions: prior
  });
  expect(same.tiles[1]).toBe(previous[1]);
});

test('incremental arrivals cannot exceed the complete snapshot sample capacity', () => {
  const options = {width: 3, height: 3, maxSamples: 25};
  const tile = (column: number) => ({column, row: 0, heights: new Float64Array(9)});
  const previous = createTerrainVertexTileHalos([tile(0)], options).tiles;
  expect(() =>
    updateTerrainVertexTileHalos(previous, [tile(0), tile(10)], [tile(10)], {
      ...options,
      previousOptions: options
    })
  ).toThrow(/capacity/);
  const updated = updateTerrainVertexTileHalos(previous, [tile(0), tile(10)], [tile(10)], {
    ...options,
    maxSamples: 50,
    previousOptions: options
  });
  expect(updated.tiles).toEqual(
    createTerrainVertexTileHalos([tile(0), tile(10)], {...options, maxSamples: 50}).tiles
  );
});
