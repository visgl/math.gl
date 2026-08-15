// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {test, expect} from 'vitest';
import {Vector3, toDegrees, _MathUtils, equals} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

const radii = new Vector3(1.0, 2.0, 3.0);
const radiiSquared = new Vector3(radii).multiply(radii);
const radiiToTheFourth = new Vector3(radiiSquared).multiply(radiiSquared);
const oneOverRadii = new Vector3(1 / radii.x, 1 / radii.y, 1 / radii.z);
const oneOverRadiiSquared = new Vector3(1 / radiiSquared.x, 1 / radiiSquared.y, 1 / radiiSquared.z);
const minimumRadius = 1.0;
const maximumRadius = 3.0;

// All values computes using STK Components
const spaceCartesian = new Vector3(4582719.8827300891, -4582719.8827300882, 1725510.4250797231);
const spaceCartesianGeodeticSurfaceNormal = new Vector3(
  0.6829975339864266,
  -0.68299753398642649,
  0.25889908678270795
);

// [longitude, latitude, height] in degrees, degrees, and meters
const spaceCartographic = new Vector3(-45.0, 15.0, 330000.0);
const spaceCartographicGeodeticSurfaceNormal = new Vector3(
  0.68301270189221941,
  -0.6830127018922193,
  0.25881904510252074
);

const surfaceCartesian = new Vector3(4094327.7921465295, 1909216.4044747739, 4487348.4088659193);
const surfaceCartographic = new Vector3(25.0, 45.0, 0.0);

test('Ellipsoid#default constructor creates zero Ellipsoid', () => {
  const ellipsoid = new Ellipsoid();
  expect(equals(ellipsoid.radii, Vector3.ZERO)).toBe(true);
  expect(equals(ellipsoid.radiiSquared, Vector3.ZERO)).toBe(true);
  expect(equals(ellipsoid.radiiToTheFourth, Vector3.ZERO)).toBe(true);
  expect(equals(ellipsoid.oneOverRadii, Vector3.ZERO)).toBe(true);
  expect(equals(ellipsoid.oneOverRadiiSquared, Vector3.ZERO)).toBe(true);
  expect(ellipsoid.minimumRadius).toBe(0.0);
  expect(ellipsoid.maximumRadius).toBe(0.0);
});

test('Ellipsoid#constructor computes correct values', () => {
  const ellipsoid = new Ellipsoid(radii.x, radii.y, radii.z);
  expect(equals(ellipsoid.radii, radii)).toBe(true);
  expect(equals(ellipsoid.radiiSquared, radiiSquared)).toBe(true);
  expect(equals(ellipsoid.radiiToTheFourth, radiiToTheFourth)).toBe(true);
  expect(equals(ellipsoid.oneOverRadii, oneOverRadii)).toBe(true);
  expect(equals(ellipsoid.oneOverRadiiSquared, oneOverRadiiSquared)).toBe(true);
  expect(ellipsoid.minimumRadius).toBe(minimumRadius);
  expect(ellipsoid.maximumRadius).toBe(maximumRadius);
});

test('Ellipsoid#ellipsoid is initialized with squaredXOverSquaredZ property', () => {
  const ellipsoid = new Ellipsoid(4, 4, 3);
  const squaredXOverSquaredZ = ellipsoid.radiiSquared.x / ellipsoid.radiiSquared.z;
  expect(ellipsoid.squaredXOverSquaredZ).toBe(squaredXOverSquaredZ);
});

test('Ellipsoid#geodeticSurfaceNormalCartographic works without a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.geodeticSurfaceNormalCartographic(spaceCartographic);
  expect(equals(returnedResult, spaceCartographicGeodeticSurfaceNormal, _MathUtils.EPSILON15)).toBe(
    true
  );
});

test('Ellipsoid#geodeticSurfaceNormalCartographic works with a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.geodeticSurfaceNormalCartographic(spaceCartographic, result);
  expect(returnedResult === result).toBeTruthy();
  expect(equals(returnedResult, spaceCartographicGeodeticSurfaceNormal, _MathUtils.EPSILON15)).toBe(
    true
  );
});

test('Ellipsoid#geodeticSurfaceNormal works without a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.geodeticSurfaceNormal(spaceCartesian);
  expect(equals(returnedResult, spaceCartesianGeodeticSurfaceNormal, _MathUtils.EPSILON15)).toBe(
    true
  );
});

test('Ellipsoid#geodeticSurfaceNormal works with a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.geodeticSurfaceNormal(spaceCartesian, result);
  expect(returnedResult === result).toBeTruthy();
  expect(equals(returnedResult, spaceCartesianGeodeticSurfaceNormal, _MathUtils.EPSILON15)).toBe(
    true
  );
});

test('Ellipsoid#geocentricSurfaceNormal works without a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.geocentricSurfaceNormal([2, 0, 0]);
  expect(equals(returnedResult, [1, 0, 0])).toBe(true);
});

test('Ellipsoid#geocentricSurfaceNormal works with a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.geocentricSurfaceNormal([2, 0, 0], result);
  expect(returnedResult === result).toBeTruthy();
  expect(equals(returnedResult, [1, 0, 0])).toBe(true);
});

test('Ellipsoid#cartographicToCartesian interprets degrees without a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartographicToCartesian(spaceCartographic);
  expect(equals(returnedResult, spaceCartesian, _MathUtils.EPSILON7)).toBe(true);
});

test('Ellipsoid#cartographicToCartesian works with a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.cartographicToCartesian(spaceCartographic, result);
  expect(result === returnedResult).toBeTruthy();
  expect(equals(returnedResult, spaceCartesian, _MathUtils.EPSILON7)).toBe(true);
});

test('Ellipsoid#cartographicToCartesian works with an Object result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = {x: 0, y: 0, z: 0};
  // @ts-expect-error ADD XYZ TYPE
  const returnedResult = ellipsoid.cartographicToCartesian(spaceCartographic, result);
  expect(result === returnedResult).toBeTruthy();
  expect(equals(returnedResult.x, spaceCartesian.x, _MathUtils.EPSILON7)).toBe(true);
  expect(equals(returnedResult.y, spaceCartesian.y, _MathUtils.EPSILON7)).toBe(true);
  expect(equals(returnedResult.z, spaceCartesian.z, _MathUtils.EPSILON7)).toBe(true);
});

test('Ellipsoid#cartesianToCartographic works without a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartesianToCartographic(surfaceCartesian);
  expect(equals(returnedResult, surfaceCartographic, _MathUtils.EPSILON8)).toBe(true);
});

test('Ellipsoid#cartesianToCartographic works with a result parameter', () => {
  const result = new Vector3();
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(surfaceCartesian, result);
  expect(result === returnedResult).toBeTruthy();
  expect(equals(returnedResult, surfaceCartographic, _MathUtils.EPSILON8)).toBe(true);
});

test('Ellipsoid#cartesianToCartographic works with an Object result parameter', () => {
  const result = {x: 0, y: 0, z: 0};
  // @ts-ignore
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(surfaceCartesian, result);
  expect(result === returnedResult).toBeTruthy();
  expect(equals(returnedResult.x, surfaceCartographic.x, _MathUtils.EPSILON8)).toBe(true);
  expect(equals(returnedResult.y, surfaceCartographic.y, _MathUtils.EPSILON8)).toBe(true);
  expect(equals(returnedResult.z, surfaceCartographic.z, _MathUtils.EPSILON8)).toBe(true);
});

test('Ellipsoid#cartesianToCartographic works with a Cartesian result parameter', () => {
  const result = {longitude: 0, latitude: 0, height: 0};
  // @ts-ignore
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(surfaceCartesian, result);
  // @ts-ignore
  expect(result === returnedResult).toBeTruthy();
  // @ts-ignore
  expect(equals(returnedResult.longitude, surfaceCartographic.x, _MathUtils.EPSILON8)).toBe(true);
  // @ts-ignore
  expect(equals(returnedResult.latitude, surfaceCartographic.y, _MathUtils.EPSILON8)).toBe(true);
  // @ts-ignore
  expect(equals(returnedResult.height, surfaceCartographic.z, _MathUtils.EPSILON8)).toBe(true);
});

test('Ellipsoid#cartesianToCartographic works close to center', () => {
  const expected = new Vector3(
    toDegrees(9.999999999999999e-11),
    toDegrees(1.0067394967422763e-20),
    -6378137.0
  );
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(new Vector3(1e-50, 1e-60, 1e-70));
  expect(equals(returnedResult, expected, _MathUtils.EPSILON8), 'close to center').toBe(true);
});

test('Ellipsoid#cartesianToCartographic return undefined very close to center', () => {
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(1e-150, 1e-150, 1e-150)
  );
  expect(returnedResult).toBe(undefined);
});

test('Ellipsoid#cartesianToCartographic return undefined at center', () => {
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(Vector3.ZERO);
  expect(returnedResult).toBe(undefined);
});

test('Ellipsoid#scaleToGeodeticSurface scaled in the x direction', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(1.0, 0.0, 0.0);
  const cartesian = new Vector3(9.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  expect(returnedResult).toEqual(expected);
});

test('Ellipsoid#scaleToGeodeticSurface scaled in the y direction', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 2.0, 0.0);
  const cartesian = new Vector3(0.0, 8.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  expect(returnedResult).toEqual(expected);
});

test('Ellipsoid#scaleToGeodeticSurface scaled in the z direction', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 0.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 8.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  expect(returnedResult).toEqual(expected);
});

test('Ellipsoid#scaleToGeodeticSurface works without a result parameter', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.2680893773941855, 1.1160466902266495, 2.3559801120411263);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  expect(equals(returnedResult, expected, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#scaleToGeodeticSurface works with a result parameter', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.2680893773941855, 1.1160466902266495, 2.3559801120411263);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian, result);
  expect(returnedResult === result).toBeTruthy();
  expect(equals(result, expected, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#scaleToGeodeticSurface returns undefined at center', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  expect(returnedResult).toBe(undefined);
});

test('Ellipsoid#scaleToGeocentricSurface scaled in the x direction', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(1.0, 0.0, 0.0);
  const cartesian = new Vector3(9.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  expect(returnedResult).toEqual(expected);
});

test('Ellipsoid#scaleToGeocentricSurface scaled in the y direction', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 2.0, 0.0);
  const cartesian = new Vector3(0.0, 8.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  expect(returnedResult).toEqual(expected);
});

test('Ellipsoid#scaleToGeocentricSurface scaled in the z direction', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 0.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 8.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  expect(returnedResult).toEqual(expected);
});

test('Ellipsoid#scaleToGeocentricSurface works without a result parameter', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.7807200583588266, 0.9759000729485333, 1.1710800875382399);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  expect(equals(returnedResult, expected, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#scaleToGeocentricSurface works with a result parameter', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.7807200583588266, 0.9759000729485333, 1.1710800875382399);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian, result);
  expect(returnedResult === result).toBeTruthy();
  expect(equals(result, expected, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#scaleToGeocentricSurface works with an Object result parameter', () => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.7807200583588266, 0.9759000729485333, 1.1710800875382399);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const result = {x: 0, y: 0, z: 0};
  // @ts-expect-error TODO - remove
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian, result);
  // @ts-expect-error
  expect(returnedResult === result).toBeTruthy();
  expect(equals(result.x, expected.x, _MathUtils.EPSILON16)).toBe(true);
  expect(equals(result.y, expected.y, _MathUtils.EPSILON16)).toBe(true);
  expect(equals(result.z, expected.z, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#transformPositionToScaledSpace works without a result parameter', () => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(2.0, 2.0, 2.0);
  const cartesian = new Vector3(4.0, 6.0, 8.0);
  const returnedResult = ellipsoid.transformPositionToScaledSpace(cartesian);
  expect(equals(returnedResult, expected, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#transformPositionToScaledSpace works with a result parameter', () => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(3.0, 3.0, 3.0);
  const cartesian = new Vector3(6.0, 9.0, 12.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.transformPositionToScaledSpace(cartesian, result);
  expect(returnedResult === result).toBeTruthy();
  expect(equals(result, expected, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#transformPositionFromScaledSpace works without a result parameter', () => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(4.0, 6.0, 8.0);
  const cartesian = new Vector3(2.0, 2.0, 2.0);
  const returnedResult = ellipsoid.transformPositionFromScaledSpace(cartesian);
  expect(equals(returnedResult, expected, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#transformPositionFromScaledSpace works with a result parameter', () => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(6.0, 9.0, 12.0);
  const cartesian = new Vector3(3.0, 3.0, 3.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.transformPositionFromScaledSpace(cartesian, result);
  expect(returnedResult === result).toBeTruthy();
  expect(equals(result, expected, _MathUtils.EPSILON16)).toBe(true);
});

test('Ellipsoid#equals works in all cases', () => {
  const ellipsoid = new Ellipsoid(1.0, 0.0, 0.0);
  expect(ellipsoid.equals(new Ellipsoid(1.0, 0.0, 0.0))).toBe(true);
  expect(ellipsoid.equals(new Ellipsoid(1.0, 1.0, 0.0))).toBe(false);
  expect(ellipsoid.equals(undefined)).toBe(false);
});

test('Ellipsoid#toString produces expected values', () => {
  const expected = '[1, 2, 3]';
  const ellipsoid = new Ellipsoid(1, 2, 3);
  expect(ellipsoid.toString()).toBe(expected);
});

test('Ellipsoid#constructor throws if x less than 0', () => {
  expect(() => new Ellipsoid(-1, 0, 0)).toThrow();
});

test('Ellipsoid#constructor throws if y less than 0', () => {
  expect(() => new Ellipsoid(0, -1, 0)).toThrow();
});

test('Ellipsoid#constructor throws if z less than 0', () => {
  expect(() => new Ellipsoid(0, 0, -1)).toThrow();
});

test('Ellipsoid#geodeticSurfaceNormalCartographic throws with no cartographic', () => {
  expect(() => Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(undefined)).toThrow();
});

test.skip('Ellipsoid#geocentricSurfaceNormal throws with no', () => {
  expect(() => Ellipsoid.WGS84.geocentricSurfaceNormal(undefined)).toThrow();
});

test('Ellipsoid#geodeticSurfaceNormal throws with no cartesian', () => {
  expect(() => Ellipsoid.WGS84.geodeticSurfaceNormal(undefined)).toThrow();
});

test('Ellipsoid#cartographicToCartesian throws with no cartographic', () => {
  expect(() => Ellipsoid.WGS84.cartographicToCartesian(undefined)).toThrow();
});

test('Ellipsoid#cartographicArrayToCartesianArray throws with no cartographics', () => {
  // @ts-expect-error
  expect(() => Ellipsoid.WGS84.cartographicArrayToCartesianArray(undefined)).toThrow();
});

test('Ellipsoid#cartesianToCartographic throws with no cartesian', () => {
  expect(() => Ellipsoid.WGS84.cartesianToCartographic(undefined)).toThrow();
});

test('Ellipsoid#cartesianArrayToCartographicArray throws with no cartesians', () => {
  // @ts-ignore
  expect(() => Ellipsoid.WGS84.cartesianArrayToCartographicArray(undefined)).toThrow();
});

test('Ellipsoid#scaleToGeodeticSurface throws with no cartesian', () => {
  expect(() => Ellipsoid.WGS84.scaleToGeodeticSurface(undefined)).toThrow();
});

test('Ellipsoid#scaleToGeocentricSurface throws with no cartesian', () => {
  expect(() => Ellipsoid.WGS84.scaleToGeocentricSurface(undefined)).toThrow();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis throws with no position', () => {
  // @ts-ignore
  expect(() => Ellipsoid.WGS84.getSurfaceNormalIntersectionWithZAxis(undefined)).toThrow();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis throws if the ellipsoid is not an ellipsoid of revolution', () => {
  const ellipsoid = new Ellipsoid(1, 2, 3);
  const cartesian = new Vector3();
  // @ts-ignore
  expect(() => ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesian)).toThrow();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis throws if the ellipsoid has radii.z === 0', () => {
  const ellipsoid = new Ellipsoid(1, 2, 0);
  const cartesian = new Vector3();
  // @ts-ignore
  expect(() => ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesian)).toThrow();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis works without a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = [35.23, 33.23, 0]; // Cartographic.fromDegrees(35.23, 33.23);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface);
  expect(returnedResult instanceof Array).toBeTruthy();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis works with a result parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = [35.23, 33.23, 0]; // Cartographic.fromDegrees(35.23, 33.23);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(
    cartesianOnTheSurface,
    undefined,
    cartesianOnTheSurface
  );
  expect(returnedResult === cartesianOnTheSurface).toBeTruthy();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis returns undefined if the result is outside the ellipsoid with buffer parameter', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = [35.23, 33.23, 0]; // Cartographic.fromDegrees(35.23, 33.23);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(
    cartesianOnTheSurface,
    ellipsoid.radii.z
  );
  expect(returnedResult === undefined).toBeTruthy();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis returns undefined if the result is outside the ellipsoid without buffer parameter', () => {
  const majorAxis = 10;
  const minorAxis = 1;
  const ellipsoid = new Ellipsoid(majorAxis, majorAxis, minorAxis);
  const cartographic = [45.0, 90.0, 0]; // Cartographic.fromDegrees(45.0, 90.0);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(
    cartesianOnTheSurface,
    undefined
  );
  expect(returnedResult === undefined).toBeTruthy();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis returns a result that is equal to a value that computed in a different way', () => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = [35.23, 33.23, 0]; // Cartographic.fromDegrees(35.23, 33.23);
  let cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(cartesianOnTheSurface);
  const magnitude = cartesianOnTheSurface[0] / surfaceNormal[0];

  const expected = new Vector3();
  expected.z = cartesianOnTheSurface[2] - surfaceNormal[2] * magnitude;
  let result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);
  expect(equals(result, expected, _MathUtils.EPSILON8)).toBe(true);

  // at the equator
  cartesianOnTheSurface = new Vector3(ellipsoid.radii.x, 0, 0);
  result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);
  expect(equals(result, Vector3.ZERO, _MathUtils.EPSILON8)).toBe(true);
});

test("getSurfaceNormalIntersectionWithZAxis returns a result that when it's used as an origin for a vector with the surface normal direction it produces an accurate cartographic", () => {
  const ellipsoid = Ellipsoid.WGS84;

  let cartographic = [35.23, 33.23, 0];
  let cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  let surfaceNormal = ellipsoid.geodeticSurfaceNormal(cartesianOnTheSurface);

  let result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);

  let surfaceNormalWithLength = new Vector3(surfaceNormal).multiplyByScalar(
    ellipsoid.maximumRadius
  );
  let position = new Vector3(surfaceNormalWithLength).add(result);
  let resultCartographic = ellipsoid.cartesianToCartographic(position);
  resultCartographic[2] = 0.0;
  expect(equals(resultCartographic, cartographic, _MathUtils.EPSILON8)).toBe(true);

  // at the north pole
  cartographic = [0, 90, 0];
  cartesianOnTheSurface = new Vector3(0, 0, ellipsoid.radii.z);
  surfaceNormal = ellipsoid.geodeticSurfaceNormal(cartesianOnTheSurface);
  surfaceNormalWithLength = new Vector3(surfaceNormal).multiplyByScalar(ellipsoid.maximumRadius);
  result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);
  position = new Vector3(surfaceNormalWithLength).add(result);
  resultCartographic = ellipsoid.cartesianToCartographic(position);
  resultCartographic[2] = 0.0;
  expect(equals(resultCartographic, cartographic, _MathUtils.EPSILON8)).toBe(true);
});
