// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeoArrowArray, GeoArrowColumn, GeoArrowEncoding, GeoArrowDimension} from './types';
import {
  getEncodingFromChildName,
  getListRange,
  isGeoArrowValueValid,
  readCoordinate,
  validateGeoArrowColumn
} from './layout';
import {assertGeoArrowResourceLimits, type GeoArrowResourceLimitOptions} from './kernels';

/** Synchronous XY geometry events, structurally compatible with a D3 geometry stream. */
export type GeoArrowGeometryStream = {
  point(x: number, y: number): void;
  lineStart(): void;
  lineEnd(): void;
  polygonStart(): void;
  polygonEnd(): void;
};
/** Streaming resource and source-row controls. */
export type StreamGeoArrowOptions = {
  /** Added to logical row indices, including null rows. Default 0. */
  sourceRowOffset?: number;
  /** Called before/after all geometry events for each row, including null rows. */
  onRowStart?: (rowIndex: number) => void;
  onRowEnd?: (rowIndex: number) => void;
  limits?: GeoArrowResourceLimitOptions;
};

/** Emit native XY GeoArrow geometry directly from physical buffers, without materializing
 * GeoJSON rows. Ring closing coordinates are omitted, as in D3's stream protocol. Null rows
 * emit no geometry. Mixed geometries/collections preserve source-row identity. Winding, CRS
 * conversion and spherical/planar edge semantics remain the caller's responsibility.
 * XY only: higher-dimensional input is rejected rather than silently dropping Z/M. Serialized
 * encodings and boxes must be decoded/converted first. Callbacks run synchronously and errors
 * propagate; an external sink may contain partial output after an error.
 */
export function streamGeoArrow(
  column: GeoArrowColumn,
  stream: GeoArrowGeometryStream,
  options: StreamGeoArrowOptions = {}
): void {
  const offset = options.sourceRowOffset ?? 0;
  if (
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    !Number.isSafeInteger(offset + column.chunks.reduce((n, c) => n + c.length, 0))
  )
    throw new RangeError('Invalid source row offset');
  if (!validateGeoArrowColumn(column).valid)
    throw new RangeError('Invalid GeoArrow physical layout');
  assertGeoArrowResourceLimits(column, options.limits);
  function check(array: GeoArrowArray, encoding: GeoArrowEncoding, dimension: GeoArrowDimension) {
    if (dimension !== 'xy' || ['geoarrow.wkb', 'geoarrow.wkt', 'geoarrow.box'].includes(encoding))
      throw new RangeError('Geometry streams require native XY input');
    if (array.kind === 'dense-union')
      for (const child of array.children)
        check(
          child.data,
          child.encoding || getEncodingFromChildName(child.name),
          child.dimension ?? dimension
        );
    if (array.kind === 'list') check(array.child, encoding, dimension);
  }
  if (
    column.dimension !== 'xy' ||
    ['geoarrow.wkb', 'geoarrow.wkt', 'geoarrow.box'].includes(column.encoding)
  )
    throw new RangeError('Geometry streams require native XY input');
  for (const chunk of column.chunks) check(chunk, column.encoding, column.dimension);
  function point(array: GeoArrowArray, index: number) {
    const xy = readCoordinate(array, index);
    if (xy === null || xy.every(Number.isNaN)) return;
    if (!xy.every(Number.isFinite)) throw new RangeError('Nonfinite stream coordinate');
    stream.point(xy[0], xy[1]);
  }
  function line(array: GeoArrowArray, index: number, closed: boolean) {
    if (array.kind !== 'list' || !isGeoArrowValueValid(array.validity, index)) return;
    let [start, end] = getListRange(array, index);
    if (closed && end > start) {
      const a = readCoordinate(array.child, start),
        b = readCoordinate(array.child, end - 1);
      if (a && b && a[0] === b[0] && a[1] === b[1]) end--;
    }
    stream.lineStart();
    for (let i = start; i < end; i++) point(array.child, i);
    stream.lineEnd();
  }
  function geometry(array: GeoArrowArray, index: number, encoding: GeoArrowEncoding) {
    if (!isGeoArrowValueValid(array.validity, index)) return;
    if (array.kind === 'dense-union') {
      const physical = (array.offset || 0) + index;
      const child = array.children.find(c => c.typeId === array.typeIds[physical])!;
      geometry(
        child.data,
        array.valueOffsets[physical],
        child.encoding || getEncodingFromChildName(child.name)
      );
    } else if (encoding === 'geoarrow.point') point(array, index);
    else if (encoding === 'geoarrow.linestring') line(array, index, false);
    else if (array.kind === 'list') {
      const [start, end] = getListRange(array, index);
      if (encoding === 'geoarrow.polygon') {
        stream.polygonStart();
        for (let i = start; i < end; i++) line(array.child, i, true);
        stream.polygonEnd();
      } else {
        const childEncoding: GeoArrowEncoding =
          encoding === 'geoarrow.multipoint'
            ? 'geoarrow.point'
            : encoding === 'geoarrow.multilinestring'
              ? 'geoarrow.linestring'
              : encoding === 'geoarrow.multipolygon'
                ? 'geoarrow.polygon'
                : 'geoarrow.geometry';
        for (let i = start; i < end; i++) geometry(array.child, i, childEncoding);
      }
    }
  }
  let row = offset;
  for (const chunk of column.chunks)
    for (let i = 0; i < chunk.length; i++, row++) {
      options.onRowStart?.(row);
      geometry(chunk, i, column.encoding);
      options.onRowEnd?.(row);
    }
}
