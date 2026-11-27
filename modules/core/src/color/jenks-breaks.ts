// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * Finds Fisher–Jenks natural breaks that minimize within-class squared error.
 * Repeated observations carry their full weight and stay in the same class.
 * Each returned break is the first value of its upper class, suitable for a
 * threshold scale. Nonfinite observations are skipped.
 * @param values - Numeric observations in any order.
 * @param classCount - Number of classes, up to the number of distinct finite observations.
 */
export function getJenksBreaks(values: Iterable<number>, classCount: number): number[] {
  if (!Number.isSafeInteger(classCount) || classCount < 1) {
    throw new Error('Jenks class count must be a positive integer');
  }
  const frequencies = new Map<number, number>();
  for (const value of values) {
    if (Number.isFinite(value)) {
      frequencies.set(value, (frequencies.get(value) ?? 0) + 1);
    }
  }
  const sorted = [...frequencies.keys()].sort((a, b) => a - b);
  const size = sorted.length;
  if (classCount > size) {
    throw new Error('Jenks class count exceeds the distinct finite observations');
  }
  if (classCount === 1 || classCount === size) {
    return classCount === 1 ? [] : sorted.slice(1);
  }

  const first = sorted[0]!;
  const last = sorted[size - 1]!;
  const divisor = Number.isFinite(last - first) ? last - first : Math.max(-first, last);
  // Merge disjoint interval moments so a small cluster is never recovered by
  // subtracting nearly equal prefix sums dominated by a distant observation.
  const leaves = 2 ** Math.ceil(Math.log2(size));
  const counts = new Float64Array(2 * leaves);
  const means = new Float64Array(2 * leaves);
  const errors = new Float64Array(2 * leaves);
  for (let i = 0; i < size; i++) {
    const value = sorted[i]!;
    counts[leaves + i] = frequencies.get(value)!;
    means[leaves + i] = Number.isFinite(value - first)
      ? (value - first) / divisor
      : value / divisor - first / divisor;
  }
  for (let i = leaves - 1; i > 0; i--) {
    const left = 2 * i;
    const right = left + 1;
    const leftCount = counts[left]!;
    const rightCount = counts[right]!;
    const count = leftCount + rightCount;
    if (!count) continue;
    const delta = means[right]! - means[left]!;
    const fraction = rightCount / count;
    counts[i] = count;
    means[i] = means[left]! + delta * fraction;
    errors[i] = errors[left]! + errors[right]! + delta * delta * leftCount * fraction;
  }

  /** Combines the disjoint tree nodes covering a contiguous class. */
  const cost = (start: number, end: number): number => {
    let count = 0;
    let mean = 0;
    let error = 0;
    /** Incorporates a node using the parallel variance update. */
    function add(index: number): void {
      const weight = counts[index]!;
      const delta = means[index]! - mean;
      const fraction = weight / (count + weight);
      error += errors[index]! + delta * delta * count * fraction;
      mean += delta * fraction;
      count += weight;
    }
    for (let left = leaves + start, right = leaves + end; left < right; ) {
      if (left % 2) add(left++);
      if (right % 2) add(--right);
      left = Math.floor(left / 2);
      right = Math.floor(right / 2);
    }
    return error;
  };

  let previous = Float64Array.from({length: size + 1}, (_, end) => (end ? cost(0, end) : 0));
  const splits: Uint32Array[] = [];
  for (let classes = 2; classes <= classCount; classes++) {
    const current = new Float64Array(size + 1);
    const split = new Uint32Array(size + 1);

    /** Optimal splits are monotone, so each half can search a smaller range. */
    const optimize = (left: number, right: number, lower: number, upper: number): void => {
      if (left > right) {
        return;
      }
      const end = Math.floor((left + right) / 2);
      let best = lower;
      let error = Infinity;
      for (let start = lower; start <= Math.min(upper, end - 1); start++) {
        const candidate = previous[start]! + cost(start, end);
        if (candidate < error) {
          best = start;
          error = candidate;
        }
      }
      current[end] = error;
      split[end] = best;
      optimize(left, end - 1, lower, best);
      optimize(end + 1, right, best, upper);
    };

    optimize(classes, size, classes - 1, size - 1);
    splits.push(split);
    previous = current;
  }

  let end = size;
  return splits
    .reverse()
    .map(split => {
      end = split[end]!;
      return sorted[end]!;
    })
    .reverse();
}
