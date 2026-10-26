// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original shared cut-circle graph and ellipsoidal source topology. Existing solvers retain GeographicLib/PROJ SPDX and packaged notices.
import {Context, createEdges, type Edge} from '../geographic-seams/edge';
import {cutOptions} from '../geographic-seams/cut-options';
import {prepare, filled, interior} from '../geographic-seams/polygon';
import {GeographicSeamError, type GeographicPolygonRing} from '../geographic-seams/types';
import {sourceCurve, roots, sliceCurve, circleCurve, type Curve} from './curves';
import {
  unit,
  normal,
  position,
  basis,
  circle,
  angle,
  onCircle,
  intersections,
  project,
  dot,
  value,
  valueError,
  cross,
  TAU,
  ANGULAR,
  type V,
  type Circle,
  type ChartFrame
} from './math';
import {polygons, reverseArc, type Arc, type Node} from './topology';
import type {
  GeographicCutGraph,
  GeographicAtlasBoundary,
  GeographicAtlasOptions,
  GeographicAtlasEdge,
  GeographicAtlasPolyline,
  GeographicAtlasPolygon
} from './types';
import {
  subdivideAtlasRing,
  type AtlasSubdivisionOptions,
  type SubdividedAtlasRing,
  type SubdividedAtlasPolyline
} from './sampling';
import type {GeographicAtlasRing} from './types';
type Cell = ChartFrame & {id: string; cuts: {circle: Circle; side: 1 | -1}[]};
type Source = {edge: Edge; curve: Curve; reversed: boolean};
const key = (n: V) => n.map(x => (x === 0 ? 0 : x)).join(',');
function fail(message: string): never {
  throw new GeographicSeamError('input', message);
}
// Latitude extrema and pole aliases belong to the membership chart, not to
// the cut graph's original-edge identity. Rejoin them before finding events.
function mergeEdges(edges: readonly Edge[]): Edge[] {
  const groups = new Map<string, Edge[]>();
  for (const e of edges)
    if (e.source) {
      const k = e.source.ringIndex + ':' + e.source.edgeIndex;
      const list = groups.get(k) ?? [];
      list.push(e);
      groups.set(k, list);
    }
  return Array.from(groups.values(), pieces => {
    const first = pieces[0],
      last = pieces[pieces.length - 1];
    if (pieces.length === 1) return first;
    return {
      a: first.a,
      b: last.b,
      source: {...first.source!, startFraction: 0, endFraction: 1},
      sample: (t: number) => {
        const part = pieces.find(p => t >= p.source!.startFraction && t <= p.source!.endFraction);
        if (!part) throw new GeographicSeamError('precision', 'Missing source curve interval');
        return part.sample(
          (t - part.source!.startFraction) / (part.source!.endFraction - part.source!.startFraction)
        );
      }
    };
  });
}
export class GeographicCutAtlas {
  private readonly config: ReturnType<typeof cutOptions>;
  private readonly boundaries: Circle[] = [];
  private readonly cells: Cell[] = [];
  private readonly attributes: number[];
  private readonly declaredIds = new Set<string>();
  constructor(graph: GeographicCutGraph, options: GeographicAtlasOptions) {
    this.config = cutOptions({...options, latitudeRange: [-90, 90]});
    new Context(this.config.options);
    this.attributes = options.boundaryAttributes ? Array.from(options.boundaryAttributes) : [];
    if (
      this.attributes.length !== (options.size ?? 2) - 2 ||
      !this.attributes.every(Number.isFinite)
    )
      fail('Supply boundaryAttributes for every extra coordinate');
    if (
      !Array.isArray(graph.boundaries) ||
      !Array.isArray(graph.charts) ||
      graph.boundaries.length > 64 ||
      graph.charts.length < 1 ||
      graph.charts.length > 64
    )
      fail('Expected 1–64 charts and at most 64 declared cuts');
    const byId = new Map<string, Circle>();
    const id = (s: string) =>
      typeof s === 'string' && s.length > 0 && s.length <= 128 && !s.startsWith('@');
    for (const input of graph.boundaries) {
      if (!id(input.id) || byId.has(input.id))
        fail('Cut IDs must be unique nonempty names without @');
      const n = unit(input.normal),
        c = input.offset ?? 0;
      if (!Number.isFinite(c) || Math.abs(c) >= 1 || Math.sqrt((1 - c) * (1 + c)) < 1e-6)
        fail('Cut circle outside the resolved radius profile');
      for (const prior of this.boundaries)
        if (
          Math.hypot(...cross(n, prior.normal)) === 0 &&
          c === dot(n, prior.normal) * prior.offset
        )
          fail('Coincident boundaries must share one ID');
      const cut = circle(input.id, n, c);
      this.declaredIds.add(cut.id);
      byId.set(cut.id, cut);
      this.boundaries.push(cut);
    }
    const chartIds = new Set<string>();
    for (const input of graph.charts) {
      if (
        !id(input.id) ||
        chartIds.has(input.id) ||
        !Array.isArray(input.cuts) ||
        input.cuts.length > 64
      )
        fail('Invalid chart ID or cut list');
      chartIds.add(input.id);
      const center = unit(input.center),
        [u, v] = basis(center),
        cuts: Cell['cuts'] = [],
        seen = new Set<string>();
      for (const ref of input.cuts) {
        const cut = byId.get(ref.boundary);
        if (!cut || seen.has(cut.id) || (ref.side !== 1 && ref.side !== -1))
          fail('Invalid chart boundary reference');
        seen.add(cut.id);
        cuts.push({circle: cut, side: ref.side});
      }
      let cap = this.boundaries.find(
        b => b.offset === 0 && Math.hypot(...cross(b.normal, center)) === 0
      );
      if (!cap) {
        cap = circle('@hemisphere:' + input.id, center, 0);
        this.boundaries.push(cap);
        byId.set(cap.id, cap);
      }
      const side = dot(cap.normal, center) > 0 ? 1 : -1;
      if (seen.has(cap.id)) {
        if (cuts.find(c => c.circle === cap)!.side !== side)
          fail('Chart cuts exclude its center hemisphere');
      } else cuts.push({circle: cap, side});
      this.cells.push({id: input.id, center, u, v, cuts});
    }
    for (let i = 0; i < this.cells.length; i++)
      for (let j = 0; j < i; j++) {
        if (
          !this.cells[i].cuts.some(a =>
            this.cells[j].cuts.some(b => a.circle === b.circle && a.side !== b.side)
          )
        )
          fail(
            'Atlas cells need an oppositely oriented shared separator; overlapping interiors are unsupported'
          );
      }
  }

  /** Reconstructible snapshot of the declared graph. */
  get graph(): GeographicCutGraph {
    return {
      boundaries: this.boundaries
        .filter(b => this.declaredIds.has(b.id))
        .map(b => ({
          id: b.id,
          normal: [...b.normal] as V,
          offset: b.offset
        })),
      charts: this.cells.map(c => ({
        id: c.id,
        center: [...c.center] as V,
        cuts: c.cuts
          .filter(r => this.declaredIds.has(r.circle.id))
          .map(r => ({boundary: r.circle.id, side: r.side}))
      }))
    };
  }
  /** Includes implicit hemispheres used by generated boundary descriptors. */
  get boundaryDefinitions(): GeographicAtlasBoundary[] {
    return this.boundaries.map(b => ({id: b.id, normal: [...b.normal] as V, offset: b.offset}));
  }
  /** Candidate adjacency across shared cuts; disjoint arc extents are still chart-specific. */
  get adjacency(): {boundary: string; positive: string[]; negative: string[]}[] {
    return this.boundaries
      .filter(b => this.declaredIds.has(b.id))
      .map(b => ({
        boundary: b.id,
        positive: this.cells
          .filter(c => c.cuts.some(r => r.circle === b && r.side === 1))
          .map(c => c.id),
        negative: this.cells
          .filter(c => c.cuts.some(r => r.circle === b && r.side === -1))
          .map(c => c.id)
      }))
      .filter(r => r.positive.length && r.negative.length);
  }
  private sources(
    inputs: readonly GeographicPolygonRing[],
    context: Context
  ): {sources: Source[]; rings: ReturnType<typeof prepare>[]; sign: number} {
    const originals = inputs.map(r => context.read(r.positions));
    const snapshots = inputs.map((r, i) => ({
      ...r,
      positions: originals[i].flat(),
      longitudeTurns: r.longitudeTurns ? Array.from(r.longitudeTurns) : undefined,
      poleAttributes: r.poleAttributes ? Array.from(r.poleAttributes) : undefined
    }));
    const rings = snapshots.map((r, i) => prepare(r, i, context));
    if (!rings.length) return {sources: [], rings, sign: 1};
    const sign = interior(rings[0].membership, context).sign,
      sources: Source[] = [];
    for (let i = 0; i < rings.length; i++) {
      const orientation = interior(rings[i].membership, context).sign,
        reversed = orientation !== (i ? -1 : 1),
        points = originals[i];
      if (
        points.length > 1 &&
        points[0][0] === points[points.length - 1][0] &&
        points[0][1] === points[points.length - 1][1]
      )
        points.pop();
      for (const edge of mergeEdges(rings[i].edges)) {
        const index = edge.source!.edgeIndex;
        sources.push({
          edge,
          curve: sourceCurve(
            edge,
            context,
            this.config.axes.semiMajorAxis,
            this.config.axes.semiMinorAxis,
            [points[index], points[(index + 1) % points.length]]
          ),
          reversed
        });
      }
    }
    return {sources, rings, sign};
  }
  /** Clip simple original outer+hole rings to every chart. Shared events are computed once. */
  clipPolygon(inputs: readonly GeographicPolygonRing[]): GeographicAtlasPolygon[] {
    const context = new Context(this.config.options),
      {sources, rings, sign} = this.sources(inputs, context);
    if (!rings.length) return [];
    return this.clip(
      sources,
      context,
      (n: V) => filled(rings, position(n), context),
      sign
    ) as GeographicAtlasPolygon[];
  }
  clipPolyline(
    input: ArrayLike<number>,
    options: {longitudeTurns?: readonly number[]} = {}
  ): GeographicAtlasPolyline[] {
    const context = new Context(this.config.options),
      points = context.read(input),
      turns = options.longitudeTurns
        ? Array.from(options.longitudeTurns)
        : new Array(Math.max(0, points.length - 1)).fill(0);
    if (turns.length !== Math.max(0, points.length - 1))
      fail('Expected one turn count per line edge');
    if (!points.length) return [];
    if (points.length === 1) {
      const n = normal(points[0]),
        cell = this.cells.find(c =>
          c.cuts.every(r => r.side * value(r.circle, n) >= -valueError(r.circle, n))
        );
      return cell
        ? [
            {
              chart: cell.id,
              positions: new Float64Array(position(n, points[0].slice(2))),
              normals: new Float64Array(n),
              vertexIds: ['v0'],
              edges: []
            }
          ]
        : [];
    }
    const sources: Source[] = [];
    let cursor = points[0];
    for (let i = 1; i < points.length; i++) {
      const pieces = createEdges(cursor, points[i], points[i - 1], i - 1, 0, turns[i - 1], context);
      for (const edge of mergeEdges(pieces))
        sources.push({
          edge,
          curve: sourceCurve(
            edge,
            context,
            this.config.axes.semiMajorAxis,
            this.config.axes.semiMinorAxis,
            [points[i - 1], points[i]]
          ),
          reversed: false
        });
      cursor = pieces[pieces.length - 1].b;
    }
    return this.clip(sources, context) as GeographicAtlasPolyline[];
  }
  private clip(
    sources: Source[],
    context: Context,
    contains?: (n: V) => boolean,
    sign = 1
  ): GeographicAtlasPolygon[] | GeographicAtlasPolyline[] {
    const registry = new Map<string, Node & {source?: boolean}>(),
      events = new Map(this.boundaries.map(c => [c.id, new Set<Node>()]));
    let serial = 0;
    const node = (n: V, attributes: readonly number[], source = false): Node => {
      const k = key(n) + (!contains && source ? '|' + attributes.join(',') : ''),
        previous = registry.get(k);
      if (previous) {
        if (source && previous.source && attributes.some((x, i) => x !== previous.p[i + 2]))
          throw new GeographicSeamError('topology', 'Shared source vertex attributes disagree');
        if (source && !previous.source) {
          previous.p = position(n, attributes);
          previous.source = true;
        }
        return previous;
      }
      context.addVertices(1);
      const p = {
        id: 'v' + serial++,
        n,
        p: position(n, attributes),
        cuts: new Set<string>(),
        source
      };
      registry.set(k, p);
      return p;
    };
    const on = (n: Node, b: Circle) => {
      n.cuts.add(b.id);
      events.get(b.id)!.add(n);
    };
    const relevant = (ids: readonly string[], n: V) =>
      this.cells.some(c => {
        context.tick();
        return (
          ids.every(id => c.cuts.some(r => r.circle.id === id)) &&
          c.cuts.every(r => {
            context.tick();
            return r.side * value(r.circle, n) >= -valueError(r.circle, n);
          })
        );
      });
    for (let i = 0; i < this.boundaries.length; i++)
      for (let j = 0; j < i; j++) {
        context.tick();
        for (const n of intersections(this.boundaries[i], this.boundaries[j])) {
          if (!relevant([this.boundaries[i].id, this.boundaries[j].id], n)) continue;
          const v = node(n, this.attributes);
          on(v, this.boundaries[i]);
          on(v, this.boundaries[j]);
        }
      }
    const sourceArcs: Arc[] = [];
    for (const {edge, curve, reversed} of sources) {
      const endpoints = [
          node(normal(edge.a), edge.a.slice(2), true),
          node(normal(edge.b), edge.b.slice(2), true)
        ],
        at = new Map<number, Node>([
          [0, endpoints[0]],
          [1, endpoints[1]]
        ]),
        coincident = new Set<string>();
      for (const b of this.boundaries) {
        const hit = roots(curve, b, context);
        if (hit.coincident) {
          coincident.add(b.id);
          on(endpoints[0], b);
          on(endpoints[1], b);
          continue;
        }
        for (const t of hit.fractions) {
          const p = curve.sample(t),
            n = project(b, normal(p));
          if (!relevant([b.id], n)) continue;
          let v = at.get(t);
          if (!v) {
            v = node(n, p.slice(2), true);
            at.set(t, v);
          }
          on(v, b);
        }
        for (const v of endpoints) if (value(b, v.n) === 0) on(v, b);
      }
      if (
        !contains &&
        Math.hypot(...endpoints[0].n.map((x, i) => x - endpoints[1].n[i])) === 0 &&
        curve.speed > ANGULAR
      ) {
        const steps = Math.max(4, Math.ceil(curve.speed / (Math.PI / 2)));
        if (steps > context.maxVertices)
          throw new GeographicSeamError('limit', 'Too many closed-line samples');
        for (let i = 1; i < steps; i++) {
          context.tick();
          const t = i / steps,
            p = curve.sample(t);
          if (!at.has(t)) at.set(t, node(normal(p), p.slice(2), true));
        }
      }
      const fractions = Array.from(at.keys()).sort((a, b) => a - b);
      for (let i = 1; i < fractions.length; i++) {
        const lo = fractions[i - 1],
          hi = fractions[i],
          a = at.get(lo)!,
          b = at.get(hi)!;
        if (a.id === b.id) {
          if (lo !== hi && curve.speed * (hi - lo) > ANGULAR)
            throw new GeographicSeamError('precision', 'Unresolved source loop');
          continue;
        }
        const descriptor: GeographicAtlasEdge = {
          kind: 'source',
          source: {
            ringIndex: edge.source!.ringIndex,
            edgeIndex: edge.source!.edgeIndex,
            startFraction:
              edge.source!.startFraction +
              (edge.source!.endFraction - edge.source!.startFraction) * lo,
            endFraction:
              edge.source!.startFraction +
              (edge.source!.endFraction - edge.source!.startFraction) * hi
          }
        };
        let arc: Arc = {a, b, curve: sliceCurve(curve, lo, hi), descriptor, coincident};
        if (reversed) arc = reverseArc(arc);
        // Coincidence is carried by both endpoints, but ordinary crossings are not.
        for (const id of coincident) {
          arc.a.cuts.add(id);
          arc.b.cuts.add(id);
        }
        sourceArcs.push(arc);
      }
    }
    // Auxiliary quarter points never create a second representation of an existing event.
    for (const b of this.boundaries)
      for (let i = 0; i < 4; i++) {
        const n = onCircle(b, (i * TAU) / 4);
        if (
          Array.from(events.get(b.id)!).some(
            v => Math.hypot(...v.n.map((x, j) => x - n[j])) < ANGULAR
          )
        )
          continue;
        const v = node(n, this.attributes);
        on(v, b);
      }
    const accepts = (cell: Cell, n: V, known?: Set<string>) => {
      const values = cell.cuts
        .filter(r => !known?.has(r.circle.id))
        .map(r => {
          context.tick();
          return {f: r.side * value(r.circle, n), error: valueError(r.circle, n)};
        });
      if (values.some(v => v.f < -v.error)) return false;
      if (values.some(v => Math.abs(v.f) <= v.error))
        throw new GeographicSeamError('precision', 'Unresolved chart-side classification');
      return true;
    };
    const result: GeographicAtlasPolygon[] | GeographicAtlasPolyline[] = [];
    for (const cell of this.cells) {
      const arcs: Arc[] = [];
      for (const arc of sourceArcs) {
        context.tick();
        const n = normal(arc.curve.sample(0.5));
        if (!accepts(cell, n, arc.coincident)) continue;
        // A coincident polygon source edge belongs only to its retained filled side.
        if (
          contains &&
          cell.cuts.some(
            r =>
              arc.coincident?.has(r.circle.id) &&
              r.side * dot(r.circle.normal, cross(n, arc.curve.derivative(0.5))) < 0
          )
        )
          continue;
        if (!contains) {
          const coincident = cell.cuts.filter(r => arc.coincident?.has(r.circle.id));
          if (coincident.length) {
            const owner = this.cells.find(c => accepts(c, n, arc.coincident));
            if (owner !== cell) continue;
          }
        }
        arcs.push(arc);
      }
      if (!contains) {
        const parts: {vertices: Node[]; edges: GeographicAtlasPolyline['edges']}[] = [];
        for (const e of arcs) {
          context.tick();
          const previous = parts[parts.length - 1],
            s = e.descriptor;
          if (s.kind !== 'source') continue;
          if (previous && previous.vertices[previous.vertices.length - 1].id === e.a.id) {
            previous.vertices.push(e.b);
            previous.edges.push({...s.source});
          } else parts.push({vertices: [e.a, e.b], edges: [{...s.source}]});
        }
        (result as GeographicAtlasPolyline[]).push(
          ...parts.map(p => ({
            chart: cell.id,
            positions: new Float64Array(p.vertices.flatMap(n => n.p)),
            normals: new Float64Array(p.vertices.flatMap(n => n.n)),
            vertexIds: p.vertices.map(n => n.id),
            edges: p.edges
          }))
        );
        continue;
      }
      for (const ref of cell.cuts) {
        const b = ref.circle,
          list = Array.from(events.get(b.id)!)
            .map(n => ({n, angle: angle(b, n.n)}))
            .sort((a, b) => a.angle - b.angle);
        for (let i = 0; i < list.length; i++) {
          context.tick();
          const a = list[i],
            end = list[(i + 1) % list.length],
            hi = end.angle + (i === list.length - 1 ? TAU : 0),
            delta = hi - a.angle;
          if (delta * b.radius < ANGULAR) {
            if (a.n.id !== end.n.id)
              throw new GeographicSeamError('precision', 'Unresolved cut-graph event separation');
            continue;
          }
          const midpoint = onCircle(b, (a.angle + hi) / 2),
            known = new Set([b.id]);
          if (!accepts(cell, midpoint, known) || !contains(midpoint)) continue;
          if (
            sourceArcs.some(e => {
              if (!e.coincident?.has(b.id)) return false;
              // Test the generated midpoint against the source arc's angular interval,
              // including reversed and periodically unrolled source curves.
              const z = e.curve.circular!;
              const raw = Math.atan2(dot(z.v, midpoint), dot(z.u, midpoint));
              const low = Math.min(z.start, z.end),
                high = Math.max(z.start, z.end);
              const theta = raw + TAU * Math.ceil((low - raw) / TAU);
              return theta > low && theta < high;
            })
          )
            continue;
          let arc: Arc = {
            a: a.n,
            b: end.n,
            curve: circleCurve(b, a.angle, hi, a.n.p.slice(2), end.n.p.slice(2)),
            descriptor: {kind: 'boundary', boundary: b.id, startAngle: a.angle, endAngle: hi}
          };
          if (ref.side === -1) arc = reverseArc(arc);
          arcs.push(arc);
        }
      }
      (result as GeographicAtlasPolygon[]).push(...polygons(arcs, cell, cell.id, sign, context));
    }
    return result;
  }
  subdividePolyline(
    input: ArrayLike<number>,
    part: GeographicAtlasPolyline,
    options: AtlasSubdivisionOptions & {longitudeTurns?: readonly number[]}
  ): SubdividedAtlasPolyline {
    const context = new Context(this.config.options),
      points = context.read(input),
      turns = options.longitudeTurns
        ? Array.from(options.longitudeTurns)
        : new Array(Math.max(0, points.length - 1)).fill(0),
      sources: {edge: Edge; curve: Curve}[] = [];
    if (turns.length !== Math.max(0, points.length - 1))
      fail('Expected one turn count per line edge');
    let cursor = points[0];
    for (let i = 1; i < points.length; i++) {
      const pieces = createEdges(cursor, points[i], points[i - 1], i - 1, 0, turns[i - 1], context);
      for (const edge of mergeEdges(pieces))
        sources.push({
          edge,
          curve: sourceCurve(
            edge,
            context,
            this.config.axes.semiMajorAxis,
            this.config.axes.semiMinorAxis,
            [points[i - 1], points[i]]
          )
        });
      cursor = pieces[pieces.length - 1].b;
    }
    const result = subdivideAtlasRing(
      sources,
      this.boundaries,
      {...part, edges: part.edges.map(source => ({kind: 'source' as const, source}))},
      options,
      context,
      this.config.axes,
      false
    );
    return {
      ...result,
      edges: result.edges.map(e => {
        if (e.kind !== 'source')
          throw new GeographicSeamError('input', 'Unexpected generated line edge');
        return e.source;
      })
    };
  }
  subdivideRing(
    inputs: readonly GeographicPolygonRing[],
    ring: GeographicAtlasRing,
    options: AtlasSubdivisionOptions
  ): SubdividedAtlasRing {
    const context = new Context(this.config.options),
      {sources} = this.sources(inputs, context);
    return subdivideAtlasRing(
      sources.map(s => ({edge: s.edge, curve: s.curve})),
      this.boundaries,
      ring,
      options,
      context,
      this.config.axes
    );
  }
}
