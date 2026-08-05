import {test, expect} from 'vitest';
import {
  makeOrientedBoundingBoxFromPoints,
  makeAxisAlignedBoundingBoxFromPoints
} from '@math.gl/culling';
import {Vector3, equals} from '@math.gl/core';

const testPoints = [
  [1, 0, 0],
  [2, 0, 0],
  [0, 0, 0],
  [1, 1, 2]
];

test('makeOrientedBoundingBoxFromPoints#empty', () => {
  const boundingBox = makeOrientedBoundingBoxFromPoints([]);
  expect(equals(boundingBox.center, Vector3.ZERO)).toBeTruthy();
  expect(equals(boundingBox.halfSize, Vector3.ZERO)).toBeTruthy();
});

test('makeOrientedBoundingBoxFromPoints#one point', () => {
  const point = [1, 2, 3];
  const boundingBox = makeOrientedBoundingBoxFromPoints([point]);
  expect(equals(boundingBox.center, point)).toBeTruthy();
  expect(equals(boundingBox.halfSize, Vector3.ZERO)).toBeTruthy();
});

test('makeOrientedBoundingBoxFromPoints', () => {
  const boundingBox = makeOrientedBoundingBoxFromPoints(testPoints);
  for (const point of testPoints) {
    expect(
      equals(boundingBox.distanceTo(point), 0),
      'point is inside the bounding box'
    ).toBeTruthy();
  }
});

test('makeAxisAlignedBoundingBoxFromPoints', () => {
  const boundingBox = makeAxisAlignedBoundingBoxFromPoints(testPoints);
  expect(equals(boundingBox.center, [1, 0.5, 1])).toBeTruthy();
  expect(equals(boundingBox.halfDiagonal, [1, 0.5, 1])).toBeTruthy();
});
