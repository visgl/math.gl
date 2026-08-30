// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {formatWKT, parseWKB, parseWKT, writeWKB} from '@math.gl/wkb';
import type {
  GeoArrowColumn,
  GeoArrowDimension,
  GeoArrowGeometryValue,
  GeoArrowSerialized
} from './types';
import {getGeoArrowDimensionSize} from './types';
import {makeGeoArrowColumnFromGeometryRows} from './builder';
import {getGeoArrowOffset, isGeoArrowValueValid, materializeGeoArrowRows} from './layout';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Decodes a GeoArrow WKB column into native physical geometry buffers. */
export function decodeGeoArrowWKB(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding !== 'geoarrow.wkb') throw new Error('Expected a geoarrow.wkb column');
  const rows = normalizeRowsToDimension(
    decodeSerializedRows(column, bytes => parseWKB(bytes).geometry),
    column.dimension
  );
  return copyMetadata(
    column,
    makeGeoArrowColumnFromGeometryRows(rows, {dimension: column.dimension})
  );
}

/** Encodes a native GeoArrow column as variable-width WKB bytes. */
export function encodeGeoArrowWKB(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding === 'geoarrow.wkb') return column;
  const rows = materializeGeoArrowRows(column);
  const values = rows.map(row => (row ? writeWKB(row, column.dimension) : null));
  return copyMetadata(column, makeSerializedColumn(values, 'geoarrow.wkb', column.dimension));
}

/** Decodes a GeoArrow WKT column into native physical geometry buffers. */
export function decodeGeoArrowWKT(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding !== 'geoarrow.wkt') throw new Error('Expected a geoarrow.wkt column');
  const rows = normalizeRowsToDimension(
    decodeSerializedRows(column, bytes => parseWKT(textDecoder.decode(bytes))),
    column.dimension
  );
  return copyMetadata(
    column,
    makeGeoArrowColumnFromGeometryRows(rows, {dimension: column.dimension})
  );
}

/** Encodes a native GeoArrow column as variable-width UTF-8 WKT. */
export function encodeGeoArrowWKT(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding === 'geoarrow.wkt') return column;
  const rows = materializeGeoArrowRows(column);
  const values = rows.map(row =>
    row ? textEncoder.encode(formatWKT(row, column.dimension)) : null
  );
  return copyMetadata(column, makeSerializedColumn(values, 'geoarrow.wkt', column.dimension));
}

function normalizeRowsToDimension(
  rows: readonly (GeoArrowGeometryValue | null)[],
  dimension: GeoArrowDimension
): Array<GeoArrowGeometryValue | null> {
  const size = getGeoArrowDimensionSize(dimension);
  const normalizeGeometry = (geometry: GeoArrowGeometryValue): GeoArrowGeometryValue => {
    if (geometry.type === 'GeometryCollection') {
      return {...geometry, geometries: geometry.geometries.map(normalizeGeometry)};
    }
    return {
      ...geometry,
      coordinates: normalizeCoordinateNesting(geometry.coordinates, size)
    } as GeoArrowGeometryValue;
  };
  return rows.map(row => (row ? normalizeGeometry(row) : null));
}

function normalizeCoordinateNesting(value: readonly unknown[], size: number): unknown {
  if (value.length === 0) return [];
  if (typeof value[0] === 'number') {
    const coordinate = (value as readonly number[]).slice(0, size);
    while (coordinate.length < size) coordinate.push(0);
    return coordinate;
  }
  return value.map(child => normalizeCoordinateNesting(child as readonly unknown[], size));
}

function decodeSerializedRows(
  column: GeoArrowColumn,
  decoder: (bytes: Uint8Array) => GeoArrowGeometryValue
): Array<GeoArrowGeometryValue | null> {
  const rows: Array<GeoArrowGeometryValue | null> = [];
  for (const chunk of column.chunks) {
    if (chunk.kind !== 'serialized') throw new Error('Serialized column contains native storage');
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      if (!isGeoArrowValueValid(chunk.validity, rowIndex)) {
        rows.push(null);
        continue;
      }
      rows.push(decoder(getSerializedBytes(chunk, rowIndex)));
    }
  }
  return rows;
}

function getSerializedBytes(array: GeoArrowSerialized, rowIndex: number): Uint8Array {
  const offsetIndex = (array.offset || 0) + rowIndex;
  const baseValue = array.offsetBase ?? 0;
  const base = typeof baseValue === 'bigint' ? Number(baseValue) : baseValue;
  const first = getGeoArrowOffset(array.offsets, offsetIndex) - base;
  const last = getGeoArrowOffset(array.offsets, offsetIndex + 1) - base;
  return array.values.subarray(first, last);
}

function makeSerializedColumn(
  rows: readonly (Uint8Array | null)[],
  encoding: 'geoarrow.wkb' | 'geoarrow.wkt',
  dimension: GeoArrowDimension
): GeoArrowColumn {
  let byteLength = 0;
  for (const row of rows) byteLength += row?.byteLength || 0;
  const values = new Uint8Array(byteLength);
  const offsets = new Int32Array(rows.length + 1);
  const validity = new Uint8Array(Math.ceil(rows.length / 8));
  let byteOffset = 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row) {
      values.set(row, byteOffset);
      byteOffset += row.byteLength;
      validity[rowIndex >> 3] |= 1 << (rowIndex & 7);
    }
    offsets[rowIndex + 1] = byteOffset;
  }
  const chunk: GeoArrowSerialized = {
    kind: 'serialized',
    encoding: encoding === 'geoarrow.wkb' ? 'binary' : 'utf8',
    length: rows.length,
    offsets,
    values,
    validity: {values: validity}
  };
  return {encoding, dimension, coordinateLayout: null, chunks: [chunk]};
}

function copyMetadata(source: GeoArrowColumn, target: GeoArrowColumn): GeoArrowColumn {
  return {
    ...target,
    spatialReference: source.spatialReference,
    edges: source.edges,
    metadata: source.metadata
  };
}
