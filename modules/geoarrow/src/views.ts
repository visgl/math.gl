// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeoArrowArray, GeoArrowColumn} from './types';
import {getEncodingFromChildName, isGeoArrowValueValid, sliceGeoArrowArray} from './layout';

/** One physical batch borrowed from a native geometry column. */
export type GeoArrowBatchView = Readonly<{
  /** Single-chunk column retaining the source semantics and typed arrays. */
  column: GeoArrowColumn;
  /** Index of the physical chunk in the source column, including empty chunks. */
  chunkIndex: number;
  /** First logical row in the source column; not a feature ID or byte cursor. */
  rowOffset: number;
}>;

/** One logical row, with top-level union dispatch resolved without decoding coordinates. */
export type GeoArrowRowView = Readonly<{
  /** One-row column, preserving nulls, collections, and exact single/multi identity. */
  column: GeoArrowColumn;
  /** Logical row index relative to the input column, including null rows. */
  rowIndex: number;
  /** Physical chunk index in the input column. */
  chunkIndex: number;
  /** Logical row index within that chunk, before union dispatch. */
  chunkRowIndex: number;
}>;

/**
 * Iterates native physical chunks lazily, including empty chunks, without new typed arrays.
 * This is not a loader record-batch protocol: one loader batch may contain several chunks.
 * Views borrow storage; callers must not mutate, recycle, or detach it while views are in use.
 * Assumes valid physical descriptors; use validateGeoArrowColumn for untrusted input.
 */
export function* iterateGeoArrowBatches(
  column: GeoArrowColumn
): IterableIterator<GeoArrowBatchView> {
  assertNativeGeometryColumn(column);
  let rowOffset = 0;
  for (let chunkIndex = 0; chunkIndex < column.chunks.length; chunkIndex++) {
    const chunk = column.chunks[chunkIndex];
    yield {column: {...column, chunks: [chunk]}, chunkIndex, rowOffset};
    rowOffset += chunk.length;
  }
}

/**
 * Borrows one native geometry row, allocating descriptors but no typed arrays or coordinates.
 * Resolves the top-level union by type ID and retains collection grouping inside the row.
 * Indices are relative to the supplied column (including when it is already sliced).
 * Throws for an invalid row index, serialized/box encoding, or invalid union dispatch.
 * Assumes valid physical descriptors beyond the selected union dispatch.
 */
export function getGeoArrowRowView(column: GeoArrowColumn, rowIndex: number): GeoArrowRowView {
  assertNativeGeometryColumn(column);
  if (!Number.isSafeInteger(rowIndex) || rowIndex < 0) {
    throw new RangeError('GeoArrow row index must be a nonnegative safe integer');
  }
  let chunkRowIndex = rowIndex;
  for (let chunkIndex = 0; chunkIndex < column.chunks.length; chunkIndex++) {
    const chunk = column.chunks[chunkIndex];
    if (chunkRowIndex >= chunk.length) {
      chunkRowIndex -= chunk.length;
      continue;
    }
    let rowColumn = {
      ...column,
      chunks: [sliceGeoArrowArray(chunk, chunkRowIndex, chunkRowIndex + 1)]
    };
    if (column.encoding === 'geoarrow.geometry') {
      if (chunk.kind !== 'dense-union') {
        throw new Error('Mixed GeoArrow geometry requires dense-union storage');
      }
      const physicalIndex = (chunk.offset || 0) + chunkRowIndex;
      const child = chunk.children.find(
        candidate => candidate.typeId === chunk.typeIds[physicalIndex]
      );
      const valueOffset = chunk.valueOffsets[physicalIndex];
      if (
        !child ||
        !Number.isInteger(valueOffset) ||
        valueOffset < 0 ||
        valueOffset >= child.data.length
      ) {
        throw new Error('Invalid GeoArrow union row dispatch');
      }
      const encoding = child.encoding || getEncodingFromChildName(child.name);
      if (encoding === 'geoarrow.geometry') {
        throw new Error('GeoArrow geometry union children must be concrete geometries');
      }
      let data = sliceGeoArrowArray(child.data, valueOffset, valueOffset + 1);
      // A null parent masks a valid child without constructing an intersected bitmap.
      if (!isGeoArrowValueValid(chunk.validity, chunkRowIndex)) {
        data = {...data, validity: rowColumn.chunks[0].validity};
      }
      rowColumn = {
        ...column,
        encoding,
        dimension: child.dimension ?? column.dimension,
        coordinateLayout:
          child.coordinateLayout === undefined ? column.coordinateLayout : child.coordinateLayout,
        chunks: [data]
      };
      assertNativeGeometryColumn(rowColumn);
    }
    return {column: rowColumn, rowIndex, chunkIndex, chunkRowIndex};
  }
  throw new RangeError('GeoArrow row index exceeds column length');
}

/**
 * Assembles a nonempty iterable of compatible native columns without merging physical chunks.
 * Encodings, dimensions, and layouts must match. CRS and opaque metadata must be the same
 * references (or both absent); no semantic equivalence, metadata merging, or reprojection is
 * attempted. Missing edges mean planar. Empty columns/chunks are permitted and retained.
 * Returns a new envelope and chunk-reference list, never new typed arrays.
 */
export function concatenateGeoArrowColumns(columns: Iterable<GeoArrowColumn>): GeoArrowColumn {
  let firstColumn: GeoArrowColumn | undefined;
  const chunks: GeoArrowArray[] = [];
  for (const column of columns) {
    assertNativeGeometryColumn(column);
    if (!firstColumn) {
      firstColumn = column;
    } else if (
      column.encoding !== firstColumn.encoding ||
      column.dimension !== firstColumn.dimension ||
      column.coordinateLayout !== firstColumn.coordinateLayout ||
      (column.edges ?? 'planar') !== (firstColumn.edges ?? 'planar') ||
      column.spatialReference !== firstColumn.spatialReference ||
      column.metadata !== firstColumn.metadata
    ) {
      throw new Error('Cannot concatenate GeoArrow columns with different semantic envelopes');
    }
    for (const chunk of column.chunks) chunks.push(chunk);
  }
  if (!firstColumn) throw new Error('At least one GeoArrow column is required');
  return {...firstColumn, chunks};
}

/** Keeps borrowed geometry access distinct from decoding serialized data or interpreting boxes. */
function assertNativeGeometryColumn(column: GeoArrowColumn): void {
  if (
    column.encoding === 'geoarrow.wkb' ||
    column.encoding === 'geoarrow.wkt' ||
    column.encoding === 'geoarrow.box'
  ) {
    throw new Error('GeoArrow geometry views require native geometry; decode WKB/WKT first');
  }
}
