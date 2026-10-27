// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original directed curved-edge reconstruction in a bounded normal-sphere chart.
import {Context} from '../geographic-seams/edge';
import {GeographicSeamError} from '../geographic-seams/types';
import {
  circle,
  dot,
  unit,
  cross,
  add,
  scale,
  chartPoint,
  chartNormal,
  ANGULAR,
  type V,
  type ChartFrame
} from './math';
import {roots, sliceCurve, type Curve} from './curves';
import type {GeographicAtlasEdge, GeographicAtlasPolygon} from './types';
export type Node = {id: string; n: V; p: number[]; cuts: Set<string>};
export type Arc = {
  a: Node;
  b: Node;
  curve: Curve;
  descriptor: GeographicAtlasEdge;
  coincident?: Set<string>;
};
export function reverseArc(e: Arc): Arc {
  const d = e.descriptor;
  return {
    coincident: e.coincident,
    a: e.b,
    b: e.a,
    curve: sliceCurve(e.curve, 1, 0),
    descriptor:
      d.kind === 'source'
        ? {
            kind: 'source',
            source: {
              ...d.source,
              startFraction: d.source.endFraction,
              endFraction: d.source.startFraction
            }
          }
        : {...d, startAngle: d.endAngle, endAngle: d.startAngle}
  };
}
function crossings(
  edges: readonly Arc[],
  y: number,
  frame: ChartFrame,
  context: Context
): {x: number; sign: number}[] {
  const direction = frame.v.map((x, i) => x - y * frame.center[i]) as V,
    m = Math.hypot(...direction),
    query = circle('ray', unit(direction), y / m),
    result: {x: number; sign: number}[] = [];
  for (const edge of edges) {
    const hits = roots(edge.curve, query, context);
    if (hits.coincident)
      throw new GeographicSeamError('precision', 'Interior ray coincides with a boundary');
    for (const t of hits.fractions) {
      // Interior rays are selected away from graph vertices.
      const n = edge.curve.sample(t),
        v = dot(direction, edge.curve.derivative(t));
      if (v === 0 || (t === 0 && v < 0) || (t === 1 && v > 0)) continue;
      result.push({x: chartPoint(frame, normalOf(n))[0], sign: Math.sign(v)});
    }
  }
  return result.sort((a, b) => a.x - b.x);
}
import {normal as normalOf} from './math';
function winding(edges: readonly Arc[], n: V, frame: ChartFrame, context: Context): number {
  const [x, y] = chartPoint(frame, n);
  return crossings(edges, y, frame, context).reduce((s, p) => s + (p.x > x ? p.sign : 0), 0);
}
function orientation(edges: readonly Arc[], frame: ChartFrame, context: Context): number {
  const ys = Array.from(new Set(edges.map(e => chartPoint(frame, e.a.n)[1]))).sort((a, b) => a - b);
  const bands = ys
    .slice(1)
    .map((y, i) => [ys[i], y])
    .sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
  for (const [lo, hi] of bands) {
    if (hi - lo < 1e-11) continue;
    const hits = crossings(edges, (lo + hi) / 2, frame, context);
    for (let i = 1; i < hits.length; i++)
      if (hits[i].x - hits[i - 1].x > 1e-11) {
        const n = chartNormal(frame, (hits[i].x + hits[i - 1].x) / 2, (lo + hi) / 2),
          w = winding(edges, n, frame, context);
        if (w) return Math.sign(w);
      }
  }
  // Vertices alone do not bound a curved edge's projected extent. A regular
  // point on any simple boundary has an open interior on one of its two sides.
  // Probe both sides and use curved-edge winding to verify the witness.
  for (const edge of edges)
    for (const t of [0.371, 0.613, 0.5]) {
      context.tick();
      const n = normalOf(edge.curve.sample(t)),
        left = cross(n, edge.curve.derivative(t));
      if (Math.hypot(...left) === 0) continue;
      const direction = unit(left);
      for (let epsilon = 0.0625; epsilon >= ANGULAR; epsilon /= 4)
        for (const side of [1, -1]) {
          context.tick();
          const probe = unit(add(n, scale(direction, side * epsilon)));
          try {
            const w = winding(edges, probe, frame, context);
            if (w) return Math.sign(w);
          } catch (error) {
            if (!(error instanceof GeographicSeamError) || error.reason !== 'precision')
              throw error;
          }
        }
    }
  throw new GeographicSeamError('precision', 'No resolvable chart-ring interior');
}
export function polygons(
  arcs: Arc[],
  frame: ChartFrame,
  chart: string,
  sign: number,
  context: Context
): GeographicAtlasPolygon[] {
  const outgoing = new Map<string, number>(),
    incoming = new Map<string, number>();
  for (let i = 0; i < arcs.length; i++) {
    context.tick();
    const e = arcs[i];
    if (e.a.id === e.b.id) throw new GeographicSeamError('topology', 'Collapsed atlas arc');
    if (outgoing.has(e.a.id) || incoming.has(e.b.id))
      throw new GeographicSeamError('topology', 'Touching or unresolved atlas boundaries');
    outgoing.set(e.a.id, i);
    incoming.set(e.b.id, i);
  }
  for (const key of outgoing.keys())
    if (!incoming.has(key)) throw new GeographicSeamError('topology', 'Open atlas boundary');
  const cycles: Arc[][] = [],
    used = new Set<number>();
  for (let i = 0; i < arcs.length; i++)
    if (!used.has(i)) {
      const cycle: Arc[] = [];
      let k = i;
      do {
        context.tick();
        if (used.has(k) || k === undefined)
          throw new GeographicSeamError('topology', 'Invalid atlas cycle');
        used.add(k);
        const e = arcs[k];
        cycle.push(e);
        k = outgoing.get(e.b.id);
      } while (k !== i);
      cycles.push(cycle);
    }
  const parents = cycles.map((c, i) => {
    const containers: number[] = [];
    for (let j = 0; j < cycles.length; j++)
      if (i !== j && winding(cycles[j], normalOf(c[0].curve.sample(0.371)), frame, context))
        containers.push(j);
    return containers;
  });
  const result: GeographicAtlasPolygon[] = [],
    groups = new Map<number, GeographicAtlasPolygon>();
  const output = (c: Arc[], wanted: number) => {
    if (orientation(c, frame, context) !== wanted) c = c.slice().reverse().map(reverseArc);
    const vertices = [...c.map(e => e.a), c[0].a];
    context.addVertices(vertices.length);
    return {
      positions: new Float64Array(vertices.flatMap(n => n.p)),
      normals: new Float64Array(vertices.flatMap(n => n.n)),
      vertexIds: vertices.map(n => n.id),
      edges: c.map(e => e.descriptor)
    };
  };
  const depths = parents.map(p => p.length);
  for (let i = 0; i < cycles.length; i++) {
    const expected = depths[i] % 2 === 0 ? 1 : -1;
    if (orientation(cycles[i], frame, context) !== expected)
      throw new GeographicSeamError('topology', 'Inconsistent nested atlas winding');
    if (expected === 1) {
      const p = {chart, rings: [output(cycles[i], sign)]};
      result.push(p);
      groups.set(i, p);
    }
  }
  for (let i = 0; i < cycles.length; i++)
    if (depths[i] % 2 === 1) {
      const immediate = parents[i].filter(j => depths[j] === depths[i] - 1);
      if (immediate.length !== 1 || !groups.has(immediate[0]))
        throw new GeographicSeamError('topology', 'Unresolved atlas ring hierarchy');
      groups.get(immediate[0])!.rings.push(output(cycles[i], -sign));
    }
  return result;
}
