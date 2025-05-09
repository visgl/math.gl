// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// @ts-nocheck
import {earcut, Polygon, modifyPolygonWindingDirection, WINDING} from '@math.gl/polygon';
import {toNested} from './utils';
import {fstat} from 'fs';

const flatPolygonSmall = [0, 0, 1, 1, 0, 2, -1, 1, -1.25, 0.5, 0, 0];

const flatPolygonMedium = [
  4.2625, 2.24125, 3.0025, 3.20125, 2.5225, 4.22125, 0.9225, 4.32125, -0.3775, 3.30125, -0.7975,
  2.14125, -1.8575, 2.72125, -1.8575, 0.64125, -0.3775, -0.89875, -0.3775, -0.89875, 1.2825,
  0.92125, 1.4025, -0.89875, 2.9025, -0.31875, 4.0825, 0.62125, 4.2625, 2.24125
];
const nestedPolygonMedium = toNested(flatPolygonMedium);

const flatPolygonLarge = new Array(10000)
  .fill(0)
  .map((_, i) =>
    i % 2 === 0 ? Math.cos((Math.PI * 2 * i) / 5000) : Math.sin((Math.PI * 2 * i) / 5000)
  );
const nestedPolygonLarge = toNested(flatPolygonLarge);

// A helper function to swap winding direction on each iteration.
let winding = WINDING.CLOCKWISE;
function nextWinding() {
  winding = winding === WINDING.CLOCKWISE ? WINDING.COUNTER_CLOCKWISE : WINDING.CLOCKWISE;
  return winding;
}

export function polygonBench(suite, addReferenceBenchmarks) {
  suite
    .group('Polygon')
    .add('Polygon#new()', () => new Polygon(flatPolygonSmall))
    .add('Polygon#modifyWindingDirection() flat small', () => {
      const polygon = new Polygon(flatPolygonSmall);
      polygon.modifyWindingDirection(nextWinding());
    })
    .add('modifyPolygonWindingDirection() flat small', () => {
      modifyPolygonWindingDirection(flatPolygonSmall, nextWinding(), {
        isClosed: true,
        start: 0,
        end: flatPolygonSmall.length,
        size: 2
      });
    })
    .add('Polygon#modifyWindingDirection() flat medium', () => {
      const polygon = new Polygon(flatPolygonMedium);
      polygon.modifyWindingDirection(nextWinding());
    })
    .add('modifyPolygonWindingDirection() flat medium', () => {
      modifyPolygonWindingDirection(flatPolygonMedium, nextWinding(), {
        isClosed: true,
        start: 0,
        end: flatPolygonMedium.length,
        size: 2
      });
    })
    .add('Polygon#getSignedArea() flat medium', () => {
      const polygon = new Polygon(flatPolygonMedium);
      polygon.getSignedArea();
    })
    .add('Polygon#getSignedArea(fast) flat medium', () => {
      const polygon = new Polygon(flatPolygonMedium);
      polygon.getSignedArea(true);
    })
    .add('Polygon#getSignedArea() nested medium', () => {
      const polygon = new Polygon(nestedPolygonMedium);
      polygon.getSignedArea();
    })
    .add('Polygon#getSignedArea(fast) nested medium', () => {
      const polygon = new Polygon(nestedPolygonMedium);
      polygon.getSignedArea(true);
    })
    .add('Polygon#getSignedArea() flat large', () => {
      const polygon = new Polygon(flatPolygonLarge);
      polygon.getSignedArea();
    })
    .add('Polygon#getSignedArea(fast) flat large ', () => {
      const polygon = new Polygon(flatPolygonLarge);
      polygon.getSignedArea(true);
    })
    .add('Polygon#getSignedArea() nested large', () => {
      const polygon = new Polygon(nestedPolygonLarge);
      polygon.getSignedArea();
    })
    .add('Polygon#getSignedArea(fast) nested large', () => {
      const polygon = new Polygon(nestedPolygonLarge);
      polygon.getSignedArea(true);
    })
    .add('earcut with precomputed areas', () => {
      earcut(flatPolygonMedium, [], 2, [-21.3664]);
    })
    .add('earcut', () => {
      earcut(flatPolygonMedium, [], 2);
    });

  return suite;
}
