// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Proj4Projection} from '@math.gl/proj4/classic';
import {TypeScriptProjection, mercator, equidistantCylindrical} from '@math.gl/proj4/experimental';
import type {ProjectionPlugin} from '@math.gl/proj4/experimental';

const projections = [mercator, equidistantCylindrical];
const definitions = [
  'EPSG:3857',
  '+proj=merc +datum=WGS84',
  '+proj=merc +ellps=WGS84 +lon_0=15 +lat_ts=30 +x_0=1200 +y_0=-3400 +units=us-ft',
  '+proj=merc +R=6371000 +lon_0=-20 +k_0=0.9 +to_meter=1000',
  '+proj=merc +a=7000000 +b=6900000 +datum=none +k=1.2',
  '+proj=eqc +R=6371000 +lon_0=10 +lat_ts=30 +x_0=150 +y_0=-90',
  '+proj=eqc +ellps=WGS84 +lat_0=0 +units=km'
];

function expectCoordinates(actual: number[], expected: number[], tolerance: number): void {
  expect(actual.length).toBe(expected.length);
  for (let index = 0; index < actual.length; index++) {
    expect(Math.abs(actual[index] - expected[index])).toBeLessThanOrEqual(tolerance);
  }
}

for (const definition of definitions) {
  test(`TypeScriptProjection agrees with proj4js: ${definition}`, () => {
    const native = new TypeScriptProjection({to: definition, projections});
    const reference = new Proj4Projection({to: definition});
    for (const longitude of [-179, -120, -1, 0, 12, 90, 179]) {
      for (const latitude of [-85, -45, 0, 30, 80, 85]) {
        const coordinate = [longitude, latitude, 123, 456];
        const expected = reference.project(coordinate);
        expectCoordinates(native.project(coordinate), expected, 1e-6);
        expectCoordinates(native.unproject(expected), reference.unproject(expected), 1e-9);
        expectCoordinates(native.unproject(native.project(coordinate)), coordinate, 1e-9);
      }
    }
  });
}

test('TypeScriptProjection transforms between projected CRSs and preserves input', () => {
  const from = definitions[2];
  const to = definitions[5];
  const coordinate = new Proj4Projection({to: from}).project([12, 48, 23, 99]);
  const frozen = Object.freeze(coordinate);
  const projection = new TypeScriptProjection({from, to, projections});
  const reference = new Proj4Projection({from, to});
  const {project, unproject} = projection;
  // proj4js's iterative Mercator inverse stops at a looser angular tolerance.
  expectCoordinates(project(frozen), reference.project(coordinate), 1e-5);
  expectCoordinates(unproject(project(frozen)), coordinate, 1e-6);
  expect(project(frozen).slice(2)).toEqual([23, 99]);
  expect(project(frozen)).not.toBe(frozen);
});

test('TypeScriptProjection has an independent geographic default', () => {
  const identity = new TypeScriptProjection();
  expectCoordinates(identity.project([180, 90]), [180, 90], 1e-12);
  expectCoordinates(identity.unproject([-180, -90]), [-180, -90], 1e-12);
  expect(() => new TypeScriptProjection({to: 'EPSG:3857'})).toThrow('not registered');
  expectCoordinates(
    new TypeScriptProjection({to: 'EPSG:3857', projections}).project([0, 0]),
    [0, 0],
    1e-12
  );
  expectCoordinates(
    new TypeScriptProjection({to: 'EPSG:3857', projections}).project([180, 0]),
    [20037508.342789244, 0],
    1e-8
  );
});

test('TypeScriptProjection supports the geographic aliases in proj4js 2.22.0', () => {
  for (const name of ['longlat', 'latlong', 'latlon', 'lonlat']) {
    const to = `+proj=${name} +datum=WGS84`;
    const native = new TypeScriptProjection({to});
    const reference = new Proj4Projection({to});
    expectCoordinates(native.project([12, 48, 100]), reference.project([12, 48, 100]), 1e-12);
  }
});

test('TypeScriptProjection aliases and plugins are local to each instance', () => {
  const custom: ProjectionPlugin = {
    name: 'custom',
    parameters: ['offset'],
    create({parameters}) {
      const offset = Number(parameters['offset']);
      return {
        forward: (longitude, latitude) => [longitude + offset, latitude],
        inverse: (x, y) => [x - offset, y]
      };
    }
  };
  const aliases = {LOCAL: '+proj=custom +offset=10', INDIRECT: 'LOCAL'};
  const native = new TypeScriptProjection({to: 'INDIRECT', projections: [custom], aliases});
  expect(native.project([0, 0])).toEqual([10, 0]);
  expectCoordinates(native.unproject([11, 1]), [180 / Math.PI, 180 / Math.PI], 1e-12);
  expect(() => new TypeScriptProjection({to: 'LOCAL', projections: [custom]})).toThrow(
    'Unsupported CRS'
  );
  expect(() => new TypeScriptProjection({to: 'LOCAL', aliases})).toThrow('not registered');
  expect(() => new TypeScriptProjection({projections: [custom, custom]})).toThrow('Duplicate');
  expect(() => new TypeScriptProjection({to: 'A', aliases: {A: 'B', B: 'A'}})).toThrow('Circular');
  expect(() => new TypeScriptProjection({to: 'toString'})).toThrow('Unsupported CRS');
});

test('TypeScriptProjection rejects unsupported CRS features instead of ignoring them', () => {
  for (const to of [
    'EPSG:32631',
    'GEOGCS["WGS 84"]',
    '+proj=utm +zone=31',
    '+proj=merc +lat_0=10',
    '+proj=longlat +units=m',
    '+proj=longlat +to_meter=2',
    '+proj=merc +type=pipeline'
  ]) {
    expect(() => new TypeScriptProjection({to, projections})).toThrow();
  }
});

test('TypeScriptProjection validates parameters and domains', () => {
  for (const to of [
    '+proj=merc +k_0=0',
    '+proj=merc +k=-1',
    '+proj=merc +lat_ts=90',
    '+proj=eqc +lat_ts=-90',
    '+proj=merc +a=-1',
    '+proj=merc +b=9000000',
    '+proj=merc +R=0',
    '+proj=merc +rf=1',
    '+proj=merc +lon_0=NaN',
    '+proj=merc +lon_0=1e999',
    '+proj=merc +lon_0=0x20',
    '+proj=merc +lon_0',
    '+proj=merc +lon_0=',
    '+proj=merc +lon_0=10 +lon_0=20',
    '+proj=merc +units=invalid',
    '+proj=merc +to_meter=0'
  ]) {
    expect(() => new TypeScriptProjection({to, projections})).toThrow();
  }
  const native = new TypeScriptProjection({to: 'EPSG:3857', projections});
  for (const coordinate of [
    [],
    [1],
    [NaN, 0],
    [0, Infinity],
    [0, 91],
    [0, -91],
    [0, 90],
    [0, -90]
  ]) {
    expect(() => native.project(coordinate)).toThrow();
  }
  expect(() => native.unproject([Infinity, 0])).toThrow();
});

test('TypeScriptProjection supports the eqc latitude origin', () => {
  const projection = new TypeScriptProjection({
    to: '+proj=eqc +R=6371000 +lat_0=20 +lat_ts=30 +lon_0=10',
    projections
  });
  expectCoordinates(projection.project([10, 20]), [0, 0], 1e-10);
  expectCoordinates(projection.unproject(projection.project([45, -60])), [45, -60], 1e-10);
});
