// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WellKnownDimension, WellKnownGeometry} from './types';
import {getWellKnownDimensionSize, inferWellKnownGeometryDimension} from './types';
import {inspectWKBHeader} from './wkb-reader';

/** Defensive limits applied before WKB allocates geometry arrays. */
export type WKBParseOptions = Readonly<{
  /** Maximum recursive geometry nesting. Defaults to 64. */
  maximumDepth?: number;
  /** Maximum total declared child elements. Defaults to 100 million. */
  maximumElements?: number;
}>;

/** One completely parsed WKB value and metadata declared by its root header. */
export type WKBParseResult = Readonly<{
  geometry: WellKnownGeometry;
  byteLength: number;
  dimension: WellKnownDimension;
  /** EWKB SRID when the root header carries one. */
  srid?: number;
}>;

type WKBReadResult = {
  geometry: WellKnownGeometry;
  offset: number;
  dimension: WellKnownDimension;
  srid?: number;
};

type WKBReadState = {
  maximumDepth: number;
  maximumElements: number;
  elementCount: number;
};

/** Parses exactly one little- or big-endian ISO WKB or EWKB geometry. */
export function parseWKB(bytes: Uint8Array, options: WKBParseOptions = {}): WKBParseResult {
  const state: WKBReadState = {
    maximumDepth: validateLimit(options.maximumDepth, 64, 'maximumDepth'),
    maximumElements: validateLimit(options.maximumElements, 100_000_000, 'maximumElements'),
    elementCount: 0
  };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = readWKBGeometry(view, 0, state, 0);
  if (result.offset !== bytes.byteLength) throw new Error('WKB contains trailing bytes');
  return {
    geometry: result.geometry,
    byteLength: result.offset,
    dimension: result.dimension,
    ...(result.srid === undefined ? {} : {srid: result.srid})
  };
}

/** Writes one geometry as little-endian ISO WKB. */
export function writeWKB(
  geometry: WellKnownGeometry,
  dimension: WellKnownDimension = inferWellKnownGeometryDimension(geometry)
): Uint8Array {
  const bytes: number[] = [];
  writeWKBGeometry(bytes, geometry, dimension);
  return Uint8Array.from(bytes);
}

function readWKBGeometry(
  view: DataView,
  startOffset: number,
  state: WKBReadState,
  depth: number
): WKBReadResult {
  if (depth > state.maximumDepth) throw new Error('WKB geometry nesting exceeds maximumDepth');
  const header = inspectWKBHeader(view, startOffset);
  let offset = header.bodyByteOffset;
  const {dimension, geometryType, littleEndian, srid} = header;
  const dimensions = getWellKnownDimensionSize(dimension);
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
    state.elementCount += count;
    if (state.elementCount > state.maximumElements) {
      throw new Error('WKB element count exceeds maximumElements');
    }
    return count;
  };
  const readCoordinates = (): number[][] => {
    const count = readCount();
    return Array.from({length: count}, readCoordinate);
  };

  let geometry: WellKnownGeometry;
  switch (geometryType) {
    case 'Point':
      geometry = {type: 'Point', coordinates: readCoordinate()};
      break;
    case 'LineString':
      geometry = {type: 'LineString', coordinates: readCoordinates()};
      break;
    case 'Polygon':
      geometry = {type: 'Polygon', coordinates: Array.from({length: readCount()}, readCoordinates)};
      break;
    case 'MultiPoint':
    case 'MultiLineString':
    case 'MultiPolygon':
    case 'GeometryCollection': {
      const children: WellKnownGeometry[] = [];
      for (let index = 0, count = readCount(); index < count; index++) {
        const child = readWKBGeometry(view, offset, state, depth + 1);
        children.push(child.geometry);
        offset = child.offset;
      }
      if (geometryType === 'MultiPoint') {
        geometry = {
          type: 'MultiPoint',
          coordinates: children.map(assertPoint).map(point => point.coordinates)
        };
      } else if (geometryType === 'MultiLineString') {
        geometry = {
          type: 'MultiLineString',
          coordinates: children.map(assertLineString).map(line => line.coordinates)
        };
      } else if (geometryType === 'MultiPolygon') {
        geometry = {
          type: 'MultiPolygon',
          coordinates: children.map(assertPolygon).map(polygon => polygon.coordinates)
        };
      } else {
        geometry = {type: 'GeometryCollection', geometries: children};
      }
      break;
    }
  }
  return {geometry, offset, dimension, ...(srid === undefined ? {} : {srid})};
}

function writeWKBGeometry(
  bytes: number[],
  geometry: WellKnownGeometry,
  dimension: WellKnownDimension
): void {
  bytes.push(1);
  const size = getWellKnownDimensionSize(dimension);
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
      for (const coordinate of geometry.coordinates) {
        writeWKBGeometry(bytes, {type: 'Point', coordinates: coordinate}, dimension);
      }
      break;
    case 'MultiLineString':
      writeUint32(bytes, geometry.coordinates.length);
      for (const coordinates of geometry.coordinates) {
        writeWKBGeometry(bytes, {type: 'LineString', coordinates}, dimension);
      }
      break;
    case 'MultiPolygon':
      writeUint32(bytes, geometry.coordinates.length);
      for (const coordinates of geometry.coordinates) {
        writeWKBGeometry(bytes, {type: 'Polygon', coordinates}, dimension);
      }
      break;
    case 'GeometryCollection':
      writeUint32(bytes, geometry.geometries.length);
      for (const child of geometry.geometries) writeWKBGeometry(bytes, child, dimension);
      break;
  }
}

function getWKBType(type: WellKnownGeometry['type']): number {
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

function assertPoint(value: WellKnownGeometry): Extract<WellKnownGeometry, {type: 'Point'}> {
  if (value.type !== 'Point') throw new Error('WKB MultiPoint contains a non-Point child');
  return value;
}

function assertLineString(
  value: WellKnownGeometry
): Extract<WellKnownGeometry, {type: 'LineString'}> {
  if (value.type !== 'LineString') {
    throw new Error('WKB MultiLineString contains a non-LineString child');
  }
  return value;
}

function assertPolygon(value: WellKnownGeometry): Extract<WellKnownGeometry, {type: 'Polygon'}> {
  if (value.type !== 'Polygon') throw new Error('WKB MultiPolygon contains a non-Polygon child');
  return value;
}

function validateLimit(value: number | undefined, fallback: number, name: string): number {
  const limit = value ?? fallback;
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
  return limit;
}
