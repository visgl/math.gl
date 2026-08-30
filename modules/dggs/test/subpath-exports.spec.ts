// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {A5Decoder} from '@math.gl/dggs/a5';
import {GeohashDecoder} from '@math.gl/dggs/geohash';
import {H3Decoder} from '@math.gl/dggs/h3';
import {PlusCodeDecoder} from '@math.gl/dggs/plus-code';
import {QuadkeyDecoder} from '@math.gl/dggs/quadkey';
import {S2Decoder} from '@math.gl/dggs/s2';

type GlobalGridLayerContract = {
  name: string;
  hasNumericRepresentation: boolean;
  cellToLngLat: (cell: string | bigint) => [number, number];
  cellToBoundary: (cell: string | bigint) => [number, number][];
};

test('@math.gl/dggs decoder subpath exports', () => {
  expect(A5Decoder.name).toBe('a5');
  expect(GeohashDecoder.name).toBe('geohash');
  expect(H3Decoder.name).toBe('h3');
  expect(PlusCodeDecoder.name).toBe('plus-code');
  expect(QuadkeyDecoder.name).toBe('quadkey');
  expect(S2Decoder.name).toBe('s2');
});

test('decoders satisfy the deck.gl-community GlobalGridLayer contract', () => {
  const grids: GlobalGridLayerContract[] = [
    A5Decoder,
    GeohashDecoder,
    H3Decoder,
    PlusCodeDecoder,
    QuadkeyDecoder,
    S2Decoder
  ];
  expect(grids.every(grid => typeof grid.cellToBoundary === 'function')).toBe(true);
});
