// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GeoArrowArray,
  GeoArrowBounds,
  GeoArrowColumn,
  GeoArrowCoordinateLayout,
  GeoArrowCoordinateMapper,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowGeometryValue
} from './types';
import {getGeoArrowDimensionSize} from './types';
import {makeGeoArrowColumnFromGeometryRows} from './builder';
import {
  getGeoArrowRowCount,
  getGeoArrowVertexCount,
  isGeoArrowValueValid,
  materializeGeoArrowRows,
  visitGeoArrowCoordinates
} from './layout';

/** Resource limits applied before potentially expensive materialization or conversion. */
export type GeoArrowResourceLimitOptions = Readonly<{
  maximumRows?: number;
  maximumCoordinates?: number;
  maximumChunks?: number;
  maximumNestingDepth?: number;
  maximumOutputBytes?: number;
}>;

/** Coordinate-map options. */
export type MapGeoArrowCoordinatesOptions = Readonly<{
  dimension?: GeoArrowDimension;
  coordinateLayout?: GeoArrowCoordinateLayout;
  limits?: GeoArrowResourceLimitOptions;
}>;

/** Conversion options for native physical layouts. */
export type ConvertGeoArrowColumnOptions = Readonly<{
  encoding?: GeoArrowEncoding;
  dimension?: GeoArrowDimension;
  coordinateLayout?: GeoArrowCoordinateLayout;
  limits?: GeoArrowResourceLimitOptions;
}>;

/** Ring orientation requested by {@link rewindGeoArrow}. */
export type GeoArrowRingOrientation = 'clockwise' | 'counter-clockwise';

/** Rewind options. */
export type RewindGeoArrowOptions = Readonly<{
  outer?: GeoArrowRingOrientation;
  limits?: GeoArrowResourceLimitOptions;
}>;

/** Returns XY bounds, or null when the column contains no finite coordinates. */
export function getGeoArrowBounds(column: GeoArrowColumn): GeoArrowBounds | null {
  if (column.encoding === 'geoarrow.box') return getGeoArrowBoxBounds(column);
  let minimumX = Number.POSITIVE_INFINITY;
  let minimumY = Number.POSITIVE_INFINITY;
  let maximumX = Number.NEGATIVE_INFINITY;
  let maximumY = Number.NEGATIVE_INFINITY;
  visitGeoArrowCoordinates(column, coordinate => {
    const x = coordinate[0];
    const y = coordinate[1];
    if (Number.isFinite(x) && Number.isFinite(y)) {
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
    }
    return coordinate;
  });
  return Number.isFinite(minimumX) ? [minimumX, minimumY, maximumX, maximumY] : null;
}

function getGeoArrowBoxBounds(column: GeoArrowColumn): GeoArrowBounds | null {
  let minimumX = Number.POSITIVE_INFINITY;
  let minimumY = Number.POSITIVE_INFINITY;
  let maximumX = Number.NEGATIVE_INFINITY;
  let maximumY = Number.NEGATIVE_INFINITY;
  for (const chunk of column.chunks) {
    if (chunk.kind !== 'struct') continue;
    const xmin = chunk.children['xmin'];
    const ymin = chunk.children['ymin'];
    const xmax = chunk.children['xmax'];
    const ymax = chunk.children['ymax'];
    if (!xmin || !ymin || !xmax || !ymax) continue;
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      if (!isGeoArrowValueValid(chunk.validity, rowIndex)) continue;
      const structIndex = (chunk.offset || 0) + rowIndex;
      const bounds = [
        readPrimitiveNumber(xmin, structIndex),
        readPrimitiveNumber(ymin, structIndex),
        readPrimitiveNumber(xmax, structIndex),
        readPrimitiveNumber(ymax, structIndex)
      ];
      if (bounds.every(Number.isFinite)) {
        minimumX = Math.min(minimumX, bounds[0]);
        minimumY = Math.min(minimumY, bounds[1]);
        maximumX = Math.max(maximumX, bounds[2]);
        maximumY = Math.max(maximumY, bounds[3]);
      }
    }
  }
  return Number.isFinite(minimumX) ? [minimumX, minimumY, maximumX, maximumY] : null;
}

function readPrimitiveNumber(array: GeoArrowArray, index: number): number {
  if (array.kind !== 'primitive' || !isGeoArrowValueValid(array.validity, index)) return Number.NaN;
  const valueIndex = (array.offset || 0) + index * (array.stride || 1);
  return Number(array.values[valueIndex]);
}

/** Maps every coordinate into newly allocated physical buffers while preserving column semantics. */
export function mapGeoArrowCoordinates(
  column: GeoArrowColumn,
  mapper: GeoArrowCoordinateMapper,
  options: MapGeoArrowCoordinatesOptions = {}
): GeoArrowColumn {
  assertGeoArrowResourceLimits(column, options.limits);
  const rows = materializeGeoArrowRows(column);
  let rowIndex = 0;
  const mappedRows = rows.map(row => {
    const mapped = row
      ? mapGeometryCoordinates(row, coordinate => mapper(coordinate, rowIndex))
      : null;
    rowIndex++;
    return mapped;
  });
  const result = makeGeoArrowColumnFromGeometryRows(mappedRows, {
    dimension: options.dimension || column.dimension,
    coordinateLayout: options.coordinateLayout || column.coordinateLayout || 'interleaved'
  });
  return copyColumnMetadata(column, result);
}

/**
 * Maps coordinates and copies the result into caller-provided destination buffers.
 *
 * The destination must have the same physical topology as the mapped result. Topology, validity,
 * offsets, and metadata in the destination are never replaced.
 */
export function mapGeoArrowCoordinatesInto(
  target: GeoArrowColumn,
  source: GeoArrowColumn,
  mapper: GeoArrowCoordinateMapper,
  options: Omit<MapGeoArrowCoordinatesOptions, 'coordinateLayout'> = {}
): GeoArrowColumn {
  const mapped = mapGeoArrowCoordinates(source, mapper, {
    ...options,
    coordinateLayout: target.coordinateLayout || undefined
  });
  const sourceLeaves = collectCoordinateLeaves(mapped);
  const targetLeaves = collectCoordinateLeaves(target);
  if (sourceLeaves.length !== targetLeaves.length) {
    throw new Error('GeoArrow destination has different coordinate topology');
  }
  for (let index = 0; index < sourceLeaves.length; index++) {
    const sourceLeaf = sourceLeaves[index];
    const targetLeaf = targetLeaves[index];
    if (sourceLeaf.length !== targetLeaf.length) {
      throw new Error('GeoArrow destination coordinate buffer has a different length');
    }
    targetLeaf.set(sourceLeaf as never);
  }
  return target;
}

/** Converts separated native coordinates to interleaved tuples. Identity is returned unchanged. */
export function interleaveGeoArrowCoordinates(column: GeoArrowColumn): GeoArrowColumn {
  if (column.coordinateLayout === 'interleaved') return column;
  if (!column.coordinateLayout) return column;
  return mapGeoArrowCoordinates(column, coordinate => coordinate, {
    coordinateLayout: 'interleaved'
  });
}

/** Normalizes dense-union children by ascending type ID without changing dispatch buffers. */
export function normalizeGeoArrowUnion(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding !== 'geoarrow.geometry') return column;
  let changed = false;
  const chunks = column.chunks.map(chunk => {
    if (chunk.kind !== 'dense-union') return chunk;
    const children = [...chunk.children].sort((left, right) => left.typeId - right.typeId);
    changed ||= children.some((child, index) => child !== chunk.children[index]);
    return children.every((child, index) => child === chunk.children[index])
      ? chunk
      : {...chunk, children};
  });
  return changed ? {...column, chunks} : column;
}

/** Converts between concrete/mixed encodings, dimensions, and coordinate layouts. */
export function convertGeoArrowColumn(
  column: GeoArrowColumn,
  options: ConvertGeoArrowColumnOptions = {}
): GeoArrowColumn {
  const encoding = options.encoding || column.encoding;
  const dimension = options.dimension || column.dimension;
  const coordinateLayout = options.coordinateLayout || column.coordinateLayout;
  if (
    encoding === column.encoding &&
    dimension === column.dimension &&
    coordinateLayout === column.coordinateLayout
  ) {
    return column;
  }
  if (encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt') {
    throw new Error('Use encodeGeoArrowWKB or encodeGeoArrowWKT for serialized output');
  }
  assertGeoArrowResourceLimits(column, options.limits);
  const rows = materializeGeoArrowRows(column).map(row =>
    row ? convertGeometryFamily(row, encoding, column.dimension, dimension) : null
  );
  const result = makeGeoArrowColumnFromGeometryRows(rows, {
    encoding: encoding === 'geoarrow.geometry' ? encoding : undefined,
    dimension,
    coordinateLayout: coordinateLayout || 'interleaved'
  });
  if (result.encoding !== encoding && encoding !== 'geoarrow.geometry') {
    throw new Error(`Rows cannot be represented as ${encoding}`);
  }
  return copyColumnMetadata(column, result);
}

/** Rewinds polygon rings without changing non-polygon rows. */
export function rewindGeoArrow(
  column: GeoArrowColumn,
  options: RewindGeoArrowOptions = {}
): GeoArrowColumn {
  assertGeoArrowResourceLimits(column, options.limits);
  const outerClockwise = (options.outer || 'counter-clockwise') === 'clockwise';
  let changed = false;
  const rows = materializeGeoArrowRows(column).map(row => {
    if (!row) return null;
    const rewound = rewindGeometry(row, outerClockwise);
    changed ||= rewound !== row;
    return rewound;
  });
  if (!changed) return column;
  const result = makeGeoArrowColumnFromGeometryRows(rows, {
    dimension: column.dimension,
    coordinateLayout: column.coordinateLayout || 'interleaved'
  });
  return copyColumnMetadata(column, result);
}

/** Throws when a column exceeds configured work or output limits. */
export function assertGeoArrowResourceLimits(
  column: GeoArrowColumn,
  options: GeoArrowResourceLimitOptions = {}
): void {
  const rows = getGeoArrowRowCount(column);
  if (rows > (options.maximumRows ?? Number.POSITIVE_INFINITY)) {
    throw new Error(`GeoArrow row count ${rows} exceeds maximumRows`);
  }
  if (column.chunks.length > (options.maximumChunks ?? Number.POSITIVE_INFINITY)) {
    throw new Error(`GeoArrow chunk count ${column.chunks.length} exceeds maximumChunks`);
  }
  const coordinates = getGeoArrowVertexCount(column);
  if (coordinates > (options.maximumCoordinates ?? Number.POSITIVE_INFINITY)) {
    throw new Error(`GeoArrow coordinate count ${coordinates} exceeds maximumCoordinates`);
  }
  if (options.maximumNestingDepth !== undefined) {
    const depth = Math.max(0, ...column.chunks.map(getArrayDepth));
    if (depth > options.maximumNestingDepth) {
      throw new Error(`GeoArrow nesting depth ${depth} exceeds maximumNestingDepth`);
    }
  }
  if (options.maximumOutputBytes !== undefined) {
    const estimatedBytes = coordinates * getGeoArrowDimensionSize(column.dimension) * 8;
    if (estimatedBytes > options.maximumOutputBytes) {
      throw new Error(`GeoArrow estimated output ${estimatedBytes} exceeds maximumOutputBytes`);
    }
  }
}

function mapGeometryCoordinates(
  geometry: GeoArrowGeometryValue,
  mapper: (coordinate: readonly number[]) => readonly number[]
): GeoArrowGeometryValue {
  if (geometry.type === 'GeometryCollection') {
    return {
      ...geometry,
      geometries: geometry.geometries.map(child => mapGeometryCoordinates(child, mapper))
    };
  }
  return {
    ...geometry,
    coordinates: mapCoordinateNesting(geometry.coordinates, mapper)
  } as GeoArrowGeometryValue;
}

function mapCoordinateNesting(
  value: readonly unknown[],
  mapper: (coordinate: readonly number[]) => readonly number[]
): unknown {
  if (value.length === 0) return [];
  if (typeof value[0] === 'number') return [...mapper(value as readonly number[])];
  return value.map(child => mapCoordinateNesting(child as readonly unknown[], mapper));
}

function rewindGeometry(
  geometry: GeoArrowGeometryValue,
  outerClockwise: boolean
): GeoArrowGeometryValue {
  if (geometry.type === 'GeometryCollection') {
    const geometries = geometry.geometries.map(child => rewindGeometry(child, outerClockwise));
    return geometries.some((child, index) => child !== geometry.geometries[index])
      ? {...geometry, geometries}
      : geometry;
  }
  if (geometry.type === 'Polygon') {
    const coordinates = rewindPolygon(geometry.coordinates, outerClockwise);
    return coordinates === geometry.coordinates ? geometry : {...geometry, coordinates};
  }
  if (geometry.type === 'MultiPolygon') {
    const coordinates = geometry.coordinates.map(polygon => rewindPolygon(polygon, outerClockwise));
    return coordinates.every((polygon, index) => polygon === geometry.coordinates[index])
      ? geometry
      : {...geometry, coordinates};
  }
  return geometry;
}

function rewindPolygon(
  rings: readonly (readonly (readonly number[])[])[],
  outerClockwise: boolean
): readonly (readonly (readonly number[])[])[] {
  let changed = false;
  const result = rings.map((ring, ringIndex) => {
    const shouldBeClockwise = ringIndex === 0 ? outerClockwise : !outerClockwise;
    const isClockwise = getRingSignedArea(ring) < 0;
    if (isClockwise === shouldBeClockwise) return ring;
    changed = true;
    return [...ring].reverse();
  });
  return changed ? result : rings;
}

function getRingSignedArea(ring: readonly (readonly number[])[]): number {
  let area = 0;
  for (let index = 0; index < ring.length; index++) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function convertGeometryFamily(
  geometry: GeoArrowGeometryValue,
  encoding: GeoArrowEncoding,
  sourceDimension: GeoArrowDimension,
  targetDimension: GeoArrowDimension
): GeoArrowGeometryValue {
  if (geometry.type === 'GeometryCollection') {
    const geometries = geometry.geometries.map(child =>
      convertGeometryFamily(child, 'geoarrow.geometry', sourceDimension, targetDimension)
    );
    if (encoding === 'geoarrow.geometry' || encoding === 'geoarrow.geometrycollection') {
      return {...geometry, geometries};
    }
    throw new Error(`${geometry.type} cannot be represented as ${encoding}`);
  }
  const coordinates = mapCoordinateNesting(geometry.coordinates, coordinate =>
    resizeCoordinate(coordinate, sourceDimension, targetDimension)
  );
  if (encoding === 'geoarrow.geometry') {
    return {...geometry, coordinates} as GeoArrowGeometryValue;
  }
  const target = encoding.replace('geoarrow.', '');
  if (geometry.type.toLowerCase() !== target) {
    throw new Error(`${geometry.type} cannot be represented as ${encoding}`);
  }
  return {...geometry, coordinates} as GeoArrowGeometryValue;
}

function resizeCoordinate(
  coordinate: readonly number[],
  sourceDimension: GeoArrowDimension,
  targetDimension: GeoArrowDimension
): number[] {
  const sourceNames = getDimensionNames(sourceDimension);
  const targetNames = getDimensionNames(targetDimension);
  return targetNames.map(name => {
    const sourceIndex = sourceNames.indexOf(name);
    return sourceIndex >= 0 ? (coordinate[sourceIndex] ?? 0) : 0;
  });
}

function getDimensionNames(dimension: GeoArrowDimension): Array<'x' | 'y' | 'z' | 'm'> {
  switch (dimension) {
    case 'xy':
      return ['x', 'y'];
    case 'xyz':
      return ['x', 'y', 'z'];
    case 'xym':
      return ['x', 'y', 'm'];
    case 'xyzm':
      return ['x', 'y', 'z', 'm'];
  }
}

function copyColumnMetadata(source: GeoArrowColumn, target: GeoArrowColumn): GeoArrowColumn {
  return {
    ...target,
    spatialReference: source.spatialReference,
    edges: source.edges,
    metadata: source.metadata
  };
}

function collectCoordinateLeaves(column: GeoArrowColumn): Array<Float32Array | Float64Array> {
  const leaves: Array<Float32Array | Float64Array> = [];
  for (const chunk of column.chunks) collectArrayCoordinateLeaves(chunk, leaves);
  return leaves;
}

function collectArrayCoordinateLeaves(
  array: GeoArrowArray,
  leaves: Array<Float32Array | Float64Array>
): void {
  switch (array.kind) {
    case 'primitive':
      if (array.values instanceof Float32Array || array.values instanceof Float64Array) {
        leaves.push(array.values);
      }
      break;
    case 'fixed-size-list':
    case 'list':
      collectArrayCoordinateLeaves(array.child, leaves);
      break;
    case 'struct':
      for (const name of ['x', 'y', 'z', 'm']) {
        const child = array.children[name];
        if (child) collectArrayCoordinateLeaves(child, leaves);
      }
      break;
    case 'dense-union':
      for (const child of array.children) collectArrayCoordinateLeaves(child.data, leaves);
      break;
    default:
      break;
  }
}

function getArrayDepth(array: GeoArrowArray): number {
  switch (array.kind) {
    case 'list':
    case 'fixed-size-list':
      return 1 + getArrayDepth(array.child);
    case 'struct':
      return 1 + Math.max(0, ...Object.values(array.children).map(getArrayDepth));
    case 'dense-union':
      return 1 + Math.max(0, ...array.children.map(child => getArrayDepth(child.data)));
    default:
      return 1;
  }
}
