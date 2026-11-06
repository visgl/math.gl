// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent high-precision pole accuracy tests.
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/geospatial/projection';
import reference from '../fixtures/pole-precision-reference.json';

for (const [index, row] of reference.cases.entries()) {
  test(`80-digit pole equations ${index}: ${row.definition} ${row.input}`, () => {
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat +datum=none',
      to: row.definition
    });
    if (!('inverseOnly' in row)) {
      const actual = transform.project(row.input);
      expect(Math.abs(actual[0] - row.forward[0])).toBeLessThan(row.forwardTolerance);
      expect(Math.abs(actual[1] - row.forward[1])).toBeLessThan(row.forwardTolerance);
    }
    if ('inverse' in row) {
      const actual = transform.unproject(row.forward);
      expect(Math.abs(actual[1] - row.inverse![1])).toBeLessThan(row.inverseTolerance!);
      // Longitude is indeterminate at an exact collapsed pole. For near poles,
      // compare its physical horizontal contribution instead of its raw angle.
      const delta = Math.abs(((actual[0] - row.inverse![0] + 540) % 360) - 180);
      expect(delta * Math.abs(Math.cos((row.inverse![1] * Math.PI) / 180))).toBeLessThan(
        row.inverseTolerance!
      );
      const flat = new Float64Array([...row.forward, 123, 7]);
      transform.unprojectFlat(flat, 4);
      expect(flat[1]).toBe(actual[1]);
      expect([...flat.slice(2)]).toEqual([123, 7]);
    }
  });
}

for (const centre of [0, 90, 180, -90]) {
  test(`QSC equatorial face ${centre} preserves offsets near its centre`, () => {
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat +datum=none',
      to: `+proj=qsc +lat_0=0 +lon_0=${centre} +ellps=WGS84`
    });
    const es = (1 / 298.257223563) * (2 - 1 / 298.257223563);
    for (const offset of [-0.000001, 0.000001]) {
      const angle = (offset * Math.PI) / 180;
      const x = (6378137 * Math.sin(angle / 2)) / Math.sin(Math.PI / 8);
      const beta = Math.atan2((1 - es) * Math.sin(angle), Math.cos(angle));
      const y = (6378137 * Math.sin(beta / 2)) / Math.sin(Math.PI / 8);
      for (const [point, expected] of [
        [
          [centre + offset, 0],
          [x, 0]
        ],
        [
          [centre, offset],
          [0, y]
        ]
      ]) {
        const projected = transform.project(point);
        expect(Math.abs(projected[0] - expected[0])).toBeLessThan(1e-7);
        expect(Math.abs(projected[1] - expected[1])).toBeLessThan(1e-7);
        const result = transform.unproject(projected);
        expect(Math.abs(result[1] - point[1])).toBeLessThan(1e-10);
        expect(Math.abs(((result[0] - point[0] + 540) % 360) - 180)).toBeLessThan(1e-10);
      }
    }
  });
}

test('Mollweide rejects projected points beyond its ellipse and retains nearby pole offsets', () => {
  const transform = projectionEngine.createProjection({to: '+proj=moll +R=6371000'});
  expect(() => transform.unproject([0, 1e8])).toThrow();
  expect(() => transform.unproject([1e8, 0])).toThrow();
  expect(() => transform.unproject([1, Math.SQRT2 * 6371000])).toThrow();
  const near = transform.project([30, 89.999999]);
  const pole = transform.project([30, 90]);
  expect(near[0]).toBeGreaterThan(0.1);
  expect(pole[0]).toBe(0);
  expect(pole[1]).toBe(Math.SQRT2 * 6371000);
});

test('Mollweide polar seams accept rounded ellipse boundaries and reject exterior points', () => {
  for (const shape of ['+R=6371000', '+ellps=WGS84']) {
    const a = shape.startsWith('+R=') ? 6371000 : 6378137;
    for (const origin of [0, 25]) {
      const transform = projectionEngine.createProjection({
        from: '+proj=longlat +datum=none',
        to: `+proj=moll ${shape} +lon_0=${origin} +x_0=500 +y_0=-300`
      });
      for (const side of [-1, 1]) {
        for (const latitude of [
          -89.9999999999, -89.999999, -89.99, 0, 89.99, 89.999999, 89.9999999999
        ]) {
          const projected = transform.project([origin + side * 180, latitude]);
          const inverse = transform.unproject(projected);
          // The two map seams identify the same geographic meridian; wrapping
          // can select the opposite planar edge after a shifted central meridian.
          const recovered = transform.project(inverse);
          expect(Math.abs(inverse[1] - latitude)).toBeLessThanOrEqual(2e-12);
          // Recovering a binary64 latitude introduces its own easting rounding:
          // near a pole x is proportional to (pi/2-|lat|)^(2/3).
          const complement = ((90 - Math.abs(latitude)) * Math.PI) / 180;
          const eastingQuantization =
            (4 * Number.EPSILON * Math.abs(projected[0] - 500)) / complement;
          for (let i = 0; i < 2; i++)
            expect(
              i === 0
                ? Math.abs(Math.abs(recovered[0] - 500) - Math.abs(projected[0] - 500))
                : Math.abs(recovered[i] - projected[i]),
              `${shape} ${latitude}: ordinate ${i}`
            ).toBeLessThanOrEqual(16 * Number.EPSILON * a + (i === 0 ? eastingQuantization : 0));
          expect(Math.abs(((inverse[0] - origin + 540) % 360) - 180)).toBeCloseTo(180, 8);
          // A definite displacement outside the ellipse is still rejected,
          // including when the northing itself rounds to its polar limit.
          expect(() =>
            transform.unproject([projected[0] + Math.sign(projected[0] - 500) * 2, projected[1]])
          ).toThrow();
        }
      }
    }
  }
  const transform = projectionEngine.createProjection({to: '+proj=moll +R=6371000'});
  const point = [128.05539759931776, 9009954.605651489];
  const inverse = transform.unproject(point);
  expect(Math.abs(inverse[0])).toBeCloseTo(180, 8);
  const recovered = transform.project(inverse);
  expect(Math.abs(Math.abs(recovered[0]) - Math.abs(point[0]))).toBeLessThan(
    (4 * Number.EPSILON * point[0]) / (Math.PI / 180000000)
  );
  expect(Math.abs(recovered[1] - point[1])).toBeLessThan(1e-7);
});

test('polyconic inverses accept roundoff-stalled updates only with a tight planar residual', () => {
  for (const shape of ['+R=6371000', '+ellps=WGS84']) {
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat +datum=none',
      to: `+proj=poly ${shape}`
    });
    for (const latitude of [
      -89.9, -89, -88, -80, -45, -0.001, -0.00001, -0.000001, -0.0000001, -1e-10, -1e-12, 1e-12,
      1e-10, 0.0000001, 0.000001, 0.00001, 0.001, 45, 80, 88, 89, 89.9
    ]) {
      for (const longitude of [-49, -10, -5, -1, 0, 1, 5, 10, 49]) {
        const projected = transform.project([longitude, latitude]);
        expect(
          () => transform.unproject(projected),
          `${shape}: ${longitude}, ${latitude}`
        ).not.toThrow();
        const inverse = transform.unproject(projected);
        expect(Math.abs(inverse[0] - longitude)).toBeLessThan(2e-9);
        expect(Math.abs(inverse[1] - latitude)).toBeLessThan(
          Math.min(2e-11, Math.abs(latitude) * 1e-6)
        );
        const recovered = transform.project(inverse);
        expect(Math.hypot(recovered[0] - projected[0], recovered[1] - projected[1])).toBeLessThan(
          2e-7
        );
      }
    }
  }
  const transform = projectionEngine.createProjection({to: '+proj=poly +R=6371000'});
  const inverse = transform.unproject([9690.78815532985, 9896771.515790729]);
  expect(Math.abs(inverse[0] - 5)).toBeLessThan(2e-9);
  expect(Math.abs(inverse[1] - 89)).toBeLessThan(2e-11);
});

test('polyconic inverts the stored near-equator cancellation regression', () => {
  const transform = projectionEngine.createProjection({to: '+proj=poly +R=6371000'});
  const projected = [5448551.405583377, 0.15172155439576684];
  const inverse = transform.unproject(projected);
  expect(Math.abs(inverse[0] - 49)).toBeLessThan(2e-11);
  // This stored northing was formed with the old cancelling forward formula;
  // its accurate inverse need not be the original ideal latitude of 1e-6°.
  expect(Math.abs(inverse[1] - 9.991004620028349e-7)).toBeLessThan(1e-15);
  const recovered = transform.project(inverse);
  expect(Math.hypot(recovered[0] - projected[0], recovered[1] - projected[1])).toBeLessThan(1e-7);
});

test('polyconic near-equator forward equations match independent 80-digit controls', () => {
  // Original spherical equations evaluated with mpmath 1.3.0 at 80 digits,
  // using the exact binary64 longitude/latitude inputs. Native PROJ's rounded
  // 1-cos(e) is not an accuracy oracle for these cancellation-sensitive rows.
  const transform = projectionEngine.createProjection({to: '+proj=poly +R=6371000'});
  const controls = [
    {input: [49, 0.000001], expected: [5448551.405583377, 0.15185815657778803]},
    {input: [-49, -0.000001], expected: [-5448551.405583377, -0.15185815657778803]},
    {input: [10, 0.0000001], expected: [1111949.2664455874, 0.011288852222695062]}
  ];
  for (const row of controls) {
    const actual = transform.project(row.input);
    expect(Math.abs(actual[0] - row.expected[0])).toBeLessThan(1e-8);
    expect(Math.abs(actual[1] - row.expected[1])).toBeLessThan(1e-12);
  }
});
