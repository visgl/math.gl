// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  getClosestPointOnTriangle,
  intersectRayTriangle,
  normalizeQueryDirection,
  validateQueryPoint,
  type QueryPoint
} from '../culling/queries';
import {
  BoxIndex,
  type IndexQueryBudget,
  type IndexQueryResult,
  type SearchIndexOptions
} from './box-index';

export type TriangleBVHOptions = {
  /** Packed xyz vertices. Copied at construction. */
  positions: ArrayLike<number>;
  /** Triangle-list vertex indices. Omit for non-indexed triangles. */
  indices?: ArrayLike<number>;
  leafSize?: number;
};
export type TriangleQueryResult = {
  index: number;
  distance: number;
  point: [number, number, number];
};
export type TriangleRayResult = TriangleQueryResult & {barycentric: [number, number, number]};
export type TriangleNearestOptions = {maxDistance?: number; filter?: (index: number) => boolean};

/** Optional application constraints for the nearest accepted triangle intersection. */
export type TriangleRayOptions = {
  /** Inclusive Euclidean distance limit in input-coordinate units; defaults to Infinity. */
  maxDistance?: number;
  /** Ignore triangles facing away from the ray; defaults to false. */
  backfaceCulling?: boolean;
  /** Exclude an original triangle index before running its exact intersection kernel. */
  filter?: (index: number) => boolean;
  /**
   * Accept or reject an exact hit using its point and original-order barycentric weights.
   * Rejected hits do not shorten the search: a valid surface behind a hole can still win.
   * Called only for candidates that could improve the current accepted result, not all hits.
   * Treat the detached candidate as immutable; traversal order is unspecified.
   */
  acceptHit?: (
    hit: Readonly<Omit<TriangleRayResult, 'point' | 'barycentric'>> & {
      readonly point: readonly [number, number, number];
      readonly barycentric: readonly [number, number, number];
    }
  ) => boolean;
};

/** Static triangle-list BVH. index is the original triangle number, not a vertex index. */
export class TriangleBVH {
  readonly size: number;
  private readonly positions: Float64Array;
  private readonly indices: Uint32Array;
  private readonly boxes: BoxIndex;

  constructor(options: TriangleBVHOptions) {
    if (options.positions.length % 3) throw new RangeError('Positions must be packed xyz');
    this.positions = Float64Array.from(options.positions);
    for (const value of this.positions) {
      if (!Number.isFinite(value)) throw new RangeError('Positions must be finite');
    }
    const source = options.indices ?? Array.from({length: this.positions.length / 3}, (_, i) => i);
    if (source.length % 3) throw new RangeError('Indices must form triangles');
    this.indices = new Uint32Array(source.length);
    for (let i = 0; i < source.length; i++) {
      if (
        !Number.isSafeInteger(source[i]) ||
        source[i] < 0 ||
        source[i] >= this.positions.length / 3 ||
        source[i] > 0xffffffff
      ) {
        throw new RangeError('Triangle index is out of bounds');
      }
      this.indices[i] = source[i];
    }
    this.size = this.indices.length / 3;
    const bounds = new Float64Array(this.size * 6);
    for (let i = 0; i < this.size; i++) {
      const [a, b, c] = this.triangle(i);
      for (let axis = 0; axis < 3; axis++) {
        bounds[i * 6 + axis] = Math.min(a[axis], b[axis], c[axis]);
        bounds[i * 6 + axis + 3] = Math.max(a[axis], b[axis], c[axis]);
      }
    }
    this.boxes = new BoxIndex({bounds, dimension: 3, leafSize: options.leafSize});
  }

  /** Bounds candidates only; does not imply exact triangle/box overlap. */
  search(minimum: QueryPoint, maximum: QueryPoint): number[] {
    return this.boxes.search(minimum, maximum);
  }

  searchQuery(
    minimum: QueryPoint,
    maximum: QueryPoint,
    options: SearchIndexOptions = {}
  ): IndexQueryResult<number[]> {
    return this.boxes.searchQuery(minimum, maximum, options);
  }

  /** Nearest accepted exact hit; application rejection never clips away later candidates. */
  intersectRay(
    origin: QueryPoint,
    direction: QueryPoint,
    options: TriangleRayOptions = {}
  ): TriangleRayResult | null {
    return this.intersectRayQuery(origin, direction, {...options, maxWork: Infinity}).result;
  }

  intersectRayQuery(
    origin: QueryPoint,
    direction: QueryPoint,
    options: TriangleRayOptions & IndexQueryBudget = {}
  ): IndexQueryResult<TriangleRayResult | null> {
    validateQueryPoint(origin, 3);
    const unit = normalizeQueryDirection(direction, 3);
    let result: TriangleRayResult | null = null;
    const query = this.boxes.intersectRayQuery(origin, direction, {
      maxWork: options.maxWork,
      maxDistance: options.maxDistance,
      filter: options.filter,
      intersectItem: (index, maximum) => {
        const [a, b, c] = this.triangle(index);
        const hit = intersectRayTriangle(origin, unit, a, b, c, {
          backfaceCulling: options.backfaceCulling,
          maxT: maximum
        });
        if (
          hit &&
          (!result ||
            hit.t < result.distance ||
            (hit.t === result.distance && index < result.index))
        ) {
          const candidateHit: TriangleRayResult = {
            index,
            distance: hit.t,
            point: [
              origin[0] + hit.t * unit[0],
              origin[1] + hit.t * unit[1],
              origin[2] + hit.t * unit[2]
            ],
            barycentric: hit.barycentric
          };
          if (!options.acceptHit || options.acceptHit(candidateHit)) {
            result = candidateHit;
            return hit.t;
          }
        }
        return null;
      }
    });
    return {...query, result};
  }

  nearest(point: QueryPoint, options: TriangleNearestOptions = {}): TriangleQueryResult | null {
    return this.nearestQuery(point, {...options, maxWork: Infinity}).result;
  }

  nearestQuery(
    point: QueryPoint,
    options: TriangleNearestOptions & IndexQueryBudget = {}
  ): IndexQueryResult<TriangleQueryResult | null> {
    let candidate: TriangleQueryResult | null = null;
    const query = this.boxes.nearestQuery(point, {
      ...options,
      distanceToItem: index => {
        const closest = getClosestPointOnTriangle(point, ...this.triangle(index));
        const distance = Math.hypot(
          point[0] - closest[0],
          point[1] - closest[1],
          point[2] - closest[2]
        );
        if (
          !candidate ||
          distance < candidate.distance ||
          (distance === candidate.distance && index < candidate.index)
        )
          candidate = {index, distance, point: closest};
        return distance;
      }
    });
    // Reuse the winning refinement rather than running an extra kernel outside the budget.
    return {...query, result: query.result ? candidate : null};
  }

  /** All triangle contacts with a closed sphere, sorted by original index (not distance).
   * Uses closest points on faces, edges and vertices. No contact manifold reduction.
   */
  intersectSphere(
    center: QueryPoint,
    radius: number,
    options: SearchIndexOptions = {}
  ): IndexQueryResult<TriangleQueryResult[]> {
    validateQueryPoint(center, 3);
    if (!Number.isFinite(radius) || radius < 0)
      throw new RangeError('Sphere radius must be finite and nonnegative');
    const minimum: number[] = [],
      maximum: number[] = [];
    for (let axis = 0; axis < 3; axis++) {
      // Outward allowance keeps the broad phase from dropping roundoff-sized tangencies.
      // The exact kernel below still uses the caller's unmodified radius.
      const padding =
        8 * Math.max(Number.MIN_VALUE, Number.EPSILON * Math.max(Math.abs(center[axis]), radius));
      minimum.push(center[axis] - radius - padding);
      maximum.push(center[axis] + radius + padding);
    }
    const hits = new Map<number, TriangleQueryResult>();
    const query = this.boxes.searchQuery(minimum, maximum, {
      ...options,
      filter: index => {
        if (options.filter && !options.filter(index)) return false;
        const point = getClosestPointOnTriangle(center, ...this.triangle(index));
        const distance = Math.hypot(
          center[0] - point[0],
          center[1] - point[1],
          center[2] - point[2]
        );
        if (!point.every(Number.isFinite) || !Number.isFinite(distance))
          throw new RangeError('Sphere query arithmetic overflow');
        if (distance > radius) return false;
        hits.set(index, {index, distance, point});
        return true;
      }
    });
    return {...query, result: query.result.map(index => hits.get(index)!)};
  }

  private triangle(index: number): [Float64Array, Float64Array, Float64Array] {
    const vertex = (i: number): Float64Array => {
      const start = this.indices[index * 3 + i] * 3;
      return this.positions.subarray(start, start + 3);
    };
    return [vertex(0), vertex(1), vertex(2)];
  }
}
