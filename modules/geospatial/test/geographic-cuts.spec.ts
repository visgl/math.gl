// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {clipGeographicPolygon, clipGeographicPolyline} from '../src/geographic-cuts';
import {GeodesicPath} from '../src/geodesic-path';
import {RhumbPath} from '../src/rhumb-path';
const area = (p: ReturnType<typeof clipGeographicPolygon>) =>
  p.reduce(
    (a, p) =>
      a +
      p.rings.reduce((a, r) => {
        let sum = 0;
        for (let i = 2; i < r.positions.length; i += 2)
          sum +=
            (r.positions[i - 2] * r.positions[i + 1] - r.positions[i] * r.positions[i - 1]) / 2;
        return a + sum;
      }, 0),
    0
  );
test('Linear band clipping reconstructs components and opened holes', () => {
  const rings = [
    {positions: [-40, -40, 40, -40, 40, 40, -40, 40]},
    {positions: [-10, -30, 10, -30, 10, 10, -10, 10]}
  ];
  const result = clipGeographicPolygon(rings, {edgeModel: 'linear', latitudeRange: [0, 30]});
  expect(result).toHaveLength(1);
  expect(result[0].rings).toHaveLength(1);
  expect(area(result)).toBe(80 * 30 - 20 * 10);
  expect(result[0].rings[0].edges.some(e => e.kind === 'parallel')).toBe(true);
});
for (const edgeModel of ['geodesic', 'rhumb'] as const)
  test(`${edgeModel} roots keep distance fractions and source attributes`, () => {
    const input = [10, -20, 100, 40, 30, 200],
      options = {edgeModel, latitudeRange: [0, 20] as const, size: 3};
    const result = clipGeographicPolyline(input, options);
    expect(result).toHaveLength(1);
    const path =
      edgeModel === 'geodesic'
        ? new GeodesicPath(input.slice(0, 3), input.slice(3))
        : new RhumbPath(input.slice(0, 3), input.slice(3));
    for (const part of result)
      for (let i = 0; i < part.edges.length; i++) {
        const source = part.edges[i];
        for (const [k, t] of [
          [i, source.startFraction],
          [i + 1, source.endFraction]
        ]) {
          const p = path.sample(t);
          expect(Math.abs(p[1] - part.positions[3 * k + 1])).toBeLessThan(1e-10);
          expect(Math.abs(p[0] + source.longitudeShift - part.positions[3 * k])).toBeLessThan(
            1e-10
          );
          expect(part.positions[3 * k + 2]).toBeCloseTo(100 + 100 * t, 10);
        }
      }
    expect(result[0].positions[1]).toBe(0);
    expect(result[0].positions[result[0].positions.length - 2]).toBe(20);
  });
test('A geodesic excursion is clipped twice even when both endpoints are outside', () => {
  const p = clipGeographicPolyline([-60, 40, 60, 40], {
    edgeModel: 'geodesic',
    latitudeRange: [50, 90]
  });
  expect(p).toHaveLength(1);
  expect(p[0].edges).toHaveLength(2);
  expect(p[0].positions[1]).toBe(50);
  expect(p[0].positions[p[0].positions.length - 1]).toBe(50);
  expect(p[0].edges[0].startFraction).toBeGreaterThan(0);
  expect(p[0].edges[1].endFraction).toBeLessThan(1);
});
for (const edgeModel of ['linear', 'geodesic', 'rhumb'] as const)
  test(`${edgeModel} polygons preserve band closure and holes`, () => {
    const rings = [
      {positions: [-40, -40, 40, -40, 40, 40, -40, 40]},
      {positions: [-10, -30, 10, -30, 10, 10, -10, 10]}
    ];
    const before = JSON.stringify(rings);
    const result = clipGeographicPolygon(rings, {edgeModel, latitudeRange: [0, 30]});
    expect(result.length).toBeGreaterThan(0);
    expect(JSON.stringify(rings)).toBe(before);
    for (const p of result)
      for (const r of p.rings) {
        expect(r.edges.length).toBe(r.positions.length / 2 - 1);
        for (let i = 1; i < r.positions.length; i += 2)
          expect(r.positions[i] >= 0 && r.positions[i] <= 30).toBe(true);
      }
  });
test('Band and seam cuts compose for explicit polar caps and rhumb winding', () => {
  const cap = clipGeographicPolygon(
    [{positions: [-180, 60, -60, 60, 60, 60, 180, 60], pole: 'north'}],
    {edgeModel: 'geodesic', latitudeRange: [0, 80]}
  );
  expect(cap.length).toBeGreaterThan(0);
  expect(
    cap.some(p => p.rings.some(r => r.edges.some(e => e.kind === 'parallel' && e.latitude === 80)))
  ).toBe(true);
  const turns = clipGeographicPolyline([10, -30, 10, 30], {
    edgeModel: 'rhumb',
    longitudeTurns: [2],
    latitudeRange: [-10, 10]
  });
  expect(turns.length).toBeGreaterThan(0);
  expect(turns.every(p => p.positions.every(Number.isFinite))).toBe(true);
});
test('Invalid bands and exhausted work fail without mutating inputs', () => {
  const input = [0, -20, 10, 20],
    before = input.slice();
  for (const latitudeRange of [
    [20, -20],
    [-91, 20],
    [0, 91],
    [0, NaN],
    [0, 0]
  ])
    expect(() =>
      clipGeographicPolyline(input, {
        edgeModel: 'linear',
        latitudeRange: latitudeRange as [number, number]
      })
    ).toThrow();
  expect(() =>
    clipGeographicPolyline(input, {edgeModel: 'geodesic', latitudeRange: [0, 10], maxWork: 1})
  ).toThrow();
  expect(input).toEqual(before);
});

import {subdivideGeographicCutRing} from '../src/geographic-cuts';
for (const edgeModel of ['geodesic', 'rhumb'] as const)
  test(`${edgeModel} polar projection retains small-circle closures and source intervals`, () => {
    const a = 6378137,
      b = 6356752.314245179,
      e2 = 1 - (b / a) ** 2,
      latitude = (20 * Math.PI) / 180;
    const inputs = [{positions: [-60, -20, 60, -20, 60, 60, -60, 60]}],
      options = {
        edgeModel,
        latitudeRange: [20, 90] as const,
        ellipsoid: {semiMajorAxis: a, semiMinorAxis: b}
      };
    const polygons = clipGeographicPolygon(inputs, options);
    const radius = (a * Math.cos(latitude)) / Math.sqrt(1 - e2 * Math.sin(latitude) ** 2);
    const transform = ([lon, lat]: readonly number[]) => {
      const phi = (lat * Math.PI) / 180,
        lambda = (lon * Math.PI) / 180,
        r = Math.abs(lat) === 90 ? 0 : (a * Math.cos(phi)) / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
      return [r * Math.sin(lambda), -r * Math.cos(lambda)];
    };
    let closures = 0;
    for (const polygon of polygons)
      for (const ring of polygon.rings) {
        const p = subdivideGeographicCutRing(inputs, ring, {
          ...options,
          transform,
          tolerance: 100,
          maxSegmentLength: 200000,
          maxDepth: 24
        });
        expect(p.edges.length).toBe(p.positions.length / 2 - 1);
        expect(p.positions.length).toBeGreaterThan(ring.positions.length);
        for (let i = 0; i < p.edges.length; i++) {
          const edge = p.edges[i];
          if (edge.kind === 'parallel') {
            closures++;
            for (const k of [i, i + 1]) {
              expect(p.sourcePositions[2 * k + 1]).toBe(20);
              expect(
                Math.abs(Math.hypot(p.positions[2 * k], p.positions[2 * k + 1]) - radius)
              ).toBeLessThan(a * 2e-12);
            }
            const delta =
              ((p.sourcePositions[2 * i + 2] - p.sourcePositions[2 * i]) * Math.PI) / 180;
            expect(radius * (1 - Math.cos(delta / 2))).toBeLessThan(100 + a * 2e-12);
          } else if (edge.kind === 'source')
            expect(edge.source.startFraction >= 0 && edge.source.endFraction <= 1).toBe(true);
        }
      }
    expect(closures).toBeGreaterThan(2);
  });
test('Adaptive cut projection snapshots options, ring descriptors and original inputs', () => {
  const make = () => [{positions: [-40, -40, 40, -40, 40, 40, -40, 40]}];
  const inputs = make(),
    options = {edgeModel: 'rhumb' as const, latitudeRange: [0, 30] as const};
  const ring = clipGeographicPolygon(inputs, options)[0].rings[0];
  const transform = (p: readonly number[]) => [
    p[0],
    (Math.asinh(Math.tan((p[1] * Math.PI) / 180)) * 180) / Math.PI
  ];
  const expected = subdivideGeographicCutRing(inputs, ring, {
    ...options,
    transform,
    tolerance: 0.001
  });
  const settings = {...options, transform, tolerance: 0.001};
  let first = true;
  settings.transform = p => {
    if (first) {
      first = false;
      inputs[0].positions.fill(999);
      ring.positions.fill(999);
      ring.edges.length = 0;
      (settings as {edgeModel: string}).edgeModel = 'linear';
    }
    return transform(p);
  };
  const actual = subdivideGeographicCutRing(inputs, ring, settings);
  expect(actual.positions).toEqual(expected.positions);
  expect(actual.sourcePositions).toEqual(expected.sourcePositions);
  expect(() =>
    subdivideGeographicCutRing(make(), clipGeographicPolygon(make(), options)[0].rings[0], {
      ...options,
      transform,
      tolerance: 1e-20,
      maxDepth: 0
    })
  ).toThrow();
});

import {qualifyLatitudeCuts} from './latitude-cuts-qualification';
for (const row of qualifyLatitudeCuts())
  test(`${row.mode} ${row.id}`, () => expect(row.passed, JSON.stringify(row)).toBe(true));

for (const edgeModel of ['linear', 'geodesic', 'rhumb'] as const)
  test(`${edgeModel} retained holes, reverse winding, outside bands and tangent contacts`, () => {
    const outer = [-40, -40, 40, -40, 40, 40, -40, 40];
    const hole = [-10, 5, 10, 5, 10, 15, -10, 15];
    const reverse = (p: number[]) =>
      Array.from({length: p.length / 2}, (_, i) =>
        p.slice(p.length - 2 * i - 2, p.length - 2 * i)
      ).flat();
    const settings = {edgeModel, latitudeRange: [0, 30] as const};
    const p = clipGeographicPolygon([{positions: outer}, {positions: hole}], settings);
    expect(p).toHaveLength(1);
    expect(p[0].rings).toHaveLength(2);
    const reversed = clipGeographicPolygon(
      [{positions: reverse(outer)}, {positions: hole}],
      settings
    );
    expect(reversed).toHaveLength(1);
    expect(reversed[0].rings).toHaveLength(2);
    expect(Math.abs(area(reversed) + area(p))).toBeLessThan(1e-8);
    expect(
      clipGeographicPolygon([{positions: outer}], {edgeModel, latitudeRange: [80, 90]})
    ).toEqual([]);
    expect(clipGeographicPolyline([0, -20, 0, 0], {edgeModel, latitudeRange: [0, 30]})).toEqual([]);
    const whole = clipGeographicPolygon([{positions: outer}, {positions: hole}], {
      edgeModel,
      latitudeRange: [-90, 90]
    });
    expect(whole[0].rings).toHaveLength(2);
  });
test('Concave cuts produce disconnected components without filling the gap', () => {
  const p = clipGeographicPolygon(
    [{positions: [-40, -40, 40, -40, 40, 40, 20, 40, 20, -20, -20, -20, -20, 40, -40, 40]}],
    {edgeModel: 'linear', latitudeRange: [0, 30]}
  );
  expect(p).toHaveLength(2);
  expect(area(p)).toBe(2 * 20 * 30);
});
test('Boundary-coincident rhumb parallels retain only the filled side', () => {
  const input = [{positions: [-40, 0, 40, 0, 40, 30, -40, 30]}];
  const p = clipGeographicPolygon(input, {edgeModel: 'rhumb', latitudeRange: [0, 30]});
  expect(p).toHaveLength(1);
  expect(p[0].rings[0].edges.every(e => e.kind === 'source')).toBe(true);
  expect(clipGeographicPolygon(input, {edgeModel: 'rhumb', latitudeRange: [30, 80]})).toEqual([]);
});
test('South polar holes and generated meridians survive resampling on wide rhumb shapes', () => {
  for (const ratio of [0.5, 2]) {
    const inputs = [
      {positions: [-180, -40, -60, -40, 60, -40, 180, -40], pole: 'south' as const},
      {positions: [-180, -70, -60, -70, 60, -70, 180, -70], pole: 'south' as const}
    ];
    const options = {
      edgeModel: 'rhumb' as const,
      latitudeRange: [-80, -50] as const,
      ellipsoid: {semiMajorAxis: 1, semiMinorAxis: ratio}
    };
    const polygons = clipGeographicPolygon(inputs, options);
    expect(polygons.length).toBeGreaterThan(0);
    for (const p of polygons)
      for (const r of p.rings) {
        const sampled = subdivideGeographicCutRing(inputs, r, {
          ...options,
          transform: p => p,
          tolerance: 0.1,
          maxSegmentLength: 0.1
        });
        expect(sampled.positions.every(Number.isFinite)).toBe(true);
        for (let i = 1; i < sampled.sourcePositions.length; i += 2)
          expect(sampled.sourcePositions[i] >= -70 && sampled.sourcePositions[i] <= -50).toBe(true);
      }
  }
});
test('Cut profile, descriptor and sampling limits fail explicitly', () => {
  const input = [{positions: [-40, -40, 40, -40, 40, 40, -40, 40]}];
  for (const edgeModel of ['geodesic', 'rhumb'] as const)
    expect(() =>
      clipGeographicPolygon(input, {
        edgeModel,
        latitudeRange: [0, 30],
        ellipsoid: {semiMajorAxis: 1, semiMinorAxis: 3}
      })
    ).toThrow();
  const options = {edgeModel: 'linear' as const, latitudeRange: [0, 30] as const};
  const ring = clipGeographicPolygon(input, options)[0].rings[0];
  for (const maxWork of [1, 2])
    expect(() =>
      subdivideGeographicCutRing(input, ring, {
        ...options,
        transform: p => p,
        tolerance: 0.1,
        maxWork
      })
    ).toThrow();
  const source = ring.edges.find(e => e.kind === 'source');
  if (source?.kind === 'source') source.source.edgeIndex = 999;
  expect(() =>
    subdivideGeographicCutRing(input, ring, {...options, transform: p => p, tolerance: 0.1})
  ).toThrow();
});
