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
  const count = new Float64Array(size + 1);
  const sum = new Float64Array(size + 1);
  const squares = new Float64Array(size + 1);
  for (let i = 0; i < size; i++) {
    const value = sorted[i]!;
    const weight = frequencies.get(value)!;
    const x = Number.isFinite(value - first)
      ? (value - first) / divisor
      : value / divisor - first / divisor;
    count[i + 1] = count[i]! + weight;
    sum[i + 1] = sum[i]! + weight * x;
    squares[i + 1] = squares[i]! + weight * x * x;
  }

  /** Squared error for a contiguous class from start (inclusive) to end (exclusive). */
  const cost = (start: number, end: number): number => {
    const total = sum[end]! - sum[start]!;
    return Math.max(
      0,
      squares[end]! - squares[start]! - (total * total) / (count[end]! - count[start]!)
    );
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
