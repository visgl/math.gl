// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  TriangleBVH,
  BoxIndex,
  type IndexQueryBudget,
  type IndexQueryResult
} from '@math.gl/geometry/spatial-index';
import type {HeightField} from './height-field';
import {createTerrainMesh} from './mesh';
import {TerrainSampleStatus as Status, type TerrainSample} from './types';

export type TerrainSurfaceProps = {
  /** Packed local XYZ in meters, copied at construction. */
  positions: Float32Array | Float64Array;
  /** Original triangle-list order is preserved in all query results. */
  indices: Uint16Array | Uint32Array;
  /** Zero excludes a triangle from all queries and topology (e.g. visual skirts). */
  triangleValidity?: Uint8Array;
  origin?: readonly [number, number, number];
  heightReference?: string;
};
export type TerrainSurfaceSample = TerrainSample & {
  triangleIndex: number;
  /** Weights in original triangle vertex order. Zero on failure. */
  barycentric: [number, number, number];
};
export type TerrainSurfaceHit = {
  triangleIndex: number;
  distance: number;
  point: [number, number, number];
  /** Upward contact normal, independent of source winding. */
  normal: [number, number, number];
};
export type TerrainSurfaceRayHit = TerrainSurfaceHit & {barycentric: [number, number, number]};
export type TerrainQueryOptions = IndexQueryBudget & {maxDistance?: number};
export type TerrainQueryResult<T> = IndexQueryResult<T>;
export type TerrainSphereContact = Omit<TerrainSurfaceHit, 'normal'> & {
  /** Unit direction from the closest terrain point toward the center; upward face normal at zero distance. */
  normal: [number, number, number];
  /** Upward triangle normal, independent of the contact feature or side. */
  faceNormal: [number, number, number];
  penetration: number;
};
export type TerrainSegmentHit = TerrainSurfaceHit & {
  /** Closest point on the input segment, in world coordinates. */
  segmentPoint: [number, number, number];
  /** Closest-pair parameter, not first-impact time. */
  segmentFraction: number;
};
export type TerrainCapsuleContact = TerrainSphereContact & {
  segmentPoint: [number, number, number];
  segmentFraction: number;
};
export type TerrainSurfaceTopology = {
  /** 3 * triangleIndex + local edge; each edge runs vertex j to (j+1)%3. -1 = boundary/inactive. */
  halfedges: Int32Array;
  /** Active halfedges with no opposite, in original triangle/edge order. */
  boundaryHalfedges: Uint32Array;
};

/** Immutable indexed 2.5D terrain. Active triangles must have nondegenerate XY projections.
 * Shared indexed edges must be manifold and consistently wound; disconnected components
 * and overlapping XY footprints are allowed. Height queries choose the uppermost surface.
 */
export class TerrainSurface {
  readonly origin: readonly [number, number, number];
  readonly heightReference: string;
  readonly triangleCount: number;
  readonly activeTriangleCount: number;
  private readonly positions: Float64Array;
  private readonly indices: Uint32Array;
  private readonly validity: Uint8Array;
  private readonly gradients: Float64Array;
  private readonly normals: Float64Array;
  private readonly topology: TerrainSurfaceTopology;
  private readonly xyIndex: BoxIndex;
  private readonly bvh: TriangleBVH;

  constructor(props: TerrainSurfaceProps) {
    if (
      !(props.positions instanceof Float32Array || props.positions instanceof Float64Array) ||
      props.positions.length % 3
    )
      throw new Error('Terrain positions must be packed Float32/Float64 XYZ');
    if (
      !(props.indices instanceof Uint16Array || props.indices instanceof Uint32Array) ||
      props.indices.length % 3 ||
      props.indices.length > 0x7fffffff
    )
      throw new Error(
        'Terrain indices must form a Uint16/Uint32 triangle list within int32 topology capacity'
      );
    const origin = props.origin ?? [0, 0, 0];
    if (
      origin.length !== 3 ||
      !Number.isFinite(origin[0]) ||
      !Number.isFinite(origin[1]) ||
      !Number.isFinite(origin[2])
    )
      throw new Error('Terrain origin must be finite XYZ');
    this.origin = Object.freeze([origin[0], origin[1], origin[2]]);
    this.heightReference = props.heightReference ?? 'unknown';
    if (typeof this.heightReference !== 'string')
      throw new Error('Terrain height reference must be a string');
    this.positions = Float64Array.from(props.positions);
    if (!this.positions.every(Number.isFinite)) throw new Error('Terrain positions must be finite');
    this.indices = Uint32Array.from(props.indices);
    this.triangleCount = this.indices.length / 3;
    if (
      props.triangleValidity !== undefined &&
      (!(props.triangleValidity instanceof Uint8Array) ||
        props.triangleValidity.length !== this.triangleCount)
    )
      throw new Error('Terrain triangle validity must match triangle count');
    this.validity = Uint8Array.from({length: this.triangleCount}, (_, i) =>
      !props.triangleValidity || props.triangleValidity[i] ? 1 : 0
    );
    for (const index of this.indices)
      if (index >= this.positions.length / 3) throw new Error('Terrain vertex index out of bounds');
    this.gradients = new Float64Array(this.triangleCount * 2);
    this.normals = new Float64Array(this.triangleCount * 3);
    const bounds = new Float64Array(this.triangleCount * 4);
    let active = 0;
    for (let i = 0; i < this.triangleCount; i++) {
      const [a, b, c] = this.triangle(i);
      bounds.set(
        [
          Math.min(a[0], b[0], c[0]),
          Math.min(a[1], b[1], c[1]),
          Math.max(a[0], b[0], c[0]),
          Math.max(a[1], b[1], c[1])
        ],
        i * 4
      );
      if (!this.validity[i]) continue;
      const ax = b[0] - a[0],
        ay = b[1] - a[1],
        az = b[2] - a[2];
      const bx = c[0] - a[0],
        by = c[1] - a[1],
        bz = c[2] - a[2];
      const determinant = ax * by - ay * bx;
      const scale = Math.hypot(ax, ay) * Math.hypot(bx, by);
      if (!Number.isFinite(determinant) || Math.abs(determinant) <= Number.EPSILON * scale)
        throw new Error(
          'Active terrain triangles need finite, nondegenerate XY projections; use a local frame'
        );
      const gx = (az * by - ay * bz) / determinant;
      const gy = (ax * bz - az * bx) / determinant;
      if (!Number.isFinite(gx) || !Number.isFinite(gy))
        throw new Error('Terrain gradient overflow');
      this.gradients.set([gx, gy], i * 2);
      const s = Math.max(1, Math.abs(gx), Math.abs(gy));
      const length = Math.hypot(gx / s, gy / s, 1 / s);
      this.normals.set([-gx / s / length, -gy / s / length, 1 / s / length], i * 3);
      active++;
    }
    this.activeTriangleCount = active;
    this.topology = buildTopology(this.indices, this.validity);
    this.xyIndex = new BoxIndex({bounds, dimension: 2});
    this.bvh = new TriangleBVH({positions: this.positions, indices: this.indices});
  }

  /** Detached source data; changing these buffers never changes this surface. */
  copyData(): {positions: Float64Array; indices: Uint32Array; triangleValidity: Uint8Array} {
    return {
      positions: this.positions.slice(),
      indices: this.indices.slice(),
      triangleValidity: this.validity.slice()
    };
  }

  copyTopology(): TerrainSurfaceTopology {
    return {
      halfedges: this.topology.halfedges.slice(),
      boundaryHalfedges: this.topology.boundaryHalfedges.slice()
    };
  }

  /** World XY height, planar gradient and contact normal. Highest local Z wins; exact ties use the lowest triangle index. */
  sample(x: number, y: number): TerrainSurfaceSample {
    const result: TerrainSurfaceSample = {
      status: Status.INVALID_INPUT,
      height: 0,
      gradientStatus: Status.INVALID_INPUT,
      gradientX: 0,
      gradientY: 0,
      normalX: 0,
      normalY: 0,
      normalZ: 0,
      triangleIndex: -1,
      barycentric: [0, 0, 0]
    };
    if (!Number.isFinite(x) || !Number.isFinite(y)) return result;
    const px = x - this.origin[0],
      py = y - this.origin[1];
    if (!Number.isFinite(px) || !Number.isFinite(py)) {
      result.status = result.gradientStatus = Status.NUMERIC_ERROR;
      return result;
    }
    result.status = result.gradientStatus = Status.NO_DATA;
    let best = -Infinity;
    for (const i of this.xyIndex.search([px, py], [px, py])) {
      if (!this.validity[i]) continue;
      const [a, b, c] = this.triangle(i);
      const ax = b[0] - a[0],
        ay = b[1] - a[1],
        bx = c[0] - a[0],
        by = c[1] - a[1];
      const determinant = ax * by - ay * bx;
      const dx = px - a[0],
        dy = py - a[1];
      const u = (dx * by - dy * bx) / determinant;
      const v = (ax * dy - ay * dx) / determinant;
      if (u < 0 || v < 0 || u + v > 1 || !Number.isFinite(u) || !Number.isFinite(v)) continue;
      const weights: [number, number, number] = [1 - u - v, u, v];
      const height = weights[0] * a[2] + u * b[2] + v * c[2];
      if (!Number.isFinite(height)) {
        result.status = result.gradientStatus = Status.NUMERIC_ERROR;
        result.triangleIndex = -1;
        result.barycentric = [0, 0, 0];
        return result;
      }
      if (height <= best) continue;
      best = height;
      result.triangleIndex = i;
      result.barycentric = weights;
    }
    if (result.triangleIndex < 0) return result;
    const height = best + this.origin[2];
    if (!Number.isFinite(height)) {
      result.triangleIndex = -1;
      result.barycentric = [0, 0, 0];
      result.status = result.gradientStatus = Status.NUMERIC_ERROR;
      return result;
    }
    const i = result.triangleIndex;
    result.status = result.gradientStatus = Status.VALID;
    result.height = height;
    result.gradientX = this.gradients[i * 2];
    result.gradientY = this.gradients[i * 2 + 1];
    result.normalX = this.normals[i * 3];
    result.normalY = this.normals[i * 3 + 1];
    result.normalZ = this.normals[i * 3 + 2];
    return result;
  }

  /** Two-sided ray query; distance limits are Euclidean meters, independent of direction magnitude. */
  intersectRay(
    origin: readonly [number, number, number],
    direction: readonly [number, number, number],
    options: {maxDistance?: number} = {}
  ): TerrainSurfaceRayHit | null {
    return this.intersectRayQuery(origin, direction, {...options, maxWork: Infinity}).result;
  }

  /** A partial hit is provisional; an incomplete null result does not establish a miss. */
  intersectRayQuery(
    origin: readonly [number, number, number],
    direction: readonly [number, number, number],
    options: TerrainQueryOptions = {}
  ): TerrainQueryResult<TerrainSurfaceRayHit | null> {
    const query = this.bvh.intersectRayQuery(this.localPoint(origin), direction, {
      ...options,
      filter: i => Boolean(this.validity[i])
    });
    const hit = query.result;
    return {...query, result: hit ? {...this.toHit(hit), barycentric: [...hit.barycentric]} : null};
  }

  /** Closed segment query. A zero-length segment has no directional intersection. */
  intersectSegment(
    start: readonly [number, number, number],
    end: readonly [number, number, number]
  ): TerrainSurfaceRayHit | null {
    return this.intersectSegmentQuery(start, end).result;
  }

  intersectSegmentQuery(
    start: readonly [number, number, number],
    end: readonly [number, number, number],
    options: IndexQueryBudget = {}
  ): TerrainQueryResult<TerrainSurfaceRayHit | null> {
    this.localPoint(start);
    this.localPoint(end);
    const direction: [number, number, number] = [
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2]
    ];
    const distance = Math.hypot(...direction);
    if (!Number.isFinite(distance)) throw new Error('Terrain segment length overflow');
    if (!distance) {
      // Validate even when there is no directional query to perform.
      const limit = options.maxWork ?? Infinity;
      if (limit !== Infinity && (!Number.isSafeInteger(limit) || limit < 0))
        throw new Error('Invalid terrain query work limit');
      return {result: null, complete: true, work: 0};
    }
    return this.intersectRayQuery(start, direction, {...options, maxDistance: distance});
  }

  /** Exact Euclidean nearest point, not vertical ground clearance. */
  nearest(
    point: readonly [number, number, number],
    options: {maxDistance?: number} = {}
  ): TerrainSurfaceHit | null {
    return this.nearestQuery(point, {...options, maxWork: Infinity}).result;
  }

  nearestQuery(
    point: readonly [number, number, number],
    options: TerrainQueryOptions = {}
  ): TerrainQueryResult<TerrainSurfaceHit | null> {
    const query = this.bvh.nearestQuery(this.localPoint(point), {
      ...options,
      filter: i => Boolean(this.validity[i])
    });
    return {...query, result: query.result ? this.toHit(query.result) : null};
  }

  /** Two-sided contacts with the triangle sheet, not solid-ground penetration or swept collision.
   * Adjacent triangles may contribute coincident contacts. Incomplete lists are not manifolds.
   */
  intersectSphere(
    center: readonly [number, number, number],
    radius: number,
    options: IndexQueryBudget & {maxContacts?: number} = {}
  ): TerrainQueryResult<TerrainSphereContact[]> {
    const local = this.localPoint(center);
    const query = this.bvh.intersectSphere(local, radius, {
      maxWork: options.maxWork,
      maxResults: options.maxContacts,
      filter: i => Boolean(this.validity[i])
    });
    return {
      ...query,
      result: query.result.map(hit => {
        const contact = this.toHit(hit);
        // Compute in the local frame: adding a large world origin can round the contact point.
        const normal: [number, number, number] = hit.distance
          ? [
              (local[0] - hit.point[0]) / hit.distance,
              (local[1] - hit.point[1]) / hit.distance,
              (local[2] - hit.point[2]) / hit.distance
            ]
          : [...contact.normal];
        return {...contact, faceNormal: contact.normal, normal, penetration: radius - hit.distance};
      })
    };
  }

  /** Minimum Euclidean clearance along a closed segment; this is not vertical clearance. */
  nearestSegment(
    start: readonly [number, number, number],
    end: readonly [number, number, number],
    options: {maxDistance?: number} = {}
  ): TerrainSegmentHit | null {
    return this.nearestSegmentQuery(start, end, {...options, maxWork: Infinity}).result;
  }

  nearestSegmentQuery(
    start: readonly [number, number, number],
    end: readonly [number, number, number],
    options: TerrainQueryOptions = {}
  ): TerrainQueryResult<TerrainSegmentHit | null> {
    const query = this.bvh.nearestSegmentQuery(this.localPoint(start), this.localPoint(end), {
      ...options,
      filter: i => Boolean(this.validity[i])
    });
    const hit = query.result;
    return {
      ...query,
      result: hit
        ? {
            ...this.toHit(hit),
            segmentPoint: this.worldPoint(hit.segmentPoint),
            segmentFraction: hit.segmentFraction
          }
        : null
    };
  }

  /** Contacts with a closed capsule's entire axis, including its interior and both caps.
   * Fractions locate minimum separation, not the first time a translating sphere touches terrain.
   */
  intersectCapsule(
    start: readonly [number, number, number],
    end: readonly [number, number, number],
    radius: number,
    options: IndexQueryBudget & {maxContacts?: number} = {}
  ): TerrainQueryResult<TerrainCapsuleContact[]> {
    const query = this.bvh.intersectCapsule(this.localPoint(start), this.localPoint(end), radius, {
      maxWork: options.maxWork,
      maxResults: options.maxContacts,
      filter: i => Boolean(this.validity[i])
    });
    return {
      ...query,
      result: query.result.map(hit => {
        const contact = this.toHit(hit);
        const normal: [number, number, number] = hit.distance
          ? [
              (hit.segmentPoint[0] - hit.point[0]) / hit.distance,
              (hit.segmentPoint[1] - hit.point[1]) / hit.distance,
              (hit.segmentPoint[2] - hit.point[2]) / hit.distance
            ]
          : [...contact.normal];
        return {
          ...contact,
          normal,
          faceNormal: contact.normal,
          penetration: radius - hit.distance,
          segmentPoint: this.worldPoint(hit.segmentPoint),
          segmentFraction: hit.segmentFraction
        };
      })
    };
  }

  private worldPoint(point: readonly [number, number, number]): [number, number, number] {
    const world: [number, number, number] = [
      point[0] + this.origin[0],
      point[1] + this.origin[1],
      point[2] + this.origin[2]
    ];
    if (!world.every(Number.isFinite)) throw new Error('Terrain query result overflow');
    return world;
  }

  private localPoint(point: readonly [number, number, number]): [number, number, number] {
    if (
      point.length !== 3 ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1]) ||
      !Number.isFinite(point[2])
    )
      throw new Error('Terrain query point must be finite XYZ');
    const local: [number, number, number] = [
      point[0] - this.origin[0],
      point[1] - this.origin[1],
      point[2] - this.origin[2]
    ];
    if (!local.every(Number.isFinite)) throw new Error('Terrain query coordinate overflow');
    return local;
  }

  private toHit(hit: {
    index: number;
    distance: number;
    point: [number, number, number];
  }): TerrainSurfaceHit {
    const point = this.worldPoint(hit.point);
    if (!Number.isFinite(hit.distance)) throw new Error('Terrain query result overflow');
    const i = hit.index * 3;
    return {
      triangleIndex: hit.index,
      distance: hit.distance,
      point,
      normal: [this.normals[i], this.normals[i + 1], this.normals[i + 2]]
    };
  }

  private triangle(index: number): [Float64Array, Float64Array, Float64Array] {
    return [0, 1, 2].map(j => {
      const start = this.indices[index * 3 + j] * 3;
      return this.positions.subarray(start, start + 3);
    }) as [Float64Array, Float64Array, Float64Array];
  }
}

function buildTopology(indices: Uint32Array, validity: Uint8Array): TerrainSurfaceTopology {
  const halfedges = new Int32Array(indices.length).fill(-1);
  const edges = new Map<string, number>();
  for (let i = 0; i < indices.length; i++) {
    const triangle = Math.floor(i / 3);
    if (!validity[triangle]) continue;
    const a = indices[i],
      b = indices[triangle * 3 + (((i % 3) + 1) % 3)];
    const key = a < b ? `${a}/${b}` : `${b}/${a}`;
    const opposite = edges.get(key);
    if (opposite === undefined) edges.set(key, i);
    else {
      if (halfedges[opposite] !== -1) throw new Error('Nonmanifold terrain edge');
      if (indices[opposite] === a) throw new Error('Inconsistent terrain triangle winding');
      halfedges[i] = opposite;
      halfedges[opposite] = i;
    }
  }
  const boundary: number[] = [];
  for (let i = 0; i < halfedges.length; i++)
    if (validity[Math.floor(i / 3)] && halfedges[i] === -1) boundary.push(i);
  return {halfedges, boundaryHalfedges: Uint32Array.from(boundary)};
}

/** Builds a CPU query surface from the regular triangle mesh, preserving holes and its local origin. */
export function createTerrainSurface(
  field: HeightField,
  options: {origin?: readonly [number, number, number]} = {}
): TerrainSurface {
  const mesh = createTerrainMesh(field, options);
  return new TerrainSurface({
    positions: mesh.positions,
    indices: mesh.indices,
    origin: mesh.origin,
    heightReference: field.heightReference
  });
}
