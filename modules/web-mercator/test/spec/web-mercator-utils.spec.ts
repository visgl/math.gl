import {test, expect} from 'vitest';
import destination from '@turf/destination';
import {toLowPrecision} from '../utils/test-utils';
import {config, equals} from '@math.gl/core';

import {
  lngLatToWorld,
  worldToLngLat,
  zoomToScale,
  getMeterZoom,
  getDistanceScales,
  addMetersToLngLat,
  getViewMatrix,
  getProjectionMatrix,
  getProjectionParameters,
  worldToPixels,
  pixelsToWorld
} from '@math.gl/web-mercator';

import VIEWPORT_PROPS from '../utils/sample-viewports';

const DISTANCE_TOLERANCE = 0.0005;
const DISTANCE_TOLERANCE_PIXELS = 2;
const DISTANCE_SCALE_TEST_ZOOM = 12;

test('Viewport#imports', () => {
  expect(lngLatToWorld, 'lngLatToWorld imports OK').toBeTruthy();
  expect(worldToLngLat, 'worldToLngLat imports OK').toBeTruthy();
  expect(getMeterZoom, 'getMeterZoom imports OK').toBeTruthy();
  expect(getViewMatrix, 'getViewMatrix imports OK').toBeTruthy();
  expect(getProjectionMatrix, 'getProjectionMatrix imports OK').toBeTruthy();
  expect(getProjectionParameters, 'getProjectionParameters imports OK').toBeTruthy();
  expect(worldToPixels, 'worldToPixels imports OK').toBeTruthy();
  expect(pixelsToWorld, 'pixelsToWorld imports OK').toBeTruthy();
});

test('lngLatToWorld', () => {
  expect(() => lngLatToWorld([38, -122]), 'throws on invalid latitude').toThrow(/latitude/i);
  expect(
    equals(lngLatToWorld([-122, 38]), [82.4888888888889, 314.50692551385134]),
    'returns correct result'
  ).toBeTruthy();
});

test('getDistanceScales', () => {
  for (const vc in VIEWPORT_PROPS) {
    const props = VIEWPORT_PROPS[vc];
    const {metersPerUnit, unitsPerMeter, degreesPerUnit, unitsPerDegree} = getDistanceScales(props);

    expect(
      [
        toLowPrecision(metersPerUnit[0] * unitsPerMeter[0]),
        toLowPrecision(metersPerUnit[1] * unitsPerMeter[1]),
        toLowPrecision(metersPerUnit[2] * unitsPerMeter[2])
      ],
      'metersPerUnit checks with unitsPerMeter'
    ).toEqual([1, 1, 1]);

    expect(
      [
        toLowPrecision(degreesPerUnit[0] * unitsPerDegree[0]),
        toLowPrecision(degreesPerUnit[1] * unitsPerDegree[1]),
        toLowPrecision(degreesPerUnit[2] * unitsPerDegree[2])
      ],
      'degreesPerUnit checks with unitsPerDegree'
    ).toEqual([1, 1, 1]);
  }
});

test('getDistanceScales#unitsPerDegree', () => {
  const scale = Math.pow(2, DISTANCE_SCALE_TEST_ZOOM);
  const z = 1000;

  for (const vc in VIEWPORT_PROPS) {
    console.log(vc);
    const props = VIEWPORT_PROPS[vc];
    const {longitude, latitude} = props;
    const {unitsPerDegree, unitsPerDegree2} = getDistanceScales({
      longitude,
      latitude,
      highPrecision: true
    });

    // Test degree offsets
    for (const delta of [0.001, 0.01, 0.05, 0.1, 0.3]) {
      console.log(`R = ${delta} degrees`);

      // To pixels
      const coords = [delta * unitsPerDegree[0], delta * unitsPerDegree[1], z * unitsPerDegree[2]];
      const coordsAdjusted = [
        delta * (unitsPerDegree[0] + unitsPerDegree2[0] * delta),
        delta * (unitsPerDegree[1] + unitsPerDegree2[1] * delta),
        z * (unitsPerDegree[2] + unitsPerDegree2[2] * delta)
      ];

      const pt = [longitude + delta, latitude + delta];

      const realCoords = [
        lngLatToWorld(pt)[0] - lngLatToWorld([longitude, latitude])[0],
        lngLatToWorld(pt)[1] - lngLatToWorld([longitude, latitude])[1],
        z * getDistanceScales({longitude: pt[0], latitude: pt[1]}).unitsPerMeter[2]
      ];

      const diff = getDiff(coords, realCoords, scale);
      const diffAdjusted = getDiff(coordsAdjusted, realCoords, scale);

      console.log(`unadjusted: ${diff.message}`);
      console.log(`adjusted: ${diffAdjusted.message}`);

      expect(
        diffAdjusted.error.every(e => e < DISTANCE_TOLERANCE),
        'Error within ratio tolerance'
      ).toBeTruthy();
      expect(
        diffAdjusted.errorPixels.every(p => p < DISTANCE_TOLERANCE_PIXELS),
        'Error within pixel tolerance'
      ).toBeTruthy();
    }
  }
});

test('getDistanceScales#unitsPerMeter', () => {
  const scale = Math.pow(2, DISTANCE_SCALE_TEST_ZOOM);
  const z = 1000;

  for (const vc in VIEWPORT_PROPS) {
    console.log(vc);
    const props = VIEWPORT_PROPS[vc];
    const {longitude, latitude} = props;
    const {unitsPerMeter, unitsPerMeter2} = getDistanceScales({
      latitude,
      longitude,
      highPrecision: true
    });

    // Test degree offsets
    for (const delta of [10, 100, 1000, 5000, 10000, 30000]) {
      console.log(`R = ${delta} meters`);

      // To pixels
      const coords = [delta * unitsPerMeter[0], delta * unitsPerMeter[1], z * unitsPerMeter[2]];
      const coordsAdjusted = [
        delta * (unitsPerMeter[0] + unitsPerMeter2[0] * delta),
        delta * (unitsPerMeter[1] + unitsPerMeter2[1] * delta),
        z * (unitsPerMeter[2] + unitsPerMeter2[2] * delta)
      ];

      let pt = [longitude, latitude];
      // turf unit is kilometers
      const feature = destination(pt, (delta / 1000) * Math.sqrt(2), 45);
      pt = feature.geometry.coordinates;

      const realCoords = [
        lngLatToWorld(pt)[0] - lngLatToWorld([longitude, latitude])[0],
        lngLatToWorld(pt)[1] - lngLatToWorld([longitude, latitude])[1],
        z * getDistanceScales({longitude: pt[0], latitude: pt[1]}).unitsPerMeter[2]
      ];

      const diff = getDiff(coords, realCoords, scale);
      const diffAdjusted = getDiff(coordsAdjusted, realCoords, scale);

      console.log(`unadjusted: ${diff.message}`);
      console.log(`adjusted: ${diffAdjusted.message}`);

      expect(
        diffAdjusted.error.every(e => e < DISTANCE_TOLERANCE),
        'Error within ratio tolerance'
      ).toBeTruthy();
      expect(
        diffAdjusted.errorPixels.every(p => p < DISTANCE_TOLERANCE_PIXELS),
        'Error within pixel tolerance'
      ).toBeTruthy();
    }
  }
});

test('addMetersToLngLat', () => {
  config.EPSILON = 1e-7;

  for (const vc in VIEWPORT_PROPS) {
    console.log(vc);
    const {longitude, latitude} = VIEWPORT_PROPS[vc];

    // Test degree offsets
    for (const delta of [10, 100, 1000, 5000]) {
      console.log(`R = ${delta} meters`);

      const origin = [longitude, latitude];
      // turf unit is kilometers
      const feature = destination(origin, (delta / 1000) * Math.sqrt(2), 45);
      const pt = feature.geometry.coordinates.concat(delta);

      const result = addMetersToLngLat(origin, [delta, delta, delta]);

      console.log(`Comparing: ${result}, ${pt}`);

      expect(equals(result, pt), 'Returns correct result').toBeTruthy();
    }
  }
});

test('getMeterZoom', () => {
  const TEST_LATITUDES = [0, 37.5, 75];

  for (const latitude of TEST_LATITUDES) {
    const zoom = getMeterZoom({latitude});
    const scale = zoomToScale(zoom);

    const {unitsPerMeter} = getDistanceScales({latitude, longitude: 0});
    expect(
      toLowPrecision(unitsPerMeter.map(x => x * scale)),
      'zoom yields 1 pixel per meter'
    ).toEqual([1, 1, 1]);
  }
});

function getDiff(value, baseValue, scale) {
  const errorPixels = value.map((v, i) => Math.abs((v - baseValue[i]) * scale));
  const error = value.map(
    (v, i) => Math.abs(v - baseValue[i]) / Math.min(Math.abs(v), Math.abs(baseValue[i]))
  );

  return {
    errorPixels,
    error,
    message: `off by \
      (${errorPixels.map(d => d.toFixed(3)).join(', ')}) pixels, \
      (${error.map(d => `${(d * 100).toFixed(3)}%`).join(', ')})`
  };
}

test('getProjectionParameters', () => {
  const TEST_CASES = {
    ...VIEWPORT_PROPS,
    extremePitched: {
      latitude: 37.75,
      longitude: -122.43,
      zoom: 11.5,
      pitch: 80,
      bearing: 0,
      width: 800,
      height: 600
    }
  };

  for (const vc in TEST_CASES) {
    const props = TEST_CASES[vc];

    // TODO - for now, just tests that fields are valid number
    const {fov, aspect, focalDistance, near, far} = getProjectionParameters(props);
    expect(Number.isFinite(fov), 'getProjectionParameters: fov is a number').toBeTruthy();
    expect(Number.isFinite(aspect), 'getProjectionParameters: aspect is a number').toBeTruthy();
    expect(
      Number.isFinite(focalDistance),
      'getProjectionParameters: focalDistance is a number'
    ).toBeTruthy();
    expect(
      Number.isFinite(near) && near > 0,
      'getProjectionParameters: near is a number'
    ).toBeTruthy();
    expect(
      Number.isFinite(far) && far > near,
      'getProjectionParameters: far is a number'
    ).toBeTruthy();
  }
});
