// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/projection';
import {lazyProjectionEngine} from '@math.gl/projection/projections/lazy';
import {geographicJSON, projectedJSON, projectedWKT2} from '../fixtures/crs-datums';
import inputs from '../fixtures/native-proj-cases.json';

for (const fixture of inputs.cases) {
  test('finite rendering bounds and normalized containment: ' + fixture.id, async () => {
    const crs = await projectionEngine.getCRS(fixture.definition);
    const [minimum, maximum] = crs.renderingBounds;
    expect([...minimum, ...maximum].every(Number.isFinite)).toBe(true);
    for (let axis = 0; axis < 2; axis++) expect(maximum[axis]).toBeGreaterThan(minimum[axis]);
    for (let longitude = -180; longitude <= 180; longitude += 10) {
      for (let latitude = -90; latitude <= 90; latitude += 10) {
        const normalized = crs.converter.WGS84.normalize([longitude, latitude, 0]);
        const point = crs.converter.WGS84.from(normalized);
        for (let axis = 0; axis < 2; axis++) {
          const tolerance = Math.max(1, Math.abs(minimum[axis]), Math.abs(maximum[axis])) * 1e-8;
          expect(point[axis], `${longitude},${latitude} axis ${axis}`).toBeGreaterThanOrEqual(
            minimum[axis] - tolerance
          );
          expect(point[axis], `${longitude},${latitude} axis ${axis}`).toBeLessThanOrEqual(
            maximum[axis] + tolerance
          );
        }
      }
    }
  });
}

test('lazy retrieval includes rendering profiles for every projection algorithm', async () => {
  const definitions = new Map<string, string>();
  for (const fixture of inputs.cases)
    definitions.set(/\+proj=(\w+)/.exec(fixture.definition)![1], fixture.definition);
  for (const definition of definitions.values()) {
    const eager = await projectionEngine.getCRS(definition);
    const lazy = await lazyProjectionEngine.getCRS(definition);
    expect(lazy.renderingBounds).toEqual(eager.renderingBounds);
    expect(lazy.converter.WGS84.normalize([150, -80])).toEqual(
      eager.converter.WGS84.normalize([150, -80])
    );
  }
});

test('UTM bounds describe a zone while conversion remains available outside it', async () => {
  const north = await projectionEngine.getCRS('EPSG:32618');
  expect(north.renderingBounds[0][0]).toBeCloseTo(166021.44308054, 3);
  expect(north.renderingBounds[1][0]).toBeCloseTo(833978.55691946, 3);
  expect(north.renderingBounds[0][1]).toBeCloseTo(0, 3);
  expect(north.converter.WGS84.normalize([-100, -10])).toEqual([-78, 0]);
  const point = [-80, 40, 123];
  const restored = north.converter.WGS84.to(north.converter.WGS84.from(point));
  expect(restored[0]).toBeCloseTo(point[0], 7);
  expect(restored[1]).toBeCloseTo(point[1], 7);
  const south = await projectionEngine.getCRS('EPSG:32718');
  const normalized = south.converter.WGS84.normalize([-75, 10]);
  expect(normalized[0]).toBeCloseTo(-75, 12);
  expect(normalized[1]).toBe(0);
  expect(south.renderingBounds[1][1]).toBeCloseTo(10000000, 3);
});

test('PROJJSON coverage narrows the rendering target without restricting conversion', async () => {
  const definition = {
    ...projectedJSON,
    bbox: {west_longitude: 2, south_latitude: 40, east_longitude: 4, north_latitude: 50}
  };
  const crs = await projectionEngine.getCRS(definition);
  expect(crs.areaOfUse).toEqual([2, 40, 4, 50]);
  expect(crs.converter.WGS84.normalize([10, 20, 123])).toEqual([4, 40, 123]);
  const outside = crs.converter.WGS84.from([3, 20]);
  expect(outside[1]).toBeLessThan(crs.renderingBounds[0][1]);
  const original = await projectionEngine.getCRS(projectedJSON);
  expect(original.signature).not.toBe(crs.signature);
  expect(crs.renderingBounds[1][1] - crs.renderingBounds[0][1]).toBeLessThan(
    original.renderingBounds[1][1] - original.renderingBounds[0][1]
  );
  const wkt =
    projectedWKT2.slice(0, -1) +
    ',USAGE[SCOPE["Rendering test"],AREA["Test area"],BBOX[40,2,50,4]]]';
  const fromWKT = await projectionEngine.getCRS(wkt);
  expect(fromWKT.areaOfUse).toEqual(crs.areaOfUse);
  expect(fromWKT.renderingBounds).toEqual(crs.renderingBounds);
});

test('declared coverage handles the antimeridian and prime meridian', async () => {
  const definition = {
    ...geographicJSON,
    bbox: {west_longitude: 170, south_latitude: -20, east_longitude: -170, north_latitude: 20}
  };
  const crs = await projectionEngine.getCRS(definition);
  expect(crs.converter.WGS84.normalize([-175, 30])).toEqual([185, 20]);
  expect(crs.renderingBounds[0][0]).toBeCloseTo(170, 6);
  expect(crs.renderingBounds[1][0]).toBeCloseTo(190, 6);
  // Geographic storage follows its wrapping convention; the rendering rectangle
  // must use the same convention to contain converted normalized coordinates.
  expect(crs.converter.WGS84.from(crs.converter.WGS84.normalize([-175, 30]))[0]).toBeCloseTo(
    185,
    6
  );
  const shifted = await projectionEngine.getCRS({
    ...geographicJSON,
    prime_meridian: {name: 'Test meridian', longitude: 10},
    bbox: {west_longitude: 20, south_latitude: -20, east_longitude: 30, north_latitude: 20}
  });
  expect(shifted.renderingBounds[0][0]).toBeCloseTo(10, 6);
  expect(shifted.renderingBounds[1][0]).toBeCloseTo(20, 6);
  expect(shifted.converter.WGS84.normalize([40, 0])[0]).toBeCloseTo(30, 12);
});

test('invalid declared geographic coverage fails with an actionable error', async () => {
  await expect(
    projectionEngine.getCRS({
      ...projectedJSON,
      bbox: {west_longitude: 2, south_latitude: 50, east_longitude: 4, north_latitude: 40}
    })
  ).rejects.toThrow('Invalid CRS geographic bounding box');
});

test.each([
  'Orthographic',
  'Gnomonic',
  'Stereographic',
  'Lambert Azimuthal Equal Area',
  'Azimuthal Equidistant'
])('declared coverage encloses normalized curved boundaries for %s', async method => {
  const crs = await projectionEngine.getCRS({
    ...projectedJSON,
    conversion: {
      name: 'Test domain',
      method: {name: method},
      parameters: [
        {name: 'Latitude of natural origin', value: 40, unit: 'degree'},
        {name: 'Longitude of natural origin', value: 10, unit: 'degree'}
      ]
    },
    bbox: {west_longitude: -120, south_latitude: -70, east_longitude: 130, north_latitude: 80}
  });
  for (let longitude = -180; longitude <= 180; longitude += 5) {
    for (let latitude = -90; latitude <= 90; latitude += 5) {
      const point = crs.converter.WGS84.from(
        crs.converter.WGS84.normalize([longitude, latitude, 0])
      );
      for (let axis = 0; axis < 2; axis++) {
        expect(point[axis]).toBeGreaterThanOrEqual(crs.renderingBounds[0][axis] - 0.01);
        expect(point[axis]).toBeLessThanOrEqual(crs.renderingBounds[1][axis] + 0.01);
      }
    }
  }
});
