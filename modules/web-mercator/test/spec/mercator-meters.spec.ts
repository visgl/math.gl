import {test, expect} from 'vitest';
import {
  EPSG3857_EARTH_RADIUS,
  EPSG3857_HALF_CIRCUMFERENCE,
  EPSG3857_MAX_LATITUDE,
  lngLatToEPSG3857,
  EPSG3857ToLngLat
} from '@math.gl/web-mercator';

test('lngLatToEPSG3857', () => {
  const result = lngLatToEPSG3857([-122.4, 37.8, 100]);

  expect(result[0]).toBeCloseTo(-13625505.673096687, 6);
  expect(result[1]).toBeCloseTo(4551210.919691888, 6);
  expect(result[2]).toBe(100);
});

test('EPSG3857ToLngLat', () => {
  const result = EPSG3857ToLngLat([-13625505.673096687, 4551210.919691888, 100]);

  expect(result[0]).toBeCloseTo(-122.4, 10);
  expect(result[1]).toBeCloseTo(37.8, 10);
  expect(result[2]).toBe(100);
});

test('EPSG3857 constants', () => {
  expect(EPSG3857_HALF_CIRCUMFERENCE).toBeCloseTo(Math.PI * EPSG3857_EARTH_RADIUS, 12);
  expect(EPSG3857_MAX_LATITUDE).toBeCloseTo(85.0511287798066, 12);
});

test('lngLatToEPSG3857 clamps latitude by default', () => {
  const result = lngLatToEPSG3857([0, 90]);
  const unprojected = EPSG3857ToLngLat(result);

  expect(unprojected[1]).toBeCloseTo(EPSG3857_MAX_LATITUDE, 12);
});

test('lngLatToEPSG3857 can reject out-of-range latitude', () => {
  expect(() => lngLatToEPSG3857([0, 90], {clampLatitude: false})).toThrow(/finite EPSG:3857 range/);
});

test('EPSG3857 converters preserve dimensionality', () => {
  expect(lngLatToEPSG3857([0, 0])).toHaveLength(2);
  expect(EPSG3857ToLngLat([0, 0])).toHaveLength(2);
  expect(lngLatToEPSG3857([0, 0, 0])).toHaveLength(3);
  expect(EPSG3857ToLngLat([0, 0, 0])).toHaveLength(3);
});
