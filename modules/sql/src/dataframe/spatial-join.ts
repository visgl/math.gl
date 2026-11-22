// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, type Field, type Table} from 'apache-arrow';
import {takeArrowTableRows, type GeoArrowBounds} from '@math.gl/core/arrow';
import {BoxIndex} from '@math.gl/geometry/spatial-index';
import {gatherArrowJoin, makeArrowJoinSchema} from '../arrow/relational-query';
import type {ScalarFunction} from '../arrow/types';

/** Supported options for an inner spatial join. */
export type GeoDataFrameSpatialJoinOptions = {
  /** Spatial SQL predicate such as ST_WITHIN from @math.gl/geospatial/st-functions. */
  predicate: ScalarFunction;
  /** Prefix added to each right field name, including the right geometry. */
  rightPrefix?: string;
  /** Cancels the join between rows and candidate batches. */
  signal?: AbortSignal;
};

/** A table and the envelopes of its active geometry, indexed by source row. */
type SpatialJoinInput = {
  table: Table;
  field: Field;
  bounds: readonly (GeoArrowBounds | null)[];
};

/** Predicates whose true results require overlapping planar envelopes. */
const predicates = new Set([
  'ST_WITHIN',
  'ST_CONTAINS',
  'ST_COVERS',
  'ST_COVEREDBY',
  'ST_INTERSECTS'
]);

/** Matches source rows through a right-side box index and a bound SQL predicate. */
export function spatialJoin(
  left: SpatialJoinInput,
  right: SpatialJoinInput,
  {predicate, rightPrefix = 'right.', signal}: GeoDataFrameSpatialJoinOptions
): Table {
  signal?.throwIfAborted();
  if (!predicates.has(predicate.name.toUpperCase())) {
    throw new Error(`Unsupported GeoDataFrame spatial join predicate: ${predicate.name}`);
  }
  const match = predicate.resolvePrototype?.([left.field, right.field]);
  if (!match || !DataType.isBool(match.result.type)) {
    throw new Error(`Cannot bind spatial join predicate ${predicate.name} to the active fields`);
  }

  const {evaluate} = match;
  const schema = makeArrowJoinSchema(left.table, right.table, rightPrefix);
  const packed: number[] = [];
  const rightRows: number[] = [];
  right.bounds.forEach((bounds, row) => {
    if (!bounds) return;
    packed.push(...bounds);
    rightRows.push(row);
  });
  const index = new BoxIndex({dimension: 2, bounds: packed});
  const leftGeometry = left.table.selectAt([left.table.schema.fields.indexOf(left.field)]);
  const rightGeometry = right.table.selectAt([right.table.schema.fields.indexOf(right.field)]);
  const leftMatches: number[] = [];
  const rightMatches: number[] = [];
  const leftCandidates: number[] = [];
  const rightCandidates: number[] = [];

  /** Evaluates exact predicates on a bounded batch of candidate geometry pairs. */
  function flush(): void {
    const length = leftCandidates.length;
    if (!length) return;
    signal?.throwIfAborted();
    const vectors = [
      takeArrowTableRows(leftGeometry, Int32Array.from(leftCandidates)).getChildAt(0)!,
      takeArrowTableRows(rightGeometry, Int32Array.from(rightCandidates)).getChildAt(0)!
    ];
    const mask = evaluate(vectors, {length, activeRows: new Uint8Array(length).fill(1)});
    for (let i = 0; i < length; i++) {
      if (mask.get(i) !== true) continue;
      leftMatches.push(leftCandidates[i]!);
      rightMatches.push(rightCandidates[i]!);
    }
    leftCandidates.length = 0;
    rightCandidates.length = 0;
  }

  left.bounds.forEach((bounds, row) => {
    signal?.throwIfAborted();
    if (!bounds) return;
    for (const candidate of index.search([bounds[0], bounds[1]], [bounds[2], bounds[3]])) {
      leftCandidates.push(row);
      rightCandidates.push(rightRows[candidate]!);
      if (leftCandidates.length === 4096) flush();
    }
  });
  flush();
  return gatherArrowJoin(left.table, right.table, leftMatches, rightMatches, schema);
}
