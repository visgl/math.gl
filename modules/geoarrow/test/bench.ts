// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// @ts-expect-error tsconfig issue?
import type {Bench} from '@probe.gl/bench';
import {writeWKB} from '@math.gl/wkb';
import {
  convertGeoArrowColumn,
  decodeGeoArrowWKB,
  getGeoArrowBounds,
  getGeoArrowWKBVertexCount,
  getGeoArrowVertexCount
} from '../src/index';
import type {GeoArrowColumn} from '../src/types';

const POINT_COUNT = 1_000_000;
const pointWKB = writeWKB({type: 'Point', coordinates: [1, 2]}, 'xy');
const wkbValues = new Uint8Array(POINT_COUNT * pointWKB.length);
const wkbOffsets = new Int32Array(POINT_COUNT + 1);
const coordinates = new Float64Array(POINT_COUNT * 2);
for (let index = 0; index < POINT_COUNT; index++) {
  wkbValues.set(pointWKB, index * pointWKB.length);
  wkbOffsets[index + 1] = (index + 1) * pointWKB.length;
  coordinates[index * 2] = index;
  coordinates[index * 2 + 1] = -index;
}

const serializedPoints: GeoArrowColumn = {
  encoding: 'geoarrow.wkb',
  dimension: 'xy',
  coordinateLayout: null,
  chunks: [
    {
      kind: 'serialized',
      encoding: 'binary',
      length: POINT_COUNT,
      offsets: wkbOffsets,
      values: wkbValues
    }
  ]
};

const nativePoints: GeoArrowColumn = {
  encoding: 'geoarrow.point',
  dimension: 'xy',
  coordinateLayout: 'interleaved',
  chunks: [
    {
      kind: 'fixed-size-list',
      length: POINT_COUNT,
      size: 2,
      child: {kind: 'primitive', length: coordinates.length, values: coordinates}
    }
  ]
};

/** Allocation-sensitive GeoArrow benchmarks modeled on loaders.gl's small-feature hot path. */
export function geoarrowBench(suite: Bench): Bench {
  suite
    .group('GeoArrow buffers (1M points)')
    .add('count WKB vertices', () => getGeoArrowWKBVertexCount(serializedPoints))
    .add('decode WKB to native', () => decodeGeoArrowWKB(serializedPoints))
    .add('native vertex count', () => getGeoArrowVertexCount(nativePoints))
    .add('native bounds', () => getGeoArrowBounds(nativePoints))
    .add('interleaved to separated', () =>
      convertGeoArrowColumn(nativePoints, {coordinateLayout: 'separated'})
    );
  return suite;
}
