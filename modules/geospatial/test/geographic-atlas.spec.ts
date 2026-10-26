// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {createOrthographicCutAtlas, GeographicCutAtlas} from '../src/geographic-atlas';
test('Oblique ellipsoidal horizon clips and projects a polygon', () => {
  const {atlas, project} = createOrthographicCutAtlas({
    viewDirection: [1, 1, 1],
    edgeModel: 'geodesic'
  });
  const inputs = [{positions: [-120, -40, 40, -40, 40, 70, -120, 70]}];
  const p = atlas.clipPolygon(inputs);
  expect(p.length).toBeGreaterThan(0);
  for (const polygon of p)
    for (const ring of polygon.rings) {
      expect(ring.edges.length).toBe(ring.positions.length / 2 - 1);
      const projected = atlas.subdivideRing(inputs, ring, {
        transform: project,
        tolerance: 1000,
        maxSegmentLength: 500000
      });
      expect(projected.positions.every(Number.isFinite)).toBe(true);
    }
});
test('An octant atlas partitions linear polygons with shared cut identities', () => {
  const boundaries = [
    {id: 'x', normal: [1, 0, 0] as const},
    {id: 'y', normal: [0, 1, 0] as const},
    {id: 'z', normal: [0, 0, 1] as const}
  ];
  const charts = [];
  for (const x of [-1, 1] as const)
    for (const y of [-1, 1] as const)
      for (const z of [-1, 1] as const)
        charts.push({
          id: `${x}/${y}/${z}`,
          center: [x, y, z] as const,
          cuts: [
            {boundary: 'x', side: x},
            {boundary: 'y', side: y},
            {boundary: 'z', side: z}
          ]
        });
  const atlas = new GeographicCutAtlas({boundaries, charts}, {edgeModel: 'linear'});
  const p = atlas.clipPolygon([{positions: [-60, -40, 60, -40, 60, 40, -60, 40]}]);
  expect(p).toHaveLength(4);
  expect(atlas.adjacency).toHaveLength(3);
});
test('Visible line source intervals survive an oblique horizon', () => {
  const {atlas} = createOrthographicCutAtlas({viewDirection: [1, 1, 1], edgeModel: 'rhumb'});
  const p = atlas.clipPolyline([-120, -40, 40, 70]);
  expect(p.length).toBeGreaterThan(0);
  expect(p[0].edges[0].startFraction).toBeGreaterThan(0);
});

for (const edgeModel of ['linear', 'geodesic', 'rhumb'] as const) {
  test(`${edgeModel} oblique clipping preserves holes and reversed input`, () => {
    const {atlas} = createOrthographicCutAtlas({viewDirection: [1, 0, 1], edgeModel});
    const input = [
      {positions: [-70, -40, 70, -40, 70, 70, -70, 70]},
      {positions: [-10, 20, 10, 20, 10, 40, -10, 40]}
    ];
    const p = atlas.clipPolygon(input);
    expect(p).toHaveLength(1);
    expect(p[0].rings).toHaveLength(2);
    const reverse = (p: number[]) =>
      Array.from({length: p.length / 2}, (_, i) =>
        p.slice(p.length - 2 * i - 2, p.length - 2 * i)
      ).flat();
    const reversed = atlas.clipPolygon(input.map(r => ({positions: reverse(r.positions)})));
    expect(reversed).toHaveLength(1);
    expect(reversed[0].rings).toHaveLength(2);
  });
  test(`${edgeModel} hidden polygons and holes opening into the horizon`, () => {
    const {atlas} = createOrthographicCutAtlas({viewDirection: [1, 0, 0], edgeModel});
    expect(atlas.clipPolygon([{positions: [140, -20, 160, -20, 160, 20, 140, 20]}])).toEqual([]);
    const input = [
      {positions: [-40, -40, 120, -40, 120, 40, -40, 40]},
      {positions: [70, -10, 110, -10, 110, 10, 70, 10]}
    ];
    const p = atlas.clipPolygon(input);
    expect(p).toHaveLength(1);
    expect(p[0].rings).toHaveLength(1);
  });
}
test('A full generated horizon and a curved cut hole reconstruct an annulus', () => {
  const atlas = new GeographicCutAtlas(
    {
      boundaries: [{id: 'cap', normal: [0, 0, 1], offset: 0.8}],
      charts: [{id: 'annulus', center: [0, 0, 1], cuts: [{boundary: 'cap', side: -1}]}]
    },
    {edgeModel: 'rhumb'}
  );
  const p = atlas.clipPolygon([
    {positions: [-135, -20, -45, -20, 45, -20, 135, -20], pole: 'north'}
  ]);
  expect(p).toHaveLength(1);
  expect(p[0].rings).toHaveLength(2);
  expect(p[0].rings.every(r => r.edges.every(e => e.kind === 'boundary'))).toBe(true);
});
test('Repeated wound rhumb crossings retain every visible source interval', () => {
  const {atlas} = createOrthographicCutAtlas({viewDirection: [1, 0, 0], edgeModel: 'rhumb'});
  const parts = atlas.clipPolyline([0, 30, 0, 30], {longitudeTurns: [3]});
  expect(parts).toHaveLength(4);
  const total = parts
    .flatMap(p => p.edges)
    .reduce((s, e) => s + e.endFraction - e.startFraction, 0);
  expect(total).toBeCloseTo(0.5, 13);
});
test('Oblique ellipsoidal horizon obeys the independent projected quadric', () => {
  const a = 6378137,
    b = 6356752.314245179,
    view = [1, 2, 3] as const;
  const {atlas, project, right, up} = createOrthographicCutAtlas({
    viewDirection: view,
    edgeModel: 'rhumb'
  });
  const input = [{positions: [-135, -75, -45, -75, 45, -75, 135, -75], pole: 'north' as const}];
  const p = atlas.clipPolygon(input);
  expect(p.length).toBeGreaterThan(0);
  const u = right,
    w = up;
  const covariance = (s: number[], t: number[]) =>
    a * a * (s[0] * t[0] + s[1] * t[1]) + b * b * s[2] * t[2];
  const A = covariance(u, u),
    B = covariance(u, w),
    D = covariance(w, w),
    det = A * D - B * B;
  let boundary = 0;
  for (const polygon of p)
    for (const ring of polygon.rings) {
      const sampled = atlas.subdivideRing(input, ring, {
        transform: project,
        tolerance: 100,
        maxSegmentLength: 300000
      });
      for (let i = 0; i < sampled.edges.length; i++)
        if (sampled.edges[i].kind === 'boundary') {
          boundary++;
          const x = sampled.positions[2 * i],
            y = sampled.positions[2 * i + 1];
          expect(Math.abs((D * x * x - 2 * B * x * y + A * y * y) / det - 1)).toBeLessThan(2e-12);
        }
    }
  expect(boundary).toBeGreaterThan(8);
});

import {qualifyAtlas} from './atlas-qualification';
for (const row of qualifyAtlas())
  test(`${row.mode} ${row.id}`, () => expect(row.passed, JSON.stringify(row)).toBe(true));

import {
  createOctahedralCutAtlas,
  createOctahedralCutGraph,
  GeographicSeamError
} from '../src/geographic-atlas';
test('Faceted consumer projects all retained curves and shares every internal boundary', () => {
  const {atlas, project} = createOctahedralCutAtlas({edgeModel: 'geodesic'}),
    input = [{positions: [-60, -40, 60, -40, 60, 40, -60, 40]}];
  const edges = new Map<string, number>(),
    vertices = new Map<string, number[]>();
  for (const polygon of atlas.clipPolygon(input))
    for (const ring of polygon.rings) {
      const sampled = atlas.subdivideRing(input, ring, {
        transform: p => project(polygon.chart, p),
        tolerance: 1e-4,
        maxSegmentLength: 200000
      });
      expect(sampled.positions.every(Number.isFinite)).toBe(true);
      for (let i = 0; i < ring.edges.length; i++) {
        if (ring.edges[i].kind === 'boundary') {
          const key = [ring.vertexIds[i], ring.vertexIds[i + 1]].sort().join('|');
          edges.set(key, (edges.get(key) ?? 0) + 1);
        }
        const id = ring.vertexIds[i],
          n = Array.from(ring.normals.slice(3 * i, 3 * i + 3));
        if (vertices.has(id)) expect(n).toEqual(vertices.get(id));
        else vertices.set(id, n);
      }
    }
  expect(edges.size).toBeGreaterThan(0);
  expect(Array.from(edges.values()).every(n => n === 2)).toBe(true);
});
test('Cut graphs snapshot inputs and expose copies of metadata', () => {
  const graph = createOctahedralCutGraph(),
    before = JSON.stringify(graph),
    atlas = new GeographicCutAtlas(graph, {edgeModel: 'linear'});
  const options = {
    viewDirection: [1, 2, 3] as [number, number, number],
    edgeModel: 'linear' as const
  };
  const view = createOrthographicCutAtlas(options),
    expected = view.project([20, 30]);
  options.viewDirection.fill(0);
  view.right.fill(0);
  view.up.fill(0);
  view.viewDirection.fill(0);
  expect(view.project([20, 30])).toEqual(expected);
  const snapshot = atlas.graph;
  (snapshot.boundaries as {normal: number[]}[])[0].normal.fill(0);
  expect(JSON.stringify(graph)).toBe(before);
  expect(atlas.clipPolyline([0, 0])).toHaveLength(1);
  expect(atlas.clipPolyline([])).toEqual([]);
});
test('Coincident polygon boundaries retain the filled side; coincident lines have one owner', () => {
  const {atlas} = createOctahedralCutAtlas({edgeModel: 'linear'});
  const p = atlas.clipPolygon([{positions: [0, 0, 40, 0, 40, 40, 0, 40]}]);
  expect(p).toHaveLength(1);
  const line = atlas.clipPolyline([0, -20, 0, 20]);
  expect(
    line.flatMap(p => p.edges).reduce((s, e) => s + e.endFraction - e.startFraction, 0)
  ).toBeCloseTo(1, 13);
});
test('Graph validation, bounds and source ownership fail explicitly', () => {
  const options = {edgeModel: 'linear' as const};
  for (const graph of [
    {boundaries: [], charts: []},
    {
      boundaries: [{id: 'c', normal: [0, 0, 0] as const}],
      charts: [{id: 'a', center: [1, 0, 0] as const, cuts: []}]
    },
    {
      boundaries: [],
      charts: [
        {id: 'a', center: [1, 0, 0] as const, cuts: []},
        {id: 'b', center: [0, 1, 0] as const, cuts: []}
      ]
    },
    {
      boundaries: [
        {id: 'a', normal: [1, 0, 0] as const},
        {id: 'b', normal: [-1, 0, 0] as const}
      ],
      charts: [{id: 'a', center: [1, 0, 0] as const, cuts: []}]
    }
  ])
    expect(() => new GeographicCutAtlas(graph, options)).toThrow(GeographicSeamError);
  const input = [{positions: [-40, -40, 40, -40, 40, 40, -40, 40]}],
    before = JSON.stringify(input);
  const limited = createOrthographicCutAtlas({
    viewDirection: [1, 1, 1],
    edgeModel: 'geodesic',
    maxWork: 1
  }).atlas;
  expect(() => limited.clipPolygon(input)).toThrow();
  expect(JSON.stringify(input)).toBe(before);
  const {atlas, project} = createOrthographicCutAtlas({
      viewDirection: [1, 1, 1],
      edgeModel: 'geodesic'
    }),
    ring = atlas.clipPolygon(input)[0].rings[0];
  const expected = atlas.subdivideRing(input, ring, {transform: project, tolerance: 1000});
  let first = true;
  const actual = atlas.subdivideRing(input, ring, {
    transform: p => {
      if (first) {
        first = false;
        input[0].positions.fill(999);
        ring.positions.fill(999);
        ring.edges.length = 0;
      }
      return project(p);
    },
    tolerance: 1000
  });
  expect(actual.positions).toEqual(expected.positions);
});

test('Small-circle crossings preserve angular accuracy without near-one cancellation', () => {
  for (const offset of [0.9, 0.9999, 1 - 1e-8, 1 - 1e-12])
    for (const edgeModel of ['linear', 'geodesic', 'rhumb'] as const) {
      const atlas = new GeographicCutAtlas(
        {
          boundaries: [{id: 'cap', normal: [1, 0, 0], offset}],
          charts: [{id: 'cap', center: [1, 0, 0], cuts: [{boundary: 'cap', side: 1}]}]
        },
        {edgeModel, ellipsoid: {semiMajorAxis: 1, semiMinorAxis: 1}}
      );
      const p = atlas.clipPolyline([0, -40, 0, 40]);
      expect(p).toHaveLength(1);
      const expected = (Math.acos(offset) * 180) / Math.PI;
      expect(Math.abs(p[0].positions[1] + expected)).toBeLessThan(1e-10);
      expect(Math.abs(p[0].positions[p[0].positions.length - 1] - expected)).toBeLessThan(1e-10);
    }
});
test('A spherical geodesic coincident with an oblique horizon retains the whole line', () => {
  const rad = Math.PI / 180,
    first = [-30, 20],
    last = [40, 50],
    n = (p: number[]) => [
      Math.cos(p[1] * rad) * Math.cos(p[0] * rad),
      Math.cos(p[1] * rad) * Math.sin(p[0] * rad),
      Math.sin(p[1] * rad)
    ];
  const a = n(first),
    b = n(last),
    view: [number, number, number] = [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  const {atlas} = createOrthographicCutAtlas({
    viewDirection: view,
    edgeModel: 'geodesic',
    ellipsoid: {semiMajorAxis: 1, semiMinorAxis: 1}
  });
  const p = atlas.clipPolyline([...first, ...last]);
  expect(p).toHaveLength(1);
  expect(p[0].edges[0].startFraction).toBe(0);
  expect(p[0].edges[p[0].edges.length - 1].endFraction).toBe(1);
});

test('Closed wound lines keep changing attributes and resample through projection', () => {
  const input = [0, 30, 100, 0, 30, 200],
    options = {edgeModel: 'rhumb' as const, size: 3, boundaryAttributes: [0]},
    view = createOrthographicCutAtlas({...options, viewDirection: [0, 0, 1]});
  const parts = view.atlas.clipPolyline(input, {longitudeTurns: [3]});
  expect(parts).toHaveLength(1);
  const sampled = view.atlas.subdividePolyline(input, parts[0], {
    longitudeTurns: [3],
    transform: view.project,
    tolerance: 100,
    targetSize: 2,
    maxSegmentLength: 250000
  });
  expect(sampled.positions.every(Number.isFinite)).toBe(true);
  expect(sampled.sourcePositions[2]).toBe(100);
  expect(sampled.sourcePositions[sampled.sourcePositions.length - 1]).toBe(200);
  expect(sampled.edges.reduce((s, e) => s + e.endFraction - e.startFraction, 0)).toBeCloseTo(1, 13);
});
test('Concave inputs split into components and isolated contacts emit no line', () => {
  const {atlas} = createOrthographicCutAtlas({viewDirection: [0, 0, 1], edgeModel: 'linear'});
  const p = atlas.clipPolygon([
    {positions: [-40, -40, 40, -40, 40, 40, 20, 40, 20, -20, -20, -20, -20, 40, -40, 40]}
  ]);
  expect(p).toHaveLength(2);
  expect(atlas.clipPolyline([0, -20, 0, 0])).toEqual([]);
  expect(atlas.clipPolyline([0, 90, 30, 90])).toEqual([]);
});

test('Geodesic pole aliases keep the outgoing meridian and original fractions', () => {
  const {atlas} = createOrthographicCutAtlas({
    viewDirection: [1, 0, 1],
    edgeModel: 'geodesic',
    ellipsoid: {semiMajorAxis: 1, semiMinorAxis: 1}
  });
  const expected = (-Math.atan(Math.cos((40 * Math.PI) / 180)) * 180) / Math.PI;
  for (const longitude of [-170, 0, 40, 170]) {
    const p = atlas.clipPolyline([longitude, 90, 40, -60]);
    expect(p).toHaveLength(1);
    expect(Math.abs(p[0].positions[p[0].positions.length - 1] - expected)).toBeLessThan(1e-10);
    expect(
      Math.abs(p[0].edges[p[0].edges.length - 1].endFraction - (90 - expected) / 150)
    ).toBeLessThan(2e-13);
  }
});
