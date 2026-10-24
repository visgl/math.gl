// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original native and analytic adapter/parameterization controls.
import {expect, test} from 'vitest';
import {EllipsoidRhumb, RhumbPath, RhumbDomainError} from '@math.gl/geospatial/ellipsoid';
import {subdivideRhumbPolyline} from '@math.gl/geospatial/globe';
const sphere = new EllipsoidRhumb({semiMajorAxis: 1, semiMinorAxis: 1});
const rad = Math.PI / 180;
function close(a: ArrayLike<number>, b: ArrayLike<number>, tolerance = 2e-10) {
  for (let i = 0; i < b.length; i++) expect(Math.abs(a[i] - b[i])).toBeLessThanOrEqual(tolerance);
}
test('Independent sphere oblique rhumbs are straight in isometric latitude, not latitude/longitude', () => {
  const first = [170, -40, 10],
    last = [-150, 60, 30];
  const path = new RhumbPath(first, last, {rhumb: sphere});
  const psi = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + (latitude * rad) / 2));
  const dp = psi(last[1]) - psi(first[1]),
    dphi = (last[1] - first[1]) * rad,
    dl = 40 * rad;
  expect(Math.abs(path.length - Math.hypot(dphi, (dl * dphi) / dp))).toBeLessThan(2e-14);
  for (const f of [0.1, 0.25, 0.5, 0.9]) {
    const lat = first[1] * (1 - f) + last[1] * f;
    close(path.sample(f), [170 + (40 * (psi(lat) - psi(first[1]))) / dp, lat, 10 + 20 * f], 2e-12);
  }
});
test('Rhumb winding, height, snapshots, floating output and failure atomicity', () => {
  const a = [170, 30, 10],
    b = [-170, 30, 30],
    options = {rhumb: sphere, longitudeTurns: 1};
  const path = new RhumbPath(a, b, options);
  a.fill(0);
  b.fill(0);
  options.longitudeTurns = 0;
  path.start.fill(0);
  path.end.fill(0);
  expect(path.end).toEqual([550, 30, 30]);
  expect(Math.abs(path.length - 380 * rad * Math.cos(30 * rad))).toBeLessThan(2e-14);
  close(path.sample(0.5), [360, 30, 20]);
  const out = new Float64Array(3);
  expect(path.sample(0.5, out)).toBe(out);
  close(out, [360, 30, 20]);
  for (const f of [-1, 2, NaN, Infinity]) {
    out.fill(7);
    expect(() => path.sample(f, out)).toThrow(RangeError);
    expect(Array.from(out)).toEqual([7, 7, 7]);
  }
  expect(() => path.sample(0.5, new Int32Array(3))).toThrow(RangeError);
  expect(() => path.sampleByDistance(path.length + 1)).toThrow(RangeError);
  expect(() => new RhumbPath([0, 90], [0, 0])).toThrow(RhumbDomainError);
  expect(() => new RhumbPath([0, 0], [0, 0], {longitudeTurns: 0.1})).toThrow(RangeError);
  const vertical = new RhumbPath([0, 0, 1], [0, 0, 5]);
  expect(vertical.sample(0.5)).toEqual([0, 0, 3]);
  expect(vertical.sampleByDistance(0)).toEqual([0, 0, 1]);
});
test('Rhumb adaptive sampling keeps distance, height and original-edge provenance', () => {
  const input = [170, 0, 10, -170, 0, 30, -150, 0, 50];
  const result = subdivideRhumbPolyline(input, {
    size: 3,
    rhumb: sphere,
    transform: p => p,
    tolerance: 1e-9,
    maxSurfaceDistance: 5 * rad
  });
  for (let i = 0; i < result.segmentIndices.length; i++) {
    const edge = result.segmentIndices[i],
      f = result.segmentFractions[i];
    close(result.sourcePositions.slice(3 * i, 3 * i + 3), [
      170 + 20 * edge + 20 * f,
      0,
      10 + 20 * edge + 20 * f
    ]);
  }
  const winding = subdivideRhumbPolyline([0, 30, 0, 30], {
    rhumb: sphere,
    longitudeTurns: [1],
    transform: p => p,
    tolerance: 1,
    maxSurfaceDistance: 1
  });
  expect(winding.sourcePositions[winding.sourcePositions.length - 2]).toBe(360);
  expect(() =>
    subdivideRhumbPolyline([0, 0, 1, 1], {transform: p => p, tolerance: 1, longitudeTurns: []})
  ).toThrow(RangeError);
  expect(() =>
    subdivideRhumbPolyline([0, 0, 80, 80], {transform: p => p, tolerance: 1e-20, maxDepth: 0})
  ).toThrow(RangeError);
  expect(() =>
    subdivideRhumbPolyline(input, {size: 3, transform: p => p, tolerance: 1, maxVertices: 2})
  ).toThrow(RangeError);
});
test('Rhumb subdivision retains original signed ties after accumulated wraps', () => {
  for (const sign of [-1, 1]) {
    const result = subdivideRhumbPolyline([sign * 170, 0, -sign * 170, 0, sign * 10, 0], {
      rhumb: sphere,
      transform: p => p,
      tolerance: 1,
      maxSurfaceDistance: 10 * rad
    });
    for (let i = 0; i < result.segmentIndices.length; i++) {
      const edge = result.segmentIndices[i],
        f = result.segmentFractions[i];
      close(result.sourcePositions.slice(2 * i, 2 * i + 2), [
        sign * (edge === 0 ? 170 + 20 * f : 190 + 180 * f),
        0
      ]);
    }
  }
});

test('Unrolled rhumb mode preserves full-width seam fragments without another solver', () => {
  const path = new RhumbPath([-180, 30], [180, 30], {rhumb: sphere, longitudeMode: 'unrolled'});
  expect(Math.abs(path.length - 2 * Math.PI * Math.cos(Math.PI / 6))).toBeLessThan(2e-14);
  close(path.sample(0.5), [0, 30]);
  expect(
    () => new RhumbPath([0, 0], [360, 0], {longitudeMode: 'unrolled', longitudeTurns: 1})
  ).toThrow(RangeError);
  const result = subdivideRhumbPolyline([-180, 30, 180, 30], {
    rhumb: sphere,
    longitudeMode: 'unrolled',
    transform: p => p,
    tolerance: 1,
    maxSurfaceDistance: 1
  });
  expect(result.sourcePositions[0]).toBe(-180);
  expect(result.sourcePositions[result.sourcePositions.length - 2]).toBe(180);
  expect(result.segmentIndices.length).toBeGreaterThan(4);
});

test('Float32 overflow and mismatched rhumb outputs reject before writes', () => {
  const path = new RhumbPath([0, 0, 1e40], [1, 1, 1e40]);
  const out = new Float32Array([7, 7, 7]);
  expect(() => path.sample(0.5, out)).toThrow(RangeError);
  expect(Array.from(out)).toEqual([7, 7, 7]);
  expect(() => path.sample(0.5, new Float64Array(2))).toThrow(RangeError);
  expect(() => new RhumbPath([0, 0], [1, 1, 1])).toThrow(RangeError);
  expect(() =>
    subdivideRhumbPolyline([], {
      longitudeMode: 'unrolled',
      longitudeTurns: [],
      transform: p => p,
      tolerance: 1
    })
  ).toThrow(RangeError);
});

test('Numerically zero rhumb paths hold horizontal coordinates while interpolating height', () => {
  const path = new RhumbPath([0, 0, 1], [360, Number.MIN_VALUE, 5]);
  expect(path.length).toBe(0);
  expect(path.end).toEqual([0, 0, 5]);
  expect(path.sample(0.5)).toEqual([0, 0, 3]);
  expect(path.sample(1)).toEqual([0, 0, 5]);
  const result = subdivideRhumbPolyline([0, 0, 360, Number.MIN_VALUE, 1, 1], {
    transform: p => p,
    tolerance: 1
  });
  expect(Array.from(result.sourcePositions)).toEqual([0, 0, 0, 0, 1, 1]);
});
