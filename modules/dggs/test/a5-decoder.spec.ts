// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {A5Decoder} from '@math.gl/dggs/a5';

const A5_TOKEN = '1ae2988000000000';
const A5_INDEX = 1937278465245970432n;

test('A5Decoder decodes tokens and bigint indexes', () => {
  expect(A5Decoder.tokenToCell(A5_TOKEN)).toBe(A5_INDEX);
  expect(A5Decoder.cellToToken(A5_INDEX)).toBe(A5_TOKEN);
  expect(A5Decoder.cellToLngLat(A5_TOKEN)).toEqual(A5Decoder.cellToLngLat(A5_INDEX));
  expectCoordinatesClose(
    A5Decoder.cellToLngLat(A5_TOKEN),
    [-122.37432272230855, 37.78289994807168]
  );

  const boundary = A5Decoder.cellToBoundary(A5_TOKEN);
  expect(boundary).toHaveLength(6);
  expect(boundary[0]).toEqual(boundary.at(-1));
  expect(A5Decoder.cellToBoundaryFlat(A5_TOKEN)).toEqual(boundary.flat());
  expectCoordinatesClose(
    A5Decoder.cellToBounds(A5_TOKEN).flat(),
    [-122.42869436115987, 37.760815980573746, -122.32275241425506, 37.808111753388296]
  );
});

function expectCoordinatesClose(actual: number[], expected: number[]): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 12));
}
