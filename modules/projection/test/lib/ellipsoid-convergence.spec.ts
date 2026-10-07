// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original cross-module qualification, using existing pinned PROJ cart fixtures and authored geometric anchors. No conversion kernel is copied or changed.
import {expect, test} from 'vitest';
import {config} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {normalizeCRS, ProjectionTransform} from '@math.gl/projection/core';
import {geocentric} from '@math.gl/projection/projections/geocent';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import references from '../fixtures/operation-pipeline-reference.json';

function close(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance = 1e-5) {
  for (let i = 0; i < 3; i++)
    expect(Math.abs(actual[i] - expected[i]), `ordinate ${i}`).toBeLessThanOrEqual(tolerance);
}
function geographicClose(
  actual: ArrayLike<number>,
  expected: ArrayLike<number>,
  latitudeTolerance = 1e-9
) {
  // Longitude is undefined at the exact poles; compare its canonical wrapping elsewhere.
  if (Math.abs(expected[1]) !== 90)
    expect(Math.abs(((actual[0] - expected[0] + 540) % 360) - 180)).toBeLessThanOrEqual(1e-9);
  expect(Math.abs(actual[1] - expected[1])).toBeLessThanOrEqual(latitudeTolerance);
  expect(Math.abs(actual[2] - expected[2])).toBeLessThanOrEqual(1e-5);
}
const geometries = ['+ellps=WGS84', '+ellps=GRS80', '+ellps=airy', '+ellps=intl', '+R=6371000'];
for (const geometry of geometries) {
  test('geospatial/projection spheroid conversions: ' + geometry, () => {
    const previous = config._cartographicRadians;
    config._cartographicRadians = false;
    try {
      const normalized = normalizeCRS('+proj=longlat ' + geometry);
      const ellipsoid = Ellipsoid.fromSpheroid(normalized.ellipsoid);
      const {semiMajorAxis: a, semiMinorAxis: b} = ellipsoid.toSpheroid();
      const axes = `+a=${a} +b=${b}`;
      expect(normalizeCRS('+proj=longlat ' + axes).ellipsoid).toEqual(normalized.ellipsoid);
      const engine = new ProjectionTransform({
        from: '+proj=longlat ' + axes,
        to: '+proj=geocent ' + axes,
        projections: [geocentric]
      });
      const destination = [0, 0, 0];
      for (const lon of [-180, -179.999999, -120, -45, 0, 45, 120, 179.999999, 180])
        for (const lat of [-90, -89.999999, -89.999, -80, -45, 0, 45, 80, 89.999, 89.999999, 90])
          for (const height of [-1000, 0, 2500, 36000000]) {
            const llh = [lon, lat, height];
            const xyz = engine.project(llh);
            expect(ellipsoid.cartographicToCartesian(llh, destination)).toBe(destination);
            close(destination, xyz);
            geographicClose(engine.unproject(xyz), llh);
            expect(ellipsoid.cartesianToCartographic(xyz, destination)).toBe(destination);
            geographicClose(destination, llh);
          }
    } finally {
      config._cartographicRadians = previous;
    }
  });
}

test('both modules qualify independently against pinned PROJ cart results', () => {
  const previous = config._cartographicRadians;
  config._cartographicRadians = false;
  try {
    for (const [id, geometry] of [
      ['cart-wgs84', '+ellps=WGS84'],
      ['cart-sphere', '+R=6371000']
    ]) {
      const ellipsoid = Ellipsoid.fromSpheroid(normalizeCRS('+proj=longlat ' + geometry).ellipsoid);
      const engine = new ProjectionTransform({
        from: '+proj=longlat ' + geometry,
        to: '+proj=geocent ' + geometry,
        projections: [geocentric]
      });
      for (const reference of references.cases.find(fixture => fixture.id === id).results) {
        close(engine.project(reference.input), reference.forward);
        close(ellipsoid.cartographicToCartesian(reference.input), reference.forward);
        geographicClose(engine.unproject(reference.forward), reference.inverse);
        geographicClose(ellipsoid.cartesianToCartographic(reference.forward), reference.inverse);
      }
    }
  } finally {
    config._cartographicRadians = previous;
  }
});

test('authored cardinal anchors and explicitly scoped radians agree with the cart pipeline', () => {
  const previous = config._cartographicRadians;
  config._cartographicRadians = true;
  try {
    const spheroid = {semiMajorAxis: 6378137, semiMinorAxis: 6356752};
    const ellipsoid = Ellipsoid.fromSpheroid(spheroid);
    const pipeline = new ProjectionPipeline({
      input: {space: 'geographic', units: ['rad', 'rad', 'm']},
      steps: [
        {
          type: 'cart',
          ellipsoid: {a: String(spheroid.semiMajorAxis), b: String(spheroid.semiMinorAxis)}
        }
      ]
    });
    for (const [llh, xyz] of [
      [
        [0, 0, 100],
        [6378237, 0, 0]
      ],
      [
        [Math.PI / 2, 0, -100],
        [0, 6378037, 0]
      ],
      [
        [0, Math.PI / 2, 100],
        [0, 0, 6356852]
      ],
      [
        [0, -Math.PI / 2, -100],
        [0, 0, -6356652]
      ]
    ]) {
      close(ellipsoid.cartographicToCartesian(llh), xyz);
      close(pipeline.project(llh), xyz);
      close(ellipsoid.cartesianToCartographic(xyz), llh);
      close(pipeline.unproject(xyz), llh);
    }
    const geometry = `+a=${spheroid.semiMajorAxis} +b=${spheroid.semiMinorAxis}`;
    const engine = new ProjectionTransform({
      from: '+proj=longlat ' + geometry,
      to: '+proj=geocent ' + geometry,
      projections: [geocentric]
    });
    // Public CRS angles remain degrees while geospatial's global radians mode is enabled.
    close(engine.project([0, 90, 100]), [0, 0, 6356852]);
    const sphere = Ellipsoid.fromSpheroid({semiMajorAxis: 2, semiMinorAxis: 2});
    close(sphere.cartographicToCartesian([Math.PI / 4, 0, 0]), [Math.SQRT2, Math.SQRT2, 0], 1e-14);
  } finally {
    config._cartographicRadians = previous;
  }
});

test('caller-owned scalar outputs, aliasing, Float32/64 batches and M preserve their contracts', () => {
  const previous = config._cartographicRadians;
  config._cartographicRadians = false;
  try {
    const ellipsoid = Ellipsoid.WGS84;
    const {semiMajorAxis: a, semiMinorAxis: b} = ellipsoid.toSpheroid();
    const axes = `+a=${a} +b=${b}`;
    const engine = new ProjectionTransform({
      from: '+proj=longlat ' + axes,
      to: '+proj=geocent ' + axes,
      projections: [geocentric]
    });
    const source = [123.25, -52.5, -30, 77];
    const owned = source.slice(0, 3);
    const expected = ellipsoid.cartographicToCartesian(owned);
    expect(ellipsoid.cartographicToCartesian(owned, owned)).toBe(owned);
    close(owned, expected);
    expect(ellipsoid.cartesianToCartographic(owned, owned)).toBe(owned);
    geographicClose(owned, source);
    const output = new Float64Array(4);
    expect(engine.projectTo(source, output)).toBe(output);
    close(output, expected);
    expect(output[3]).toBe(77);
    expect(source).toEqual([123.25, -52.5, -30, 77]);
    for (const ArrayType of [Float32Array, Float64Array]) {
      const storage = new ArrayType([999, ...source, 999]);
      const data = storage.subarray(1, 5);
      const scalar = engine.project(Array.from(data));
      expect(engine.projectFlat(data, 4)).toBe(data);
      expect(Array.from(data)).toEqual(Array.from(new ArrayType(scalar)));
      close(data, expected, ArrayType === Float32Array ? 0.5 : 1e-5);
      const inverse = engine.unproject(Array.from(data));
      expect(engine.unprojectFlat(data, 4)).toBe(data);
      expect(Array.from(data)).toEqual(Array.from(new ArrayType(inverse)));
      expect(data[3]).toBe(77);
      expect(storage[0]).toBe(999);
      expect(storage[5]).toBe(999);
    }
  } finally {
    config._cartographicRadians = previous;
  }
});

test('undefined center and canonical pole longitude remain distinct boundary contracts', () => {
  const previous = config._cartographicRadians;
  config._cartographicRadians = false;
  try {
    const engine = new ProjectionTransform({to: 'EPSG:4978', projections: [geocentric]});
    const output = [7, 8, 9];
    expect(Ellipsoid.WGS84.cartesianToCartographic([0, 0, 0], output)).toBeUndefined();
    expect(output).toEqual([7, 8, 9]);
    expect(() => engine.unprojectTo([0, 0, 0], output)).toThrow('Earth center');
    expect(output).toEqual([7, 8, 9]);
    // At the pole geospatial preserves signed-zero atan2 longitude; projection canonicalizes it.
    const pole = [-0, 0, Ellipsoid.WGS84.radii.z];
    expect(Ellipsoid.WGS84.cartesianToCartographic(pole)[0]).toBe(180);
    expect(engine.unproject(pole)[0]).toBe(0);
    expect(() => engine.project([0, 91, 0])).toThrow('geographic domain');
    expect(Ellipsoid.WGS84.cartographicToCartesian([0, 91, 0]).every(Number.isFinite)).toBe(true);
  } finally {
    config._cartographicRadians = previous;
  }
});
