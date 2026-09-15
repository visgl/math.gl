// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';

import {
  getS2Cell,
  getS2DescendantIndex,
  getS2IndexFromCell,
  toHilbertQuadkey
} from '@math.gl/dggs/s2-geometry/s2-geometry';
import {S2} from 's2-geometry';
import {
  getS2ChildIndex,
  getS2IndexFromToken,
  getS2Level,
  getS2TokenFromIndex
} from '../../src/s2-geometry/s2-token';

test('S2 Hilbert quadkey conversion', () => {
  const TEST_COORDINATES = [
    {lat: 0, lng: 0},
    {lat: -122.45, lng: 37.78},
    {lat: 85, lng: 180}
  ];

  const TEST_LEVELS = [1, 2, 4, 8, 16];

  for (let face = 0; face < 6; face++) {
    const id = (BigInt(face) << 61n) | (1n << 60n);
    expect(toHilbertQuadkey(id), `face ${face} level 0 key`).toBe(`${face}/`);
    expect(getS2Cell(id), `face ${face} level 0 cell`).toEqual({
      face,
      ij: [0, 0],
      level: 0
    });
  }

  for (const point of TEST_COORDINATES) {
    for (const level of TEST_LEVELS) {
      const key = S2.latLngToKey(point.lat, point.lng, level);
      const id = BigInt(S2.keyToId(key));
      const cell = S2.S2Cell.FromHilbertQuadKey(key);

      expect(toHilbertQuadkey(id), `level ${level}, id ${id.toString()}: Id to quad key`).toBe(key);
      expect(getS2Cell(id), `level ${level}, id ${id.toString()}: Id to S2 cell`).toEqual({
        face: cell.face,
        ij: cell.ij,
        level: cell.level
      });
    }
  }
});

test('S2 tokens support empty cells, canonical padding and child indexes', () => {
  expect(getS2IndexFromToken('X')).toBe(0n);
  expect(getS2TokenFromIndex(0n)).toBe('X');
  const parent = getS2IndexFromToken('89c25');
  expect(getS2TokenFromIndex(parent)).toBe('89c25');
  expect([0, 1, 2, 3].map(child => getS2TokenFromIndex(getS2ChildIndex(parent, child)))).toEqual([
    '89c244',
    '89c24c',
    '89c254',
    '89c25c'
  ]);
});

test('S2 child indexes match the reference implementation across faces and levels', () => {
  const parentTokens = ['1', '3', '5', '7', '9', 'b', '89c25', '80858004'];
  for (const parentToken of parentTokens) {
    const parentIndex = getS2IndexFromToken(parentToken);
    const parentKey = toHilbertQuadkey(parentIndex);
    for (let child = 0; child < 4; child++) {
      const expectedIndex = BigInt(S2.keyToId(`${parentKey}${child}`));
      expect(getS2ChildIndex(parentIndex, child), `${parentToken} child ${child}`).toBe(
        expectedIndex
      );
    }
  }
});

test('S2 cell coordinates and spatial descendants match the reference implementation', () => {
  const rootTokens = ['1', '3', '5', '7', '9', 'b', '89c25'];
  for (const rootToken of rootTokens) {
    const rootIndex = getS2IndexFromToken(rootToken);
    const rootCell = getS2Cell(rootIndex);
    expect(getS2IndexFromCell(rootCell)).toBe(rootIndex);

    const relativeLevel = 2;
    const divisionCount = 2 ** relativeLevel;
    for (let x = 0; x < divisionCount; x++) {
      for (let y = 0; y < divisionCount; y++) {
        const referenceCell = S2.S2Cell.FromFaceIJ(
          rootCell.face,
          [rootCell.ij[0] * divisionCount + x, rootCell.ij[1] * divisionCount + y],
          rootCell.level + relativeLevel
        );
        const expectedIndex = BigInt(S2.keyToId(referenceCell.toHilbertQuadkey()));
        expect(
          getS2DescendantIndex(rootIndex, relativeLevel, x, y),
          `${rootToken} descendant ${x},${y}`
        ).toBe(expectedIndex);
      }
    }
  }
});

test('S2 hierarchy helpers reject malformed and out-of-range inputs', () => {
  const parentIndex = getS2IndexFromToken('89c25');
  expect(getS2Level(parentIndex)).toBe(8);
  expect(() => getS2ChildIndex(parentIndex, -1)).toThrow(/child index/);
  expect(() => getS2ChildIndex(parentIndex, 4)).toThrow(/child index/);
  expect(() => getS2ChildIndex(0n, 0)).toThrow(/S2 index/);
  expect(() => getS2ChildIndex(getS2IndexFromToken('1000000000000001'), 0)).toThrow(/leaf/);
  expect(() => getS2DescendantIndex(parentIndex, -1, 0, 0)).toThrow(/relative level/);
  expect(() => getS2DescendantIndex(parentIndex, 1, 2, 0)).toThrow(/coordinates/);
  expect(() => getS2IndexFromCell({face: 6, ij: [0, 0], level: 0})).toThrow(/face/);
  expect(() => getS2IndexFromCell({face: 0, ij: [2, 0], level: 1})).toThrow(/coordinates/);
});
