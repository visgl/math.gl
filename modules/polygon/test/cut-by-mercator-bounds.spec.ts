// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {cutPolylineByMercatorBounds, cutPolygonByMercatorBounds} from '@math.gl/polygon';

import {flatten} from './lineclip.spec';

test('cutPolylineByMercatorBounds - simple', () => {
  expect(cutPolylineByMercatorBounds([-170, 0, 170, 20]), '2d').toEqual([
    [-170, 0, -180, 10],
    [180, 10, 170, 20]
  ]);

  expect(cutPolylineByMercatorBounds([-170, 0, 100, 170, 20, 200], {size: 3}), '3d').toEqual([
    [-170, 0, 100, -180, 10, 150],
    [180, 10, 150, 170, 20, 200]
  ]);

  expect(
    cutPolylineByMercatorBounds([-170, 0, 170, 20], {normalize: false}),
    'normalize: false'
  ).toEqual([
    [-170, 0, -180, 10],
    [-180, 10, -190, 20]
  ]);
});

test('cutPolylineByMercatorBounds - multiple crossings', () => {
  const result = cutPolylineByMercatorBounds([-170, 0, 170, 20, -175, 35, 175, 45]);

  console.log(JSON.stringify(result));
  expect(result).toEqual([
    [-170, 0, -180, 10],
    [180, 10, 170, 20, 180, 30],
    [-180, 30, -175, 35, -180, 40],
    [180, 40, 175, 45]
  ]);
});

test('cutPolylineByMercatorBounds - multiple worlds', () => {
  const polyline: number[][] = [];
  const N = 30;

  for (let i = 0; i < N; i++) {
    polyline.push([((i * 60 + 30) % 360) - 180, i]);
  }
  const result = cutPolylineByMercatorBounds(flatten(polyline));

  expect(result.length, 'returns correct number of parts').toBe(Math.ceil((N * 60) / 360));

  for (const positions of result) {
    // check left/right bounds
    let valid = positions[0] === -180 || positions[positions.length - 2] === 180;
    for (let i = 2; i < positions.length; i += 2) {
      // check slope
      valid = valid && positions[i] > positions[i - 2] && positions[i + 1] > positions[i - 1];
    }
    expect(valid, 'part is valid').toBeTruthy();
  }
});

test('cutPolygonByMercatorBounds - simple', () => {
  const polygon = [
    [-170, 0],
    [170, 0],
    [170, 20],
    [-170, 20]
  ];
  const expectedA = [
    [170, 20],
    [180, 20],
    [180, 0],
    [170, 0]
  ];
  const expectedB = [
    [-180, 20],
    [-170, 20],
    [-170, 0],
    [-180, 0]
  ];

  let parts = cutPolygonByMercatorBounds(flatten(polygon));
  expect(parts[0].positions, '2d').toEqual(flatten(expectedA));
  expect(parts[1].positions, '2d').toEqual(flatten(expectedB));

  const flatten2 = (ring, accessPosition) => flatten(ring.map(accessPosition));
  const addZ = (p: number[]) => [p[0], p[1], 100];

  parts = cutPolygonByMercatorBounds(flatten2(polygon, addZ), null, {size: 3});
  expect(parts[0].positions, '3d').toEqual(flatten2(expectedA, addZ));
  expect(parts[1].positions, '3d').toEqual(flatten2(expectedB, addZ));

  parts = cutPolygonByMercatorBounds(flatten(polygon), null, {normalize: false});
  expect(parts[0].positions, 'normalize: false').toEqual(flatten(expectedA));
  expect(parts[1].positions, 'normalize: false').toEqual(
    flatten2(expectedB, p => [p[0] + 360, p[1]])
  );
});

test('cutPolygonByMercatorBounds - with holes', () => {
  const polygon = [
    [-170, 0],
    [170, 0],
    [170, 20],
    [-170, 20]
  ];
  const expectedA = [
    [170, 20],
    [180, 20],
    [180, 0],
    [170, 0]
  ];
  const expectedB = [
    [-180, 20],
    [-170, 20],
    [-170, 0],
    [-180, 0]
  ];

  const holeA = [
    [175, 10],
    [173, 10],
    [175, 8],
    [173, 8]
  ];
  const holeB = [
    [-175, 10],
    [-173, 10],
    [-175, 8],
    [-173, 8]
  ];

  let result = cutPolygonByMercatorBounds(flatten([polygon, holeA]), [8]);
  expect(result.length, 'Returns correct number of parts').toBe(2);
  expect(result[0].positions, 'part 1 positions').toEqual(flatten([expectedA, holeA]));
  expect(result[0].holeIndices, 'part 1 holeIndices').toEqual([8]);
  expect(result[1].positions, 'part 2 positions').toEqual(flatten(expectedB));

  result = cutPolygonByMercatorBounds(flatten([polygon, holeB]), [8]);
  expect(result.length, 'Returns correct number of parts').toBe(2);
  expect(result[0].positions, 'part 1 positions').toEqual(flatten(expectedA));
  expect(result[1].positions, 'part 2 positions').toEqual(flatten([expectedB, holeB]));
  expect(result[1].holeIndices, 'part 2 holeIndices').toEqual([8]);
});

test('cutPolygonByMercatorBounds - contains pole', () => {
  const polygon = [
    [-150, 75],
    [-90, 80],
    [-30, 70],
    [30, 60],
    [90, 70],
    [150, 75]
  ];

  const result = cutPolygonByMercatorBounds(flatten(polygon));
  expect(result[0].positions).toEqual(
    flatten([
      [-90, 80],
      [-30, 70],
      [30, 60],
      [90, 70],
      [150, 75],
      [180, 75],
      [180, 85.051129],
      [-90, 85.051129]
    ])
  );
  expect(result[1].positions).toEqual(
    flatten([
      [-180, 75],
      [-150, 75],
      [-90, 80],
      [-90, 85.051129],
      [-180, 85.051129]
    ])
  );
});
