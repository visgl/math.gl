// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original analytic topology/attribute controls and pinned native curve-root controls.
import {expect, test} from 'vitest';
import {EllipsoidRhumb, EllipsoidGeodesic} from '@math.gl/geospatial/ellipsoid';
import {
  splitGeographicPolyline as line,
  splitGeographicPolygon as polygon,
  GeographicSeamError
} from '@math.gl/geospatial/globe';
import type {GeographicSeamPolygon, GeographicSeamRing} from '@math.gl/geospatial/globe';
import {qualifyGeographicSeams} from './geographic-seams-qualification';
const linear = {edgeModel: 'linear' as const};
const rhumb = new EllipsoidRhumb({semiMajorAxis: 1, semiMinorAxis: 1});
const geodesic = new EllipsoidGeodesic({semiMajorAxis: 1, semiMinorAxis: 1});
const points = (p: ArrayLike<number>, size = 2) =>
  Array.from({length: p.length / size}, (_, i) =>
    Array.from({length: size}, (_, k) => p[i * size + k])
  );
function area(r: GeographicSeamRing): number {
  const p = points(r.positions);
  let sum = 0;
  for (let i = 1; i < p.length; i++) sum += p[i - 1][0] * p[i][1] - p[i][0] * p[i - 1][1];
  return sum / 2;
}
function total(parts: GeographicSeamPolygon[]): number {
  return parts.reduce(
    (s, p) =>
      s + Math.abs(area(p.rings[0])) - p.rings.slice(1).reduce((s, h) => s + Math.abs(area(h)), 0),
    0
  );
}
function closed(parts: GeographicSeamPolygon[]) {
  for (const part of parts)
    for (const ring of part.rings) {
      const p = points(ring.positions);
      expect(p[0]).toEqual(p[p.length - 1]);
      expect(ring.edges.length).toBe(p.length - 1);
      expect(p.every(([x, y]) => x >= -180 && x <= 180 && y >= -90 && y <= 90)).toBe(true);
    }
}
test('Linear edges explicitly preserve supplied extents or select short seam intervals', () => {
  expect(line([170, 10, -170, 30], linear).map(p => Array.from(p.positions))).toEqual([
    [170, 10, -170, 30]
  ]);
  const p = line([170, 10, 10, 100, -170, 30, 30, 300], {
    ...linear,
    size: 4,
    linearLongitude: 'shortest'
  });
  expect(p.map(p => Array.from(p.positions))).toEqual([
    [170, 10, 10, 100, 180, 20, 20, 200],
    [-180, 20, 20, 200, -170, 30, 30, 300]
  ]);
  expect(p.map(p => p.world)).toEqual([0, 1]);
  expect(p[0].edges[0]).toMatchObject({edgeIndex: 0, startFraction: 0, endFraction: 0.5});
  expect(p[1].edges[0]).toMatchObject({startFraction: 0.5, endFraction: 1, longitudeShift: -360});
});
test('Repeated seam crossings keep source order and are bounded', () => {
  const p = line([170, 0, -170, 10, 170, 20, -170, 30], {...linear, linearLongitude: 'shortest'});
  expect(p.length).toBe(4);
  expect(p.flatMap(p => p.edges).map(e => e.edgeIndex)).toEqual([0, 0, 1, 1, 2, 2]);
  const winding = line([0, 30, 0, 30], {edgeModel: 'rhumb', rhumb, longitudeTurns: [2]});
  expect(winding.length).toBe(3);
  expect(winding.map(p => p.world)).toEqual([0, 1, 2]);
  expect(() =>
    line([0, 30, 0, 30], {edgeModel: 'rhumb', rhumb, longitudeTurns: [128], maxVertices: 4})
  ).toThrow(GeographicSeamError);
  expect(() =>
    line([0, 0, 80, 40], {edgeModel: 'rhumb', rhumb, seamLongitude: 30, maxIterations: 1})
  ).toThrow(GeographicSeamError);
});
test('Original rhumb tie directions survive earlier longitude wraps', () => {
  for (const [input, end] of [
    [[170, 0, -170, 0, 10, 0], 370],
    [[-170, 0, 170, 0, -10, 0], -370]
  ] as const) {
    const parts = line(input, {edgeModel: 'rhumb', rhumb});
    const last = parts.at(-1);
    expect(last.positions[last.positions.length - 2] + 360 * last.world).toBe(end);
    expect(parts.length).toBe(2);
    const edges = parts.flatMap(p => p.edges).filter(e => e.edgeIndex === 1);
    expect(edges[0].startFraction).toBe(0);
    expect(edges.at(-1).endFraction).toBe(1);
  }
});
for (const row of qualifyGeographicSeams()) {
  test(`C5/C6 ${row.family}: ${row.id}`, () =>
    expect(row, row.error).toMatchObject({passed: true}));
}
test('Independent spherical great-circle seam latitude differs from a chord', () => {
  const parts = line([170, 30, -170, 30], {edgeModel: 'geodesic', geodesic});
  const latitude = (Math.atan(Math.tan(Math.PI / 6) / Math.cos(Math.PI / 18)) * 180) / Math.PI;
  const p = points(parts[0].positions).at(-1);
  expect(Math.abs(p[1] - latitude)).toBeLessThan(2e-10);
  expect(p[1]).toBeGreaterThan(30);
});
test('Exact pole passages are separate meridian endpoints, including pole vertices', () => {
  const parts = line([0, 80, 180, 80], {edgeModel: 'geodesic', geodesic});
  expect(parts.length).toBe(2);
  expect(points(parts[0].positions).at(-1)).toEqual([0, 90]);
  expect(points(parts[1].positions)[0]).toEqual([-180, 90]);
  const vertex = line([0, 80, 0, 90, 90, 80], {edgeModel: 'geodesic', geodesic});
  expect(vertex.length).toBe(2);
  expect(points(vertex[1].positions)[0]).toEqual([90, 90]);
  expect(() => line([0, 80, 0, 90], {edgeModel: 'rhumb', rhumb})).toThrow(RangeError);
});
test('Rectangles retain area and winding when split, including full-world extents', () => {
  for (const outer of [
    [170, -20, 190, -20, 190, 20, 170, 20],
    [170, 20, 190, 20, 190, -20, 170, -20]
  ]) {
    const result = polygon([{positions: outer}], linear);
    closed(result);
    expect(result.length).toBe(2);
    expect(total(result)).toBe(800);
    expect(result.every(p => Math.sign(area(p.rings[0])) === Math.sign(outer[5] - outer[1]))).toBe(
      true
    );
  }
  const world = polygon([{positions: [-180, -10, 180, -10, 180, 10, -180, 10]}], linear);
  expect(world.length).toBe(1);
  expect(total(world)).toBe(7200);
});
test('Full-width aliases cancel at interior meridians and across partial overlaps', () => {
  for (const origin of [-180, 0, 23, 360])
    for (const seamLongitude of [0, 180, 270]) {
      const result = polygon(
        [{positions: [origin, -10, origin + 360, -10, origin + 360, 10, origin, 10]}],
        {...linear, seamLongitude}
      );
      expect(result.length).toBe(1);
      expect(total(result)).toBe(7200);
      expect(result[0].rings.length).toBe(1);
      expect(Array.from(result[0].rings[0].positions).every(Number.isFinite)).toBe(true);
    }
  const partial = polygon([{positions: [0, -10, 360, -5, 360, 15, 0, 10]}], linear);
  closed(partial);
  expect(partial.length).toBe(1);
  expect(total(partial)).toBe(7200);
});
test('A seam-crossing hole becomes notches, not independently closed filled rings', () => {
  const result = polygon(
    [
      {positions: [170, -20, 190, -20, 190, 20, 170, 20]},
      {positions: [175, -5, 185, -5, 185, 5, 175, 5]}
    ],
    linear
  );
  closed(result);
  expect(result.length).toBe(2);
  expect(result.every(p => p.rings.length === 1)).toBe(true);
  expect(total(result)).toBe(700);
  expect(result.flatMap(p => p.rings[0].edges).some(e => e?.ringIndex === 1)).toBe(true);
});
test('Contained holes stay with their component and acquire opposite winding', () => {
  const result = polygon(
    [
      {positions: [170, -20, 190, -20, 190, 20, 170, 20]},
      {positions: [172, -5, 176, -5, 176, 5, 172, 5]}
    ],
    linear
  );
  closed(result);
  expect(result.length).toBe(2);
  expect(result.filter(p => p.rings.length === 2).length).toBe(1);
  expect(total(result)).toBe(760);
  const hole = result.find(p => p.rings.length === 2);
  expect(area(hole.rings[0]) * area(hole.rings[1])).toBeLessThan(0);
});
test('Concave repeated cuts produce multiple disconnected components in one chart', () => {
  const ring = [170, -30, 190, -30, 190, 30, 170, 30, 170, 20, 185, 20, 185, -20, 170, -20];
  const result = polygon([{positions: ring}], linear);
  closed(result);
  expect(result.length).toBe(3);
  expect(total(result)).toBe(600);
});
test('Polar cap choice and polar holes preserve the cylindrical chart topology', () => {
  const outer = {positions: [-135, 60, -45, 60, 45, 60, 135, 60], pole: 'north' as const};
  const cap = polygon([outer], {edgeModel: 'rhumb', rhumb});
  closed(cap);
  expect(cap.length).toBe(1);
  expect(total(cap)).toBe(10800);
  const annulus = polygon([outer, {positions: [-90, 80, 0, 80, 90, 80, 180, 80], pole: 'north'}], {
    edgeModel: 'rhumb',
    rhumb
  });
  closed(annulus);
  expect(total(annulus)).toBe(7200);
  expect(
    annulus
      .flatMap(p => p.rings)
      .flatMap(r => points(r.positions))
      .every(p => p[1] <= 80)
  ).toBe(true);
  expect(() => polygon([{positions: outer.positions}], {edgeModel: 'rhumb', rhumb})).toThrow(
    GeographicSeamError
  );
});
test('Attributes on original edges use source fractions; generated edges are explicit', () => {
  const result = polygon([{positions: [170, -20, 0, 190, -20, 20, 190, 20, 40, 170, 20, 60]}], {
    ...linear,
    size: 3
  });
  for (const part of result)
    for (const ring of part.rings) {
      const ps = points(ring.positions, 3);
      ring.edges.forEach((source, i) => {
        if (!source) return;
        const heights = [0, 20, 40, 60, 0];
        expect(ps[i][2]).toBeCloseTo(
          heights[source.edgeIndex] * (1 - source.startFraction) +
            heights[source.edgeIndex + 1] * source.startFraction,
          12
        );
      });
      expect(ring.edges.some(e => e === null)).toBe(true);
    }
});
test('Seam tangencies, duplicate vertices, resource and topology failures are deterministic', () => {
  const tangent = polygon([{positions: [170, 0, 180, 10, 170, 20, 170, 20]}], linear);
  expect(tangent.length).toBe(1);
  expect(total(tangent)).toBe(100);
  const input = [170, -10, 190, -10, 190, 10, 170, 10],
    before = input.slice();
  expect(() => polygon([{positions: input}], {...linear, maxWork: 1})).toThrow(GeographicSeamError);
  expect(input).toEqual(before);
  expect(() => polygon([{positions: [0, 0, 1, 0, 1, 0, 0, 0]}], linear)).toThrow(
    GeographicSeamError
  );
  expect(() =>
    polygon(
      [{positions: [0, 0, 10, 0, 10, 10, 0, 10]}, {positions: [20, 20, 30, 20, 30, 30, 20, 30]}],
      linear
    )
  ).toThrow(GeographicSeamError);
  expect(() => line([NaN, 0, 0, 1], linear)).toThrow(GeographicSeamError);
});

function solidArea(p: number[][]): number {
  const xyz = p.map(([lon, lat]) => {
    const a = (lon * Math.PI) / 180,
      b = (lat * Math.PI) / 180;
    return [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
  });
  const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
  let sum = 0;
  for (let i = 1; i + 1 < xyz.length; i++) {
    const a = xyz[0],
      b = xyz[i],
      c = xyz[i + 1];
    const determinant =
      a[0] * (b[1] * c[2] - b[2] * c[1]) +
      a[1] * (b[2] * c[0] - b[0] * c[2]) +
      a[2] * (b[0] * c[1] - b[1] * c[0]);
    sum += 2 * Math.atan2(determinant, 1 + dot(a, b) + dot(b, c) + dot(c, a));
  }
  return sum;
}
test('Geodesic hole cuts preserve independently computed spherical solid angle', () => {
  const outer = [170, -20, -170, -20, -170, 20, 170, 20];
  const hole = [175, -5, -175, -5, -175, 5, 175, 5];
  const result = polygon([{positions: outer}, {positions: hole}], {
    edgeModel: 'geodesic',
    geodesic
  });
  closed(result);
  const actual = result.reduce(
    (s, p) =>
      s +
      Math.abs(solidArea(points(p.rings[0].positions))) -
      p.rings.slice(1).reduce((s, h) => s + Math.abs(solidArea(points(h.positions))), 0),
    0
  );
  const expected = Math.abs(solidArea(points(outer))) - Math.abs(solidArea(points(hole)));
  expect(Math.abs(actual - expected)).toBeLessThan(2e-12);
});
test('Geodesic pole vertices retain the analytic octant rather than a longitude chord', () => {
  const result = polygon([{positions: [0, 0, 90, 0, 0, 90]}], {edgeModel: 'geodesic', geodesic});
  closed(result);
  expect(result.length).toBe(1);
  expect(
    Math.abs(Math.abs(solidArea(points(result[0].rings[0].positions))) - Math.PI / 2)
  ).toBeLessThan(2e-12);
  expect(result[0].rings[0].edges.some(e => e === null)).toBe(true);
});
test('Polar rhumb caps preserve independent spherical surface area and explicit pole attributes', () => {
  for (const pole of ['north', 'south'] as const) {
    const sign = pole === 'north' ? 1 : -1;
    const ring = {
      positions: [-135, sign * 60, 1, -45, sign * 60, 2, 45, sign * 60, 3, 135, sign * 60, 4],
      pole,
      poleAttributes: [9]
    };
    const result = polygon([ring], {edgeModel: 'rhumb', rhumb, size: 3});
    let integral = 0;
    for (const part of result)
      for (const ring of part.rings) {
        const p = points(ring.positions, 3);
        for (let i = 1; i < p.length; i++)
          if (p[i - 1][1] === p[i][1])
            integral +=
              (((p[i][0] - p[i - 1][0]) * Math.PI) / 180) * Math.sin((p[i][1] * Math.PI) / 180);
        expect(p.filter(p => Math.abs(p[1]) === 90).every(p => p[2] === 9)).toBe(true);
      }
    expect(Math.abs(Math.abs(integral) - 2 * Math.PI * (1 - Math.sin(Math.PI / 3)))).toBeLessThan(
      2e-12
    );
    expect(() =>
      polygon([{positions: ring.positions, pole}], {edgeModel: 'rhumb', rhumb, size: 3})
    ).toThrow(GeographicSeamError);
  }
});
function planarInside(p: readonly number[], ring: number[][]): boolean {
  // Independent vertical ray and closed-form chord intersections for linear controls.
  let parity = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j],
      b = ring[i];
    if (
      a[0] > p[0] !== b[0] > p[0] &&
      a[1] + ((b[1] - a[1]) * (p[0] - a[0])) / (b[0] - a[0]) > p[1]
    )
      parity = !parity;
  }
  return parity;
}
test('Deterministic concave polygons and holes preserve filled sets after repeated cuts', () => {
  for (let n = 7; n <= 18; n++) {
    const outer = Array.from({length: n}, (_, i) => {
      const a = (2 * Math.PI * (i + 0.137)) / n,
        r = 10 + 5 * Math.sin(3 * a);
      return [180 + r * Math.cos(a), r * Math.sin(a)];
    });
    const hole = Array.from({length: 5}, (_, i) => {
      const a = (2 * Math.PI * (i + 0.27)) / 5;
      return [180 + 2 * Math.cos(a), 2 * Math.sin(a)];
    });
    const result = polygon([{positions: outer.flat()}, {positions: hole.flat()}], linear);
    closed(result);
    for (let x = -179.1; x < 180; x += 7.3)
      for (let y = -14.3; y < 15; y += 3.7) {
        const unrolled = x < 0 ? x + 360 : x;
        const expected = planarInside([unrolled, y], outer) && !planarInside([unrolled, y], hole);
        const actual = result.some(
          p =>
            planarInside([x, y], points(p.rings[0].positions)) &&
            !p.rings.slice(1).some(h => planarInside([x, y], points(h.positions)))
        );
        expect(actual, `${n}: ${x}, ${y}`).toBe(expected);
      }
  }
});
test('Empty/singleton inputs and configurable projection meridians are stable snapshots', () => {
  expect(line([], linear)).toEqual([]);
  expect(polygon([], linear)).toEqual([]);
  expect(Array.from(line([360, 1, 7], {...linear, size: 3})[0].positions)).toEqual([0, 1, 7]);
  const input = [-10, -10, 10, -10, 10, 10, -10, 10],
    before = input.slice();
  const result = polygon([{positions: input}], {...linear, seamLongitude: 0});
  expect(result.length).toBe(2);
  expect(input).toEqual(before);
  expect(result.every(p => points(p.rings[0].positions).every(([x]) => x >= -360 && x <= 0))).toBe(
    true
  );
  result[0].rings[0].positions.fill(0);
  expect(input).toEqual(before);
});
test('Unsupported winding, invalid dimensions, ambiguous contacts and all limits reject atomically', () => {
  for (const options of [
    {...linear, size: 1},
    {...linear, maxIterations: 0},
    {...linear, maxVertices: 0},
    {...linear, maxWork: 0},
    {...linear, seamLongitude: Infinity}
  ])
    expect(() => line([0, 0, 1, 1], options)).toThrow(GeographicSeamError);
  expect(() => line([65537, 0, 0, 0], linear)).toThrow(GeographicSeamError);
  expect(() => line([0, 0, 1], linear)).toThrow(GeographicSeamError);
  expect(() => line([0, 0, 1, 1], {...linear, longitudeTurns: []})).toThrow(GeographicSeamError);
  expect(() => line([0, 0, 1, 1], {...linear, longitudeTurns: [1]})).toThrow(GeographicSeamError);
  expect(() => line([0, 0, 1, 1], {...linear, longitudeTurns: [0.1]})).toThrow(GeographicSeamError);
  expect(() => polygon([{positions: [0, 0, 10, 0, 10, 10, 0, 10], pole: 'north'}], linear)).toThrow(
    GeographicSeamError
  );
  expect(() =>
    polygon([{positions: [0, 0, 10, 0, 10, 10, 0, 10, 0, 0, 2]}], {...linear, size: 3})
  ).toThrow(GeographicSeamError);
  const square = [0, 0, 20, 0, 20, 20, 0, 20];
  expect(() => polygon([{positions: square}, {positions: [0, 0, 4, 1, 1, 4]}], linear)).toThrow(
    GeographicSeamError
  );
  expect(() =>
    polygon(
      [
        {positions: square},
        {positions: [2, 2, 18, 2, 18, 18, 2, 18]},
        {positions: [4, 4, 6, 4, 6, 6, 4, 6]}
      ],
      linear
    )
  ).toThrow(GeographicSeamError);
  expect(() => polygon([{positions: square}], {...linear, maxVertices: 4})).toThrow(
    GeographicSeamError
  );
  expect(() => polygon([{positions: [0, 0, 1, 0, 1, 1e-12, 0, 1e-12]}], linear)).toThrow(
    GeographicSeamError
  );
});

test('Tiny short longitude intervals are not erased by wrap-offset arithmetic', () => {
  expect(
    Array.from(line([0, 0, 1e-20, 1], {...linear, linearLongitude: 'shortest'})[0].positions)
  ).toEqual([0, 0, 1e-20, 1]);
  expect(() => line([-1e-20, 0, 1e-20, 1], {...linear, seamLongitude: 0})).toThrow(
    GeographicSeamError
  );
});

test('Geodesic polar caps retain independent solid angle through pole-chart connectors', () => {
  const input = [-120, 80, 0, 80, 120, 80];
  const result = polygon([{positions: input, pole: 'north'}], {edgeModel: 'geodesic', geodesic});
  closed(result);
  const actual = result.reduce((s, p) => s + Math.abs(solidArea(points(p.rings[0].positions))), 0);
  expect(Math.abs(actual - Math.abs(solidArea(points(input))))).toBeLessThan(2e-12);
});
test('Closing and zero-length polygon attributes cannot silently change', () => {
  expect(() =>
    polygon([{positions: [0, 0, 0, 10, 0, 1, 10, 10, 2, 0, 10, 3, 0, 0, 4]}], {...linear, size: 3})
  ).toThrow(GeographicSeamError);
  expect(() =>
    polygon([{positions: [0, 0, 0, 10, 0, 1, 10, 0, 2, 0, 10, 3]}], {...linear, size: 3})
  ).toThrow(GeographicSeamError);
  try {
    line([0, 0, 1, 1], {...linear, maxVertices: 1});
    throw new Error('Expected a vertex limit');
  } catch (error) {
    expect(error).toMatchObject({reason: 'limit'});
  }
});

test('Unique near-pole routes are not converted into exact pole passages', () => {
  for (const start of [0, 1e-20]) {
    const end = start === 0 ? 180 - 2 ** -40 : 180;
    const result = line([start, 80, end, 80], {edgeModel: 'geodesic', geodesic});
    expect(result.length).toBe(1);
    expect(points(result[0].positions)).toEqual([
      [start, 80],
      [end, 80]
    ]);
  }
});
