// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import polygonClipping from 'polygon-clipping';
import {createKernelMap} from '../world-map';
import {geographic, coordinates, unit, add, angle, RAD, type Position} from '../math';
import type {
  MapRegion,
  MapSeam,
  MapPoint,
  MapLine,
  MapPolygon,
  MapSamplingOptions,
  GeographicPosition,
  MapSurface
} from '../map-layout';
import type {ElasticMapData} from './data';
import {ElasticGrid} from './grid';
import {indexDomain, rectangle, onSegment, sample, sampling, type Polygons} from './geometry';
import {clipSourceArc} from './source-arc';
import {sourceArc} from '../source-arc';
import {tracePolygonConstraints, composePolygonEdge} from '../polygon-constraints';

// This chart splitter retains directional pole limits and antimeridian sides.
const kernel = Object.assign((x: number, y: number) => [x, y], {
  invert: (x: number, y: number) => [x, y]
});
const splitter = createKernelMap({kernel, radius: 1 / RAD});
type Chart = {
  region: MapRegion;
  domain: Polygons;
  grid: ElasticGrid;
  baseId: string;
  section: string;
  contains: (p: readonly number[]) => boolean;
};

/** Compile a sampled Elastic dataset. Output units are radius-scaled, matching
 * other MapEngine maps. Dataset tables remain explicit, optional imports. */
export function createElasticMap(
  data: ElasticMapData,
  options: {radius?: number} = {}
): MapSurface {
  return new ElasticMap(data, options.radius ?? 1);
}
class ElasticMap implements MapSurface {
  readonly regions: readonly MapRegion[];
  readonly seams: readonly MapSeam[];
  private charts: Chart[] = [];
  constructor(data: ElasticMapData, radius: number) {
    if (
      data.version !== 1 ||
      typeof data.name !== 'string' ||
      !data.name ||
      !Number.isFinite(data.radius) ||
      data.radius <= 0 ||
      !Number.isFinite(radius) ||
      radius <= 0 ||
      !data.sections?.length ||
      data.sections.length > 64
    )
      throw new Error('Invalid Elastic dataset');
    const ids = new Set<string>();
    for (const section of data.sections) {
      if (typeof section.id !== 'string' || !section.id || ids.has(section.id))
        throw new Error('Elastic section IDs must be unique');
      ids.add(section.id);
      if (section.complement !== undefined && typeof section.complement !== 'boolean')
        throw new Error('Invalid Elastic complement flag');
      if (section.boundary.length < 4 || section.boundary.length > 100000)
        throw new Error('Invalid Elastic section boundary');
      const boundary = section.boundary.map(p => {
        geographic(p);
        if (Math.abs(p[0]) > 180) throw new Error('Elastic boundaries must be in [-180,180]');
        return [...p] as Position;
      });
      if (boundary[0].some((v, i) => v !== boundary[boundary.length - 1][i]))
        throw new Error('Elastic boundaries must be closed');
      const values = Object.freeze([...section.values]);
      const grid = new ElasticGrid({...section, values}, radius / data.radius);
      const world = rectangle(-180, -90, 180, 90);
      const domain = (
        section.complement
          ? polygonClipping.difference(world, [boundary])
          : polygonClipping.intersection(world, [boundary])
      ) as Polygons;
      for (const base of splitter.regions) {
        const [lon, lat] = base.interior,
          w = lon - 45,
          e = lon + 45,
          s = lat < 0 ? -90 : 0,
          n = lat < 0 ? 0 : 90;
        const clipped = polygonClipping.intersection(domain, rectangle(w, s, e, n)) as Polygons;
        if (!clipped.length) continue;
        const id = `${section.id}/${base.id}`;
        const owns = indexDomain(clipped);
        const project = (p: GeographicPosition) =>
          grid.project([Math.max(w, Math.min(e, lon + wrap(p[0] - lon))), p[1]]);
        const region: MapRegion = Object.freeze({
          ...base,
          id,
          layout: Object.freeze({label: `${data.name} · ${section.id}`, kind: 'panel' as const}),
          placement: Object.freeze([1, 0, 0, 1, 0, 0]) as MapRegion['placement'],
          project: (p: GeographicPosition) => project(p) ?? [NaN, NaN],
          unproject: (p: GeographicPosition) => grid.inverse(p).find(p => owns(p)) ?? null
        });
        this.charts.push({
          region,
          domain: clipped,
          grid,
          baseId: base.id,
          section: section.id,
          contains: owns
        });
      }
    }
    if (!this.charts.length) throw new Error('Elastic dataset has empty coverage');
    this.regions = Object.freeze(this.charts.map(c => c.region));
    this.seams = Object.freeze(this.makeSeams());
  }
  private select(id?: string) {
    if (id === undefined) return this.charts;
    const c = this.charts.find(c => c.region.id === id);
    if (!c) throw new Error(`Unknown map region: ${id}`);
    return [c];
  }
  private local(c: Chart, p: GeographicPosition): Position {
    const center = c.region.interior[0];
    return [center + wrap(p[0] - center), p[1]];
  }
  findRegions(p: GeographicPosition) {
    geographic(p);
    return this.charts.filter(c => c.contains(this.local(c, p))).map(c => c.region.id);
  }
  containsConvexPolygon(ring: readonly GeographicPosition[], id: string) {
    const c = this.select(id)[0];
    if (!splitter.containsConvexPolygon(ring, c.baseId)) return false;
    const points = ring.map(geographic),
      center = unit(points.reduce(add, [0, 0, 0]));
    const [lon, lat] = coordinates(center),
      radius = Math.max(...points.map(p => angle(center, p)));
    // A spherical cap enclosing the convex ring encloses its entire interior.
    // Bound that cap in longitude/latitude, then reject every boundary contact.
    if (radius >= Math.PI / 2 || Math.abs(lat) + radius / RAD >= 90) return false;
    const dx = Math.asin(Math.min(1, Math.sin(radius) / Math.cos(lat * RAD))) / RAD;
    const box = [lon - dx, lat - radius / RAD, lon + dx, lat + radius / RAD];
    if (box[0] < -180 || box[2] > 180 || !c.contains([lon, lat])) return false;
    for (const polygon of c.domain)
      for (const edge of polygon)
        for (let i = 1; i < edge.length; i++) {
          const a = edge[i - 1],
            b = edge[i];
          if (
            Math.max(a[0], b[0]) >= box[0] - 1e-7 &&
            Math.min(a[0], b[0]) <= box[2] + 1e-7 &&
            Math.max(a[1], b[1]) >= box[1] - 1e-7 &&
            Math.min(a[1], b[1]) <= box[3] + 1e-7
          )
            return false;
        }
    return c.grid.covers(box);
  }
  projectPoint(p: GeographicPosition, id?: string): MapPoint | null {
    geographic(p);
    for (const c of this.select(id)) {
      const q = this.local(c, p);
      if (c.contains(q)) {
        const xy = c.grid.project(q);
        if (xy) return {regionId: c.region.id, position: xy};
      }
    }
    return null;
  }
  unprojectPoint(p: GeographicPosition, id?: string): MapPoint[] {
    if (p.length !== 2 || !p.every(Number.isFinite))
      throw new Error('Expected finite XY coordinates');
    const results: MapPoint[] = [];
    const candidates = new Map<ElasticGrid, Position[]>();
    for (const c of this.select(id)) {
      if (!candidates.has(c.grid)) candidates.set(c.grid, c.grid.inverse(p));
      for (const q of candidates.get(c.grid)!)
        if (c.contains(q)) results.push({regionId: c.region.id, position: q});
    }
    return results;
  }
  private sourceOptions(options: MapSamplingOptions) {
    const {step} = sampling(options);
    return {...options, maxAngularStep: Math.min(step, 1), tolerance: 1e-5};
  }
  private sampled(c: Chart, line: Position[], options: MapSamplingOptions) {
    return sample(
      line,
      p => c.grid.project(p),
      options,
      Math.min(180 / (c.grid.section.rows - 1), 360 / (c.grid.section.columns - 1))
    );
  }
  projectLine(line: readonly GeographicPosition[], options: MapSamplingOptions = {}): MapLine[] {
    const out: MapLine[] = [];
    for (const part of splitter.projectLine(line, this.sourceOptions(options)))
      for (const c of this.charts.filter(c => c.baseId === part.regionId)) {
        let current: MapLine | undefined;
        const boundary = (point: Position, vertex: number) => {
          if (vertex === 0 || vertex === line.length - 1) return 'source-endpoint';
          let edge = 0;
          const kinds: string[] = [];
          for (const polygon of c.domain)
            for (const ring of polygon)
              for (let i = 1; i < ring.length; i++, edge++)
                if (onSegment(point, ring[i - 1], ring[i])) {
                  const seam = this.seams.find(s =>
                    s.regions.some((id, j) => id === c.region.id && s.edges[j] === edge)
                  );
                  kinds.push(seam?.kind ?? 'boundary');
                }
          return kinds.includes('boundary')
            ? 'coverage-boundary'
            : kinds.includes('cut')
              ? 'chart-cut'
              : kinds.includes('join')
                ? 'continuous-chart-join'
                : 'coverage-boundary';
        };
        for (let i = 1; i < part.sourceCoordinates.length; i++) {
          const a = part.coordinates[i - 1],
            b = part.coordinates[i];
          const intervals = clipSourceArc(a, b, c.domain);
          if (!intervals.length) {
            current = undefined;
            continue;
          }
          if (Math.hypot(intervals[0].a[0] - a[0], intervals[0].a[1] - a[1]) > 1e-8)
            current = undefined;
          for (const clipped of intervals) {
            const arc = sourceArc(clipped.a, clipped.b);
            const samples = sample(
              [clipped.a, clipped.b],
              p => c.grid.project(p),
              options,
              Math.min(180 / (c.grid.section.rows - 1), 360 / (c.grid.section.columns - 1)),
              (_, t) => arc(t)
            );
            const first = samples.source[0],
              last = samples.source[samples.source.length - 1];
            const joined =
              current &&
              Math.hypot(
                ...current.sourceCoordinates[current.sourceCoordinates.length - 1].map(
                  (v, k) => v - first[k]
                )
              ) < 1e-8;
            if (!joined) {
              current = {regionId: c.region.id, coordinates: [], sourceCoordinates: []};
              if (part.provenance)
                current.provenance = {
                  segments: [],
                  parameters: [],
                  vertices: [],
                  angularDistances: []
                };
              out.push(current);
            }
            for (let j = joined ? 1 : 0; j < samples.source.length; j++) {
              const p = samples.source[j];
              current!.sourceCoordinates.push(p);
              current!.coordinates.push(samples.xy[j]);
              const parent = part.provenance,
                target = current!.provenance;
              if (parent && target) {
                const length = angle(geographic(a), geographic(b)),
                  t = length ? Math.min(1, angle(geographic(a), geographic(p)) / length) : 0;
                const endpoint = t < 1e-12 ? i - 1 : t > 1 - 1e-12 ? i : -1,
                  segment = parent.segments[i],
                  from = parent.segments[i - 1] === segment ? parent.parameters[i - 1] : 0;
                target.segments.push(endpoint >= 0 ? parent.segments[endpoint] : segment);
                target.parameters.push(
                  endpoint >= 0
                    ? parent.parameters[endpoint]
                    : from + t * (parent.parameters[i] - from)
                );
                target.vertices.push(endpoint >= 0 ? parent.vertices[endpoint] : 0xffffffff);
                if (options.pathDistances)
                  target.angularDistances.push(
                    parent.angularDistances[i - 1] +
                      t * (parent.angularDistances[i] - parent.angularDistances[i - 1])
                  );
                if (options.pathBoundaries) {
                  if (target.vertices.length === 1)
                    target.startReason = boundary(p, target.vertices[0]);
                  target.endReason = boundary(p, target.vertices[target.vertices.length - 1]);
                }
              }
            }
            if (Math.hypot(last[0] - b[0], last[1] - b[1]) > 1e-8) current = undefined;
          }
        }
      }
    return out;
  }

  projectPolygon(
    rings: readonly (readonly GeographicPosition[])[],
    options: MapSamplingOptions = {}
  ): MapPolygon[] {
    const out: MapPolygon[] = [];
    for (const part of splitter.projectPolygon(rings, this.sourceOptions(options)))
      for (const c of this.charts.filter(c => c.baseId === part.regionId)) {
        const clipped = polygonClipping.intersection(
          snapPolygon(part.coordinates),
          c.domain.map(snapPolygon)
        ) as Polygons;
        for (const polygon of clipped) {
          const input = snapPolygon(part.coordinates),
            traced = tracePolygonConstraints(input, polygon, 1e-9, part.edgeProvenance),
            resolved = traced.rings.map(r => r.map(p => [...p] as Position));
          traced.owners.forEach((owners, r) =>
            owners.forEach((owner, i) => {
              if (!owner) return;
              const [pr, pe] = owner,
                a = part.coordinates[pr][pe],
                b = part.coordinates[pr][pe + 1],
                length = angle(geographic(a), geographic(b)),
                arc = sourceArc(a, b);
              for (const j of [i, i + 1]) {
                const q = traced.rings[r][j],
                  start = input[pr][pe],
                  end = input[pr][pe + 1];
                if (Math.hypot(q[0] - start[0], q[1] - start[1]) < 1e-8) resolved[r][j] = [...a];
                else if (Math.hypot(q[0] - end[0], q[1] - end[1]) < 1e-8) resolved[r][j] = [...b];
                else {
                  const candidates = clipSourceArc(a, b, c.domain).flatMap(interval => [
                    interval.a,
                    interval.b
                  ]);
                  if (!candidates.length)
                    throw new Error('Unresolved Elastic polygon source intersection');
                  const reference = length ? angle(geographic(a), geographic(q)) / length : 0;
                  candidates.sort(
                    (x, y) =>
                      Math.abs(
                        (length ? angle(geographic(a), geographic(x)) / length : 0) - reference
                      ) -
                      Math.abs(
                        (length ? angle(geographic(a), geographic(y)) / length : 0) - reference
                      )
                  );
                  const fraction = length
                    ? angle(geographic(a), geographic(candidates[0])) / length
                    : 0;
                  resolved[r][j] = arc(Math.min(1, Math.max(0, fraction)));
                }
              }
            })
          );
          for (const ring of resolved) ring[ring.length - 1] = [...ring[0]];
          const generated = (a: Position, b: Position) => {
            if (angle(geographic(a), geographic(b)) < 64 * Number.EPSILON)
              return 'continuous-chart-join' as const;
            let edge = 0;
            const kinds: string[] = [];
            for (const polygon of c.domain)
              for (const ring of polygon)
                for (let j = 1; j < ring.length; j++, edge++)
                  if (onSegment(a, ring[j - 1], ring[j]) && onSegment(b, ring[j - 1], ring[j])) {
                    const seam = this.seams.find(s =>
                      s.regions.some((id, k) => id === c.region.id && s.edges[k] === edge)
                    );
                    kinds.push(seam?.kind ?? 'boundary');
                  }
            if (!kinds.length) throw new Error('Unknown Elastic polygon clipping constraint');
            return kinds.includes('boundary')
              ? ('coverage-boundary' as const)
              : kinds.includes('cut')
                ? ('chart-cut' as const)
                : ('continuous-chart-join' as const);
          };
          const coordinates: Position[][] = [],
            sourceCoordinates: Position[][] = [],
            edgeProvenance: NonNullable<MapPolygon['edgeProvenance']> = [];
          resolved.forEach((ring, r) => {
            const source: Position[] = [],
              xy: Position[] = [],
              edges: NonNullable<MapPolygon['edgeProvenance']>[number] = [];
            for (let i = 1; i < ring.length; i++) {
              const owner = traced.owners[r][i - 1],
                arc = owner ? sourceArc(ring[i - 1], ring[i]) : undefined;
              const samples = sample(
                arc ? [arc(0), arc(1)] : [ring[i - 1], ring[i]],
                p => c.grid.project(p),
                options,
                Math.min(180 / (c.grid.section.rows - 1), 360 / (c.grid.section.columns - 1)),
                arc ? (_, t) => arc(t) : undefined
              );
              if (!source.length) {
                source.push(samples.source[0]);
                xy.push(samples.xy[0]);
              } else if (
                source[source.length - 1].some((v, k) => Math.abs(v - samples.source[0][k]) > 1e-10)
              ) {
                if (
                  angle(geographic(source[source.length - 1]), geographic(samples.source[0])) >
                  1e-10
                )
                  throw new Error('Discontinuous Elastic polygon source constraint');
                if (options.polygonEdgeProvenance)
                  edges.push({
                    kind: 'continuous-chart-join',
                    ring: 0xffffffff,
                    segment: 0xffffffff,
                    t0: 0,
                    t1: 0
                  });
                source.push(samples.source[0]);
                xy.push(samples.xy[0]);
              }
              for (let j = 1; j < samples.source.length; j++) {
                if (options.polygonEdgeProvenance) {
                  if (owner) {
                    const [pr, pe] = owner;
                    edges.push(
                      composePolygonEdge(
                        part.edgeProvenance![pr][pe],
                        part.coordinates[pr][pe],
                        part.coordinates[pr][pe + 1],
                        source[source.length - 1],
                        samples.source[j]
                      )
                    );
                  } else
                    edges.push({
                      kind: generated(ring[i - 1], ring[i]),
                      ring: 0xffffffff,
                      segment: 0xffffffff,
                      t0: 0,
                      t1: 0
                    });
                }
                source.push(samples.source[j]);
                xy.push(samples.xy[j]);
              }
            }
            if (source.length && source[source.length - 1].some((v, k) => v !== source[0][k])) {
              if (angle(geographic(source[source.length - 1]), geographic(source[0])) > 1e-10)
                throw new Error('Unclosed Elastic polygon source constraint');
              if (options.polygonEdgeProvenance)
                edges.push({
                  kind: 'continuous-chart-join',
                  ring: 0xffffffff,
                  segment: 0xffffffff,
                  t0: 0,
                  t1: 0
                });
              source.push([...source[0]]);
              xy.push([...xy[0]]);
            }
            coordinates.push(xy);
            sourceCoordinates.push(source);
            edgeProvenance.push(edges);
          });
          out.push({
            regionId: c.region.id,
            coordinates,
            sourceCoordinates,
            ...(options.polygonEdgeProvenance ? {edgeProvenance} : {})
          });
        }
      }
    return out;
  }
  getRegionOutlines(id: string, options: MapSamplingOptions = {}): Position[][] {
    const c = this.select(id)[0];
    return c.domain.flatMap(p => p.map(r => this.sampled(c, r, options).xy));
  }
  private makeSeams(): MapSeam[] {
    const groups = new Map<string, {c: Chart; a: Position; b: Position; edge: number}[]>();
    const key = (p: Position) =>
      [Math.abs(p[0]) === 180 ? -180 : p[0], p[1]].map(v => Math.round(v * 1e7)).join(',');
    for (const c of this.charts) {
      let edge = 0;
      for (const polygon of c.domain)
        for (const ring of polygon)
          for (let i = 1; i < ring.length; i++, edge++) {
            const a = ring[i - 1],
              b = ring[i],
              k = [key(a), key(b)].sort().join('/'),
              group = groups.get(k) ?? [];
            group.push({c, a, b, edge});
            groups.set(k, group);
          }
    }
    return [...groups.values()]
      .flatMap(group => {
        if (group.length === 1)
          return [
            {regions: [group[0].c.region.id], edges: [group[0].edge], kind: 'boundary' as const}
          ];
        return group.slice(1).map(other => {
          const first = group[0];
          const samples = [
            first.a,
            [(first.a[0] + first.b[0]) / 2, (first.a[1] + first.b[1]) / 2] as Position,
            first.b
          ];
          const joined = samples.every(p => {
            const a = first.c.grid.project(this.local(first.c, p)),
              b = other.c.grid.project(this.local(other.c, p));
            return (
              a &&
              b &&
              Math.hypot(a[0] - b[0], a[1] - b[1]) <=
                1e-8 * Math.max(Number.MIN_VALUE, Math.hypot(...a), Math.hypot(...b))
            );
          });
          const kind = joined ? 'join' : 'cut';
          return {
            regions: [first.c.region.id, other.c.region.id],
            edges: [first.edge, other.edge],
            kind
          } as MapSeam;
        });
      })
      .map(s =>
        Object.freeze({...s, regions: Object.freeze(s.regions), edges: Object.freeze(s.edges)})
      );
  }
}
function wrap(lon: number) {
  const x = lon % 360;
  return x > 180 ? x - 360 : x < -180 ? x + 360 : x;
}

// Spherical chart clipping leaves sub-ulp variations along coincident chart
// edges. Quantize only Boolean operands, far below source sampling tolerance,
// so the sweep-line operation sees identical endpoints on shared boundaries.
function snapPolygon(rings: readonly (readonly GeographicPosition[])[]): Position[][] {
  return rings.map(ring => ring.map(p => p.map(v => Math.round(v * 1e10) / 1e10) as Position));
}
