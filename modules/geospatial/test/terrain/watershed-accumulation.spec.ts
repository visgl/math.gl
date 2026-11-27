// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  accumulateTerrainWatersheds,
  fillTerrainDepressions,
  getTerrainCellMetrics,
  HeightField
} from '@math.gl/geospatial/terrain';

test('merges branches and labels multiple outlets independently of cell order', () => {
  const receiver = Int32Array.of(3, 0, 0, -1, -2, 6, -1, 5);
  const before = receiver.slice();
  const result = accumulateTerrainWatersheds(receiver);
  expect([...result.contributingCells]).toEqual([3, 1, 1, 4, 0, 2, 3, 1]);
  expect([...result.terminal]).toEqual([3, 3, 3, 3, -1, 6, 6, 6]);
  expect(receiver).toEqual(before);
});

test('conserves outlet-connected area across a filled flat and excludes an isolated island', () => {
  const field = new HeightField({
    width: 5,
    height: 3,
    registration: 'cell',
    columnStep: [3, 0],
    rowStep: [1, -2],
    heights: Float64Array.of(9, 9, 4, NaN, -2, 9, 0, 5, NaN, -3, 9, 1, 9, NaN, -4)
  });
  const conditioned = fillTerrainDepressions(field, {outlets: [2]});
  expect(conditioned.field.getHeight(1, 1)).toBe(5);
  const {contributingCells, terminal} = accumulateTerrainWatersheds(conditioned.receiver);
  expect([...terminal]).toEqual([2, 2, 2, -1, -1, 2, 2, 2, -1, -1, 2, 2, 2, -1, -1]);
  expect(contributingCells[2] * getTerrainCellMetrics(field).area).toBe(54);
  expect(contributingCells[8]).toBe(0);
  expect(contributingCells[9]).toBe(0);
});

test('rejects malformed forests and enforces the allocation budget', () => {
  for (const receiver of [[1, 0], [0], [2, 0, 1, -1]])
    expect(() => accumulateTerrainWatersheds(Int32Array.from(receiver))).toThrow('cycle');
  for (const receiver of [[-3], [1], [1, -2]])
    expect(() => accumulateTerrainWatersheds(Int32Array.from(receiver))).toThrow('receiver');
  expect(() => accumulateTerrainWatersheds(Int32Array.of(-1), {maxCells: 0})).toThrow(
    'cell budget'
  );
  expect(accumulateTerrainWatersheds(Int32Array.of(-2)).contributingCells[0]).toBe(0);
});
