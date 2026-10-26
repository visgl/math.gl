// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original octant atlas and provenance adapter around the existing ISC d3-geo spherical clipper; its license is retained in spherical-clip/D3-GEO-LICENSE.txt.
import polygonClipping from 'polygon-clipping';
import clipCircle from './spherical-clip/clip-circle.js';
import {
  angle,
  basis,
  coordinates,
  cross,
  dot,
  geographic,
  ringOrientation,
  unit,
  validateArc,
  RAD,
  type Position,
  type Vector
} from './math';
import type {GeographicPosition, MapPolygon, MapSamplingOptions, MapSurface} from './map-layout';

export type SphericalCutOptions = {
  /** Filled side of every directed minor-great-circle boundary. Do not infer complements from winding magnitude. */
  interior: 'left' | 'right';
  /** Bound input and intermediate emitted vertices; default 65536. */
  maxVertices?: number;
  /** Bound adapter vertex visits and source-edge comparisons; default 1000000. */
  maxWork?: number;
};
export type SphericalCutEdge =
  | {
      kind: 'source';
      ringIndex: number;
      edgeIndex: number;
      startFraction: number;
      endFraction: number;
    }
  | {kind: 'cut'; axis: 0 | 1 | 2};
export type SphericalCutPolygon = {
  /** Stable signed-axis octant identifier. Adjacent cells share their boundary. */
  cellId: string;
  /** Outer first, then holes; explicitly closed. All output storage belongs to the caller. */
  rings: Position[][];
  /** One record per ring edge; generated atlas edges never pretend to be input edges. */
  edges: SphericalCutEdge[][];
};
const TOL = 2e-12;

/** Partition global spherical polygons into an open-hemisphere atlas before map clipping.
 * Input topology must be valid. This does not reinterpret edges as ellipsoid geodesics/rhumbs.
 */
export function cutSphericalPolygon(
  rings: readonly (readonly GeographicPosition[])[],
  options: SphericalCutOptions
): SphericalCutPolygon[] {
  const maxVertices = options.maxVertices ?? 65536,
    maxWork = options.maxWork ?? 1000000;
  if (
    !['left', 'right'].includes(options.interior) ||
    !Number.isSafeInteger(maxVertices) ||
    maxVertices < 3 ||
    maxVertices > 1000000 ||
    !Number.isSafeInteger(maxWork) ||
    maxWork < 1 ||
    maxWork > 1e8
  )
    throw new RangeError('Invalid spherical cut side or limits');
  let work = 0,
    emitted = 0;
  const tick = (n = 1) => {
    work += n;
    if (work > maxWork) throw new RangeError('Spherical cut work limit exceeded');
  };
  const count = () => {
    tick();
    if (++emitted > maxVertices) throw new RangeError('Spherical cut vertex limit exceeded');
  };
  const input = rings.map(ring => {
    if (ring.length > maxVertices) throw new RangeError('Spherical cut vertex limit exceeded');
    const points = ring.map(p => {
      count();
      return geographic(p);
    });
    if (points.length > 1 && angle(points[0], points[points.length - 1]) < TOL) points.pop();
    if (points.length < 3) throw new RangeError('Spherical rings need at least three vertices');
    points.forEach((p, i) => validateArc(p, points[(i + 1) % points.length]));
    return points;
  });
  if (!input.length) return [];
  const boundary = (output: Vector[][], normal: Vector): Vector[][] => {
    const [x, y] = basis(normal),
      result: Vector[][] = [];
    let ring: Vector[] = [];
    const sink = {
      polygonStart() {},
      polygonEnd() {},
      lineStart() {
        ring = [];
      },
      lineEnd() {
        if (ring.length >= 3) result.push(ring);
      },
      point(lon: number, lat: number) {
        count();
        const v = geographic([lon / RAD, lat / RAD]);
        const p: Vector = [0, 1, 2].map(
          i => normal[i] * v[0] + x[i] * v[1] + y[i] * v[2]
        ) as Vector;
        ring.push(unit(p));
      }
    };
    const stream = clipCircle(Math.PI / 3, Math.PI / 90)(sink);
    stream.polygonStart();
    for (const r of output) {
      stream.lineStart();
      for (const p of r) {
        tick();
        const q = coordinates([dot(normal, p), dot(x, p), dot(y, p)]);
        stream.point(q[0] * RAD, q[1] * RAD);
      }
      stream.lineEnd();
    }
    stream.polygonEnd();
    return result;
  };
  const source = (a: Vector, b: Vector): SphericalCutEdge => {
    for (let ringIndex = 0; ringIndex < input.length; ringIndex++) {
      const ring = input[ringIndex];
      for (let edgeIndex = 0; edgeIndex < ring.length; edgeIndex++) {
        tick();
        const p = ring[edgeIndex],
          q = ring[(edgeIndex + 1) % ring.length],
          length = angle(p, q);
        if (length < TOL) continue;
        const n = unit(cross(p, q));
        if (Math.abs(dot(n, a)) > TOL || Math.abs(dot(n, b)) > TOL) continue;
        const at = (v: Vector) => Math.atan2(dot(cross(p, v), n), dot(p, v)) / length;
        const startFraction = at(a),
          endFraction = at(b);
        if (
          Math.min(startFraction, endFraction) >= -TOL &&
          Math.max(startFraction, endFraction) <= 1 + TOL
        )
          return {
            kind: 'source',
            ringIndex,
            edgeIndex,
            startFraction: Math.max(0, Math.min(1, startFraction)),
            endFraction: Math.max(0, Math.min(1, endFraction))
          };
      }
    }
    for (let axis = 0; axis < 3; axis++)
      if (Math.abs(a[axis]) < TOL && Math.abs(b[axis]) < TOL)
        return {kind: 'cut', axis: axis as 0 | 1 | 2};
    throw new RangeError('Spherical cut edge lost its source or boundary');
  };
  const result: SphericalCutPolygon[] = [];
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        const center = unit([sx, sy, sz]),
          [x, y] = basis(center);
        let clipped = input.map(r =>
          options.interior === 'left' ? r.slice().reverse() : r.slice()
        );
        // A 60-degree cap strictly contains the octant (54.736 degrees at
        // its vertices). Its two-degree boundary chords remain outside the
        // octant, so their approximation cannot become an output boundary.
        clipped = boundary(clipped, center);
        const outer: Position[][] = [],
          holes: Position[][] = [];
        for (const r of clipped) {
          let planar = r.map(
            p => [dot(x, p) / dot(center, p), dot(y, p) / dot(center, p)] as Position
          );
          // Drop duplicate/collinear clip-boundary vertices before Boolean reconstruction.
          let changed = true;
          while (changed && planar.length >= 3) {
            changed = false;
            for (let i = 0; i < planar.length; i++) {
              tick();
              const a = planar[(i + planar.length - 1) % planar.length],
                b = planar[i],
                c = planar[(i + 1) % planar.length];
              const ab = Math.hypot(b[0] - a[0], b[1] - a[1]),
                bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
              const turn = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
              if (ab < TOL || bc < TOL || Math.abs(turn) < TOL * ab * bc) {
                planar.splice(i, 1);
                changed = true;
                break;
              }
            }
          }
          if (planar.length < 3) continue;
          const orientation = ringOrientation(planar);
          if (!orientation) continue;
          planar.reverse();
          planar.push(planar[0]);
          (orientation < 0 ? outer : holes).push(planar);
        }
        if (!outer.length) continue;
        const merged =
          outer.length === 1
            ? [outer]
            : polygonClipping.union([outer[0]], ...outer.slice(1).map(r => [r]));
        const filled = holes.length
          ? polygonClipping.difference(merged, ...holes.map(r => [r]))
          : merged;
        const mask = (
          [
            [sx, 0, 0],
            [0, sy, 0],
            [0, 0, sz]
          ] as Vector[]
        ).map(p => [dot(x, p) / dot(center, p), dot(y, p) / dot(center, p)] as Position);
        const polygons = polygonClipping.intersection(filled, [mask]);
        for (const polygon of polygons) {
          let vectors = polygon.map(r =>
            r.map(([a, b]) => unit([0, 1, 2].map(i => center[i] + a * x[i] + b * y[i]) as Vector))
          );
          // Boolean reconstruction may combine collinear source edges. Restore
          // original vertices so every retained source interval has one owner.
          vectors = vectors.map(r => {
            const out: Vector[] = [r[0]];
            for (let i = 1; i < r.length; i++) {
              const a = r[i - 1],
                b = r[i],
                length = angle(a, b),
                candidates: {t: number; p: Vector}[] = [];
              if (length > TOL) {
                const n = unit(cross(a, b));
                for (const ring of input)
                  for (const p of ring) {
                    tick();
                    if (Math.abs(dot(n, p)) > TOL) continue;
                    const t = Math.atan2(dot(cross(a, p), n), dot(a, p)) / length;
                    if (t > TOL && t < 1 - TOL) candidates.push({t, p});
                  }
              }
              candidates.sort((a, b) => a.t - b.t);
              for (const {p} of candidates) if (angle(out[out.length - 1], p) > TOL) out.push(p);
              out.push(b);
            }
            return out;
          });
          for (const r of vectors) for (const _ of r) count();
          result.push({
            cellId: `${sx},${sy},${sz}`,
            rings: vectors.map(r => r.map(coordinates)),
            edges: vectors.map(r => r.slice(0, -1).map((p, i) => source(p, r[i + 1])))
          });
        }
      }
  return result;
}

/** Use existing map-specific lobe, face, cap and placement clipping after atlas partitioning. */
export function projectSphericalPolygon(
  map: Pick<MapSurface, 'projectPolygon'>,
  rings: readonly (readonly GeographicPosition[])[],
  options: SphericalCutOptions & MapSamplingOptions
): MapPolygon[] {
  const result: MapPolygon[] = [];
  for (const part of cutSphericalPolygon(rings, options))
    result.push(...map.projectPolygon(part.rings, options));
  return result;
}
