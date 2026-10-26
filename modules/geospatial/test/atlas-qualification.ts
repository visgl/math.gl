// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  GeographicCutAtlas,
  createOrthographicCutAtlas,
  type GeographicCutGraph
} from '../src/geographic-atlas';
import reference from './geographic-atlas-reference.json';
export const provenance = reference.provenance;
export function octantGraph(): GeographicCutGraph {
  const boundaries = [
      {id: 'x', normal: [1, 0, 0] as const},
      {id: 'y', normal: [0, 1, 0] as const},
      {id: 'z', normal: [0, 0, 1] as const}
    ],
    charts = [];
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
  return {boundaries, charts};
}
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const determinant = (a: number[], b: number[], c: number[]) =>
  a[0] * (b[1] * c[2] - b[2] * c[1]) +
  a[1] * (b[2] * c[0] - b[0] * c[2]) +
  a[2] * (b[0] * c[1] - b[1] * c[0]);
function sphereArea(flat: ArrayLike<number>) {
  const points = Array.from({length: flat.length / 3}, (_, i) =>
    Array.from(flat).slice(3 * i, 3 * i + 3)
  );
  let sum = 0;
  for (let i = 2; i < points.length; i++) {
    const a = points[0],
      b = points[i - 1],
      c = points[i];
    sum += 2 * Math.atan2(determinant(a, b, c), 1 + dot(a, b) + dot(b, c) + dot(c, a));
  }
  return sum;
}
function sphereNormals(flat: number[]) {
  return flat.flatMap((x, i) =>
    i % 2
      ? []
      : [
          Math.cos((flat[i + 1] * Math.PI) / 180) * Math.cos((x * Math.PI) / 180),
          Math.cos((flat[i + 1] * Math.PI) / 180) * Math.sin((x * Math.PI) / 180),
          Math.sin((flat[i + 1] * Math.PI) / 180)
        ]
  );
}
export function qualifyAtlas() {
  const rows: {id: number; mode: string; passed: boolean; budgetUsage: number; error: string}[] =
    [];
  const run = (mode: string, job: (check: (e: number, b: number) => void) => void) => {
    let usage = 0,
      error = '';
    try {
      job((e, b) => {
        usage = Math.max(usage, e / b);
      });
    } catch (e) {
      usage = Infinity;
      error = String(e);
    }
    rows.push({
      id: rows.length,
      mode,
      passed: Number.isFinite(usage) && usage <= 1,
      budgetUsage: usage,
      error
    });
  };
  for (const r of reference.rows)
    run('native ' + r.edgeModel, check => {
      const atlas = new GeographicCutAtlas(
        {
          boundaries: [{id: 'cut', normal: r.view as [number, number, number], offset: r.offset}],
          charts: [
            {
              id: 'test',
              center: r.view as [number, number, number],
              cuts: [{boundary: 'cut', side: 1}]
            }
          ]
        },
        {
          edgeModel: r.edgeModel as 'geodesic' | 'rhumb',
          ellipsoid: {semiMajorAxis: r.axes[0], semiMinorAxis: r.axes[1]}
        }
      );
      const parts = atlas.clipPolyline([...r.start, ...r.end], {longitudeTurns: [r.turns]});
      const fragments = parts
          .flatMap(p =>
            p.edges.map((e, i) => ({
              lo: e.startFraction,
              hi: e.endFraction,
              a: Array.from(p.positions.slice(2 * i, 2 * i + 2)),
              b: Array.from(p.positions.slice(2 * i + 2, 2 * i + 4))
            }))
          )
          .sort((a, b) => a.lo - b.lo),
        merged: typeof fragments = [];
      for (const p of fragments) {
        const last = merged[merged.length - 1];
        if (last && Math.abs(last.hi - p.lo) < 2e-14) {
          last.hi = p.hi;
          last.b = p.b;
        } else merged.push({...p});
      }
      check(Math.abs(merged.length - r.expected.intervals.length), 0.5);
      r.expected.intervals.forEach((e, i) => {
        const p = merged[i];
        if (!p) throw new Error('Missing native interval');
        check((Math.abs(p.lo - e[0]) * r.expected.distance) / r.axes[0], 2e-12);
        check((Math.abs(p.hi - e[1]) * r.expected.distance) / r.axes[0], 2e-12);
        for (const [point, lat, lon] of [
          [p.a, e[2], e[3]],
          [p.b, e[4], e[5]]
        ] as [number[], number, number][]) {
          check(Math.abs(point[1] - lat), 1e-10);
          const delta = ((((point[0] - lon) % 360) + 540) % 360) - 180;
          check(Math.abs(delta * Math.cos((lat * Math.PI) / 180)), 1e-10);
        }
      });
    });
  for (const hole of [false, true])
    run('independent spherical atlas area', check => {
      const input = [
        {positions: [-60, -40, 60, -40, 60, 40, -60, 40]},
        ...(hole ? [{positions: [-10, -10, 10, -10, 10, 10, -10, 10]}] : [])
      ];
      const atlas = new GeographicCutAtlas(octantGraph(), {
          edgeModel: 'geodesic',
          ellipsoid: {semiMajorAxis: 1, semiMinorAxis: 1}
        }),
        pieces = atlas.clipPolygon(input);
      const expected =
        sphereArea(sphereNormals(input[0].positions)) -
        (hole ? sphereArea(sphereNormals(input[1].positions)) : 0);
      check(
        Math.abs(
          pieces.reduce(
            (sum, p) => sum + p.rings.reduce((s, r) => s + sphereArea(r.normals), 0),
            0
          ) - expected
        ),
        2e-12
      );
      const vertices = new Map<string, number[]>();
      for (const p of pieces)
        for (const r of p.rings)
          for (let i = 0; i < r.vertexIds.length; i++) {
            const n = Array.from(r.normals.slice(i * 3, i * 3 + 3)),
              prior = vertices.get(r.vertexIds[i]);
            if (prior) check(Math.hypot(...n.map((x, j) => x - prior[j])), 1e-15);
            else vertices.set(r.vertexIds[i], n);
          }
    });
  for (const view of [
    [1, 2, 3],
    [2, -1, 0.5],
    [-1, 0, 0],
    [0, 0, 1]
  ] as [number, number, number][])
    run('independent ellipsoid silhouette', check => {
      const a = 6378137,
        b = 6356752.314245179,
        {
          atlas,
          project,
          right: u,
          up: v
        } = createOrthographicCutAtlas({viewDirection: view, edgeModel: 'rhumb'}),
        inputs = [{positions: [-135, -80, -45, -80, 45, -80, 135, -80], pole: 'north' as const}];
      const cov = (s: number[], t: number[]) =>
          a * a * (s[0] * t[0] + s[1] * t[1]) + b * b * s[2] * t[2],
        A = cov(u, v),
        B = cov(u, u),
        D = cov(v, v),
        det = B * D - A * A;
      let count = 0;
      for (const p of atlas.clipPolygon(inputs))
        for (const r of p.rings) {
          const sampled = atlas.subdivideRing(inputs, r, {
            transform: project,
            tolerance: 100,
            maxSegmentLength: 250000
          });
          for (let i = 0; i < sampled.edges.length; i++)
            if (sampled.edges[i].kind === 'boundary') {
              count++;
              const x = sampled.positions[2 * i],
                y = sampled.positions[2 * i + 1];
              check(Math.abs((D * x * x - 2 * A * x * y + B * y * y) / det - 1), 2e-12);
            }
        }
      if (!count) throw new Error('Missing silhouette');
    });
  for (const offset of [0.9, 0.9999, 1 - 1e-8, 1 - 1e-12])
    for (const edgeModel of ['linear', 'geodesic', 'rhumb'] as const)
      run('independent small-cap ' + edgeModel, check => {
        const atlas = new GeographicCutAtlas(
            {
              boundaries: [{id: 'cap', normal: [1, 0, 0], offset}],
              charts: [{id: 'cap', center: [1, 0, 0], cuts: [{boundary: 'cap', side: 1}]}]
            },
            {edgeModel, ellipsoid: {semiMajorAxis: 1, semiMinorAxis: 1}}
          ),
          parts = atlas.clipPolyline([0, -40, 0, 40]),
          latitude = (Math.acos(offset) * 180) / Math.PI;
        check(Math.abs(parts.length - 1), 0.5);
        if (parts.length !== 1) throw new Error('Missing small cap');
        check(Math.abs(parts[0].positions[1] + latitude), 1e-10);
        check(Math.abs(parts[0].positions[parts[0].positions.length - 1] - latitude), 1e-10);
        check(Math.abs(parts[0].edges[0].startFraction - (40 - latitude) / 80), 2e-13);
      });
  run('independent nested atlas topology', check => {
    const phi = (70 * Math.PI) / 180,
      offset = Math.cos((17 * Math.PI) / 180),
      boundaries = [0, 90, 180, 270].map((lon, i) => ({
        id: 'cap' + i,
        normal: [
          Math.cos(phi) * Math.cos((lon * Math.PI) / 180),
          Math.cos(phi) * Math.sin((lon * Math.PI) / 180),
          Math.sin(phi)
        ] as [number, number, number],
        offset
      }));
    const atlas = new GeographicCutAtlas(
        {
          boundaries,
          charts: [
            {
              id: 'nested',
              center: [0, 0, 1],
              cuts: boundaries.map(b => ({boundary: b.id, side: -1 as const}))
            }
          ]
        },
        {edgeModel: 'rhumb'}
      ),
      polygons = atlas.clipPolygon([
        {positions: [-135, -20, -45, -20, 45, -20, 135, -20], pole: 'north'}
      ]);
    check(Math.abs(polygons.length - 2), 0.5);
    check(Math.abs(polygons.reduce((s, p) => s + p.rings.length, 0) - 3), 0.5);
    check(Math.abs(polygons.filter(p => p.rings.length === 2).length - 1), 0.5);
  });
  return rows;
}
