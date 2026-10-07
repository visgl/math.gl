// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Proj4Projection} from '../helpers/proj4-reference';
import {
  ProjectionTransform,
  mercator,
  transverseMercator,
  extendedTransverseMercator,
  universalTransverseMercator,
  lambertConformalConic,
  albersEqualArea,
  equidistantConic,
  lambertAzimuthalEqualArea,
  stereographic,
  obliqueStereographic,
  azimuthalEquidistant
} from '@math.gl/projection/experimental';
import {commonProjectionCases} from '../fixtures/common-projections';
import {upstreamFixtures} from '../fixtures/upstream-2.22.0';

const projections = [
  mercator,
  transverseMercator,
  extendedTransverseMercator,
  universalTransverseMercator,
  lambertConformalConic,
  albersEqualArea,
  equidistantConic,
  lambertAzimuthalEqualArea,
  stereographic,
  obliqueStereographic,
  azimuthalEquidistant
];

function close(actual: number[], expected: number[], tolerance: number): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) =>
    expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(tolerance)
  );
}

for (const fixture of commonProjectionCases) {
  test('common projection parity: ' + fixture.id, () => {
    for (const units of ['', ' +units=us-ft', ' +to_meter=1000']) {
      let to = fixture.definition + units;
      for (const key of ['lon_0', 'lat_0', 'x_0', 'y_0']) {
        if (!to.includes('+' + key + '=') && !to.includes('+proj=utm')) to += ' +' + key + '=0';
      }
      const native = new ProjectionTransform({to, projections});
      const reference = new Proj4Projection({to});
      const points =
        fixture.points ||
        [-3, 0, 3].flatMap(dx =>
          [-5, 0, 5].map(dy => [fixture.center[0] + dx, fixture.center[1] + dy, 125, 8])
        );
      for (const point of points) {
        const input = Object.freeze([...point]);
        const xy = native.project(input);
        const expected = reference.project(point);
        // EQDC now uses a higher-order meridional series: PROJ is the accuracy
        // oracle, while this comparison bounds the intentional proj4js difference.
        // proj4js polar AEQD retains a truncated meridian series; PROJ accuracy is separately gated.
        const metres =
          fixture.id.startsWith('eqdc-') || /^aeqd--?90-ellipsoid$/.test(fixture.id) ? 1e-3 : 1e-5;
        const tolerance = units.includes('us-ft')
          ? metres / (1200 / 3937)
          : units
            ? metres / 1000
            : metres;
        close(xy, expected, tolerance);
        close(native.unproject(expected), reference.unproject(expected), 1e-8);
        close(native.unproject(xy), point, fixture.roundTripTolerance || 1e-7);
        expect(input).toEqual(point);
      }
    }
  });
}

test('all 120 WGS84 UTM aliases and both UPS aliases', () => {
  for (const south of [false, true]) {
    for (let zone = 1; zone <= 60; zone++) {
      const to = 'EPSG:' + ((south ? 32700 : 32600) + zone);
      const native = new ProjectionTransform({to, projections: [universalTransverseMercator]});
      const reference = new Proj4Projection({to});
      for (const dx of [-3, 0, 3]) {
        const coordinate = [6 * zone - 183 + dx, south ? -45 : 45, 17];
        close(native.project(coordinate), reference.project(coordinate), 1e-6);
        close(native.unproject(native.project(coordinate)), coordinate, 1e-8);
      }
    }
    const to = south ? 'EPSG:5042' : 'EPSG:5041';
    const native = new ProjectionTransform({to, projections: [stereographic]});
    const reference = new Proj4Projection({to});
    const pole = [0, south ? -90 : 90];
    close(native.project(pole), [2000000, 2000000], 1e-8);
    close(native.unproject([2000000, 2000000]), pole, 1e-8);
    close(native.project([25, south ? -85 : 85]), reference.project([25, south ? -85 : 85]), 1e-6);
  }
});

test('projected-to-projected composition preserves height and measure', () => {
  const from = 'EPSG:32631';
  const to = '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +lon_0=3';
  const coordinate = new Proj4Projection({to: from}).project([4, 48, 50, 7]);
  const native = new ProjectionTransform({from, to, projections});
  close(native.project(coordinate), new Proj4Projection({from, to}).project(coordinate), 1e-6);
  close(native.unproject(native.project(coordinate)), coordinate, 1e-5);
});

test('invalid common projection parameters are rejected at construction', () => {
  for (const to of [
    '+proj=utm',
    '+proj=utm +zone=0',
    '+proj=utm +zone=61',
    '+proj=utm +zone=1.5',
    '+proj=utm +zone=31 +south=false',
    '+proj=tmerc +R=6371000',
    '+proj=etmerc +approx=false',
    '+proj=lcc',
    '+proj=aea +lat_1=30 +lat_2=-30',
    '+proj=eqdc +lat_1=90',
    '+proj=stere +lat_0=91',
    '+proj=sterea +lat_0=90',
    '+proj=stere +k=0'
  ]) {
    expect(() => new ProjectionTransform({to, projections})).toThrow();
  }
  expect(() => new ProjectionTransform({to: 'EPSG:32631'})).toThrow('not registered');
  expect(() => new ProjectionTransform({to: 'EPSG:5041'})).toThrow('not registered');
});

test('singularities and inverse domain failures produce explicit errors', () => {
  for (const to of ['+proj=tmerc +approx +R=6371000', '+proj=tmerc', '+proj=etmerc']) {
    expect(() => new ProjectionTransform({to, projections}).project([90, 0])).toThrow();
  }
  for (const name of ['laea', 'stere', 'sterea', 'aeqd']) {
    for (const geometry of ['', ' +R=6371000']) {
      const native = new ProjectionTransform({
        to: '+proj=' + name + ' +lat_0=0' + geometry,
        projections
      });
      expect(() => native.project([180, 0])).toThrow();
    }
  }
  const laea = new ProjectionTransform({to: '+proj=laea +R=6371000', projections});
  expect(() => laea.unproject([2e7, 2e7])).toThrow();
  const aeqd = new ProjectionTransform({to: '+proj=aeqd +R=6371000', projections});
  expect(() => aeqd.unproject([3e7, 0])).toThrow();
});

test('equatorial ellipsoidal stereographic applies false northing', () => {
  const base = '+proj=stere +lat_0=0 +lon_0=15 +x_0=100';
  const native = new ProjectionTransform({to: base + ' +y_0=200', projections});
  const zero = new Proj4Projection({to: base + ' +y_0=0'});
  close(native.project([15, 0]), [100, 200], 1e-8);
  for (const point of [
    [12, -5],
    [15, 0],
    [18, 5]
  ]) {
    const expected = zero.project(point);
    expected[1] += 200;
    close(native.project(point), expected, 1e-6);
    close(native.unproject(expected), point, 1e-8);
  }
});

test('native common projections initialize omitted origin and offsets', () => {
  for (const to of [
    '+proj=aea +lat_1=20 +lat_2=60',
    '+proj=eqdc +lat_1=20 +lat_2=60',
    '+proj=sterea'
  ]) {
    const native = new ProjectionTransform({to, projections});
    const complete = new ProjectionTransform({
      to: to + ' +lat_0=0 +lon_0=0 +x_0=0 +y_0=0',
      projections
    });
    close(native.project([2, 35]), complete.project([2, 35]), 1e-6);
  }
});

for (const fixture of upstreamFixtures) {
  test('tagged upstream fixture: ' + fixture.id, () => {
    if ('gapId' in fixture) {
      expect(() => new ProjectionTransform({to: fixture.to, projections})).toThrow(
        /Unsupported (datum|ellipsoid)/
      );
      return;
    }
    const native = new ProjectionTransform({to: fixture.to, projections});
    close(native.project(fixture.ll), fixture.xy, fixture.xyToleranceMeters);
    const actual = native.unproject(fixture.xy);
    const longitudeError = ((actual[0] - fixture.ll[0] + 540) % 360) - 180;
    expect(Math.abs(longitudeError)).toBeLessThanOrEqual(fixture.llToleranceDegrees);
    expect(Math.abs(actual[1] - fixture.ll[1])).toBeLessThanOrEqual(fixture.llToleranceDegrees);
  });
}

test('published PROJ UTM examples provide independent reference values', () => {
  // https://proj.org/en/stable/operations/projections/utm.html (PROJ 9.9.0 docs, 2026-09-28).
  // Published examples use default GRS80; the difference from WGS84 is below their 0.01 m precision.
  for (const fixture of [
    {to: '+proj=utm +zone=32', ll: [12, 56], xy: [687071.44, 6210141.33]},
    {to: '+proj=utm +zone=59 +south', ll: [174, -44], xy: [740526.32, 5123750.87]}
  ]) {
    const native = new ProjectionTransform({to: fixture.to, projections});
    close(native.project(fixture.ll), fixture.xy, 0.01);
    close(native.unproject(fixture.xy), fixture.ll, 1e-7);
  }
});

test('spherical approximate transverse Mercator preserves latitude across its origin', () => {
  const to = '+proj=tmerc +approx +R=6371000 +lat_0=10 +lon_0=9 +k_0=0.9 +x_0=100 +y_0=200';
  const native = new ProjectionTransform({to, projections});
  const reference = new Proj4Projection({to});
  for (const point of [
    [8, -5],
    [8, 5],
    [9, 0],
    [10, 15]
  ]) {
    close(native.project(point), reference.project(point), 1e-6);
    close(native.unproject(reference.project(point)), point, 1e-8);
  }
});

test('polar and antimeridian boundaries and nonconvergence are explicit', () => {
  const to = '+proj=tmerc +lon_0=179';
  const native = new ProjectionTransform({to, projections});
  close(native.project([-179, 80]), new Proj4Projection({to}).project([-179, 80]), 1e-6);
  close(native.unproject(native.project([-179, 80])), [-179, 80], 1e-8);
  expect(() => native.unproject([1e20, 0])).toThrow();
  const aeqd = new ProjectionTransform({to: '+proj=aeqd', projections});
  expect(() => aeqd.project([179.9, 0])).toThrow();
  const lcc = new ProjectionTransform({to: '+proj=lcc +lat_1=30 +lat_2=60', projections});
  expect(() => lcc.project([0, -90])).toThrow('opposite pole');
  close(lcc.unproject(lcc.project([5, 89])), [5, 89], 1e-7);
});

test('LCC opposite pole follows the cone sign for mixed standard parallels', () => {
  for (const parallels of ['+lat_1=0 +lat_2=45', '+lat_1=-10 +lat_2=50']) {
    const projection = new ProjectionTransform({to: '+proj=lcc ' + parallels, projections});
    expect(() => projection.project([0, -90])).toThrow('opposite pole');
    expect(projection.project([0, 90]).every(Number.isFinite)).toBe(true);
  }
});

for (const name of ['lcc', 'eqdc']) {
  for (const geometry of ['+ellps=WGS84', '+R=6371000']) {
    test(`${name} preserves an equatorial second parallel (${geometry})`, () => {
      for (const parallel of [-30, 30]) {
        const base = `+proj=${name} ${geometry} +lon_0=10 +lat_0=0 +x_0=500 +y_0=-250`;
        const native = new ProjectionTransform({
          to: `${base} +lat_1=${parallel} +lat_2=0`,
          projections
        });
        const swappedDefinition = `${base} +lat_1=0 +lat_2=${parallel}`;
        const swapped = new ProjectionTransform({to: swappedDefinition, projections});
        // Upstream also loses a zero second parallel. Its swapped definition avoids that bug.
        const reference = new Proj4Projection({to: swappedDefinition});
        for (const point of [
          [12, 0],
          [25, parallel / 2],
          [-5, parallel]
        ]) {
          const expected = reference.project(point);
          close(native.project(point), expected, name === 'eqdc' ? 1e-3 : 1e-5);
          close(native.project(point), swapped.project(point), 1e-5);
          close(native.unproject(expected), point, 1e-7);
        }
        const omitted = new ProjectionTransform({to: `${base} +lat_1=${parallel}`, projections});
        const tangent = new ProjectionTransform({
          to: `${base} +lat_1=${parallel} +lat_2=${parallel}`,
          projections
        });
        close(omitted.project([25, parallel / 2]), tangent.project([25, parallel / 2]), 1e-8);
      }
    });
  }
}
