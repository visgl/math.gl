// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Independent PROJ anchors and mathematical pole/domain regressions for issue #269.
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/geospatial/projection';
import reference from '../fixtures/pole-audit-reference.json';

function close(actual: ArrayLike<number>, expected: readonly number[], tolerance: number) {
  expected.forEach((value, index) =>
    expect(Math.abs(actual[index] - value)).toBeLessThanOrEqual(tolerance)
  );
}

test('spherical polyconic meridian distance does not wrap at the south pole', () => {
  const fixture = reference.cases.find(c => c.id === 'poly-sphere')!;
  const transform = projectionEngine.createProjection({
    from: '+proj=longlat +datum=none',
    to: fixture.definition
  });
  for (const row of fixture.results)
    if (row.forward) close(transform.project(row.input), row.forward, 1e-5);
});

test('polar LAEA inverse accepts roundoff at the edge of its authalic disk', () => {
  for (const id of ['laea-90-ellipsoid', 'laea--90-ellipsoid']) {
    const fixture = reference.cases.find(c => c.id === id)!;
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat +datum=none',
      to: fixture.definition
    });
    for (const row of fixture.results)
      if (row.inverse) {
        const result = transform.unproject(row.forward!);
        expect(Math.abs(result[1] - row.inverse[1])).toBeLessThan(5e-6);
      }
    expect(() => transform.unproject([1e8, 1e8])).toThrow();
  }
});

test('ellipsoidal orthographic matches the independent PROJ issue #269 anchor', () => {
  const transform = projectionEngine.createProjection({
    from: '+proj=longlat +ellps=WGS84',
    to: '+proj=ortho +ellps=WGS84 +lat_0=-42 +lon_0=147'
  });
  const expected = [-4636386.135423783, 4349471.32106226];
  close(transform.project([90, 30]), expected, 1e-8);
  close(transform.unproject(expected), [90, 30], 1e-10);
  const forward = new Float64Array([90, 30, 123, 7]);
  transform.projectFlat(forward, 4);
  close(forward, [...expected, 123, 7], 1e-8);
  transform.unprojectFlat(forward, 4);
  close(forward, [90, 30, 123, 7], 1e-10);
});

test('independent PROJ south-pole anchors for Eckert VI and Equal Earth', () => {
  for (const [definition, northing] of [
    ['+proj=eck6 +R=6371000', -8826908.904220507],
    ['+proj=eqearth +ellps=WGS84', -8392927.598466454]
  ] as const) {
    const transform = projectionEngine.createProjection({to: definition});
    close(transform.unproject([0, northing]), [0, -90], 1e-10);
  }
});

for (const ellipsoid of ['+R=6371000', '+ellps=WGS84']) {
  for (const definition of [
    '+proj=aea +lat_1=20 +lat_2=50',
    '+proj=aea +lat_1=-20 +lat_2=-50',
    '+proj=lcc +lat_1=20 +lat_2=50',
    '+proj=lcc +lat_1=-20 +lat_2=-50'
  ]) {
    test(`conic pole boundaries: ${definition} ${ellipsoid}`, () => {
      const transform = projectionEngine.createProjection({to: definition + ' ' + ellipsoid});
      const sign = definition.includes('lat_1=-') ? -1 : 1;
      close(transform.unproject(transform.project([0, sign * 90])), [0, sign * 90], 1e-8);
      if (definition.includes('proj=lcc'))
        expect(() => transform.project([0, -sign * 90])).toThrow();
      else {
        close(transform.unproject(transform.project([0, -sign * 90])), [0, -sign * 90], 1e-8);
        for (const lat of [-89.99, 89.99])
          close(transform.unproject(transform.project([0, lat])), [0, lat], 2e-8);
      }
    });
  }
}

for (const algorithm of ['eck6', 'eqearth']) {
  for (const ellipsoid of ['+R=6371000', '+ellps=WGS84']) {
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat ' + ellipsoid,
      to: '+proj=' + algorithm + ' ' + ellipsoid + ' +lon_0=10 +x_0=123 +y_0=-456'
    });
    for (const latitude of [-90, -89.99, 89.99, 90]) {
      test(`${algorithm} ${ellipsoid} preserves pole-line longitude and latitude ${latitude}`, () => {
        for (const longitude of [-160, 10, 170]) {
          const input = [longitude, latitude, 123, 7];
          const projected = transform.project(input);
          close(transform.unproject(projected), input, 2e-8);
          const packed = new Float64Array(projected);
          transform.unprojectFlat(packed, 4);
          close(packed, input, 2e-8);
          const output = new Float64Array(4);
          transform.unprojectToSync(projected, output);
          close(output, input, 2e-8);
        }
      });
    }
    test(`${algorithm} ${ellipsoid} rejects northings beyond pole lines`, () => {
      for (const latitude of [-90, 90]) {
        const pole = transform.project([10, latitude]);
        expect(() => transform.unproject([pole[0], pole[1] + Math.sign(latitude)])).toThrow();
      }
    });
  }
}

for (const lat0 of [-90, -42, 0, 42, 90]) {
  test(`orthographic ellipsoidal limb, scale and offsets at origin ${lat0}`, () => {
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat +ellps=WGS84',
      to: `+proj=ortho +ellps=WGS84 +lat_0=${lat0} +lon_0=10 +k_0=0.9 +x_0=123 +y_0=-456`
    });
    close(transform.project([10, lat0]), [123, -456], 1e-8);
    for (const longitude of [-20, 10, 40]) {
      const latitude = lat0 === 0 ? 30 : lat0 / 2;
      const input = [longitude, latitude];
      close(transform.unproject(transform.project(input)), input, 1e-10);
    }
    expect(() => transform.unproject([1e8, 1e8])).toThrow();
    expect(() => transform.project([190, -lat0 || 0])).toThrow();
  });
}
