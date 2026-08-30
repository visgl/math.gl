// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {H3Decoder} from '@math.gl/dggs/h3';

const H3_TOKEN = '89283082803ffff';
const H3_INDEX = 617700169957507071n;

test('H3Decoder decodes tokens and bigint indexes', () => {
  expect(H3Decoder.tokenToCell(H3_TOKEN)).toBe(H3_INDEX);
  expect(H3Decoder.cellToToken(H3_INDEX)).toBe(H3_TOKEN);
  expect(H3Decoder.cellToLngLat(H3_TOKEN)).toEqual(H3Decoder.cellToLngLat(H3_INDEX));
  expectCoordinatesClose(
    H3Decoder.cellToLngLat(H3_TOKEN),
    [-122.4182710369247, 37.773515097238146]
  );

  const boundary = H3Decoder.cellToBoundary(H3_TOKEN);
  expect(boundary).toHaveLength(7);
  expect(boundary[0]).toEqual(boundary.at(-1));
  expect(H3Decoder.cellToBoundaryFlat(H3_TOKEN)).toEqual(boundary.flat());
  expectCoordinatesClose(
    H3Decoder.cellToBounds(H3_TOKEN).flat(),
    [-122.42060189084884, 37.771832391440924, -122.4159401398489, 37.775197782893386]
  );
});

function expectCoordinatesClose(actual: number[], expected: number[]): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 12));
}
