// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Authored axis regressions; imported corpus retains its proj4js attribution.
import {expect, test} from 'vitest';
import {createSpatialReference} from '@math.gl/crs';
import type {PROJJSONCRSByType} from '@math.gl/crs';
import {ProjectionEngine, normalizeCRS} from '@math.gl/proj4/experimental/core';
import {stereographic} from '@math.gl/proj4/experimental/projections/stere';
import {wktCRSParser} from '@math.gl/proj4/experimental/parsers/wkt';
import {projJSONCRSParser} from '@math.gl/proj4/experimental/parsers/projjson';
import {projectedJSON} from '../fixtures/crs-datums';
import corpus from '../fixtures/upstream-corpus-2.22.0.json';

const parsers = [wktCRSParser, projJSONCRSParser];
const projections = [stereographic];
function close(actual: readonly number[], expected: readonly number[], tolerance = 1e-7) {
  expect(actual.length).toBe(expected.length);
  actual.forEach((value, index) =>
    expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(tolerance)
  );
}
function polar(north: boolean, longitude = 0): PROJJSONCRSByType<'ProjectedCRS'> {
  return {
    ...projectedJSON,
    conversion: {
      name: 'Authored polar axes',
      method: {name: 'Polar Stereographic (variant B)'},
      parameters: [
        {name: 'Latitude of standard parallel', value: north ? 71 : -71, unit: 'degree'},
        {name: 'Longitude of origin', value: longitude, unit: 'degree'},
        {name: 'False easting', value: 123, unit: 'metre'},
        {name: 'False northing', value: 456, unit: 'metre'}
      ]
    },
    coordinate_system: {
      subtype: 'Cartesian',
      axis: [
        {
          name: 'First',
          abbreviation: 'A',
          direction: north ? 'south' : 'north',
          meridian: {longitude: longitude + 90},
          unit: 'metre'
        },
        {
          name: 'Second',
          abbreviation: 'B',
          direction: north ? 'south' : 'north',
          meridian: {longitude: longitude + (north ? 180 : 0)},
          unit: 'metre'
        }
      ]
    }
  };
}

test('Previously rejected polar WKT fixtures honor default and enforced axes in both directions', () => {
  for (const index of [89, 91, 116, 117, 221]) {
    const fixture = corpus.fixtures[index];
    const to = fixture.code as string;
    expect(normalizeCRS(to, {parsers}).axis).toBe(index === 91 ? 'neu' : 'enu');
    const canonical = new ProjectionEngine({to, parsers, projections});
    const declared = new ProjectionEngine({to, parsers, projections, enforceAxis: true});
    const source = new ProjectionEngine({from: to, parsers, projections, enforceAxis: true});
    const point = [...fixture.ll, 123, 7];
    const xy = canonical.project(point);
    const expected = index === 91 ? [xy[1], xy[0], 123, 7] : xy;
    close(declared.project(point), expected);
    close(declared.unproject(expected), point);
    close(source.project(expected), point);
    close(source.unproject(point), expected);
    close(canonical.project(fixture.ll), fixture.xy, 0.01);
    for (const ArrayType of [Float32Array, Float64Array]) {
      const buffer = new ArrayType(point);
      const represented = Array.from(buffer);
      const expectedBuffer = new ArrayType(declared.project(represented));
      expect(declared.projectFlat(buffer, 4)).toBe(buffer);
      expect(buffer).toEqual(expectedBuffer);
      declared.unprojectFlat(buffer, 4);
      close(Array.from(buffer), represented, ArrayType === Float32Array ? 1e-4 : 1e-7);
    }
  }
});

test('Polar meridians map signs, order and angular units relative to lon_0', () => {
  for (const north of [true, false])
    for (const longitude of [0, -45]) {
      const definition = polar(north, longitude);
      const point = [longitude + 10, north ? 80 : -80, 123, 7];
      const xy = new ProjectionEngine({to: definition, parsers, projections}).project(point);
      const first = definition.coordinate_system.axis[0];
      const second = definition.coordinate_system.axis[1];
      // Swapped and reversed axes; explicit radians and grads exercise both unit representations.
      first.meridian = {
        longitude: {
          value: ((longitude - 90) * Math.PI) / 180,
          unit: {type: 'AngularUnit', name: 'radian', conversion_factor: 1}
        }
      };
      second.meridian = {
        longitude: {
          value: (longitude + (north ? 0 : 180)) / 0.9,
          unit: {type: 'AngularUnit', name: 'grad', conversion_factor: Math.PI / 200}
        }
      };
      definition.coordinate_system.axis = [second, first];
      expect(normalizeCRS(definition, {parsers}).axis).toBe('swu');
      const declared = new ProjectionEngine({
        to: definition,
        parsers,
        projections,
        enforceAxis: true
      });
      close(declared.project(point), [-xy[1], -xy[0], 123, 7]);
      close(declared.unproject(declared.project(point)), point);
      // Axis metadata is ignored only for storage order, not syntax validation.
      close(new ProjectionEngine({to: definition, parsers, projections}).project(point), xy);
    }
});

test('Stored coordinate order overrides declared polar order', () => {
  const definition = corpus.fixtures[91].code as string;
  const reference = createSpatialReference({
    crs: {state: 'explicit', definition, representation: 'wkt', provenance: 'metadata'},
    coordinateOrder: ['easting', 'northing']
  });
  const projection = new ProjectionEngine({
    to: reference,
    parsers,
    projections,
    enforceAxis: true
  });
  close(projection.project([0, 75]), corpus.fixtures[91].xy, 0.01);
  close(projection.unproject(projection.project([0, 75])), [0, 75]);
});

test('Ambiguous, non-cardinal, conflicting and non-polar axes reject explicitly', () => {
  const unknown = (corpus.fixtures[89].code as string).replace(
    'AXIS["Easting",UNKNOWN]',
    'AXIS["Unlabelled",UNKNOWN]'
  );
  expect(() => normalizeCRS(unknown, {parsers})).toThrow('Unsupported axis direction');
  for (const longitude of [45, NaN, Infinity]) {
    const definition = polar(true);
    definition.coordinate_system.axis[0].meridian = {longitude};
    expect(() => normalizeCRS(definition, {parsers})).toThrow();
  }
  const overflow = polar(true);
  overflow.coordinate_system.axis[0].meridian = {
    longitude: {
      value: 1e308,
      unit: {type: 'AngularUnit', name: 'invalid-scale', conversion_factor: 1e308}
    }
  };
  expect(() => normalizeCRS(overflow, {parsers})).toThrow('finite');
  const inward = polar(true);
  inward.coordinate_system.axis[0].direction = 'north';
  expect(() => normalizeCRS(inward, {parsers})).toThrow('outward-facing');
  const duplicate = polar(true);
  duplicate.coordinate_system.axis[1].meridian = {longitude: 90};
  expect(() => normalizeCRS(duplicate, {parsers})).toThrow('Invalid axis');
  const nonpolar = polar(true);
  nonpolar.conversion = projectedJSON.conversion;
  expect(() => normalizeCRS(nonpolar, {parsers})).toThrow('polar stereographic');
  const invalidLegacy = (corpus.fixtures[116].code as string).replace(
    'North along 90 deg East',
    'North along east'
  );
  expect(() => normalizeCRS(invalidLegacy, {parsers})).toThrow('Unsupported axis direction');
});

test('Polar axis meridians share the CRS prime meridian and legacy west spellings', () => {
  const definition = polar(false, -45);
  const base = definition.base_crs;
  definition.base_crs = {
    ...base,
    datum: {...base.datum, prime_meridian: {name: 'Paris', longitude: 2.337229166667}}
  };
  const projection = new ProjectionEngine({
    to: definition,
    parsers,
    projections,
    enforceAxis: true
  });
  const canonical = new ProjectionEngine({
    to: '+proj=stere +datum=WGS84 +lat_0=-90 +lat_ts=-71 +lon_0=-45 +pm=paris +x_0=123 +y_0=456',
    projections
  });
  close(projection.project([-35, -80]), canonical.project([-35, -80]), 1e-6);
  const legacy = (corpus.fixtures[116].code as string).replace(
    'North along 90 deg East',
    'North along 270 deg West'
  );
  expect(normalizeCRS(legacy, {parsers}).axis).toBe('enu');
});
