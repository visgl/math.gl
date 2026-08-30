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
  visitGeoArrowCoordinates,
  getListRange,
  materializeGeometryRow
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
  coordinateType?: 'preserve' | 'float32' | 'float64';
  limits?: GeoArrowResourceLimitOptions;
}>;

/** Conversion options for native physical layouts. */
export type ConvertGeoArrowColumnOptions = Readonly<{
  encoding?: GeoArrowEncoding | 'native';
  dimension?: GeoArrowDimension;
  coordinateLayout?: GeoArrowCoordinateLayout | 'preserve';
  coordinateType?: 'preserve' | 'float32' | 'float64';
  offsetType?: 'preserve' | 'int32' | 'int64';
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

/** Computes exact XY bounds for each logical row without materializing geometry values. */
export function getGeoArrowRowBounds(column: GeoArrowColumn): readonly (GeoArrowBounds | null)[] {
  const rowCount = getGeoArrowRowCount(column);
  if (column.encoding === 'geoarrow.box') {
    const result: Array<GeoArrowBounds | null> = [];
    for (const chunk of column.chunks) {
      for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
        if (chunk.kind !== 'struct' || !isGeoArrowValueValid(chunk.validity, rowIndex)) {
          result.push(null);
          continue;
        }
        const index = (chunk.offset || 0) + rowIndex;
        const xmin = readPrimitiveNumber(chunk.children['xmin'], index);
        const ymin = readPrimitiveNumber(chunk.children['ymin'], index);
        const xmax = readPrimitiveNumber(chunk.children['xmax'], index);
        const ymax = readPrimitiveNumber(chunk.children['ymax'], index);
        result.push(
          [xmin, ymin, xmax, ymax].every(Number.isFinite) ? [xmin, ymin, xmax, ymax] : null
        );
      }
    }
    return result;
  }
  const minimumX = new Float64Array(rowCount).fill(Number.POSITIVE_INFINITY);
  const minimumY = new Float64Array(rowCount).fill(Number.POSITIVE_INFINITY);
  const maximumX = new Float64Array(rowCount).fill(Number.NEGATIVE_INFINITY);
  const maximumY = new Float64Array(rowCount).fill(Number.NEGATIVE_INFINITY);
  visitGeoArrowCoordinates(column, (coordinate, sourceRowIndex) => {
    const [x, y] = coordinate;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      minimumX[sourceRowIndex] = Math.min(minimumX[sourceRowIndex], x);
      minimumY[sourceRowIndex] = Math.min(minimumY[sourceRowIndex], y);
      maximumX[sourceRowIndex] = Math.max(maximumX[sourceRowIndex], x);
      maximumY[sourceRowIndex] = Math.max(maximumY[sourceRowIndex], y);
    }
    return coordinate;
  });
  const bounds: Array<GeoArrowBounds | null> = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    bounds.push(
      Number.isFinite(minimumX[rowIndex])
        ? [minimumX[rowIndex], minimumY[rowIndex], maximumX[rowIndex], maximumY[rowIndex]]
        : null
    );
  }
  return bounds;
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
  options: MapGeoArrowCoordinatesOptions = {},
  sourceDimension?: GeoArrowDimension
): GeoArrowColumn {
  assertGeoArrowResourceLimits(column, options.limits);
  if (column.encoding === 'geoarrow.wkb' || column.encoding === 'geoarrow.wkt') {
    throw new Error('Coordinate mapping requires native GeoArrow storage');
  }
  const dimension = options.dimension || column.dimension;
  const layout = options.coordinateLayout || column.coordinateLayout || 'interleaved';
  let rowOffset = 0;
  const chunks = column.chunks.map(chunk => {
    const mapped = mapArrayCoordinates(
      chunk,
      column.encoding,
      rowOffset,
      dimension,
      layout,
      mapper,
      options.coordinateType || 'preserve',
      options.dimension !== undefined,
      options.coordinateLayout !== undefined,
      sourceDimension
    );
    rowOffset += chunk.length;
    return mapped;
  });
  return {...column, dimension, coordinateLayout: layout, chunks};
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
  const encoding =
    options.encoding === 'native' || !options.encoding ? column.encoding : options.encoding;
  const dimension = options.dimension || column.dimension;
  const coordinateLayout =
    options.coordinateLayout === 'preserve' || !options.coordinateLayout
      ? column.coordinateLayout
      : options.coordinateLayout;
  const requestedOffsetType = options.offsetType || 'preserve';
  const currentOffsetType = getColumnOffsetType(column);
  if (
    encoding === column.encoding &&
    dimension === column.dimension &&
    coordinateLayout === column.coordinateLayout &&
    (requestedOffsetType === 'preserve' || requestedOffsetType === currentOffsetType) &&
    (!options.coordinateType || options.coordinateType === 'preserve')
  ) {
    return column;
  }
  if (encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt') {
    throw new Error('Use encodeGeoArrowWKB or encodeGeoArrowWKT for serialized output');
  }
  assertGeoArrowResourceLimits(column, options.limits);
  const mapped = mapGeoArrowCoordinates(
    column,
    coordinate => coordinate,
    {
      dimension,
      coordinateLayout: coordinateLayout || undefined,
      coordinateType: options.coordinateType,
      limits: options.limits
    },
    column.dimension
  );
  const offsetConverted =
    requestedOffsetType === 'preserve'
      ? mapped
      : {
          ...mapped,
          chunks: mapped.chunks.map(chunk => convertArrayOffsets(chunk, requestedOffsetType))
        };
  if (encoding === column.encoding) return offsetConverted;
  if (encoding === 'geoarrow.geometry') return promoteToDenseUnion(offsetConverted);
  if (column.encoding === 'geoarrow.geometry') return demoteDenseUnion(offsetConverted, encoding);
  throw new Error(`Rows cannot be represented as ${encoding}`);
}

function resizeCoordinate(
  coordinate: readonly number[],
  sourceDimension: GeoArrowDimension,
  targetDimension: GeoArrowDimension
): number[] {
  const sourceNames = getDimensionNames(sourceDimension);
  return getDimensionNames(targetDimension).map(name => {
    const sourceIndex = sourceNames.indexOf(name);
    return sourceIndex >= 0 ? (coordinate[sourceIndex] ?? 0) : 0;
  });
}

/** Rewinds polygon rings without changing non-polygon rows. */
export function rewindGeoArrow(
  column: GeoArrowColumn,
  options: RewindGeoArrowOptions = {}
): GeoArrowColumn {
  assertGeoArrowResourceLimits(column, options.limits);
  if (column.encoding === 'geoarrow.wkb' || column.encoding === 'geoarrow.wkt') {
    throw new Error('Rewinding requires native GeoArrow storage');
  }
  const outerClockwise = (options.outer || 'counter-clockwise') === 'clockwise';
  let changed = false;
  const chunks = column.chunks.map(chunk => {
    const clone = mapArrayCoordinates(
      chunk,
      column.encoding,
      0,
      column.dimension,
      column.coordinateLayout || 'interleaved',
      coordinate => coordinate,
      'preserve'
    );
    changed ||= rewindArrayRings(clone, column.encoding, outerClockwise);
    return clone;
  });
  return changed ? {...column, chunks} : column;
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

/** Directly clones a physical array while rewriting only coordinate leaves. */
function mapArrayCoordinates(
  array: GeoArrowArray,
  encoding: GeoArrowEncoding,
  rowOffset: number,
  targetDimension: GeoArrowDimension,
  targetLayout: GeoArrowCoordinateLayout,
  mapper: GeoArrowCoordinateMapper,
  coordinateType: 'preserve' | 'float32' | 'float64',
  forceDimension = false,
  forceLayout = false,
  sourceDimension?: GeoArrowDimension,
  rowIndicesOverride?: readonly number[]
): GeoArrowArray {
  if (encoding === 'geoarrow.geometry' && array.kind === 'dense-union') {
    const childRowIndices = collectUnionRowIndices(array, rowOffset);
    return {
      ...array,
      children: array.children.map((child, childIndex) => {
        const childEncoding = child.encoding || getEncodingFromChildName(child.name);
        const childDimension = forceDimension
          ? targetDimension
          : child.dimension || targetDimension;
        const childLayout = forceLayout ? targetLayout : child.coordinateLayout || targetLayout;
        return {
          ...child,
          data: mapArrayCoordinates(
            child.data,
            childEncoding,
            rowOffset,
            childDimension,
            childLayout,
            mapper,
            coordinateType,
            forceDimension,
            forceLayout,
            childDimension,
            childRowIndices[childIndex]
          ),
          dimension: childDimension,
          coordinateLayout: childLayout,
          encoding: childEncoding
        };
      })
    };
  }
  if (encoding === 'geoarrow.geometrycollection' && array.kind === 'list') {
    return {
      ...array,
      child: mapArrayCoordinates(
        array.child,
        'geoarrow.geometry',
        rowOffset,
        targetDimension,
        targetLayout,
        mapper,
        coordinateType,
        forceDimension,
        forceLayout,
        sourceDimension,
        rowIndicesOverride
      )
    };
  }
  const depth = getEncodingDepth(encoding);
  const rowIndices = rowIndicesOverride || collectLeafRowIndices(array, depth, rowOffset);
  return mapNestedArray(
    array,
    depth,
    rowOffset,
    targetDimension,
    targetLayout,
    mapper,
    coordinateType,
    rowIndices,
    sourceDimension
  );
}

function mapNestedArray(
  array: GeoArrowArray,
  depth: number,
  rowOffset: number,
  targetDimension: GeoArrowDimension,
  targetLayout: GeoArrowCoordinateLayout,
  mapper: GeoArrowCoordinateMapper,
  coordinateType: 'preserve' | 'float32' | 'float64',
  rowIndices?: readonly number[],
  sourceDimension?: GeoArrowDimension
): GeoArrowArray {
  if (depth === 0) {
    return mapCoordinateLeaf(
      array,
      rowOffset,
      targetDimension,
      targetLayout,
      mapper,
      coordinateType,
      rowIndices,
      sourceDimension
    );
  }
  if (array.kind !== 'list') return array;
  return {
    ...array,
    child: mapNestedArray(
      array.child,
      depth - 1,
      rowOffset,
      targetDimension,
      targetLayout,
      mapper,
      coordinateType,
      rowIndices,
      sourceDimension
    )
  };
}

function mapCoordinateLeaf(
  array: GeoArrowArray,
  rowOffset: number,
  targetDimension: GeoArrowDimension,
  targetLayout: GeoArrowCoordinateLayout,
  mapper: GeoArrowCoordinateMapper,
  coordinateType: 'preserve' | 'float32' | 'float64',
  rowIndices?: readonly number[],
  sourceDimension?: GeoArrowDimension
): GeoArrowArray {
  const count = array.length;
  const targetSize = getGeoArrowDimensionSize(targetDimension);
  const sourceValues = new Array<number[]>(count);
  for (let index = 0; index < count; index++) {
    const coordinate = readCoordinateAt(array, index);
    const mapped = coordinate
      ? mapper(
          sourceDimension
            ? resizeCoordinate(coordinate, sourceDimension, targetDimension)
            : coordinate,
          rowIndices?.[index] ?? rowOffset
        )
      : new Array(targetSize).fill(0);
    if (mapped.length !== targetSize) {
      throw new Error(`Coordinate mapper returned ${mapped.length} values; expected ${targetSize}`);
    }
    sourceValues[index] = [...mapped];
  }
  const FloatArray = resolveCoordinateConstructor(array, coordinateType);
  return makeCoordinateLeaf(
    sourceValues,
    targetDimension,
    targetLayout,
    FloatArray,
    array.validity
  );
}

/** Fills one row-index entry per coordinate in a concrete nested array. */
function collectLeafRowIndices(array: GeoArrowArray, depth: number, rowOffset: number): number[] {
  const output = new Array<number>(getLeafLength(array, depth)).fill(rowOffset);
  for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
    if (isGeoArrowValueValid(array.validity, rowIndex)) {
      assignNestedRowIndices(array, rowIndex, depth, rowOffset + rowIndex, output);
    }
  }
  return output;
}

function assignNestedRowIndices(
  array: GeoArrowArray,
  index: number,
  depth: number,
  rowIndex: number,
  output: number[]
): void {
  if (depth === 0) {
    if (index >= 0 && index < output.length) output[index] = rowIndex;
    return;
  }
  if (array.kind !== 'list') return;
  const [first, last] = getListRange(array, index);
  for (let childIndex = first; childIndex < last; childIndex++) {
    assignNestedRowIndices(array.child, childIndex, depth - 1, rowIndex, output);
  }
}

function collectUnionRowIndices(union: GeoArrowArray, rowOffset: number): number[][] {
  if (union.kind !== 'dense-union') return [];
  const output = union.children.map(child => {
    const encoding = child.encoding || getEncodingFromChildName(child.name);
    return new Array<number>(getLeafLength(child.data, getEncodingDepth(encoding))).fill(rowOffset);
  });
  for (let rowIndex = 0; rowIndex < union.length; rowIndex++) {
    if (!isGeoArrowValueValid(union.validity, rowIndex)) continue;
    const physical = (union.offset || 0) + rowIndex;
    const childIndex = union.children.findIndex(child => child.typeId === union.typeIds[physical]);
    if (childIndex < 0) continue;
    const child = union.children[childIndex];
    assignUnionRowIndices(
      child.data,
      child.encoding || getEncodingFromChildName(child.name),
      union.valueOffsets[physical],
      rowOffset + rowIndex,
      output[childIndex]
    );
  }
  return output;
}

function assignUnionRowIndices(
  array: GeoArrowArray,
  encoding: GeoArrowEncoding,
  index: number,
  rowIndex: number,
  output: number[]
): void {
  if (encoding === 'geoarrow.geometry' && array.kind === 'dense-union') {
    const physical = (array.offset || 0) + index;
    const childIndex = array.children.findIndex(child => child.typeId === array.typeIds[physical]);
    if (childIndex >= 0) {
      const child = array.children[childIndex];
      assignUnionRowIndices(
        child.data,
        child.encoding || getEncodingFromChildName(child.name),
        array.valueOffsets[physical],
        rowIndex,
        output
      );
    }
    return;
  }
  if (encoding === 'geoarrow.geometrycollection' && array.kind === 'list') {
    const [first, last] = getListRange(array, index);
    if (array.child.kind === 'dense-union') {
      for (let childIndex = first; childIndex < last; childIndex++) {
        assignUnionRowIndices(array.child, 'geoarrow.geometry', childIndex, rowIndex, output);
      }
    }
    return;
  }
  assignNestedRowIndices(array, index, getEncodingDepth(encoding), rowIndex, output);
}

function getLeafLength(array: GeoArrowArray, depth: number): number {
  let current = array;
  for (let level = 0; level < depth; level++) {
    if (current.kind !== 'list') return 0;
    current = current.child;
  }
  return current.length;
}

function resolveCoordinateConstructor(
  array: GeoArrowArray,
  coordinateType: 'preserve' | 'float32' | 'float64'
): Float32ArrayConstructor | Float64ArrayConstructor {
  if (coordinateType === 'float32') return Float32Array;
  if (coordinateType === 'float64') return Float64Array;
  if (array.kind === 'fixed-size-list' && array.child.kind === 'primitive') {
    return array.child.values instanceof Float32Array ? Float32Array : Float64Array;
  }
  if (array.kind === 'struct') {
    const child = array.children['x'];
    if (child?.kind === 'primitive' && child.values instanceof Float32Array) return Float32Array;
  }
  return Float64Array;
}

function makeCoordinateLeaf(
  coordinates: readonly (readonly number[])[],
  dimension: GeoArrowDimension,
  layout: GeoArrowCoordinateLayout,
  FloatArray: Float32ArrayConstructor | Float64ArrayConstructor,
  validity: GeoArrowArray['validity']
): GeoArrowArray {
  const size = getGeoArrowDimensionSize(dimension);
  if (layout === 'interleaved') {
    const values = new FloatArray(coordinates.length * size);
    for (let index = 0; index < coordinates.length; index++) {
      values.set(coordinates[index], index * size);
    }
    return {
      kind: 'fixed-size-list',
      length: coordinates.length,
      size,
      child: {kind: 'primitive', length: values.length, values},
      validity
    };
  }
  const children: Record<string, GeoArrowArray> = {
    x: {kind: 'primitive', length: coordinates.length, values: new FloatArray(coordinates.length)},
    y: {kind: 'primitive', length: coordinates.length, values: new FloatArray(coordinates.length)}
  };
  const names = getDimensionNames(dimension);
  for (let component = 2; component < names.length; component++) {
    children[names[component]] = {
      kind: 'primitive',
      length: coordinates.length,
      values: new FloatArray(coordinates.length)
    };
  }
  for (let index = 0; index < coordinates.length; index++) {
    const coordinate = coordinates[index];
    for (let component = 0; component < names.length; component++) {
      const child = children[names[component]];
      if (child.kind === 'primitive') child.values[index] = coordinate[component];
    }
  }
  return {kind: 'struct', length: coordinates.length, children, validity};
}

function readCoordinateAt(array: GeoArrowArray, index: number): number[] | null {
  if (!isGeoArrowValueValid(array.validity, index)) return null;
  if (array.kind === 'fixed-size-list') {
    const logicalIndex = (array.offset || 0) + index;
    if (array.child.kind !== 'primitive') return null;
    const values: number[] = [];
    for (let component = 0; component < array.size; component++) {
      const scalarIndex = logicalIndex * array.size + component;
      values.push(
        Number(
          array.child.values[(array.child.offset || 0) + scalarIndex * (array.child.stride || 1)]
        )
      );
    }
    return values;
  }
  if (array.kind === 'struct') {
    const logicalIndex = (array.offset || 0) + index;
    const values: number[] = [];
    for (const name of ['x', 'y', 'z', 'm'] as const) {
      const child = array.children[name];
      if (child?.kind === 'primitive') {
        values.push(Number(child.values[(child.offset || 0) + logicalIndex * (child.stride || 1)]));
      }
    }
    return values.length >= 2 ? values : null;
  }
  return null;
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

function getEncodingFromChildName(name: string): GeoArrowEncoding {
  const normalized = name.replace(/[^a-z]/gi, '').toLowerCase();
  const encoding = `geoarrow.${normalized}` as GeoArrowEncoding;
  if (
    encoding === 'geoarrow.point' ||
    encoding === 'geoarrow.linestring' ||
    encoding === 'geoarrow.polygon' ||
    encoding === 'geoarrow.multipoint' ||
    encoding === 'geoarrow.multilinestring' ||
    encoding === 'geoarrow.multipolygon' ||
    encoding === 'geoarrow.geometrycollection'
  ) {
    return encoding;
  }
  throw new Error(`Unknown GeoArrow dense-union child ${name}`);
}

function getEncodingDepth(encoding: GeoArrowEncoding): 0 | 1 | 2 | 3 {
  switch (encoding) {
    case 'geoarrow.point':
      return 0;
    case 'geoarrow.linestring':
    case 'geoarrow.multipoint':
      return 1;
    case 'geoarrow.polygon':
    case 'geoarrow.multilinestring':
      return 2;
    case 'geoarrow.multipolygon':
      return 3;
    default:
      return 0;
  }
}

function promoteToDenseUnion(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding === 'geoarrow.geometry') return column;
  const chunks = column.chunks.map(chunk => {
    const typeId = getCanonicalTypeId(column.encoding, column.dimension);
    const typeIds = new Int8Array(chunk.length);
    typeIds.fill(typeId);
    const valueOffsets = new Int32Array(chunk.length);
    for (let index = 0; index < chunk.length; index++) valueOffsets[index] = index;
    return {
      kind: 'dense-union' as const,
      length: chunk.length,
      typeIds,
      valueOffsets,
      validity: chunk.validity,
      children: [
        {
          name: getGeoArrowGeometryTypeName(column.encoding),
          typeId,
          encoding: column.encoding,
          dimension: column.dimension,
          coordinateLayout: column.coordinateLayout,
          data: chunk
        }
      ]
    };
  });
  return {...column, encoding: 'geoarrow.geometry', chunks};
}

function demoteDenseUnion(column: GeoArrowColumn, encoding: GeoArrowEncoding): GeoArrowColumn {
  if (encoding === 'geoarrow.geometry' || encoding === 'geoarrow.geometrycollection') return column;
  const rows: Array<GeoArrowGeometryValue | null> = [];
  for (const chunk of column.chunks) {
    if (chunk.kind !== 'dense-union') throw new Error('Expected dense-union storage');
    for (let index = 0; index < chunk.length; index++) {
      if (!isGeoArrowValueValid(chunk.validity, index)) {
        rows.push(null);
        continue;
      }
      const physical = (chunk.offset || 0) + index;
      const child = chunk.children.find(candidate => candidate.typeId === chunk.typeIds[physical]);
      const childEncoding = child && (child.encoding || getEncodingFromChildName(child.name));
      if (!child || childEncoding !== encoding) {
        throw new Error(`Rows cannot be represented as ${encoding}`);
      }
      const geometry = materializeGeometryRow(
        child.data,
        chunk.valueOffsets[physical],
        childEncoding
      );
      rows.push(
        geometry
          ? resizeGeometryValue(geometry, child.dimension || column.dimension, column.dimension)
          : null
      );
    }
  }
  const built = makeGeoArrowColumnFromGeometryRows(rows, {
    dimension: column.dimension,
    coordinateLayout: column.coordinateLayout || 'interleaved',
    offsetType: getColumnOffsetType(column)
  });
  return {
    ...built,
    encoding: encoding as GeoArrowColumn['encoding'],
    spatialReference: column.spatialReference,
    edges: column.edges,
    metadata: column.metadata
  };
}

function resizeGeometryValue(
  geometry: import('./types').GeoArrowGeometryValue,
  sourceDimension: GeoArrowDimension,
  targetDimension: GeoArrowDimension
): import('./types').GeoArrowGeometryValue {
  const map = (value: unknown): unknown => {
    if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'number')) {
      return resizeCoordinate(value as number[], sourceDimension, targetDimension);
    }
    return Array.isArray(value) ? value.map(map) : value;
  };
  if (geometry.type === 'GeometryCollection') {
    return {
      type: geometry.type,
      geometries: geometry.geometries.map(child =>
        resizeGeometryValue(child, sourceDimension, targetDimension)
      )
    };
  }
  return {
    ...geometry,
    coordinates: map(geometry.coordinates)
  } as import('./types').GeoArrowGeometryValue;
}

function getCanonicalTypeId(encoding: GeoArrowEncoding, dimension: GeoArrowDimension): number {
  const families = [
    'point',
    'linestring',
    'polygon',
    'multipoint',
    'multilinestring',
    'multipolygon',
    'geometrycollection'
  ];
  const dimensions = ['xy', 'xyz', 'xym', 'xyzm'];
  const family = encoding.replace('geoarrow.', '');
  const familyIndex = families.indexOf(family);
  const dimensionIndex = dimensions.indexOf(dimension);
  return familyIndex < 0 || dimensionIndex < 0 ? 1 : familyIndex * 4 + dimensionIndex + 1;
}

function getColumnOffsetType(column: GeoArrowColumn): 'int32' | 'int64' {
  for (const chunk of column.chunks) {
    const found = findOffsetType(chunk);
    if (found) return found;
  }
  return 'int32';
}

function findOffsetType(array: GeoArrowArray): 'int32' | 'int64' | null {
  switch (array.kind) {
    case 'list':
    case 'serialized':
      return array.offsets instanceof BigInt64Array ? 'int64' : 'int32';
    case 'fixed-size-list':
      return findOffsetType(array.child);
    case 'struct': {
      for (const child of Object.values(array.children)) {
        const found = findOffsetType(child);
        if (found) return found;
      }
      return null;
    }
    case 'dense-union':
      for (const child of array.children) {
        const found = findOffsetType(child.data);
        if (found) return found;
      }
      return null;
    default:
      return null;
  }
}

function convertArrayOffsets(array: GeoArrowArray, offsetType: 'int32' | 'int64'): GeoArrowArray {
  const toOffsets = (
    offsets: Int32Array | BigInt64Array,
    offsetBase: number | bigint | undefined
  ): {offsets: Int32Array | BigInt64Array; offsetBase?: number | bigint} => {
    if (offsetType === 'int64') {
      const result = new BigInt64Array(offsets.length);
      for (let index = 0; index < offsets.length; index++) result[index] = BigInt(offsets[index]);
      return {offsets: result, ...(offsetBase === undefined ? {} : {offsetBase})};
    }
    const result = new Int32Array(offsets.length);
    const base = BigInt(offsetBase ?? 0);
    for (let index = 0; index < offsets.length; index++) {
      const value = BigInt(offsets[index]) - base;
      if (value < -2147483648n || value > 2147483647n) {
        throw new Error('GeoArrow offset cannot be represented as Int32');
      }
      result[index] = Number(value);
    }
    return {offsets: result, offsetBase: 0};
  };
  switch (array.kind) {
    case 'list':
      if (array.offsets instanceof (offsetType === 'int64' ? BigInt64Array : Int32Array)) {
        return {...array, child: convertArrayOffsets(array.child, offsetType)};
      }
      return {
        ...array,
        ...toOffsets(array.offsets, array.offsetBase),
        child: convertArrayOffsets(array.child, offsetType)
      } as GeoArrowArray;
    case 'serialized':
      if (array.offsets instanceof (offsetType === 'int64' ? BigInt64Array : Int32Array))
        return array;
      return {...array, ...toOffsets(array.offsets, array.offsetBase)} as GeoArrowArray;
    case 'fixed-size-list':
      return {...array, child: convertArrayOffsets(array.child, offsetType)};
    case 'struct':
      return {
        ...array,
        children: Object.fromEntries(
          Object.entries(array.children).map(([name, child]) => [
            name,
            convertArrayOffsets(child, offsetType)
          ])
        )
      };
    case 'dense-union':
      return {
        ...array,
        children: array.children.map(child => ({
          ...child,
          data: convertArrayOffsets(child.data, offsetType)
        }))
      };
    default:
      return array;
  }
}

function getGeoArrowGeometryTypeName(encoding: GeoArrowEncoding): string {
  return encoding.replace('geoarrow.', '').replace(/^./, character => character.toUpperCase());
}

function rewindArrayRings(
  array: GeoArrowArray,
  encoding: GeoArrowEncoding,
  outerClockwise: boolean
): boolean {
  if (encoding === 'geoarrow.geometry' && array.kind === 'dense-union') {
    let changed = false;
    for (const child of array.children) {
      if (
        rewindArrayRings(
          child.data,
          child.encoding || getEncodingFromChildName(child.name),
          outerClockwise
        )
      )
        changed = true;
    }
    return changed;
  }
  if (encoding === 'geoarrow.geometrycollection' && array.kind === 'list') {
    if (array.child.kind !== 'dense-union') return false;
    let changed = false;
    for (const child of array.child.children) {
      if (
        rewindArrayRings(
          child.data,
          child.encoding || getEncodingFromChildName(child.name),
          outerClockwise
        )
      )
        changed = true;
    }
    return changed;
  }
  if (encoding !== 'geoarrow.polygon' && encoding !== 'geoarrow.multipolygon') return false;
  if (array.kind !== 'list' || array.child.kind !== 'list') return false;
  let changed = false;
  for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
    if (!isGeoArrowValueValid(array.validity, rowIndex)) continue;
    const [, rowEnd] = getListRange(array, rowIndex);
    const rowStart = getListRange(array, rowIndex)[0];
    if (encoding === 'geoarrow.polygon') {
      const rings = array.child;
      if (rewindRingGroup(rings, rowStart, rowEnd, outerClockwise)) changed = true;
    } else {
      const polygons = array.child;
      for (let polygonIndex = rowStart; polygonIndex < rowEnd; polygonIndex++) {
        const [ringStart, ringEnd] = getListRange(polygons, polygonIndex);
        if (rewindRingGroup(polygons.child, ringStart, ringEnd, outerClockwise)) changed = true;
      }
    }
  }
  return changed;
}

function rewindRingGroup(
  rings: GeoArrowArray,
  firstRing: number,
  lastRing: number,
  outerClockwise: boolean
): boolean {
  if (rings.kind !== 'list') return false;
  const leaf = rings.child;
  if (leaf.kind !== 'fixed-size-list' && leaf.kind !== 'struct') return false;
  let changed = false;
  for (let ringIndex = firstRing; ringIndex < lastRing; ringIndex++) {
    const [first, last] = getListRange(rings, ringIndex);
    const area = getRingArea(leaf, first, last);
    if (!Number.isFinite(area) || area === 0) continue;
    const shouldClockwise = ringIndex === firstRing ? outerClockwise : !outerClockwise;
    if (area < 0 !== shouldClockwise) {
      reverseCoordinateRange(leaf, first, last);
      changed = true;
    }
  }
  return changed;
}

function getRingArea(leaf: GeoArrowArray, first: number, last: number): number {
  let area = 0;
  for (let index = first; index < last; index++) {
    const current = readCoordinateAt(leaf, index);
    const next = readCoordinateAt(leaf, index + 1 < last ? index + 1 : first);
    if (!current || !next) return Number.NaN;
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function reverseCoordinateRange(leaf: GeoArrowArray, first: number, last: number): void {
  const values: number[][] = [];
  for (let index = first; index < last; index++) values.push(readCoordinateAt(leaf, index)!);
  values.reverse();
  for (let index = first; index < last; index++)
    writeCoordinateAt(leaf, index, values[index - first]);
}

function writeCoordinateAt(
  array: GeoArrowArray,
  index: number,
  coordinate: readonly number[]
): void {
  if (array.kind === 'fixed-size-list' && array.child.kind === 'primitive') {
    const logical = (array.offset || 0) + index;
    for (let component = 0; component < array.size; component++) {
      const scalar = (array.child.offset || 0) + logical * array.size + component;
      array.child.values[scalar] = coordinate[component];
    }
  } else if (array.kind === 'struct') {
    const logical = (array.offset || 0) + index;
    const names = ['x', 'y', 'z', 'm'] as const;
    for (let component = 0; component < names.length; component++) {
      const child = array.children[names[component]];
      if (child?.kind === 'primitive')
        child.values[(child.offset || 0) + logical * (child.stride || 1)] = coordinate[component];
    }
  }
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
