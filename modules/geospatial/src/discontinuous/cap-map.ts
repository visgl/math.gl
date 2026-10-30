// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import clipCircle from './spherical-clip/clip-circle.js';
import {circleStream} from './spherical-clip/circle.js';
import {
  DiscontinuousMap,
  type GeographicPosition,
  type MapRegion,
  type MapSamplingOptions,
  type MapLine,
  type MapPolygon
} from './map-layout.js';
import {
  geographic,
  coordinates,
  basis,
  dot,
  cross,
  angle,
  add,
  unit,
  ringOrientation,
  RAD,
  type Vector,
  type Position
} from './math.js';

/** Spherical cap clipping before final projection, including polygon horizon arcs. */
export class CapMap extends DiscontinuousMap {
  constructor(
    regions: MapRegion[],
    private readonly local: (p: GeographicPosition) => Position,
    private readonly source: (p: Position) => Position,
    private readonly cap: number,
    private readonly radius: number,
    private readonly polarLimits = false,
    private readonly nonlinear = false
  ) {
    super(regions);
  }
  protected override resolveSourceLimit(point: Vector, towards: Vector): Vector {
    if (
      this.polarLimits &&
      Math.hypot(point[0], point[1]) < 1e-14 &&
      Math.hypot(towards[0], towards[1]) > 1e-14
    )
      return geographic([Math.atan2(towards[1], towards[0]) / RAD, point[2] > 0 ? 90 : -90]);
    return point;
  }
  private visible(p: GeographicPosition) {
    geographic(p);
    const q = this.local(p);
    return Math.cos(q[0] * RAD) * Math.cos(q[1] * RAD) >= Math.cos(this.cap) - 1e-12;
  }
  override findRegions(p: GeographicPosition) {
    return this.visible(p) ? super.findRegions(p) : [];
  }
  override containsConvexPolygon(ring: readonly GeographicPosition[], regionId: string): boolean {
    if (this.nonlinear || !super.containsConvexPolygon(ring, regionId)) return false;
    const points = ring.map(p => geographic(this.local(p))),
      threshold = Math.cos(this.cap) + 1e-12;
    if (points.some(p => p[0] < threshold)) return false;
    if (this.cap <= Math.PI / 2) return true;
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length],
        arc = angle(a, b);
      if (arc < 1e-12) continue;
      const c = (b[0] - a[0] * Math.cos(arc)) / Math.sin(arc);
      const minimum =
        (((Math.atan2(c, a[0]) + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (minimum < arc && -Math.hypot(a[0], c) < threshold) return false;
    }
    const center = unit(points.reduce(add, [0, 0, 0]));
    // The excluded cap can sit entirely inside a ring without touching an edge.
    const containsAntipode = points.every((a, i) => {
      const n = cross(a, points[(i + 1) % points.length]);
      return (dot(n, center) < 0 ? n[0] : -n[0]) >= -1e-12;
    });
    return !containsAntipode;
  }
  override projectPoint(p: GeographicPosition, id?: string) {
    return this.visible(p) ? super.projectPoint(p, id) : null;
  }
  override unprojectPoint(p: GeographicPosition, id?: string) {
    return super.unprojectPoint(p, id).filter(q => this.visible(q.position));
  }
  private clip(
    rings: readonly (readonly GeographicPosition[])[],
    polygon: boolean,
    options?: MapSamplingOptions,
    regionId?: string,
    segmentIndices?: number[][]
  ): Position[][] {
    const output: Position[][] = [];
    const originals = new Map<string, Position>();
    let ring: Position[] = [],
      indices: number[] = [],
      activeSegment = 0;
    const precision =
      Math.min(
        options?.maxAngularStep ?? 2,
        Math.sqrt((options?.tolerance ?? 1e-4) / this.radius) / RAD / 4
      ) * RAD;
    if (!Number.isFinite(precision) || (2 * Math.PI) / precision > 1_000_000)
      throw new Error('Projection sampling limit exceeded; relax tolerance');
    let emitted = 0;
    const region = this.regions.find(r => r.id === regionId);
    const local = (p: GeographicPosition) => {
      // Nonlinear longitude transforms must retain the owning chart's seam side.
      const longitude =
        this.nonlinear && region && Math.abs(Math.abs(p[0]) - 180) < 1e-10
          ? Math.sign(region.interior[0]) * 180
          : p[0];
      return this.local([longitude, p[1]]);
    };
    const projected = (p: Position): Position => {
      const q = region!.project(this.source([p[0] / RAD, p[1] / RAD])),
        [a, b, c, d, x, y] = region!.placement!;
      return [a * q[0] + c * q[1] + x, b * q[0] + d * q[1] + y];
    };
    const interpolate = region
      ? (
          from: Position | null,
          to: Position | null,
          direction: number,
          sink: {point: (x: number, y: number) => void}
        ) => {
          const points: Position[] = [];
          if (from) points.push(from);
          circleStream(
            {point: (x: number, y: number) => points.push([x, y])},
            this.cap,
            Math.min(options?.maxAngularStep ?? 2, 2) * RAD,
            direction,
            from,
            to
          );
          if (to) points.push(to);
          else if (points.length) points.push(points[0]);
          const emit = (p: Position) => sink.point(p[0], p[1]);
          const sample = (a: Position, b: Position, depth = 0) => {
            const va = geographic([a[0] / RAD, a[1] / RAD]),
              vb = geographic([b[0] / RAD, b[1] / RAD]);
            const y = va[1] + vb[1],
              z = va[2] + vb[2],
              n = Math.hypot(y, z);
            if (n < 1e-14) {
              emit(b);
              return;
            }
            const mid = coordinates([
              Math.cos(this.cap),
              (Math.sin(this.cap) * y) / n,
              (Math.sin(this.cap) * z) / n
            ]).map(v => v * RAD) as Position;
            const pa = projected(a),
              pb = projected(b),
              pm = projected(mid),
              dx = pb[0] - pa[0],
              dy = pb[1] - pa[1],
              length = dx * dx + dy * dy;
            const t = length
              ? Math.max(0, Math.min(1, ((pm[0] - pa[0]) * dx + (pm[1] - pa[1]) * dy) / length))
              : 0;
            if (
              Math.hypot(pm[0] - pa[0] - t * dx, pm[1] - pa[1] - t * dy) >
              (options?.tolerance ?? 1e-4)
            ) {
              if (depth >= 32)
                throw new Error('Projection sampling limit exceeded; relax tolerance');
              sample(a, mid, depth + 1);
              sample(mid, b, depth + 1);
            } else emit(b);
          };
          if (points.length) emit(points[0]);
          for (let i = 1; i < points.length; i++) sample(points[i - 1], points[i]);
        }
      : undefined;
    const stream = clipCircle(
      this.cap,
      precision,
      interpolate
    )({
      point: (x: number, y: number) => {
        if (++emitted > 1_000_000)
          throw new Error('Projection sampling limit exceeded; relax tolerance');
        ring.push(originals.get(`${x},${y}`) ?? this.source([x / RAD, y / RAD]));
        if (segmentIndices) indices.push(activeSegment);
      },
      lineStart: () => {
        ring = [];
        indices = [];
      },
      lineEnd: () => {
        if (ring.length > 1) {
          output.push(ring);
          segmentIndices?.push(indices);
        }
      },
      polygonStart: () => {},
      polygonEnd: () => {}
    });
    if (polygon) stream.polygonStart();
    const emit = (p: GeographicPosition) => {
      const q = local(p);
      // Canonicalize the antipode: roundoff from oblique rotations otherwise
      // assigns the same point to opposite sides of the longitude seam.
      if (Math.abs(Math.abs(q[0]) - 180) < 1e-10 && Math.abs(q[1]) < 1e-10) {
        q[0] = 180;
        q[1] = 0;
      }
      const x = q[0] * RAD,
        y = q[1] * RAD;
      originals.set(`${x},${y}`, [...p]);
      stream.point(x, y);
    };
    const subdivide = (a: GeographicPosition, b: GeographicPosition, depth = 0) => {
      if (this.nonlinear && depth < 20) {
        const va = geographic(a),
          vb = geographic(b),
          sum = add(va, vb);
        if (Math.hypot(...sum) > 1e-10) {
          const mid = coordinates(unit(sum)),
            v = geographic(local(mid)),
            q = add(geographic(local(a)), geographic(local(b)));
          if (
            Math.hypot(...q) > 1e-10 &&
            Math.hypot(...unit(q).map((n, i) => n - v[i])) >
              Math.min(1e-6, (options?.tolerance ?? 1e-4) / this.radius)
          ) {
            subdivide(a, mid, depth + 1);
            subdivide(mid, b, depth + 1);
            return;
          }
        }
      }
      emit(b);
    };
    for (const points of rings) {
      stream.lineStart();
      if (points.length) emit(points[0]);
      for (let i = 1; i < points.length; i++) {
        activeSegment = i - 1;
        subdivide(points[i - 1], points[i]);
      }
      if (polygon && points.length) subdivide(points[points.length - 1], points[0]);
      stream.lineEnd();
    }
    if (polygon) stream.polygonEnd();
    return output;
  }
  override projectLine(
    line: readonly GeographicPosition[],
    options?: MapSamplingOptions
  ): MapLine[] {
    if (this.cap === Math.PI / 2 && !this.nonlinear) return super.projectLine(line, options);
    if (options?.pathProvenance && this.nonlinear)
      throw new Error('Nonlinear cap-clipped paths do not support source provenance');
    // Attribute streaming intersections while the owning sampled edge is active.
    // Rigid spherical rotations preserve the original great-circle semantics.
    return super.projectLine(line, options).flatMap(part => {
      const indices: number[][] | undefined = part.provenance ? [] : undefined;
      const clipped = this.clip([part.sourceCoordinates], false, options, part.regionId, indices);
      return clipped.flatMap((points, piece) =>
        super
          .projectLine(points, options)
          .filter(q => q.regionId === part.regionId)
          .map(q => {
            const parent = part.provenance,
              child = q.provenance;
            if (!parent || !child) return q;
            const provenance: NonNullable<MapLine['provenance']> = {
              segments: [],
              parameters: [],
              vertices: [],
              angularDistances: []
            };
            for (let j = 0; j < q.sourceCoordinates.length; j++) {
              const k = child.segments[j];
              // The incoming endpoint owns the clipped edge, including a newly
              // generated entry point followed by its original end vertex.
              const edge = indices![piece][k + 1];
              const a = geographic(part.sourceCoordinates[edge]),
                b = geographic(part.sourceCoordinates[edge + 1]),
                p = geographic(q.sourceCoordinates[j]);
              const length = angle(a, b),
                t = length ? Math.min(1, angle(a, p) / length) : 0;
              const endpoint = t < 1e-12 ? edge : t > 1 - 1e-12 ? edge + 1 : -1;
              const segment = parent.segments[edge + 1];
              const from = parent.segments[edge] === segment ? parent.parameters[edge] : 0;
              provenance.segments.push(endpoint >= 0 ? parent.segments[endpoint] : segment);
              provenance.parameters.push(
                endpoint >= 0
                  ? parent.parameters[endpoint]
                  : from + t * (parent.parameters[edge + 1] - from)
              );
              provenance.vertices.push(endpoint >= 0 ? parent.vertices[endpoint] : 0xffffffff);
              if (options?.pathDistances)
                provenance.angularDistances.push(
                  parent.angularDistances[edge] +
                    t * (parent.angularDistances[edge + 1] - parent.angularDistances[edge])
                );
            }
            if (options?.pathBoundaries) {
              const same = (a: GeographicPosition, b: GeographicPosition) =>
                angle(geographic(a), geographic(b)) < 1e-12;
              provenance.startReason = same(q.sourceCoordinates[0], part.sourceCoordinates[0])
                ? parent.startReason
                : 'coverage-boundary';
              provenance.endReason = same(
                q.sourceCoordinates[q.sourceCoordinates.length - 1],
                part.sourceCoordinates[part.sourceCoordinates.length - 1]
              )
                ? parent.endReason
                : 'coverage-boundary';
            }
            return {...q, provenance};
          })
      );
    });
  }

  override projectPolygon(
    rings: readonly (readonly GeographicPosition[])[],
    options?: MapSamplingOptions
  ): MapPolygon[] {
    if (this.cap === Math.PI / 2 && !this.nonlinear) return super.projectPolygon(rings, options);
    if (options?.polygonEdgeProvenance)
      throw new Error('Cap-clipped polygons do not support edge provenance');
    const result: MapPolygon[] = [];
    // Split into convex chart hemispheres first; this also validates source topology.
    for (const part of super.projectPolygon(rings, options)) {
      const region = this.regions.find(r => r.id === part.regionId)!;
      const center = geographic(region.interior),
        [x, y] = basis(center);
      const planar = (p: GeographicPosition): Position => {
        const v = geographic(p),
          d = dot(v, center);
        return [dot(v, x) / d, dot(v, y) / d];
      };
      const input = part.sourceCoordinates.map((ring, i) => {
        const open = ring.slice(0, -1);
        return ringOrientation(open.map(planar)) === (i ? 1 : -1) ? open : open.reverse();
      });
      // Circle interpolation can step just beyond a chart corner when a
      // chart edge lies on the horizon. Trim in source space, retaining exact
      // small-circle intersections and polar longitude limits.
      const trim = (ring: Position[]) => {
        for (let edge = 0; edge < region.boundary.length * 3; edge++) {
          let normal = unit(
            cross(
              geographic(region.boundary[edge % region.boundary.length]),
              geographic(region.boundary[(edge + 1) % region.boundary.length])
            )
          );
          if (dot(normal, center) < 0) normal = normal.map(v => -v) as Vector;
          const next: Position[] = [];
          for (let i = 0; i < ring.length; i++) {
            const a = ring[i],
              b = ring[(i + 1) % ring.length],
              va = geographic(a),
              vb = geographic(b);
            const da = dot(normal, va),
              db = dot(normal, vb),
              insideA = da >= 0,
              insideB = db >= 0;
            if (insideA) next.push(a);
            if (insideA !== insideB) {
              const la = geographic(this.local(a)),
                lb = geographic(this.local(b));
              const horizon =
                Math.abs(la[0] - Math.cos(this.cap)) < 1e-14 &&
                Math.abs(lb[0] - Math.cos(this.cap)) < 1e-14;
              const at = (t: number): Position => {
                if (horizon) {
                  const y = la[1] * (1 - t) + lb[1] * t,
                    z = la[2] * (1 - t) + lb[2] * t,
                    n = Math.hypot(y, z);
                  if (n > 1e-14)
                    return this.source(
                      coordinates([
                        Math.cos(this.cap),
                        (Math.sin(this.cap) * y) / n,
                        (Math.sin(this.cap) * z) / n
                      ])
                    );
                }
                return coordinates(unit(va.map((v, i) => v * (1 - t) + vb[i] * t) as Vector));
              };
              let low = 0,
                high = 1;
              for (let j = 0; j < 48; j++) {
                const mid = (low + high) / 2;
                if (dot(normal, geographic(at(mid))) >= 0 === da >= 0) low = mid;
                else high = mid;
              }
              next.push(at((low + high) / 2));
            }
          }
          ring = next;
          if (!ring.length) break;
        }
        return ring.length >= 3 ? [...ring, ring[0]] : [];
      };
      const clipped = this.clip(input, true, options, part.regionId)
        .map(trim)
        .filter(r => r.length >= 4);
      const outer = clipped.filter(r => ringOrientation(r.map(planar)) < 0),
        holes = clipped.filter(r => ringOrientation(r.map(planar)) > 0);
      const contains = (ring: Position[], point: Position) => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const a = ring[i],
            b = ring[j];
          if (
            a[1] > point[1] !== b[1] > point[1] &&
            point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
          )
            inside = !inside;
        }
        return inside;
      };
      for (const ring of outer) {
        const plane = ring.map(planar),
          sources = [ring, ...holes.filter(h => contains(plane, planar(h[0])))];
        result.push({
          regionId: part.regionId,
          sourceCoordinates: sources,
          coordinates: sources.map(r =>
            r.map(p => {
              const q = super.projectPoint(p, part.regionId);
              if (!q)
                throw new Error(
                  `Cap point outside chart ${part.regionId}: ${p}, owner ${super.findRegions(p)}`
                );
              return q.position;
            })
          )
        });
      }
    }
    return result;
  }
  override getRegionOutlines(id: string, options?: MapSamplingOptions): Position[][] {
    const region = this.regions.find(r => r.id === id)!;
    const boundary = region.boundary.map(p => [...p] as Position);
    for (let changed = true; changed && boundary.length > 3; ) {
      changed = false;
      for (let i = 0; i < boundary.length; i++) {
        const a = geographic(boundary[(i + boundary.length - 1) % boundary.length]),
          b = geographic(boundary[i]),
          c = geographic(boundary[(i + 1) % boundary.length]);
        const n = cross(a, c),
          length = Math.hypot(...n);
        if (
          length > 1e-10 &&
          Math.abs(dot(n, b)) / length < 1e-13 &&
          angle(a, b) + angle(b, c) - angle(a, c) < 1e-12
        ) {
          boundary.splice(i, 1);
          changed = true;
          break;
        }
      }
    }
    return this.projectPolygon([boundary], {
      ...options,
      chartCenter: region.interior
    } as MapSamplingOptions)
      .filter(p => p.regionId === id)
      .flatMap(p => p.coordinates);
  }
}
