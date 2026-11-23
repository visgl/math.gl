// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Axis-aligned XY bounds. */
export type Bounded = {
  /** Minimum X and Y followed by maximum X and Y. */
  bounds: readonly number[];
};

/** Estimates the active interval count relative to the extent of the sweep. */
function intervalDensity(items: readonly Bounded[], axis: number): number {
  let minimum = Infinity;
  let maximum = -Infinity;
  let length = 0;
  for (const {bounds} of items) {
    const low = bounds[axis]!;
    const high = bounds[axis + 2]!;
    minimum = Math.min(minimum, low);
    maximum = Math.max(maximum, high);
    length += high - low;
  }
  return maximum > minimum ? length / (maximum - minimum) : Infinity;
}

/** Visits overlapping bounding boxes along the axis with fewer expected candidates. */
export function anyBoundsOverlap<T extends Bounded>(
  items: T[],
  reject: (a: T, b: T) => boolean
): boolean {
  const axis = intervalDensity(items, 0) > intervalDensity(items, 1) ? 1 : 0;
  const other = 1 - axis;
  items.sort((a, b) => a.bounds[axis]! - b.bounds[axis]!);
  for (let i = 0; i < items.length; i++) {
    const a = items[i]!;
    for (let j = i + 1; j < items.length && items[j]!.bounds[axis]! <= a.bounds[axis + 2]!; j++) {
      const b = items[j]!;
      if (
        b.bounds[other]! <= a.bounds[other + 2]! &&
        a.bounds[other]! <= b.bounds[other + 2]! &&
        reject(a, b)
      )
        return true;
    }
  }
  return false;
}
