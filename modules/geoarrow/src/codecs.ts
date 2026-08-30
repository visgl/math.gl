// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

/** Parses one WKB geometry value. */
export function parseWKB(bytes: Uint8Array): {geometry: GeoArrowGeometryValue; byteLength: number} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = readWKBGeometry(view, 0);
  if (result.offset !== bytes.byteLength) throw new Error('WKB contains trailing bytes');
  return {geometry: result.geometry, byteLength: result.offset};
}

/** Writes one geometry as little-endian ISO WKB. */
export function writeWKB(
  geometry: GeoArrowGeometryValue,
  dimension: GeoArrowDimension = inferGeometryDimension(geometry)
): Uint8Array {
  const bytes: number[] = [];
  writeWKBGeometry(bytes, geometry, dimension);
  return Uint8Array.from(bytes);
}

/** Parses one WKT geometry value. */
export function parseWKT(text: string): GeoArrowGeometryValue {
  const parser = new WKTParser(text);
  const geometry = parser.parseGeometry();
  parser.assertComplete();
  return geometry;
}

/** Formats one geometry as WKT. */
export function formatWKT(
  geometry: GeoArrowGeometryValue,
  dimension: GeoArrowDimension = inferGeometryDimension(geometry)
): string {
  const dimensionToken = dimension === 'xy' ? '' : ` ${dimension.slice(2).toUpperCase()}`;
  if (geometry.type === 'GeometryCollection') {
    if (geometry.geometries.length === 0) return `GEOMETRYCOLLECTION${dimensionToken} EMPTY`;
    return `GEOMETRYCOLLECTION${dimensionToken} (${geometry.geometries.map(child => formatWKT(child, dimension)).join(', ')})`;
  }
  const type = geometry.type.toUpperCase();
  if (isEmptyCoordinates(geometry.coordinates)) return `${type}${dimensionToken} EMPTY`;
  return `${type}${dimensionToken} ${formatCoordinateNesting(geometry.coordinates, getGeometryDepth(geometry.type))}`;
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

function isEmptyCoordinates(value: readonly unknown[]): boolean {
  if (value.length === 0) return true;
  if (typeof value[0] === 'number') {
    return (value as readonly number[]).every(component => !Number.isFinite(component));
  }
  return value.every(child => isEmptyCoordinates(child as readonly unknown[]));
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
      const bytes = getSerializedBytes(chunk, rowIndex);
      rows.push(decoder(bytes));
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

type WKBReadResult = {geometry: GeoArrowGeometryValue; offset: number};

function readWKBGeometry(view: DataView, startOffset: number): WKBReadResult {
  let offset = startOffset;
  assertRemaining(view, offset, 5);
  const byteOrder = view.getUint8(offset++);
  if (byteOrder !== 0 && byteOrder !== 1) throw new Error('Invalid WKB byte order');
  const littleEndian = byteOrder === 1;
  let rawType = view.getUint32(offset, littleEndian);
  offset += 4;
  const hasZFlag = Boolean(rawType & 0x80000000);
  const hasMFlag = Boolean(rawType & 0x40000000);
  const hasSrid = Boolean(rawType & 0x20000000);
  rawType &= 0x1fffffff;
  let dimensions = 2;
  if (rawType >= 3000) {
    dimensions = 4;
    rawType -= 3000;
  } else if (rawType >= 2000) {
    dimensions = 3;
    rawType -= 2000;
  } else if (rawType >= 1000) {
    dimensions = 3;
    rawType -= 1000;
  } else {
    dimensions += Number(hasZFlag) + Number(hasMFlag);
  }
  if (hasSrid) {
    assertRemaining(view, offset, 4);
    offset += 4;
  }
  const readCoordinate = (): number[] => {
    assertRemaining(view, offset, dimensions * 8);
    const coordinate = new Array<number>(dimensions);
    for (let index = 0; index < dimensions; index++) {
      coordinate[index] = view.getFloat64(offset, littleEndian);
      offset += 8;
    }
    return coordinate;
  };
  const readCount = (): number => {
    assertRemaining(view, offset, 4);
    const count = view.getUint32(offset, littleEndian);
    offset += 4;
    if (count > 100_000_000) throw new Error('WKB element count exceeds resource limit');
    return count;
  };
  const readCoordinates = (): number[][] => {
    const count = readCount();
    return Array.from({length: count}, readCoordinate);
  };

  switch (rawType) {
    case 1:
      return {geometry: {type: 'Point', coordinates: readCoordinate()}, offset};
    case 2:
      return {geometry: {type: 'LineString', coordinates: readCoordinates()}, offset};
    case 3: {
      const rings = Array.from({length: readCount()}, readCoordinates);
      return {geometry: {type: 'Polygon', coordinates: rings}, offset};
    }
    case 4:
    case 5:
    case 6:
    case 7: {
      const count = readCount();
      const children: GeoArrowGeometryValue[] = [];
      for (let index = 0; index < count; index++) {
        const child = readWKBGeometry(view, offset);
        children.push(child.geometry);
        offset = child.offset;
      }
      if (rawType === 4) {
        return {
          geometry: {
            type: 'MultiPoint',
            coordinates: children.map(assertPoint).map(point => point.coordinates)
          },
          offset
        };
      }
      if (rawType === 5) {
        return {
          geometry: {
            type: 'MultiLineString',
            coordinates: children.map(assertLineString).map(line => line.coordinates)
          },
          offset
        };
      }
      if (rawType === 6) {
        return {
          geometry: {
            type: 'MultiPolygon',
            coordinates: children.map(assertPolygon).map(polygon => polygon.coordinates)
          },
          offset
        };
      }
      return {geometry: {type: 'GeometryCollection', geometries: children}, offset};
    }
    default:
      throw new Error(`Unsupported WKB geometry type ${rawType}`);
  }
}

function writeWKBGeometry(
  bytes: number[],
  geometry: GeoArrowGeometryValue,
  dimension: GeoArrowDimension
): void {
  bytes.push(1);
  const size = getGeoArrowDimensionSize(dimension);
  const dimensionOffset =
    dimension === 'xyz' ? 1000 : dimension === 'xym' ? 2000 : dimension === 'xyzm' ? 3000 : 0;
  writeUint32(bytes, getWKBType(geometry.type) + dimensionOffset);
  const writeCoordinate = (coordinate: readonly number[]): void => {
    for (let index = 0; index < size; index++) writeFloat64(bytes, coordinate[index] ?? 0);
  };
  const writeCoordinates = (coordinates: readonly (readonly number[])[]): void => {
    writeUint32(bytes, coordinates.length);
    for (const coordinate of coordinates) writeCoordinate(coordinate);
  };
  switch (geometry.type) {
    case 'Point':
      writeCoordinate(geometry.coordinates);
      break;
    case 'LineString':
      writeCoordinates(geometry.coordinates);
      break;
    case 'Polygon':
      writeUint32(bytes, geometry.coordinates.length);
      for (const ring of geometry.coordinates) writeCoordinates(ring);
      break;
    case 'MultiPoint':
      writeUint32(bytes, geometry.coordinates.length);
      for (const coordinate of geometry.coordinates)
        writeWKBGeometry(bytes, {type: 'Point', coordinates: coordinate}, dimension);
      break;
    case 'MultiLineString':
      writeUint32(bytes, geometry.coordinates.length);
      for (const coordinates of geometry.coordinates)
        writeWKBGeometry(bytes, {type: 'LineString', coordinates}, dimension);
      break;
    case 'MultiPolygon':
      writeUint32(bytes, geometry.coordinates.length);
      for (const coordinates of geometry.coordinates)
        writeWKBGeometry(bytes, {type: 'Polygon', coordinates}, dimension);
      break;
    case 'GeometryCollection':
      writeUint32(bytes, geometry.geometries.length);
      for (const child of geometry.geometries) writeWKBGeometry(bytes, child, dimension);
      break;
  }
}

class WKTParser {
  private readonly tokens: string[];
  private index = 0;
  private dimensionSize = 2;

  constructor(text: string) {
    this.tokens = tokenizeWKT(text);
  }

  parseGeometry(): GeoArrowGeometryValue {
    const type = this.takeWord().toUpperCase();
    if (['Z', 'M', 'ZM'].includes(this.peek().toUpperCase())) {
      const dimension = this.take().toUpperCase();
      this.dimensionSize = dimension === 'ZM' ? 4 : 3;
    }
    if (this.peek().toUpperCase() === 'EMPTY') {
      this.take();
      return makeEmptyGeometry(type);
    }
    if (type === 'GEOMETRYCOLLECTION') {
      this.expect('(');
      const geometries: GeoArrowGeometryValue[] = [];
      if (this.peek() !== ')') {
        do geometries.push(this.parseGeometry());
        while (this.takeIf(','));
      }
      this.expect(')');
      return {type: 'GeometryCollection', geometries};
    }
    const depth = getWKTDepth(type);
    const coordinates = this.parseCoordinateNesting(depth);
    return makeGeometry(type, coordinates);
  }

  assertComplete(): void {
    if (this.index !== this.tokens.length) throw new Error(`Unexpected WKT token ${this.peek()}`);
  }

  private parseCoordinateNesting(depth: number): unknown {
    this.expect('(');
    if (depth === 0) {
      const coordinate = this.readCoordinate();
      this.expect(')');
      return coordinate;
    }
    const values: unknown[] = [];
    if (this.peek() !== ')') {
      do {
        if (depth === 1 && this.peek() !== '(') values.push(this.readCoordinate());
        else values.push(this.parseCoordinateNesting(depth - 1));
      } while (this.takeIf(','));
    }
    this.expect(')');
    return values;
  }

  private readCoordinate(): number[] {
    const values: number[] = [];
    while (values.length < this.dimensionSize && isNumberToken(this.peek())) {
      values.push(Number(this.take()));
    }
    if (values.length < 2) throw new Error('WKT coordinate requires at least two numbers');
    return values;
  }

  private peek(): string {
    return this.tokens[this.index] || '';
  }

  private take(): string {
    if (this.index >= this.tokens.length) throw new Error('Unexpected end of WKT');
    return this.tokens[this.index++];
  }

  private takeWord(): string {
    const token = this.take();
    if (!/^[A-Za-z_]+$/.test(token)) throw new Error(`Expected WKT geometry type, found ${token}`);
    return token;
  }

  private takeIf(token: string): boolean {
    if (this.peek() !== token) return false;
    this.index++;
    return true;
  }

  private expect(token: string): void {
    const actual = this.take();
    if (actual !== token) throw new Error(`Expected WKT token ${token}, found ${actual}`);
  }
}

function tokenizeWKT(text: string): string[] {
  const tokens: string[] = [];
  const tokenPattern = /[A-Za-z_]+|[(),]|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/gy;
  let index = 0;
  while (index < text.length) {
    while (index < text.length && /\s/.test(text[index])) index++;
    if (index === text.length) break;
    tokenPattern.lastIndex = index;
    const match = tokenPattern.exec(text);
    if (!match)
      throw new Error(`Unexpected WKT character ${JSON.stringify(text[index])} at ${index}`);
    tokens.push(match[0]);
    index = tokenPattern.lastIndex;
  }
  return tokens;
}

function formatCoordinateNesting(value: readonly unknown[], depth: number): string {
  if (depth === 0) return `(${(value as readonly number[]).map(formatNumber).join(' ')})`;
  return `(${value
    .map(child => {
      if (depth === 1) return (child as readonly number[]).map(formatNumber).join(' ');
      return formatCoordinateNesting(child as readonly unknown[], depth - 1);
    })
    .join(', ')})`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'NaN';
  return String(value);
}

function getGeometryDepth(
  type: Exclude<GeoArrowGeometryValue['type'], 'GeometryCollection'>
): number {
  switch (type) {
    case 'Point':
      return 0;
    case 'LineString':
    case 'MultiPoint':
      return 1;
    case 'Polygon':
    case 'MultiLineString':
      return 2;
    case 'MultiPolygon':
      return 3;
  }
}

function getWKTDepth(type: string): number {
  switch (type) {
    case 'POINT':
      return 0;
    case 'LINESTRING':
      return 1;
    case 'POLYGON':
      return 2;
    case 'MULTIPOINT':
      return 1;
    case 'MULTILINESTRING':
      return 2;
    case 'MULTIPOLYGON':
      return 3;
    default:
      throw new Error(`Unsupported WKT geometry type ${type}`);
  }
}

function makeGeometry(type: string, coordinates: unknown): GeoArrowGeometryValue {
  const canonical = type[0] + type.slice(1).toLowerCase();
  const names: Record<string, GeoArrowGeometryValue['type']> = {
    Point: 'Point',
    Linestring: 'LineString',
    Polygon: 'Polygon',
    Multipoint: 'MultiPoint',
    Multilinestring: 'MultiLineString',
    Multipolygon: 'MultiPolygon'
  };
  const geometryType = names[canonical];
  if (!geometryType) throw new Error(`Unsupported WKT geometry type ${type}`);
  return {type: geometryType, coordinates} as GeoArrowGeometryValue;
}

function makeEmptyGeometry(type: string): GeoArrowGeometryValue {
  if (type === 'GEOMETRYCOLLECTION') return {type: 'GeometryCollection', geometries: []};
  if (type === 'POINT') return {type: 'Point', coordinates: [Number.NaN, Number.NaN]};
  return makeGeometry(type, []);
}

function getWKBType(type: GeoArrowGeometryValue['type']): number {
  return (
    [
      'Point',
      'LineString',
      'Polygon',
      'MultiPoint',
      'MultiLineString',
      'MultiPolygon',
      'GeometryCollection'
    ].indexOf(type) + 1
  );
}

function writeUint32(bytes: number[], value: number): void {
  bytes.push(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
}

function writeFloat64(bytes: number[], value: number): void {
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setFloat64(0, value, true);
  bytes.push(...new Uint8Array(buffer));
}

function assertRemaining(view: DataView, offset: number, length: number): void {
  if (offset + length > view.byteLength) throw new Error('Unexpected end of WKB');
}

function assertPoint(
  value: GeoArrowGeometryValue
): Extract<GeoArrowGeometryValue, {type: 'Point'}> {
  if (value.type !== 'Point') throw new Error('WKB MultiPoint contains a non-Point child');
  return value;
}

function assertLineString(
  value: GeoArrowGeometryValue
): Extract<GeoArrowGeometryValue, {type: 'LineString'}> {
  if (value.type !== 'LineString')
    throw new Error('WKB MultiLineString contains a non-LineString child');
  return value;
}

function assertPolygon(
  value: GeoArrowGeometryValue
): Extract<GeoArrowGeometryValue, {type: 'Polygon'}> {
  if (value.type !== 'Polygon') throw new Error('WKB MultiPolygon contains a non-Polygon child');
  return value;
}

function isNumberToken(token: string): boolean {
  return token !== '' && Number.isFinite(Number(token));
}

function inferGeometryDimension(geometry: GeoArrowGeometryValue): GeoArrowDimension {
  const size = getGeometryDimensionSize(geometry);
  return size >= 4 ? 'xyzm' : size === 3 ? 'xyz' : 'xy';
}

function getGeometryDimensionSize(geometry: GeoArrowGeometryValue): number {
  if (geometry.type === 'GeometryCollection') {
    return Math.max(2, ...geometry.geometries.map(getGeometryDimensionSize));
  }
  return getCoordinateDimension(geometry.coordinates);
}

function getCoordinateDimension(value: readonly unknown[]): number {
  if (value.length === 0) return 2;
  if (typeof value[0] === 'number') return value.length;
  return Math.max(2, ...value.map(child => getCoordinateDimension(child as readonly unknown[])));
}

function copyMetadata(source: GeoArrowColumn, target: GeoArrowColumn): GeoArrowColumn {
  return {
    ...target,
    spatialReference: source.spatialReference,
    edges: source.edges,
    metadata: source.metadata
  };
}
