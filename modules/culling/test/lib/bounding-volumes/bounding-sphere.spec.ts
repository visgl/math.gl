// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {test, expect} from 'vitest';

import {Vector3, Matrix4, equals} from '@math.gl/core';
import {BoundingSphere, Plane, INTERSECTION} from '@math.gl/culling';

// const positionsRadius = 1.0;
// const positionsCenter = new Vector3(10000001.0, 0.0, 0.0);

// const center = [10000000.0, 0.0, 0.0];

const VECTOR3_UNIT_X = new Vector3(1, 0, 0);
Object.freeze(VECTOR3_UNIT_X);

const VECTOR3_ZERO = new Vector3(0, 0, 0);
Object.freeze(VECTOR3_ZERO);

// function getPositions() {
//   return [
//     new Vector3(center).add([1, 0, 0]),
//     new Vector3(center).add([2, 0, 0]),
//     new Vector3(center).add([0, 0, 0]),
//     new Vector3(center).add([1, 1, 0]),
//     new Vector3(center).add([1, -1, 0]),
//     new Vector3(center).add([1, 0, 1]),
//     new Vector3(center).add([1, 0, -1])
//   ];
// }

/*
function getPositionsAsFlatArray() {
  const positions = getPositions();
  const result = [];
  for (let i = 0; i < positions.length; ++i) {
    result.push(positions[i].x);
    result.push(positions[i].y);
    result.push(positions[i].z);
  }
  return result;
}

function getPositionsAsFlatArrayWithStride5() {
  const positions = getPositions();
  const result = [];
  for (let i = 0; i < positions.length; ++i) {
    result.push(positions[i].x);
    result.push(positions[i].y);
    result.push(positions[i].z);
    result.push(1.23);
    result.push(4.56);
  }
  return result;
}

function getPositionsAsEncodedFlatArray() {
  const positions = getPositions();
  const high = [];
  const low = [];
  for (let i = 0; i < positions.length; ++i) {
    const encoded = EncodedVector3.fromCartesian(positions[i]);
    high.push(encoded.high.x);
    high.push(encoded.high.y);
    high.push(encoded.high.z);
    low.push(encoded.low.x);
    low.push(encoded.low.y);
    low.push(encoded.low.z);
  }
  return {
    high,
    low
  };
}
*/

test('BoundingSphere#default constructing produces expected values', () => {
  const sphere = new BoundingSphere();
  expect(equals(sphere.center, [0, 0, 0])).toBe(true);
  expect(sphere.radius).toBe(0.0);
});

test('BoundingSphere#constructor sets expected values (array)', () => {
  const expectedCenter = [1.0, 2.0, 3.0];
  const expectedRadius = 1.0;
  const sphere = new BoundingSphere(expectedCenter, expectedRadius);
  expect(equals(sphere.center, expectedCenter)).toBe(true);
  expect(sphere.radius).toBe(expectedRadius);
});

test('BoundingSphere#constructor sets expected values (object)', () => {
  const expectedCenter = {x: 1.0, y: 2.0, z: 3.0};
  const expectedRadius = 1.0;
  // @ts-expect-error TODO - add XYZ types
  const sphere = new BoundingSphere(expectedCenter, expectedRadius);
  expect(equals(sphere.center, [1, 2, 3])).toBe(true);
  expect(sphere.radius).toBe(expectedRadius);
});

test('BoundingSphere#fromCornerPoints', () => {
  const sphere = new BoundingSphere().fromCornerPoints(
    new Vector3(-1.0, -0.0, 0.0),
    new Vector3(1.0, 0.0, 0.0)
  );
  expect(equals(sphere, new BoundingSphere(VECTOR3_ZERO, 1.0))).toBe(true);
});

test('BoundingSphere#fromCornerPoints throws without corner', () => {
  const sphere = new BoundingSphere();
  // @ts-expect-error
  expect(() => sphere.fromCornerPoints()).toThrow();
});

test('BoundingSphere#fromCornerPoints throws without oppositeCorner', () => {
  const sphere = new BoundingSphere();
  // @ts-expect-error
  expect(() => sphere.fromCornerPoints(VECTOR3_UNIT_X)).toThrow();
});

test('BoundingSphere#clone', () => {
  const sphere = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 4.0);
  const result = sphere.clone();
  expect(sphere).not.toBe(result);
  expect(equals(sphere, result)).toBe(true);
});

test('BoundingSphere#equals', () => {
  const sphere = new BoundingSphere([1.0, 2.0, 3.0], 4.0);
  expect(sphere.equals(new BoundingSphere([1.0, 2.0, 3.0], 4.0))).toBe(true);
  expect(sphere.equals(new BoundingSphere([5.0, 2.0, 3.0], 4.0))).toBe(false);
  expect(sphere.equals(new BoundingSphere([1.0, 6.0, 3.0], 4.0))).toBe(false);
  expect(sphere.equals(new BoundingSphere([1.0, 2.0, 7.0], 4.0))).toBe(false);
  expect(sphere.equals(new BoundingSphere([1.0, 2.0, 3.0], 8.0))).toBe(false);
  expect(sphere.equals(undefined)).toBe(false);
});

test('BoundingSphere#intersectPlane with sphere on the positive side of a plane', () => {
  const sphere = new BoundingSphere(VECTOR3_ZERO, 0.5);
  const normal = new Vector3(VECTOR3_UNIT_X).negate();
  const position = VECTOR3_UNIT_X;
  const plane = new Plane(normal, -normal.dot(position));
  expect(sphere.intersectPlane(plane)).toBe(INTERSECTION.INSIDE);
});

test('BoundingSphere#intersectPlane with sphere on the negative side of a plane', () => {
  const sphere = new BoundingSphere(VECTOR3_ZERO, 0.5);
  const normal = VECTOR3_UNIT_X;
  const position = VECTOR3_UNIT_X;
  const plane = new Plane(normal, -normal.dot(position));
  expect(sphere.intersectPlane(plane)).toBe(INTERSECTION.OUTSIDE);
});

test('BoundingSphere#intersectPlane with sphere intersecting a plane', () => {
  const sphere = new BoundingSphere(VECTOR3_UNIT_X, 0.5);
  const normal = VECTOR3_UNIT_X;
  const position = VECTOR3_UNIT_X;
  const plane = new Plane(normal, -normal.dot(position));
  expect(sphere.intersectPlane(plane)).toBe(INTERSECTION.INTERSECTING);
});

test('BoundingSphere#expands to contain another sphere', () => {
  const bs1 = new BoundingSphere(VECTOR3_UNIT_X.clone().negate(), 1.0);
  const bs2 = new BoundingSphere(VECTOR3_UNIT_X, 1.0);
  const expected = new BoundingSphere(VECTOR3_ZERO, 2.0);
  expect(equals(bs1.union(bs2), expected)).toBe(true);
});

test('BoundingSphere#union left sphere encloses right', () => {
  const bs1 = new BoundingSphere(VECTOR3_ZERO, 3.0);
  const bs2 = new BoundingSphere(VECTOR3_UNIT_X, 1.0);
  const union = bs1.union(bs2);
  expect(equals(union, bs1)).toBe(true);
});

test('BoundingSphere#union of co-located spheres, right sphere encloses left', () => {
  const bs1 = new BoundingSphere(VECTOR3_UNIT_X, 1.0);
  const bs2 = new BoundingSphere(VECTOR3_UNIT_X, 2.0);
  const union = bs1.union(bs2);
  expect(equals(union, bs2)).toBe(true);
});

test('BoundingSphere#union result parameter is a tight fit', () => {
  const bs1 = new BoundingSphere(new Vector3(VECTOR3_UNIT_X).negate().scale(3.0), 3.0);
  const bs2 = new BoundingSphere(VECTOR3_UNIT_X, 1.0);
  const expected = new BoundingSphere(new Vector3(VECTOR3_UNIT_X).negate().scale(2.0), 4.0);
  bs1.union(bs2);
  expect(equals(bs1, expected)).toBe(true);
});

test('BoundingSphere#expands to contain another point', () => {
  const bs = new BoundingSphere(new Vector3(VECTOR3_UNIT_X).negate(), 1.0);
  const point = VECTOR3_UNIT_X;
  const expected = new BoundingSphere(new Vector3(VECTOR3_UNIT_X).negate(), 2.0);
  expect(equals(bs.expand(point), expected)).toBe(true);
});

test('BoundingSphere#applies transform', () => {
  const bs = new BoundingSphere(VECTOR3_ZERO, 1.0);
  const transform = new Matrix4().translate(new Vector3(1.0, 2.0, 3.0));
  const expected = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 1.0);
  expect(equals(bs.transform(transform), expected)).toBe(true);
});

test('BoundingSphere#applies scale transform', () => {
  const bs = new BoundingSphere(VECTOR3_ZERO, 1.0);
  const transform = new Matrix4().scale(new Vector3(1.0, 2.0, 3.0));
  const expected = new BoundingSphere(VECTOR3_ZERO, 3.0);
  expect(equals(bs.transform(transform), expected)).toBe(true);
});

test('BoundingSphere#estimated distance squared to point', () => {
  const bs = new BoundingSphere(VECTOR3_ZERO, 1.0);
  expect(bs.distanceSquaredTo([0, 0, 0]), 'point inside the sphere').toBe(0);
  expect(bs.distanceSquaredTo([0, 0, 1]), 'point on the sphere surface').toBe(0);
  expect(bs.distanceSquaredTo([0, 0, 2]), 'point outside the sphere').toBe(1);
  expect(bs.distanceSquaredTo([3, 4, 12]), 'point outside the sphere').toBe(144);
});

test('BoundingSphere#estimated distance to point', () => {
  const bs = new BoundingSphere(VECTOR3_ZERO, 1.0);
  expect(bs.distanceTo([0, 0, 0]), 'point inside the sphere').toBe(0);
  expect(bs.distanceTo([0, 0, 1]), 'point on the sphere surface').toBe(0);
  expect(bs.distanceTo([0, 0, 2]), 'point outside the sphere').toBe(1);
  expect(bs.distanceTo([3, 4, 12]), 'point outside the sphere').toBe(12);
});

test('BoundingSphere#union throws with no parameter', () => {
  const sphere = new BoundingSphere();
  expect(() => sphere.union(undefined)).toThrow();
});

test('BoundingSphere#expand throws without a point', () => {
  const sphere = new BoundingSphere();
  expect(() => sphere.expand(undefined)).toThrow();
});

test('BoundingSphere#intersectPlane throws without a plane', () => {
  const sphere = new BoundingSphere();
  expect(() => sphere.intersectPlane(undefined)).toThrow();
});

test('BoundingSphere#transform throws without a transform', () => {
  const sphere = new BoundingSphere();
  // @ts-expect-error
  expect(() => sphere.transform()).toThrow();
});

test('BoundingSphere#distanceSquaredTo throws without a cartesian', () => {
  const sphere = new BoundingSphere();
  // @ts-expect-error
  expect(() => sphere.distanceSquaredTo(new BoundingSphere())).toThrow();
});

// CESIUM TEST CASES FOR UNPORTED METHODS

/*
test('BoundingSphere#applies transform without scale', t => {
  const bs = new BoundingSphere(VECTOR3_ZERO, 1.0);
  const transform = new Matrix4().translate(new Vector3(1.0, 2.0, 3.0));
  const expected = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 1.0);
  tapeEquals(t, BoundingSphere.transformWithoutScale(bs, transform), expected);

  t.end();
});

test('BoundingSphere#transformWithoutScale ignores scale', t => {
  const bs = new BoundingSphere(VECTOR3_ZERO, 1.0);
  const transform = new Matrix4().scale(new Vector3(1.0, 2.0, 3.0));
  const expected = new BoundingSphere(VECTOR3_ZERO, 1.0);
  tapeEquals(t, BoundingSphere.transformWithoutScale(bs, transform), expected);

  t.end();
});

test('BoundingSphere#finds distances', t => {
  const bs = new BoundingSphere(VECTOR3_ZERO, 1.0);
  const position = new Vector3(-2.0, 1.0, 0.0);
  const direction = VECTOR3_UNIT_X;
  const expected = new Interval(1.0, 3.0);
  t.equals(BoundingSphere.computePlaneDistances(bs, position, direction), expected);

  t.end();
});
*/

/*
test('BoundingSphere#fromEllipsoid', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const sphere = BoundingSphere.fromEllipsoid(ellipsoid);
  t.equals(sphere.center, VECTOR3_ZERO);
  t.equals(sphere.radius, ellipsoid.maximumRadius);

  t.end();
});

test('BoundingSphere#fromEllipsoid with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const sphere = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 4.0);
  const result = BoundingSphere.fromEllipsoid(ellipsoid, sphere);
  expect(result).toBe(sphere);
  t.equals(result, new BoundingSphere(VECTOR3_ZERO, ellipsoid.maximumRadius));

  t.end();
});

test('BoundingSphere#fromEllipsoid throws without ellipsoid', t => {
  t.throws(() => sphere.fromEllipsoid());

  t.end();
});

test('BoundingSphere#fromBoundingSpheres with undefined returns an empty sphere', t => {
  const sphere = BoundingSphere.fromBoundingSpheres();
  t.equals(sphere.center, VECTOR3_ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromBoundingSpheres with empty array returns an empty sphere', t => {
  const sphere = BoundingSphere.fromBoundingSpheres([]);
  t.equals(sphere.center, VECTOR3_ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromBoundingSpheres works with 1 sphere', t => {
  const one = new BoundingSphere(new Vector3(1, 2, 3), 4);

  const sphere = BoundingSphere.fromBoundingSpheres([one]);
  t.equals(sphere, one);

  t.end();
});

test('BoundingSphere#fromBoundingSpheres works with 2 spheres', t => {
  const one = new BoundingSphere(new Vector3(1, 2, 3), 4);
  const two = new BoundingSphere(new Vector3(5, 6, 7), 8);

  const sphere = BoundingSphere.fromBoundingSpheres([one, two]);
  t.equals(sphere, BoundingSphere.union(one, two, new BoundingSphere()));

  t.end();
});

test('BoundingSphere#fromBoundingSpheres works with 3 spheres', t => {
  const one = new BoundingSphere(new Vector3(0, 0, 0), 1);
  const two = new BoundingSphere(new Vector3(0, 3, 0), 1);
  const three = new BoundingSphere(new Vector3(0, 0, 4), 1);

  const expected = new BoundingSphere(new Vector3(0.0, 1.5, 2.0), 3.5);
  const sphere = BoundingSphere.fromBoundingSpheres([one, two, three]);
  t.equals(sphere, expected);

  t.end();
});

test('BoundingSphere#projectTo2D', t => {
  const positions = getPositions();
  const projection = new GeographicProjection();

  const positions2D = [];
  for (let i = 0; i < positions.length; ++i) {
    const position = positions[i];
    const cartographic = projection.ellipsoid.cartesianToCartographic(position);
    positions2D.push(projection.project(cartographic));
  }

  const boundingSphere3D = BoundingSphere.fromPoints(positions);
  const boundingSphere2D = BoundingSphere.projectTo2D(boundingSphere3D, projection);
  const actualSphere = BoundingSphere.fromPoints(positions2D);
  actualSphere.center = new Vector3(actualSphere.center.z, actualSphere.center.x, actualSphere.center.y);

  expect(boundingSphere2D.center).toEqualEpsilon(actualSphere.center, CesiumMath.EPSILON6);
  expect(boundingSphere2D.radius).toBeGreaterThan(actualSphere.radius);

  t.end();
});

test('BoundingSphere#projectTo2D with result parameter', t => {
  const positions = getPositions();
  const projection = new GeographicProjection();
  const sphere = new BoundingSphere();

  const positions2D = [];
  for (let i = 0; i < positions.length; ++i) {
    const position = positions[i];
    const cartographic = projection.ellipsoid.cartesianToCartographic(position);
    positions2D.push(projection.project(cartographic));
  }

  const boundingSphere3D = BoundingSphere.fromPoints(positions);
  const boundingSphere2D = BoundingSphere.projectTo2D(boundingSphere3D, projection, sphere);
  const actualSphere = BoundingSphere.fromPoints(positions2D);
  actualSphere.center = new Vector3(actualSphere.center.z, actualSphere.center.x, actualSphere.center.y);

  expect(boundingSphere2D).toBe(sphere);
  expect(boundingSphere2D.center).toEqualEpsilon(actualSphere.center, CesiumMath.EPSILON6);
  expect(boundingSphere2D.radius).toBeGreaterThan(actualSphere.radius);

  t.end();
});

test('BoundingSphere#union throws with no left parameter', t => {
  const right = new BoundingSphere();
  t.throws(() => sphere.union(undefined, right));

  t.end();
});

test('BoundingSphere#transformWithoutScale throws without a sphere', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.transformWithoutScale());

  t.end();
});

test('BoundingSphere#transformWithoutScale throws without a transform', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.transformWithoutScale(sphere));

  t.end();
});

test('BoundingSphere#computePlaneDistances throws without a sphere', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.computePlaneDistances());

  t.end();
});

test('BoundingSphere#computePlaneDistances throws without a position', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.computePlaneDistances(new BoundingSphere()));

  t.end();
});

test('BoundingSphere#computePlaneDistances throws without a direction', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.computePlaneDistances(new BoundingSphere(), new Vector3()));

  t.end();
});

test('BoundingSphere#isOccluded throws without a sphere', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.isOccluded());

  t.end();
});

test('BoundingSphere#isOccluded throws without an occluder', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.isOccluded(new BoundingSphere()));

  t.end();
});

/*
function expectBoundingSphereToContainPoint(boundingSphere, point, projection) {
  const pointInCartesian = projection.project(point);
  const distanceFromCenter = Vector3.magnitude(Vector3.subtract(pointInCartesian, boundingSphere.center, new Vector3()));

  // The distanceFromCenter for corner points at the height extreme should equal the
  // bounding sphere's radius.  But due to rounding errors it can end up being
  // very slightly greater.  Pull in the distanceFromCenter slightly to
  // account for this possibility.
  distanceFromCenter -= CesiumMath.EPSILON9;

  expect(distanceFromCenter).toBeLessThanOrEqualTo(boundingSphere.radius);
}

test('BoundingSphere#fromRectangleWithHeights2D includes specified min and max heights', t => {
  const rectangle = new Rectangle(0.1, 0.5, 0.2, 0.6);
  const projection = new GeographicProjection();
  const minHeight = -327.0;
  const maxHeight = 2456.0;
  const boundingSphere = BoundingSphere.fromRectangleWithHeights2D(rectangle, projection, minHeight, maxHeight);

  // Test that the corners are inside the bounding sphere.
  const point = Rectangle.southwest(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.southwest(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.northeast(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.northeast(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.southeast(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.southeast(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.northwest(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.northwest(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  // Test that the center is inside the bounding sphere
  point = Rectangle.center(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.center(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  // Test that the edge midpoints are inside the bounding sphere.
  point = new Cartographic(Rectangle.center(rectangle).longitude, rectangle.south, minHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(Rectangle.center(rectangle).longitude, rectangle.south, maxHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(Rectangle.center(rectangle).longitude, rectangle.north, minHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(Rectangle.center(rectangle).longitude, rectangle.north, maxHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(rectangle.west, Rectangle.center(rectangle).latitude, minHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(rectangle.west, Rectangle.center(rectangle).latitude, maxHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(rectangle.east, Rectangle.center(rectangle).latitude, minHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(rectangle.east, Rectangle.center(rectangle).latitude, maxHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  t.end();
});
*/
