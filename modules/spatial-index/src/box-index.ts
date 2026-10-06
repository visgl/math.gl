// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  intersectRayBounds,
  normalizeQueryDirection,
  validateQueryDistance,
  validateQueryPoint,
  type QueryPoint
} from '@math.gl/culling/queries';

export type BoxIndexOptions = {
  /** Flat [minX, minY, (minZ), maxX, maxY, (maxZ)] records, copied at construction. */
  bounds: ArrayLike<number>;
  dimension: 2 | 3;
  leafSize?: number;
};
export type NearestIndexResult = {index: number; distance: number};
export type NearestIndexOptions = {
  maxDistance?: number;
  filter?: (index: number) => boolean;
  /** Exact geometry distance; must be at least the distance to its indexed box. null excludes it. */
  distanceToItem?: (index: number) => number | null;
};

/** Static median-split BVH. Results refer to original input rows, not tree order. */
export class BoxIndex {
  readonly dimension: 2 | 3;
  readonly size: number;
  private readonly bounds: Float64Array;
  private readonly nodeBounds: Float64Array;
  private readonly children: Int32Array;
  private readonly starts: Uint32Array;
  private readonly counts: Uint32Array;
  private readonly order: Uint32Array;

  constructor(options: BoxIndexOptions) {
    const {dimension, bounds, leafSize = 8} = options;
    if (dimension !== 2 && dimension !== 3) throw new RangeError('Index dimension must be 2 or 3');
    if (!Number.isSafeInteger(leafSize) || leafSize < 1)
      throw new RangeError('leafSize must be positive');
    if (bounds.length % (dimension * 2)) throw new RangeError('Incomplete bounds record');
    this.dimension = dimension;
    this.bounds = Float64Array.from(bounds);
    this.size = bounds.length / (dimension * 2);
    if (this.size > 0x7fffffff) throw new RangeError('Index exceeds 32-bit capacity');
    const stride = dimension * 2;
    for (let i = 0; i < this.size; i++)
      this.validateBounds(
        this.bounds.subarray(i * stride, i * stride + dimension),
        this.bounds.subarray(i * stride + dimension, (i + 1) * stride)
      );
    const records: {bounds: number[]; left: number; right: number; start: number; count: number}[] =
      [];
    const ids = Array.from({length: this.size}, (_, i) => i);
    const build = (start: number, end: number): number => {
      const node = records.length;
      const bound = [
        ...new Array(dimension).fill(Infinity),
        ...new Array(dimension).fill(-Infinity)
      ];
      for (let i = start; i < end; i++)
        for (let axis = 0; axis < dimension; axis++) {
          bound[axis] = Math.min(bound[axis], this.bounds[ids[i] * stride + axis]);
          bound[axis + dimension] = Math.max(
            bound[axis + dimension],
            this.bounds[ids[i] * stride + axis + dimension]
          );
        }
      const record = {bounds: bound, left: -1, right: -1, start, count: end - start};
      records.push(record);
      if (end - start > leafSize) {
        let axis = 0;
        for (let i = 1; i < dimension; i++) {
          if (bound[i + dimension] - bound[i] > bound[axis + dimension] - bound[axis]) axis = i;
        }
        const center = (i: number): number =>
          this.bounds[i * stride + axis] / 2 + this.bounds[i * stride + axis + dimension] / 2;
        const sorted = ids.slice(start, end).sort((a, b) => center(a) - center(b) || a - b);
        for (let i = 0; i < sorted.length; i++) ids[start + i] = sorted[i];
        const middle = Math.floor((start + end) / 2);
        record.left = build(start, middle);
        record.right = build(middle, end);
        record.count = 0;
      }
      return node;
    };
    if (this.size) build(0, this.size);
    this.nodeBounds = new Float64Array(records.length * stride);
    this.children = new Int32Array(records.length * 2);
    this.starts = new Uint32Array(records.length);
    this.counts = new Uint32Array(records.length);
    records.forEach((record, i) => {
      this.nodeBounds.set(record.bounds, i * stride);
      this.children.set([record.left, record.right], i * 2);
      this.starts[i] = record.start;
      this.counts[i] = record.count;
    });
    this.order = Uint32Array.from(ids);
  }

  /** Closed-box overlap, including boundary contact. Sorted by original row index. */
  search(minimum: QueryPoint, maximum: QueryPoint): number[] {
    this.validateBounds(minimum, maximum);
    const result: number[] = [];
    const overlaps = (bounds: Float64Array, index: number): boolean => {
      const start = index * this.dimension * 2;
      for (let i = 0; i < this.dimension; i++) {
        if (bounds[start + i] > maximum[i] || bounds[start + i + this.dimension] < minimum[i])
          return false;
      }
      return true;
    };
    const stack = this.size ? [0] : [];
    while (stack.length) {
      const node = stack.pop();
      if (!overlaps(this.nodeBounds, node)) continue;
      if (this.counts[node]) {
        for (let i = this.starts[node]; i < this.starts[node] + this.counts[node]; i++) {
          if (overlaps(this.bounds, this.order[i])) result.push(this.order[i]);
        }
      } else stack.push(this.children[node * 2], this.children[node * 2 + 1]);
    }
    return result.sort((a, b) => a - b);
  }

  /** Branch-and-bound nearest box, optionally refined against actual geometry. */
  nearest(point: QueryPoint, options: NearestIndexOptions = {}): NearestIndexResult | null {
    validateQueryPoint(point, this.dimension);
    let best = options.maxDistance ?? Infinity;
    validateQueryDistance(best);
    let result: NearestIndexResult | null = null;
    const distance = (bounds: Float64Array, index: number): number => {
      const start = index * this.dimension * 2;
      let x = 0,
        y = 0,
        z = 0;
      x = Math.max(bounds[start] - point[0], 0, point[0] - bounds[start + this.dimension]);
      y = Math.max(bounds[start + 1] - point[1], 0, point[1] - bounds[start + this.dimension + 1]);
      if (this.dimension === 3)
        z = Math.max(bounds[start + 2] - point[2], 0, point[2] - bounds[start + 5]);
      return Math.hypot(x, y, z);
    };
    const stack = this.size ? [0] : [];
    while (stack.length) {
      const node = stack.pop();
      if (distance(this.nodeBounds, node) > best) continue;
      if (this.counts[node]) {
        for (let i = this.starts[node]; i < this.starts[node] + this.counts[node]; i++) {
          const index = this.order[i];
          const lower = distance(this.bounds, index);
          if (lower > best || (options.filter && !options.filter(index))) continue;
          const exact = options.distanceToItem ? options.distanceToItem(index) : lower;
          if (exact === null) continue;
          validateQueryDistance(exact);
          if (exact < lower)
            throw new RangeError('Refinement distance cannot be below box distance');
          if (
            Number.isFinite(exact) &&
            exact <= best &&
            (!result || exact < best || index < result.index)
          ) {
            best = exact;
            result = {index, distance: exact};
          }
        }
      } else {
        const a = this.children[node * 2],
          b = this.children[node * 2 + 1];
        if (distance(this.nodeBounds, a) < distance(this.nodeBounds, b)) stack.push(b, a);
        else stack.push(a, b);
      }
    }
    return result;
  }

  /** Broad-phase ray candidates, sorted by entry distance then original row index. */
  searchRay(
    origin: QueryPoint,
    direction: QueryPoint,
    maxDistance = Infinity
  ): NearestIndexResult[] {
    validateQueryPoint(origin, this.dimension);
    const unit = normalizeQueryDirection(direction, this.dimension);
    validateQueryDistance(maxDistance);
    const entry = (bounds: Float64Array, index: number): number | null => {
      const start = index * this.dimension * 2;
      return intersectRayBounds(
        origin,
        unit,
        bounds.subarray(start, start + this.dimension),
        bounds.subarray(start + this.dimension, start + this.dimension * 2),
        maxDistance
      );
    };
    const result: NearestIndexResult[] = [];
    const stack = this.size ? [0] : [];
    while (stack.length) {
      const node = stack.pop();
      if (entry(this.nodeBounds, node) === null) continue;
      if (this.counts[node]) {
        for (let i = this.starts[node]; i < this.starts[node] + this.counts[node]; i++) {
          const index = this.order[i],
            distance = entry(this.bounds, index);
          if (distance !== null) result.push({index, distance});
        }
      } else stack.push(this.children[node * 2], this.children[node * 2 + 1]);
    }
    return result.sort((a, b) => a.distance - b.distance || a.index - b.index);
  }

  private validateBounds(minimum: QueryPoint, maximum: QueryPoint): void {
    validateQueryPoint(minimum, this.dimension);
    validateQueryPoint(maximum, this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      if (minimum[i] > maximum[i]) throw new RangeError('Bounds must be ordered');
    }
  }
}

/** Points are zero-volume boxes: nearest gives exact Euclidean point distance. */
export class PointIndex extends BoxIndex {
  constructor(options: {positions: ArrayLike<number>; dimension: 2 | 3; leafSize?: number}) {
    const {positions, dimension, leafSize} = options;
    if ((dimension !== 2 && dimension !== 3) || positions.length % dimension) {
      throw new RangeError('Invalid point layout');
    }
    const bounds = new Float64Array(positions.length * 2);
    for (let i = 0; i < positions.length / dimension; i++)
      for (let axis = 0; axis < dimension; axis++) {
        bounds[i * dimension * 2 + axis] = bounds[i * dimension * 2 + axis + dimension] =
          positions[i * dimension + axis];
      }
    super({bounds, dimension, leafSize});
  }
}
