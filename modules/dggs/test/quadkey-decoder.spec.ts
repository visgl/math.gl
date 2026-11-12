// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {QuadkeyDecoder, quadkeyToWorldBounds} from '@math.gl/dggs';

const TEST_DATA = [
  {
    quadkey: '0',
    expectedBounds: [
      [0, 512],
      [256, 256]
    ]
  },
  {
    quadkey: '0123',
    expectedBounds: [
      [160, 416],
      [192, 384]
    ]
  },
  {
    quadkey: '333',
    expectedBounds: [
      [448, 64],
      [512, 0]
    ]
  }
];

test('QuadkeyDecoder#cellToBoundary', () => {
  for (const {quadkey} of TEST_DATA) {
    const polygon = QuadkeyDecoder.cellToBoundary(quadkey);
    expect(polygon.length - 1, `${quadkey} polygon has 4 sides`).toBe(4);
    expect(polygon[0], `${quadkey} polygon is closed`).toEqual(polygon.at(-1));
  }
});

test('quadkeyToWorldBounds', () => {
  for (const {quadkey, expectedBounds} of TEST_DATA) {
    const bounds = quadkeyToWorldBounds(quadkey);
    expect(bounds, 'Quadkey bounds calculated').toEqual(expectedBounds);
  }
});

test('QuadkeyDecoder exposes all geometry representations', () => {
  const quadkey = '0123';
  expect(QuadkeyDecoder.cellToLngLat(quadkey)).toHaveLength(2);
  const boundary = QuadkeyDecoder.cellToBoundary(quadkey);
  expect(QuadkeyDecoder.cellToBoundaryFlat(quadkey)).toEqual(boundary.flat());
  expect(QuadkeyDecoder.cellToBounds(quadkey)).toEqual([
    [-67.5, 66.51326044311185],
    [-45, 74.01954331150228]
  ]);
});

for (const level of [1, 2, 4, 30]) {
  const prefix = '0123'.repeat(8).slice(0, level - 1);

  test(`quadkeyToWorldBounds shares neighboring edges at level ${level}`, () => {
    const northWest = quadkeyToWorldBounds(`${prefix}0`);
    const northEast = quadkeyToWorldBounds(`${prefix}1`);
    const southWest = quadkeyToWorldBounds(`${prefix}2`);
    expect(northWest[1][0]).toBe(northEast[0][0]);
    expect(northWest[1][1]).toBe(southWest[0][1]);
  });

  test(`QuadkeyDecoder shares neighboring polygon edges at level ${level}`, () => {
    const northWest = QuadkeyDecoder.cellToBoundary(`${prefix}0`);
    const northEast = QuadkeyDecoder.cellToBoundary(`${prefix}1`);
    const southWest = QuadkeyDecoder.cellToBoundary(`${prefix}2`);
    // The complete east and south edges must match their neighbors' west and north edges.
    expect([northWest[0], northWest[1]]).toEqual([northEast[3], northEast[2]]);
    expect([northWest[1], northWest[2]]).toEqual([southWest[0], southWest[3]]);
  });
}

test('QuadkeyDecoder centers use the full cell bounds', () => {
  expect(QuadkeyDecoder.cellToLngLat('0')).toEqual([-90, 42.5255643899033]);
  expect(QuadkeyDecoder.cellToLngLat('0123')[0]).toBe(-56.25);
});
