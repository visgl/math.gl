// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {latLngToCell} from 'h3-js';
import {lonLatToCell} from 'a5-js';
import {
  A5Decoder,
  H3Decoder,
  S2Decoder,
  GeohashDecoder,
  QuadkeyDecoder,
  PlusCodeDecoder,
  unwrapDGGSBoundary
} from '@math.gl/dggs';

test('unwraps crossings in either direction without changing latitudes', () => {
  expect(
    unwrapDGGSBoundary([
      [179, 1],
      [-179, 2]
    ])
  ).toEqual([
    [179, 1],
    [181, 2]
  ]);
  expect(
    unwrapDGGSBoundary([
      [-179, 1],
      [179, 2]
    ])
  ).toEqual([
    [-179, 1],
    [-181, 2]
  ]);
  expect(
    unwrapDGGSBoundary(
      [
        [179, 1],
        [-179, 2]
      ],
      -180
    )
  ).toEqual([
    [-181, 1],
    [-179, 2]
  ]);
  expect(
    unwrapDGGSBoundary(
      [
        [179, 1],
        [-179, 2]
      ],
      900
    )
  ).toEqual([
    [899, 1],
    [901, 2]
  ]);
});

test('preserves ties, empty and singleton boundaries, and already unwrapped data', () => {
  expect(unwrapDGGSBoundary([])).toEqual([]);
  expect(unwrapDGGSBoundary([[10, 20]])).toEqual([[10, 20]]);
  const boundary: [number, number][] = [
    [0, 1],
    [180, 2],
    [0, 3],
    [-180, 4]
  ];
  expect(unwrapDGGSBoundary(boundary)).toEqual(boundary);
  expect(
    unwrapDGGSBoundary([
      [0, 0],
      [180, 1]
    ])
  ).toEqual([
    [0, 0],
    [180, 1]
  ]);
  expect(
    unwrapDGGSBoundary([
      [0, 0],
      [-180, 1]
    ])
  ).toEqual([
    [0, 0],
    [-180, 1]
  ]);
  const unwrapped: [number, number][] = [
    [179, 1],
    [181, 2],
    [179, 1]
  ];
  expect(unwrapDGGSBoundary(unwrapDGGSBoundary(unwrapped))).toEqual(unwrapped);
});

test('copies frozen input, preserves closure, and allocates every pair', () => {
  const boundary = Object.freeze([
    Object.freeze([179, 1] as const),
    Object.freeze([-179, 2] as const),
    Object.freeze([179, 1] as const)
  ]);
  const result = unwrapDGGSBoundary(boundary);
  expect(result).toEqual([
    [179, 1],
    [181, 2],
    [179, 1]
  ]);
  result.forEach((point, i) => expect(point).not.toBe(boundary[i]));
  expect(result[0]).not.toBe(result[2]);
});

test('preserves full-world cells and closed rings with polar winding', () => {
  for (const boundary of [
    GeohashDecoder.cellToBoundary(''),
    [
      [-135, 80],
      [-45, 80],
      [45, 80],
      [135, 80],
      [-135, 80]
    ] as [number, number][]
  ]) {
    for (const ring of [boundary, [...boundary].reverse()]) {
      const result = unwrapDGGSBoundary(ring, 720);
      expect(result).toEqual(ring);
      result.forEach((point, i) => expect(point).not.toBe(ring[i]));
    }
  }
});

const fixtures = [
  {decoder: H3Decoder, cell: latLngToCell(10, 179.99, 3)},
  {decoder: A5Decoder, cell: lonLatToCell([179.99, 10], 4)},
  {decoder: S2Decoder, cell: '6b'},
  {decoder: S2Decoder, cell: '54'},
  {decoder: S2Decoder, cell: '5c'},
  {decoder: GeohashDecoder, cell: 'xb'},
  {decoder: QuadkeyDecoder, cell: '13'},
  {decoder: PlusCodeDecoder, cell: '6VGX2X2X+2X'}
];

test.each(fixtures)(
  '$decoder.name shares helper semantics across geometry methods ($cell)',
  ({decoder, cell}) => {
    const original = decoder.cellToBoundary(cell);
    const snapshot = original.map(point => [...point]);
    const options = {unwrap: true, referenceLongitude: 180};
    const boundary = decoder.cellToBoundary(cell, options);
    expect(boundary).toEqual(unwrapDGGSBoundary(original, 180));
    expect(boundary[0]).toEqual(boundary.at(-1));
    expect(decoder.cellToBoundaryFlat(cell, options)).toEqual(boundary.flat());
    expect(decoder.cellToBounds(cell, options)).toEqual([
      [Math.min(...boundary.map(p => p[0])), decoder.cellToBounds(cell)[0][1]],
      [Math.max(...boundary.map(p => p[0])), decoder.cellToBounds(cell)[1][1]]
    ]);
    expect(original).toEqual(snapshot);
    expect(decoder.cellToBoundary(cell)).toEqual(snapshot);
    expect(decoder.cellToBoundary(cell, {referenceLongitude: 720})).toEqual(snapshot);
    expect(decoder.cellToBoundaryFlat(cell, {unwrap: false})).toEqual(
      decoder.cellToBoundaryFlat(cell)
    );
    expect(decoder.cellToBounds(cell, {unwrap: false})).toEqual(decoder.cellToBounds(cell));
  }
);

test.each(fixtures.slice(0, 2))(
  '$decoder.name real seam cells become local polygons',
  ({decoder, cell}) => {
    const raw = decoder.cellToBoundary(cell);
    if (decoder.name === 'h3') {
      expect(Math.max(...raw.map(p => p[0])) - Math.min(...raw.map(p => p[0]))).toBeGreaterThan(
        180
      );
    } else {
      // A5 already returns continuous longitudes in current releases.
      expect(Math.max(...raw.map(p => p[0]))).toBeGreaterThan(180);
      expect(Math.min(...raw.map(p => p[0]))).toBeLessThan(180);
      expect(unwrapDGGSBoundary(raw)).toEqual(raw);
    }
    const boundary = decoder.cellToBoundary(cell, {unwrap: true});
    expect(
      Math.max(...boundary.map(p => p[0])) - Math.min(...boundary.map(p => p[0]))
    ).toBeLessThan(180);
  }
);

test.each(['5', 'b'])('preserves the full extent of polar S2 root %s', cell => {
  const expected = S2Decoder.cellToBounds(cell);
  expect(expected[0][0]).toBe(-180);
  expect(expected[1][0]).toBe(180);
  expect(cell === '5' ? expected[1][1] : expected[0][1]).toBe(cell === '5' ? 90 : -90);
  for (const referenceLongitude of [undefined, 180, 720]) {
    expect(S2Decoder.cellToBounds(cell, {unwrap: true, referenceLongitude})).toEqual(expected);
  }
});
