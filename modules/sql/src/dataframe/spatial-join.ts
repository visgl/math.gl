// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, type Field, type Table} from 'apache-arrow';
import {getGeoArrowFieldInfo, takeArrowTableRows, type GeoArrowBounds} from '@math.gl/core/arrow';
import {indexedSpatialJoin} from '../arrow/spatial-join';
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
  /** Arrow input in source row order. */
  table: Table;
  /** Active geometry field used to bind the spatial predicate. */
  field: Field;
  /** Returns cached envelopes aligned with table rows. Null indicates no usable envelope. */
  bounds(): readonly (GeoArrowBounds | null)[];
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
  for (const {field} of [left, right]) {
    const encoding = getGeoArrowFieldInfo(field)!.encoding;
    if (encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt') {
      throw new Error('GeoDataFrame.sjoin requires native GeoArrow geometry');
    }
  }
  if (!predicates.has(predicate.name.toUpperCase())) {
    throw new Error(`Unsupported GeoDataFrame spatial join predicate: ${predicate.name}`);
  }
  const match = predicate.resolvePrototype?.([left.field, right.field]);
  if (!match || !DataType.isBool(match.result.type)) {
    throw new Error(`Cannot bind spatial join predicate ${predicate.name} to the active fields`);
  }

  const leftGeometry = left.table.selectAt([left.table.schema.fields.indexOf(left.field)]);
  const rightGeometry = right.table.selectAt([right.table.schema.fields.indexOf(right.field)]);
  return indexedSpatialJoin(left, right, {rightPrefix, signal}, (leftRows, rightRows) =>
    match.evaluate(
      [
        takeArrowTableRows(leftGeometry, Int32Array.from(leftRows)).getChildAt(0)!,
        takeArrowTableRows(rightGeometry, Int32Array.from(rightRows)).getChildAt(0)!
      ],
      {length: leftRows.length, activeRows: new Uint8Array(leftRows.length).fill(1)}
    )
  );
}
