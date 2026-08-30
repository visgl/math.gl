// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  forEachSegmentInPolygon,
  forEachSegmentInPolygonPoints,
  getPolygonSignedArea,
  getPolygonSignedAreaPoints,
  getPolygonWindingDirection,
  getPolygonWindingDirectionPoints,
  modifyPolygonWindingDirection,
  modifyPolygonWindingDirectionPoints
} from '../src/polygon-utils';
import {Polygon} from '../src/polygon';

const triangle = [0, 0, 1, 0, 0, 1];
const trianglePoints = [
  [0, 0],
  [1, 0],
  [0, 1]
];

test('polygon utility variants cover planes, offsets, and winding changes', () => {
  expect(getPolygonSignedArea(triangle)).toBe(-0.5);
  expect(getPolygonSignedArea([0, 0, 0, 0, 1, 0, 0, 0, 1], {size: 3, plane: 'yz'})).toBe(-0.5);
  expect(getPolygonSignedArea([0, 0, 0, 1, 0, 0, 0, 0, 1], {size: 3, plane: 'xz'})).toBe(-0.5);
  expect(getPolygonSignedArea([9, 9, ...triangle, 9, 9], {start: 2, end: 8})).toBe(-0.5);

  const direction = getPolygonWindingDirection(triangle);
  expect(modifyPolygonWindingDirection(triangle, direction)).toBe(false);
  const opposite = direction === 'clockwise' ? 'counter-clockwise' : 'clockwise';
  expect(modifyPolygonWindingDirection(triangle, opposite)).toBe(true);
  expect(getPolygonWindingDirection(triangle)).toBe(opposite);

  let flatSegments = 0;
  forEachSegmentInPolygon(triangle, () => flatSegments++, {isClosed: true});
  expect(flatSegments).toBe(2);
});

test('point-array polygon helpers preserve closure and winding semantics', () => {
  expect(getPolygonSignedAreaPoints(trianglePoints)).toBe(-0.5);
  expect(getPolygonWindingDirectionPoints(trianglePoints)).toBe('counter-clockwise');
  expect(modifyPolygonWindingDirectionPoints(trianglePoints, 'counter-clockwise')).toBe(false);
  expect(modifyPolygonWindingDirectionPoints(trianglePoints, 'clockwise')).toBe(true);
  expect(getPolygonWindingDirectionPoints(trianglePoints)).toBe('clockwise');

  let openSegments = 0;
  forEachSegmentInPolygonPoints(
    [
      [0, 0],
      [1, 0],
      [0, 1]
    ],
    () => openSegments++
  );
  expect(openSegments).toBe(3);
  let closedSegments = 0;
  forEachSegmentInPolygonPoints(
    [
      [0, 0],
      [1, 0],
      [0, 1]
    ],
    () => closedSegments++,
    {isClosed: true}
  );
  expect(closedSegments).toBe(2);

  const polygon = new Polygon([
    [0, 0],
    [1, 0],
    [0, 1]
  ]);
  expect(polygon.modifyWindingDirection('counter-clockwise')).toBe(false);
  expect(polygon.modifyWindingDirection('clockwise')).toBe(true);
  expect(
    new Polygon([
      [0, 0],
      [1, 1]
    ]).getWindingDirection()
  ).toBe('none');
});
