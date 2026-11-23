// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Table, Vector} from 'apache-arrow';
import type {GeoArrowBounds} from '@math.gl/core/arrow';
import {BoxIndex} from '@math.gl/geometry/spatial-index';
import {gatherArrowJoin, makeArrowJoinSchema} from './relational-query';

/** One source table with row-aligned planar envelopes. */
type IndexedSpatialInput = {
  /** Native Arrow input in source order. */
  table: Table;
  /** Supplies the per-row envelopes, with null for unindexable rows. */
  bounds(): readonly (GeoArrowBounds | null)[];
};

/** Settings shared by SQL and GeoDataFrame indexed joins. */
type IndexedSpatialOptions = {
  /** Prefix for right-side output columns. */
  rightPrefix: string;
  /** When true, emits one null-extended row for each unmatched left row. */
  retainUnmatched?: boolean;
  /** Planar envelope expansion for proximity candidates. */
  radius?: number;
  /** Cancels index probes and exact evaluation. */
  signal?: AbortSignal;
};

/** Rounds a radius-expanded bound outward and keeps the search box finite. */
function expand(value: number, radius: number, sign: number): number {
  const slack = Math.max(Math.abs(value), radius) * Number.EPSILON;
  return Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, value + sign * (radius + slack)));
}

/** Matches candidates through a right-side box index and refines them in bounded batches. */
export function indexedSpatialJoin(
  left: IndexedSpatialInput,
  right: IndexedSpatialInput,
  {rightPrefix, retainUnmatched = false, radius = 0, signal}: IndexedSpatialOptions,
  evaluate: (leftRows: readonly number[], rightRows: readonly number[]) => Vector
): Table {
  signal?.throwIfAborted();
  const schema = makeArrowJoinSchema(left.table, right.table, rightPrefix, retainUnmatched);
  const packed: number[] = [];
  const rightRows: number[] = [];
  right.bounds().forEach((bounds, row) => {
    if (!bounds) return;
    packed.push(...bounds);
    rightRows.push(row);
  });
  const index = new BoxIndex({dimension: 2, bounds: packed});
  const leftMatches: number[] = [];
  const rightMatches: number[] = [];
  const leftCandidates: number[] = [];
  const rightCandidates: number[] = [];
  let nextLeft = 0;

  /** Appends any intervening unmatched left rows before the next exact match. */
  function extendLeft(end: number): void {
    while (retainUnmatched && nextLeft < end) {
      leftMatches.push(nextLeft++);
      rightMatches.push(-1);
    }
  }

  /** Refines candidates in input order, allowing one left row to span multiple batches. */
  function flush(): void {
    if (!leftCandidates.length) return;
    signal?.throwIfAborted();
    const result = evaluate(leftCandidates, rightCandidates);
    for (let i = 0; i < leftCandidates.length; i++) {
      if (result.get(i) !== true) continue;
      const row = leftCandidates[i]!;
      extendLeft(row);
      leftMatches.push(row);
      rightMatches.push(rightCandidates[i]!);
      nextLeft = row + 1;
    }
    leftCandidates.length = 0;
    rightCandidates.length = 0;
  }

  left.bounds().forEach((bounds, row) => {
    signal?.throwIfAborted();
    if (!bounds) return;
    const [x0, y0, x1, y1] = bounds;
    const minimum = radius ? [expand(x0, radius, -1), expand(y0, radius, -1)] : [x0, y0];
    const maximum = radius ? [expand(x1, radius, 1), expand(y1, radius, 1)] : [x1, y1];
    for (const candidate of index.search(minimum, maximum)) {
      leftCandidates.push(row);
      rightCandidates.push(rightRows[candidate]!);
      if (leftCandidates.length === 4096) flush();
    }
  });
  flush();
  extendLeft(left.table.numRows);
  return gatherArrowJoin(left.table, right.table, leftMatches, rightMatches, schema);
}
