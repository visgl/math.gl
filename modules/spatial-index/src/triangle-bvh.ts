// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  getClosestPointOnTriangle,
  intersectRayTriangle,
  normalizeQueryDirection,
  validateQueryPoint,
  type QueryPoint
} from '@math.gl/culling/queries';
import {BoxIndex} from './box-index';

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

  intersectRay(
    origin: QueryPoint,
    direction: QueryPoint,
    options: {maxDistance?: number; backfaceCulling?: boolean} = {}
  ): TriangleRayResult | null {
    validateQueryPoint(origin, 3);
    const unit = normalizeQueryDirection(direction, 3);
    let result: TriangleRayResult | null = null;
    for (const candidate of this.boxes.searchRay(origin, unit, options.maxDistance)) {
      if (result && candidate.distance > result.distance) break;
      const [a, b, c] = this.triangle(candidate.index);
      const hit = intersectRayTriangle(origin, unit, a, b, c, {
        backfaceCulling: options.backfaceCulling,
        maxT: result?.distance ?? options.maxDistance
      });
      if (
        hit &&
        (!result ||
          hit.t < result.distance ||
          (hit.t === result.distance && candidate.index < result.index))
      ) {
        result = {
          index: candidate.index,
          distance: hit.t,
          point: [
            origin[0] + hit.t * unit[0],
            origin[1] + hit.t * unit[1],
            origin[2] + hit.t * unit[2]
          ],
          barycentric: hit.barycentric
        };
      }
    }
    return result;
  }

  nearest(
    point: QueryPoint,
    options: {maxDistance?: number; filter?: (index: number) => boolean} = {}
  ): TriangleQueryResult | null {
    const result = this.boxes.nearest(point, {
      ...options,
      distanceToItem: index => {
        const closest = getClosestPointOnTriangle(point, ...this.triangle(index));
        return Math.hypot(point[0] - closest[0], point[1] - closest[1], point[2] - closest[2]);
      }
    });
    return result
      ? {...result, point: getClosestPointOnTriangle(point, ...this.triangle(result.index))}
      : null;
  }

  private triangle(index: number): [Float64Array, Float64Array, Float64Array] {
    const vertex = (i: number): Float64Array => {
      const start = this.indices[index * 3 + i] * 3;
      return this.positions.subarray(start, start + 3);
    };
    return [vertex(0), vertex(1), vertex(2)];
  }
}
