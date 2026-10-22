// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import polygonClipping from 'polygon-clipping';
import {
  add,
  angle,
  ringOrientation,
  basis,
  coordinates,
  cross,
  dot,
  geographic,
  RAD,
  scale,
  unit,
  validateArc,
  type Position,
  type Vector
} from './math';

export type GeographicPosition = readonly [number, number];
/** [a,b,c,d,tx,ty]: x'=a*x+c*y+tx, y'=b*x+d*y+ty. */
export type MapPlacement = readonly [number, number, number, number, number, number];
/** Bounds in placed map units: [minX, minY, maxX, maxY]. */
export type MapBounds = readonly [number, number, number, number];
/** Presentation metadata; frames do not change geographic clipping. */
export type MapRegionLayout = {
  label?: string;
  kind?: 'main' | 'inset' | 'panel';
  parentId?: string;
  /** Semantic linear scale relative to the parent, independent of output units. */
  relativeScale?: number;
  /** Back-to-front order; equal values retain region definition order. */
  drawOrder?: number;
  frame?: MapBounds;
};
export type MapRegion = {
  id: string;
  layout?: MapRegionLayout;
  /** Ordered convex spherical boundary, with optional repeated closing point. */
  boundary: readonly GeographicPosition[];
  /** Strictly interior point, used to orient the boundary half-spaces. */
  interior: GeographicPosition;
  project: (position: GeographicPosition) => Position;
  unproject: (position: GeographicPosition) => Position | null;
  placement?: MapPlacement;
};
export type MapSeam = {
  regions: readonly string[];
  edges: readonly number[];
  /** Join continuity is sampled at endpoints and midpoint; clipping does not rely on it. */
  kind: 'join' | 'cut' | 'boundary';
};
export type MapPoint = {regionId: string; position: Position};
export type MapLine = {regionId: string; coordinates: Position[]; sourceCoordinates: Position[]};
export type MapPolygon = {
  regionId: string;
  coordinates: Position[][];
  sourceCoordinates: Position[][];
};
export type MapSamplingOptions = {
  /** Maximum angular sampling interval in degrees. Default 2, range (0, 90]. */
  maxAngularStep?: number;
  /** Midpoint chord-error target in placed output units. Default 1e-4. */
  tolerance?: number;
};
type Region = {
  definition: MapRegion;
  vertices: Vector[];
  normals: Vector[];
  placement: MapPlacement;
  placementScale: number;
  normalizedPlacement: number[];
  determinant: number;
};
const EPS = 1e-10;

/** Experimental static map layout. Source edges are minor great-circle arcs.
 * Geometry is split at every region boundary, including continuous joins.
 */
export class DiscontinuousMap {
  readonly regions: readonly MapRegion[];
  readonly seams: readonly MapSeam[];
  private readonly compiled: Region[];
  constructor(definitions: readonly MapRegion[]) {
    if (!definitions.length) throw new Error('At least one map region is required');
    const ids = new Set<string>();
    this.compiled = definitions.map(definition => {
      if (!definition.id || ids.has(definition.id))
        throw new Error('Map region IDs must be unique and nonempty');
      ids.add(definition.id);
      let vertices = definition.boundary.map(geographic);
      if (vertices.length > 1 && angle(vertices[0], vertices[vertices.length - 1]) < EPS)
        vertices = vertices.slice(0, -1);
      if (vertices.length < 3)
        throw new Error('A region requires at least three boundary vertices');
      const interior = geographic(definition.interior);
      const normals = vertices.map((v, i) => {
        const next = vertices[(i + 1) % vertices.length];
        validateArc(v, next);
        let normal = unit(cross(v, next));
        if (dot(normal, interior) < 0) normal = scale(normal, -1);
        if (dot(normal, interior) < EPS || vertices.some(p => dot(normal, p) < -EPS))
          throw new Error('Region must be convex with a strictly interior reference point');
        return normal;
      });
      const placement = [
        ...(definition.placement || [1, 0, 0, 1, 0, 0])
      ] as unknown as MapPlacement;
      if (placement.length !== 6 || !placement.every(Number.isFinite))
        throw new Error('Placement must be a finite invertible affine transform');
      // A normalized determinant avoids both underflow and overflow and makes
      // the numerical singularity threshold independent of output units.
      const placementScale = Math.max(...placement.slice(0, 4).map(Math.abs));
      const normalizedPlacement = placement.slice(0, 4).map(v => v / placementScale);
      const [a, b, c, d] = normalizedPlacement;
      const determinant = a * d - b * c;
      if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-14)
        throw new Error('Placement must be a finite invertible affine transform');
      const metadata = definition.layout;
      if (
        metadata?.relativeScale !== undefined &&
        (!Number.isFinite(metadata.relativeScale) || metadata.relativeScale <= 0)
      )
        throw new Error('Relative scale must be finite and positive');
      if (metadata?.drawOrder !== undefined && !Number.isFinite(metadata.drawOrder))
        throw new Error('Draw order must be finite');
      if (
        metadata?.frame &&
        (metadata.frame.length !== 4 ||
          !metadata.frame.every(Number.isFinite) ||
          metadata.frame[0] >= metadata.frame[2] ||
          metadata.frame[1] >= metadata.frame[3])
      )
        throw new Error('Frame must have finite, increasing bounds');
      const layout = metadata
        ? Object.freeze({
            ...metadata,
            ...(metadata.frame ? {frame: Object.freeze([...metadata.frame]) as MapBounds} : {})
          })
        : undefined;
      const snapshot = Object.freeze({
        ...definition,
        ...(layout ? {layout} : {}),
        interior: Object.freeze([...definition.interior]) as GeographicPosition,
        boundary: Object.freeze(vertices.map(v => Object.freeze(coordinates(v)))),
        placement: Object.freeze(placement)
      });
      return {
        definition: snapshot,
        vertices,
        normals,
        placement,
        placementScale,
        normalizedPlacement,
        determinant
      };
    });
    this.regions = Object.freeze(this.compiled.map(r => r.definition));
    const byId = new Map(this.regions.map(r => [r.id, r]));
    for (const r of this.regions) {
      const visited = new Set([r.id]);
      let parent = r.layout?.parentId;
      while (parent !== undefined) {
        if (!byId.has(parent) || visited.has(parent))
          throw new Error('Invalid region parent hierarchy');
        visited.add(parent);
        parent = byId.get(parent)!.layout?.parentId;
      }
    }
    this.seams = Object.freeze(this.buildSeams());
  }
  /** Boundary-inclusive; order determines default point ownership. */
  findRegions(position: GeographicPosition): string[] {
    const p = geographic(position);
    return this.compiled.filter(r => this.contains(r, p)).map(r => r.definition.id);
  }
  projectPoint(position: GeographicPosition, regionId?: string): MapPoint | null {
    const p = geographic(position);
    const candidates = this.select(regionId);
    const region = candidates.find(r => this.contains(r, p));
    return region ? {regionId: region.definition.id, position: this.project(region, p)} : null;
  }
  /** Explicit candidates: gaps return []; overlaps and seams can return several. */
  unprojectPoint(position: GeographicPosition, regionId?: string): MapPoint[] {
    if (position.length !== 2 || !position.every(Number.isFinite))
      throw new Error('Expected finite XY coordinates');
    const results: MapPoint[] = [];
    for (const r of this.select(regionId)) {
      const [a, b, c, d] = r.normalizedPlacement;
      // Subtract first for cancellation accuracy; scale first only if the
      // difference overflows, so inverse placement works at large scales too.
      const deltaX = position[0] - r.placement[4];
      const deltaY = position[1] - r.placement[5];
      const x = Number.isFinite(deltaX)
        ? deltaX / r.placementScale
        : position[0] / r.placementScale - r.placement[4] / r.placementScale;
      const y = Number.isFinite(deltaY)
        ? deltaY / r.placementScale
        : position[1] / r.placementScale - r.placement[5] / r.placementScale;
      const local: Position = [(d * x - c * y) / r.determinant, (-b * x + a * y) / r.determinant];
      if (!local.every(Number.isFinite)) continue;
      const source = r.definition.unproject(local);
      if (!source) continue;
      const p = geographic(source);
      if (!this.contains(r, p)) continue;
      const check = this.project(r, p);
      const outputScale = Math.max(r.placementScale, Math.abs(position[0]), Math.abs(position[1]));
      if (
        Math.hypot(
          check[0] / outputScale - position[0] / outputScale,
          check[1] / outputScale - position[1] / outputScale
        ) <= 1e-8
      )
        results.push({regionId: r.definition.id, position: coordinates(p)});
    }
    return results;
  }
  projectLine(line: readonly GeographicPosition[], options: MapSamplingOptions = {}): MapLine[] {
    const settings = sampling(options);
    const points = line.map(geographic);
    for (let i = 1; i < points.length; i++) validateArc(points[i - 1], points[i]);
    const results: MapLine[] = [];
    for (const r of this.compiled) {
      let current: MapLine | null = null;
      for (let i = 1; i < points.length; i++) {
        const clipped = clipArc(points[i - 1], points[i], r.normals);
        if (!clipped) {
          current = null;
          continue;
        }
        const sampled = this.sample(r, clipped[0], clipped[1], settings);
        if (sampled.length < 2) continue;
        if (
          !current ||
          angle(
            geographic(current.sourceCoordinates[current.sourceCoordinates.length - 1]),
            clipped[0]
          ) > EPS
        ) {
          current = {regionId: r.definition.id, coordinates: [], sourceCoordinates: []};
          results.push(current);
        } else sampled.shift();
        for (const p of sampled) {
          current.coordinates.push(this.project(r, p));
          current.sourceCoordinates.push(coordinates(p));
        }
        // Even an excursion returning to the same seam point starts a new part.
        if (!this.contains(r, points[i])) current = null;
      }
    }
    return results;
  }
  /** Exterior first, then holes; winding-independent. Each input polygon must
   * fit in one open hemisphere. Returned polygons have CCW exteriors/CW holes.
   */
  projectPolygon(
    rings: readonly (readonly GeographicPosition[])[],
    options: MapSamplingOptions & {chartCenter?: GeographicPosition} = {}
  ): MapPolygon[] {
    const settings = sampling(options);
    if (!rings.length) return [];
    const vectors = rings.map(ring => {
      let p = ring.map(geographic);
      if (p.length > 1 && angle(p[0], p[p.length - 1]) < EPS) p = p.slice(0, -1);
      if (p.length < 3) throw new Error('Polygon rings require at least three vertices');
      p.forEach((v, i) => validateArc(v, p[(i + 1) % p.length]));
      return p;
    });
    const center = options.chartCenter
      ? geographic(options.chartCenter)
      : unit(vectors[0].reduce(add, [0, 0, 0]));
    if (vectors.some(r => r.some(p => dot(center, p) <= 1e-6)))
      throw new Error(
        'Polygon does not fit its open-hemisphere chart; supply chartCenter or split into smaller polygons'
      );
    const [x, y] = basis(center);
    const planar = vectors.map(r =>
      r.map(p => [dot(x, p) / dot(center, p), dot(y, p) / dot(center, p)] as Position)
    );
    if (planar.some(r => ringOrientation(r) === 0)) throw new Error('Degenerate polygon ring');
    let bound = 1;
    for (const ring of planar)
      for (const p of ring) bound = Math.max(bound, Math.abs(p[0]), Math.abs(p[1]));
    bound += 1;
    // Convex single rings need no boolean reconstruction. Direct half-space
    // clipping avoids nearly coincident mask/input edges at exact grid seams.
    const orientation = ringOrientation(planar[0]);
    const convex =
      planar.length === 1 &&
      planar[0].every((p, i, ring) => {
        const turn = ringOrientation([p, ring[(i + 1) % ring.length], ring[(i + 2) % ring.length]]);
        return turn === 0 || turn === orientation;
      }) &&
      // Equal local turns alone also accept self-crossing stars. A convex
      // ring must lie entirely on the interior side of each of its edges.
      planar[0].every((p, i, ring) =>
        ring.every(q => {
          const side = ringOrientation([p, ring[(i + 1) % ring.length], q]);
          return side === 0 || side === orientation;
        })
      );
    const origin = planar[0][0];
    let extent = 0;
    for (const p of planar[0])
      extent = Math.max(extent, Math.abs(p[0] - origin[0]), Math.abs(p[1] - origin[1]));
    const relativeArea = (ring: Position[]) =>
      Math.abs(
        ring.reduce((sum, p, i) => {
          const q = ring[(i + 1) % ring.length];
          return (
            sum +
            ((p[0] - origin[0]) / extent) * ((q[1] - origin[1]) / extent) -
            ((p[1] - origin[1]) / extent) * ((q[0] - origin[0]) / extent)
          );
        }, 0)
      );
    const inputArea = convex ? relativeArea(planar[0]) : 0;
    const results: MapPolygon[] = [];
    for (const r of this.compiled) {
      let clip: Position[] = convex
        ? planar[0].slice()
        : [
            [-bound, -bound],
            [bound, -bound],
            [bound, bound],
            [-bound, bound]
          ];
      for (const n of r.normals) clip = clipPlane(clip, dot(n, x), dot(n, y), dot(n, center));
      if (clip.length < 3 || ringOrientation(clip) === 0) continue;
      // Roundoff at a tangent seam must not emit a numerical sliver. Compare
      // to the source ring's own scale so genuinely small polygons survive.
      if (convex && relativeArea(clip) <= inputArea * 64 * Number.EPSILON) continue;
      const polygons = convex
        ? [[[...clip, clip[0]]]]
        : polygonClipping.intersection(planar, [clip]);
      for (const polygon of polygons) {
        const output: MapPolygon = {
          regionId: r.definition.id,
          coordinates: [],
          sourceCoordinates: []
        };
        polygon.forEach((ring, index) => {
          const sphere = ring.map(p => unit(add(center, add(scale(x, p[0]), scale(y, p[1])))));
          const points: Vector[] = [];
          for (let i = 1; i < sphere.length; i++) {
            const sampled = this.sample(r, sphere[i - 1], sphere[i], settings);
            for (let j = 0; j < sampled.length - 1; j++) points.push(sampled[j]);
          }
          if (points.length < 3) return;
          points.push(points[0]);
          const xy = points.map(p => this.project(r, p));
          if (ringOrientation(xy) > 0 !== (index === 0)) {
            xy.reverse();
            points.reverse();
          }
          output.coordinates.push(xy);
          output.sourceCoordinates.push(points.map(coordinates));
        });
        if (output.coordinates.length) results.push(output);
      }
    }
    return results;
  }
  private select(id?: string): Region[] {
    if (id === undefined) return this.compiled;
    const r = this.compiled.find(p => p.definition.id === id);
    if (!r) throw new Error(`Unknown map region: ${id}`);
    return [r];
  }
  private contains(r: Region, p: Vector) {
    return r.normals.every(n => dot(n, p) >= -EPS);
  }
  private project(r: Region, p: Vector): Position {
    const local = r.definition.project(coordinates(p));
    const [a, b, c, d, tx, ty] = r.placement;
    const xy: Position = [a * local[0] + c * local[1] + tx, b * local[0] + d * local[1] + ty];
    if (!xy.every(Number.isFinite))
      throw new Error(`Nonfinite projection in region ${r.definition.id}`);
    return xy;
  }
  private sample(
    r: Region,
    a: Vector,
    b: Vector,
    settings: {step: number; tolerance: number}
  ): Vector[] {
    if (angle(a, b) < 1e-13) return [a];
    const out: Vector[] = [a];
    const visit = (u: Vector, v: Vector, depth: number) => {
      const middle = unit(add(u, v)),
        p = this.project(r, u),
        q = this.project(r, v),
        m = this.project(r, middle);
      const dx = q[0] - p[0],
        dy = q[1] - p[1],
        length = dx * dx + dy * dy;
      const t = length
        ? Math.max(0, Math.min(1, ((m[0] - p[0]) * dx + (m[1] - p[1]) * dy) / length))
        : 0;
      const error = Math.hypot(m[0] - p[0] - t * dx, m[1] - p[1] - t * dy);
      if (angle(u, v) > settings.step || error > settings.tolerance) {
        if (depth >= 20 || out.length > 1000000)
          throw new Error('Projection sampling limit exceeded; relax tolerance');
        visit(u, middle, depth + 1);
        visit(middle, v, depth + 1);
      } else out.push(v);
    };
    visit(a, b, 0);
    return out;
  }
  private buildSeams(): MapSeam[] {
    const groups = new Map<string, {r: Region; i: number}[]>();
    const key = (p: Vector) => p.map(v => Math.round(v * 1e9)).join(',');
    for (const r of this.compiled)
      r.vertices.forEach((p, i) => {
        const k = [key(p), key(r.vertices[(i + 1) % r.vertices.length])].sort().join('/');
        const group = groups.get(k) || [];
        group.push({r, i});
        groups.set(k, group);
      });
    // Repeated/inset domains may share an edge with more than one other
    // region. Describe each relation independently instead of imposing a
    // manifold-mesh restriction on arbitrary overlapping map domains.
    const relations = [...groups.values()].flatMap(group => {
      if (group.length === 1) return [group];
      return group.flatMap((edge, index) => group.slice(index + 1).map(other => [edge, other]));
    });
    return relations.map(group => {
      let kind: MapSeam['kind'] = 'boundary';
      if (group.length === 2) {
        const {r, i} = group[0],
          other = group[1].r,
          a = r.vertices[i],
          b = r.vertices[(i + 1) % r.vertices.length];
        const samples = [a, unit(add(a, b)), b];
        const first = samples.map(p => this.project(r, p));
        const second = samples.map(p => this.project(other, p));
        // Measure the actual placed edge, independent of how scale is split
        // between local projection and placement. Normalize before distances
        // to avoid overflow; allow only floating-point roundoff at large offsets.
        const coordinateScale = Math.max(...first.concat(second).flat().map(Math.abs));
        const normalizedFirst = first.map(p =>
          p.map(v => (coordinateScale ? v / coordinateScale : 0))
        );
        const normalizedSecond = second.map(p =>
          p.map(v => (coordinateScale ? v / coordinateScale : 0))
        );
        const edgeLength = (points: number[][]) =>
          Math.hypot(points[2][0] - points[0][0], points[2][1] - points[0][1]);
        const tolerance =
          1e-8 * Math.max(edgeLength(normalizedFirst), edgeLength(normalizedSecond)) +
          8 * Number.EPSILON;
        kind = normalizedFirst.every((u, index) => {
          const v = normalizedSecond[index];
          return Math.hypot(u[0] - v[0], u[1] - v[1]) <= tolerance;
        })
          ? 'join'
          : 'cut';
      }
      return Object.freeze({
        regions: Object.freeze(group.map(g => g.r.definition.id)),
        edges: Object.freeze(group.map(g => g.i)),
        kind
      });
    });
  }
}
function sampling(options: MapSamplingOptions) {
  const step = options.maxAngularStep ?? 2,
    tolerance = options.tolerance ?? 1e-4;
  if (
    !Number.isFinite(step) ||
    step <= 0 ||
    step > 90 ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0
  )
    throw new Error('Invalid map sampling options');
  return {step: step * RAD, tolerance};
}
function clipArc(a: Vector, b: Vector, normals: Vector[]): [Vector, Vector] | null {
  let start = 0,
    end = 1;
  for (const n of normals) {
    const snap = (x: number) => (Math.abs(x) < EPS ? 0 : x);
    const u = snap(dot(n, a)),
      v = snap(dot(n, b));
    if (u < -EPS && v < -EPS) return null;
    if (u < 0 && v >= 0) start = Math.max(start, -u / (v - u));
    if (v < 0 && u >= 0) end = Math.min(end, u / (u - v));
  }
  if (end - start < 1e-12) return null;
  return [
    unit(add(scale(a, 1 - start), scale(b, start))),
    unit(add(scale(a, 1 - end), scale(b, end)))
  ];
}
function clipPlane(ring: Position[], a: number, b: number, c: number): Position[] {
  const output: Position[] = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i],
      q = ring[(i + 1) % ring.length],
      u = a * p[0] + b * p[1] + c,
      v = a * q[0] + b * q[1] + c;
    if (u >= 0) output.push(p);
    if (u < 0 !== v < 0) {
      const t = u / (u - v);
      output.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return output;
}
