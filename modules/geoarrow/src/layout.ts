// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GeoArrowArray,
  GeoArrowColumn,
  GeoArrowCoordinateMapper,
  GeoArrowDenseUnion,
  GeoArrowEncoding,
  GeoArrowGeometryValue,
  GeoArrowList,
  GeoArrowOffsets,
  GeoArrowValidity
} from './types';
import {
  getGeoArrowDimensionSize,
  getGeoArrowEncodingForGeometry,
  getGeoArrowGeometryType
} from './types';

/** Stable validation diagnostic for a physical GeoArrow descriptor. */
export type GeoArrowValidationIssue = Readonly<{
  code:
    | 'invalid-length'
    | 'invalid-validity'
    | 'invalid-offset'
    | 'invalid-stride'
    | 'invalid-child'
    | 'invalid-union'
    | 'invalid-layout'
    | 'unsafe-offset';
  path: string;
  message: string;
}>;

/** Validation result for a physical GeoArrow descriptor. */
export type GeoArrowValidationResult = Readonly<{
  valid: boolean;
  issues: readonly GeoArrowValidationIssue[];
}>;

/** Value-independent and inexpensive facts about a GeoArrow column. */
export type GeoArrowColumnInspection = Readonly<{
  encoding: GeoArrowEncoding;
  rowCount: number;
  chunkCount: number;
  nullCount: number;
  coordinateCount: number;
  storageKinds: readonly GeoArrowArray['kind'][];
  valid: boolean;
  issues: readonly GeoArrowValidationIssue[];
}>;

/** Returns whether one logical value is valid at a nesting level. */
export function isGeoArrowValueValid(
  validity: GeoArrowValidity | undefined,
  index: number
): boolean {
  if (!validity) return true;
  const bitIndex = (validity.bitOffset || 0) + index;
  return Boolean(validity.values[bitIndex >> 3] & (1 << (bitIndex & 7)));
}

/** Returns the total number of logical rows across chunks. */
export function getGeoArrowRowCount(column: GeoArrowColumn): number {
  return column.chunks.reduce((count, chunk) => count + chunk.length, 0);
}

/** Visits coordinates without materializing row geometry objects. */
export function visitGeoArrowCoordinates(
  column: GeoArrowColumn,
  visitor: GeoArrowCoordinateMapper
): void {
  let rowOffset = 0;
  for (const chunk of column.chunks) {
    visitChunkCoordinates(chunk, column.encoding, rowOffset, visitor);
    rowOffset += chunk.length;
  }
}

/** Returns a zero-copy logical slice of a column, preserving chunk boundaries. */
export function sliceGeoArrowColumn(
  column: GeoArrowColumn,
  begin = 0,
  end = getGeoArrowRowCount(column)
): GeoArrowColumn {
  const rowCount = getGeoArrowRowCount(column);
  const first = normalizeSliceIndex(begin, rowCount);
  const last = Math.max(first, normalizeSliceIndex(end, rowCount));
  if (first === 0 && last === rowCount) return column;

  const chunks: GeoArrowArray[] = [];
  let chunkStart = 0;
  for (const chunk of column.chunks) {
    const chunkEnd = chunkStart + chunk.length;
    const localFirst = Math.max(0, first - chunkStart);
    const localLast = Math.min(chunk.length, last - chunkStart);
    if (localLast > localFirst) {
      chunks.push(sliceGeoArrowArray(chunk, localFirst, localLast));
    }
    chunkStart = chunkEnd;
    if (chunkStart >= last) break;
  }
  return {...column, chunks};
}

/** Returns a zero-copy logical slice of one physical array. */
export function sliceGeoArrowArray(
  array: GeoArrowArray,
  begin: number,
  end: number
): GeoArrowArray {
  if (begin === 0 && end === array.length) return array;
  const length = end - begin;
  const validity = array.validity
    ? {...array.validity, bitOffset: (array.validity.bitOffset || 0) + begin}
    : undefined;
  switch (array.kind) {
    case 'primitive':
      return {
        ...array,
        length,
        offset: (array.offset || 0) + begin * (array.stride || 1),
        validity
      };
    case 'fixed-size-list':
      return {...array, length, offset: (array.offset || 0) + begin, validity};
    case 'list':
    case 'serialized':
      return {...array, length, offset: (array.offset || 0) + begin, validity};
    case 'struct':
      return {...array, length, offset: (array.offset || 0) + begin, validity};
    case 'dense-union':
      return {...array, length, offset: (array.offset || 0) + begin, validity};
  }
}

/** Validates physical bounds, list offsets, union dispatch, and declared coordinate layout. */
export function validateGeoArrowColumn(column: GeoArrowColumn): GeoArrowValidationResult {
  const issues: GeoArrowValidationIssue[] = [];
  for (let chunkIndex = 0; chunkIndex < column.chunks.length; chunkIndex++) {
    validateArray(column.chunks[chunkIndex], `chunks[${chunkIndex}]`, issues);
  }
  validateColumnLayout(column, issues);
  return {valid: issues.length === 0, issues};
}

/** Inspects a column without decoding serialized geometry or creating row objects. */
export function inspectGeoArrowColumn(column: GeoArrowColumn): GeoArrowColumnInspection {
  const validation = validateGeoArrowColumn(column);
  const storageKinds: GeoArrowArray['kind'][] = [];
  let nullCount = 0;
  for (const chunk of column.chunks) {
    collectStorageKinds(chunk, storageKinds);
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      if (!isGeoArrowValueValid(chunk.validity, rowIndex)) nullCount++;
    }
  }
  return {
    encoding: column.encoding,
    rowCount: getGeoArrowRowCount(column),
    chunkCount: column.chunks.length,
    nullCount,
    coordinateCount: getGeoArrowVertexCount(column),
    storageKinds,
    valid: validation.valid,
    issues: validation.issues
  };
}

/** Counts coordinate tuples without materializing geometry objects. */
export function getGeoArrowVertexCount(column: GeoArrowColumn): number {
  if (
    column.encoding === 'geoarrow.wkb' ||
    column.encoding === 'geoarrow.wkt' ||
    column.encoding === 'geoarrow.box'
  ) {
    return 0;
  }
  let count = 0;
  visitGeoArrowCoordinates(column, coordinate => {
    count++;
    return coordinate;
  });
  return count;
}

/** Collects unique transferable ArrayBuffers borrowed by a column. */
export function getGeoArrowTransferList(column: GeoArrowColumn): ArrayBuffer[] {
  const buffers = new Set<ArrayBuffer>();
  for (const chunk of column.chunks) collectArrayBuffers(chunk, buffers);
  return [...buffers];
}

/** Materializes column rows for codecs and structural algorithms. */
export function materializeGeoArrowRows(
  column: GeoArrowColumn
): Array<GeoArrowGeometryValue | null> {
  if (column.encoding === 'geoarrow.wkb' || column.encoding === 'geoarrow.wkt') {
    throw new Error('Serialized GeoArrow columns must be decoded before materialization');
  }
  const rows: Array<GeoArrowGeometryValue | null> = [];
  for (const chunk of column.chunks) {
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      rows.push(materializeGeometryRow(chunk, rowIndex, column.encoding));
    }
  }
  return rows;
}

/** Materializes one row from a physical array. */
export function materializeGeometryRow(
  array: GeoArrowArray,
  rowIndex: number,
  encoding: GeoArrowEncoding
): GeoArrowGeometryValue | null {
  if (!isGeoArrowValueValid(array.validity, rowIndex)) return null;
  if (encoding === 'geoarrow.geometry') {
    if (array.kind !== 'dense-union') return null;
    return materializeUnionRow(array, rowIndex);
  }
  if (encoding === 'geoarrow.geometrycollection') {
    if (array.kind !== 'list') return null;
    const [first, last] = getListRange(array, rowIndex);
    const geometries: GeoArrowGeometryValue[] = [];
    for (let index = first; index < last; index++) {
      if (array.child.kind !== 'dense-union') continue;
      const geometry = materializeUnionRow(array.child, index);
      if (geometry) geometries.push(geometry);
    }
    return {type: 'GeometryCollection', geometries};
  }
  const geometryType = getGeoArrowGeometryType(encoding);
  if (!geometryType || geometryType === 'GeometryCollection') return null;
  const depth = getEncodingDepth(encoding);
  const coordinates = readNestedCoordinates(array, rowIndex, depth);
  if (!coordinates) return null;
  return {type: geometryType, coordinates} as GeoArrowGeometryValue;
}

/** Returns a safe numeric offset. */
export function getGeoArrowOffset(offsets: GeoArrowOffsets, index: number): number {
  const value = offsets[index];
  const numericValue = typeof value === 'bigint' ? Number(value) : value;
  if (!Number.isSafeInteger(numericValue)) {
    throw new Error(`GeoArrow offset ${String(value)} exceeds JavaScript's safe integer range`);
  }
  return numericValue;
}

/** Returns the child range for one list row. */
export function getListRange(list: GeoArrowList, rowIndex: number): [number, number] {
  const offsetIndex = (list.offset || 0) + rowIndex;
  const baseValue = list.offsetBase ?? 0;
  const base = typeof baseValue === 'bigint' ? Number(baseValue) : baseValue;
  return [
    getGeoArrowOffset(list.offsets, offsetIndex) - base,
    getGeoArrowOffset(list.offsets, offsetIndex + 1) - base
  ];
}

function visitChunkCoordinates(
  array: GeoArrowArray,
  encoding: GeoArrowEncoding,
  rowOffset: number,
  visitor: GeoArrowCoordinateMapper
): void {
  for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
    if (!isGeoArrowValueValid(array.validity, rowIndex)) continue;
    if (encoding === 'geoarrow.geometry' && array.kind === 'dense-union') {
      visitUnionRowCoordinates(array, rowIndex, rowOffset + rowIndex, visitor);
      continue;
    }
    if (encoding === 'geoarrow.geometrycollection' && array.kind === 'list') {
      const [first, last] = getListRange(array, rowIndex);
      if (array.child.kind === 'dense-union') {
        for (let index = first; index < last; index++) {
          visitUnionRowCoordinates(array.child, index, rowOffset + rowIndex, visitor);
        }
      }
      continue;
    }
    const depth = getEncodingDepth(encoding);
    visitNestedCoordinates(array, rowIndex, depth, rowOffset + rowIndex, visitor);
  }
}

function visitUnionRowCoordinates(
  union: GeoArrowDenseUnion,
  rowIndex: number,
  sourceRowIndex: number,
  visitor: GeoArrowCoordinateMapper
): void {
  if (!isGeoArrowValueValid(union.validity, rowIndex)) return;
  const physicalIndex = (union.offset || 0) + rowIndex;
  const typeId = union.typeIds[physicalIndex];
  const valueOffset = union.valueOffsets[physicalIndex];
  const child = union.children.find(candidate => candidate.typeId === typeId);
  if (!child) return;
  const encoding = getEncodingFromChildName(child.name);
  if (encoding === 'geoarrow.geometrycollection' && child.data.kind === 'list') {
    const [first, last] = getListRange(child.data, valueOffset);
    if (child.data.child.kind === 'dense-union') {
      for (let index = first; index < last; index++) {
        visitUnionRowCoordinates(child.data.child, index, sourceRowIndex, visitor);
      }
    }
    return;
  }
  visitNestedCoordinates(
    child.data,
    valueOffset,
    getEncodingDepth(encoding),
    sourceRowIndex,
    visitor
  );
}

function visitNestedCoordinates(
  array: GeoArrowArray,
  index: number,
  depth: number,
  rowIndex: number,
  visitor: GeoArrowCoordinateMapper
): void {
  if (depth === 0) {
    const coordinate = readCoordinate(array, index);
    if (coordinate) visitor(coordinate, rowIndex);
    return;
  }
  if (array.kind !== 'list' || !isGeoArrowValueValid(array.validity, index)) return;
  const [first, last] = getListRange(array, index);
  for (let childIndex = first; childIndex < last; childIndex++) {
    visitNestedCoordinates(array.child, childIndex, depth - 1, rowIndex, visitor);
  }
}

function readNestedCoordinates(array: GeoArrowArray, index: number, depth: number): unknown {
  if (depth === 0) return readCoordinate(array, index);
  if (array.kind !== 'list' || !isGeoArrowValueValid(array.validity, index)) return null;
  const [first, last] = getListRange(array, index);
  const values: unknown[] = [];
  for (let childIndex = first; childIndex < last; childIndex++) {
    const value = readNestedCoordinates(array.child, childIndex, depth - 1);
    if (value !== null) values.push(value);
  }
  return values;
}

function readCoordinate(array: GeoArrowArray, index: number): number[] | null {
  if (!isGeoArrowValueValid(array.validity, index)) return null;
  if (array.kind === 'fixed-size-list') {
    const listIndex = (array.offset || 0) + index;
    const coordinate: number[] = [];
    for (let component = 0; component < array.size; component++) {
      coordinate.push(readPrimitive(array.child, listIndex * array.size + component));
    }
    return coordinate;
  }
  if (array.kind === 'struct') {
    const structIndex = (array.offset || 0) + index;
    const coordinate: number[] = [];
    for (const name of ['x', 'y', 'z', 'm']) {
      const child = array.children[name];
      if (child) coordinate.push(readPrimitive(child, structIndex));
    }
    return coordinate.length >= 2 ? coordinate : null;
  }
  return null;
}

function readPrimitive(array: GeoArrowArray, index: number): number {
  if (array.kind !== 'primitive') throw new Error('GeoArrow coordinate child must be primitive');
  const valueIndex = (array.offset || 0) + index * (array.stride || 1);
  return Number(array.values[valueIndex]);
}

function materializeUnionRow(
  union: GeoArrowDenseUnion,
  rowIndex: number
): GeoArrowGeometryValue | null {
  if (!isGeoArrowValueValid(union.validity, rowIndex)) return null;
  const physicalIndex = (union.offset || 0) + rowIndex;
  const typeId = union.typeIds[physicalIndex];
  const valueOffset = union.valueOffsets[physicalIndex];
  const child = union.children.find(candidate => candidate.typeId === typeId);
  if (!child || valueOffset < 0 || valueOffset >= child.data.length) return null;
  return materializeGeometryRow(child.data, valueOffset, getEncodingFromChildName(child.name));
}

function getEncodingFromChildName(name: string): GeoArrowEncoding {
  const normalized = name.replace(/[^a-z]/gi, '').toLowerCase();
  switch (normalized) {
    case 'point':
      return 'geoarrow.point';
    case 'linestring':
      return 'geoarrow.linestring';
    case 'polygon':
      return 'geoarrow.polygon';
    case 'multipoint':
      return 'geoarrow.multipoint';
    case 'multilinestring':
      return 'geoarrow.multilinestring';
    case 'multipolygon':
      return 'geoarrow.multipolygon';
    case 'geometrycollection':
      return 'geoarrow.geometrycollection';
    default:
      throw new Error(`Unknown GeoArrow dense-union child ${name}`);
  }
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

function validateArray(
  array: GeoArrowArray,
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  if (!Number.isSafeInteger(array.length) || array.length < 0) {
    issues.push({
      code: 'invalid-length',
      path,
      message: 'Length must be a non-negative safe integer.'
    });
    return;
  }
  validateValidity(array.validity, array.length, path, issues);
  switch (array.kind) {
    case 'primitive': {
      const stride = array.stride || 1;
      const offset = array.offset || 0;
      if (!Number.isSafeInteger(stride) || stride < 1) {
        issues.push({code: 'invalid-stride', path, message: 'Primitive stride must be positive.'});
      }
      const requiredLength = array.length === 0 ? offset : offset + (array.length - 1) * stride + 1;
      if (offset < 0 || requiredLength > array.values.length) {
        issues.push({
          code: 'invalid-length',
          path,
          message: 'Primitive values do not cover the logical range.'
        });
      }
      break;
    }
    case 'fixed-size-list': {
      const offset = array.offset ?? 0;
      const validOffset = Number.isSafeInteger(offset) && offset >= 0;
      if (!validOffset) {
        issues.push({
          code: 'invalid-offset',
          path,
          message: 'Fixed-size list offset must be a non-negative safe integer.'
        });
      }
      if (!Number.isSafeInteger(array.size) || array.size < 1) {
        issues.push({
          code: 'invalid-length',
          path,
          message: 'Fixed-size list size must be positive.'
        });
      }
      const childEnd = (offset + array.length) * array.size;
      if (validOffset && childEnd > array.child.length) {
        issues.push({code: 'invalid-child', path, message: 'Fixed-size list child is too short.'});
      }
      validateArray(array.child, `${path}.child`, issues);
      break;
    }
    case 'list':
      validateList(array, path, issues);
      validateArray(array.child, `${path}.child`, issues);
      break;
    case 'struct':
      if (Object.keys(array.children).length === 0) {
        issues.push({code: 'invalid-child', path, message: 'Struct must contain children.'});
      }
      for (const [name, child] of Object.entries(array.children)) {
        if ((array.offset || 0) + array.length > child.length) {
          issues.push({
            code: 'invalid-child',
            path: `${path}.${name}`,
            message: 'Struct child is too short.'
          });
        }
        validateArray(child, `${path}.${name}`, issues);
      }
      break;
    case 'dense-union': {
      const end = (array.offset || 0) + array.length;
      if (end > array.typeIds.length || end > array.valueOffsets.length) {
        issues.push({
          code: 'invalid-union',
          path,
          message: 'Dense-union dispatch buffers are too short.'
        });
      }
      const childIds = new Set<number>();
      for (const child of array.children) {
        if (childIds.has(child.typeId)) {
          issues.push({
            code: 'invalid-union',
            path,
            message: `Duplicate dense-union type ID ${child.typeId}.`
          });
        }
        childIds.add(child.typeId);
        validateArray(child.data, `${path}.${child.name}`, issues);
      }
      for (let index = array.offset || 0; index < end; index++) {
        if (!isGeoArrowValueValid(array.validity, index - (array.offset || 0))) continue;
        const child = array.children.find(candidate => candidate.typeId === array.typeIds[index]);
        const valueOffset = array.valueOffsets[index];
        if (!child || valueOffset < 0 || valueOffset >= child.data.length) {
          issues.push({
            code: 'invalid-union',
            path: `${path}[${index}]`,
            message: 'Dense-union row references an invalid child value.'
          });
        }
      }
      break;
    }
    case 'serialized': {
      validateOffsets(
        array.offsets,
        array.offset || 0,
        array.length,
        array.values.length,
        array.offsetBase,
        path,
        issues
      );
      break;
    }
  }
}

function validateList(list: GeoArrowList, path: string, issues: GeoArrowValidationIssue[]): void {
  validateOffsets(
    list.offsets,
    list.offset || 0,
    list.length,
    list.child.length,
    list.offsetBase,
    path,
    issues
  );
}

function validateOffsets(
  offsets: GeoArrowOffsets,
  offset: number,
  length: number,
  childLength: number,
  offsetBase: number | bigint | undefined,
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  if (offset < 0 || offset + length >= offsets.length) {
    issues.push({code: 'invalid-offset', path, message: 'Offset buffer is too short.'});
    return;
  }
  const base = typeof offsetBase === 'bigint' ? Number(offsetBase) : offsetBase || 0;
  let previous: number;
  try {
    previous = getGeoArrowOffset(offsets, offset) - base;
  } catch (error) {
    issues.push({code: 'unsafe-offset', path, message: (error as Error).message});
    return;
  }
  for (let index = 1; index <= length; index++) {
    let current: number;
    try {
      current = getGeoArrowOffset(offsets, offset + index) - base;
    } catch (error) {
      issues.push({code: 'unsafe-offset', path, message: (error as Error).message});
      return;
    }
    if (current < previous || current < 0 || current > childLength) {
      issues.push({
        code: 'invalid-offset',
        path,
        message: 'Offsets must be monotonic and within child storage.'
      });
      return;
    }
    previous = current;
  }
}

function validateValidity(
  validity: GeoArrowValidity | undefined,
  length: number,
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  if (!validity) return;
  const bitOffset = validity.bitOffset || 0;
  if (bitOffset < 0 || bitOffset + length > validity.values.length * 8) {
    issues.push({code: 'invalid-validity', path, message: 'Validity bitmap is too short.'});
  }
}

function validateColumnLayout(column: GeoArrowColumn, issues: GeoArrowValidationIssue[]): void {
  if (column.encoding === 'geoarrow.wkb' || column.encoding === 'geoarrow.wkt') {
    for (const [index, chunk] of column.chunks.entries()) {
      const expectedEncoding = column.encoding === 'geoarrow.wkb' ? 'binary' : 'utf8';
      if (chunk.kind !== 'serialized' || chunk.encoding !== expectedEncoding) {
        issues.push({
          code: 'invalid-layout',
          path: `chunks[${index}]`,
          message: `Serialized encoding requires ${expectedEncoding} storage.`
        });
      }
    }
    return;
  }
  if (column.encoding === 'geoarrow.box') {
    for (const [index, chunk] of column.chunks.entries()) {
      if (chunk.kind !== 'struct') {
        addInvalidLayout(`chunks[${index}]`, 'Box encoding requires struct storage.', issues);
        continue;
      }
      const requiredNames =
        column.dimension === 'xy'
          ? ['xmin', 'ymin', 'xmax', 'ymax']
          : column.dimension === 'xyz'
            ? ['xmin', 'ymin', 'zmin', 'xmax', 'ymax', 'zmax']
            : column.dimension === 'xym'
              ? ['xmin', 'ymin', 'mmin', 'xmax', 'ymax', 'mmax']
              : ['xmin', 'ymin', 'zmin', 'mmin', 'xmax', 'ymax', 'zmax', 'mmax'];
      for (const name of requiredNames) {
        if (chunk.children[name]?.kind !== 'primitive') {
          addInvalidLayout(
            `chunks[${index}].${name}`,
            `Box storage requires primitive ${name}.`,
            issues
          );
        }
      }
    }
    return;
  }
  if (!column.coordinateLayout) {
    addInvalidLayout('coordinateLayout', 'Native geometry requires a coordinate layout.', issues);
    return;
  }
  for (const [index, chunk] of column.chunks.entries()) {
    validateGeometryLayout(chunk, column.encoding, column, `chunks[${index}]`, issues);
  }
}

function validateGeometryLayout(
  array: GeoArrowArray,
  encoding: GeoArrowEncoding,
  column: GeoArrowColumn,
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  if (encoding === 'geoarrow.geometry') {
    if (array.kind !== 'dense-union') {
      addInvalidLayout(path, 'Mixed geometry encoding requires dense-union storage.', issues);
      return;
    }
    validateUnionLayouts(array, column, path, issues);
    return;
  }
  if (encoding === 'geoarrow.geometrycollection') {
    if (array.kind !== 'list' || array.child.kind !== 'dense-union') {
      addInvalidLayout(path, 'GeometryCollection requires list-of-dense-union storage.', issues);
      return;
    }
    validateUnionLayouts(array.child, column, `${path}.child`, issues);
    return;
  }
  let coordinateArray = array;
  const depth = getEncodingDepth(encoding);
  for (let level = 0; level < depth; level++) {
    if (coordinateArray.kind !== 'list') {
      addInvalidLayout(path, `${encoding} requires ${depth} variable-list levels.`, issues);
      return;
    }
    coordinateArray = coordinateArray.child;
  }
  validateCoordinateLayout(coordinateArray, column, path, issues);
}

function validateUnionLayouts(
  union: GeoArrowDenseUnion,
  column: GeoArrowColumn,
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  for (const child of union.children) {
    let encoding: GeoArrowEncoding;
    try {
      encoding = getEncodingFromChildName(child.name);
    } catch (error) {
      addInvalidLayout(`${path}.${child.name}`, (error as Error).message, issues);
      continue;
    }
    validateGeometryLayout(child.data, encoding, column, `${path}.${child.name}`, issues);
  }
}

function validateCoordinateLayout(
  array: GeoArrowArray,
  column: GeoArrowColumn,
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  const dimensionSize = getGeoArrowDimensionSize(column.dimension);
  if (column.coordinateLayout === 'interleaved') {
    if (
      array.kind !== 'fixed-size-list' ||
      array.size !== dimensionSize ||
      array.child.kind !== 'primitive'
    ) {
      addInvalidLayout(
        path,
        `Interleaved ${column.dimension} coordinates require fixed-size-list<${dimensionSize}> primitive storage.`,
        issues
      );
    }
    return;
  }
  if (array.kind !== 'struct') {
    addInvalidLayout(
      path,
      `Separated ${column.dimension} coordinates require struct storage.`,
      issues
    );
    return;
  }
  const requiredNames =
    column.dimension === 'xy'
      ? ['x', 'y']
      : column.dimension === 'xyz'
        ? ['x', 'y', 'z']
        : column.dimension === 'xym'
          ? ['x', 'y', 'm']
          : ['x', 'y', 'z', 'm'];
  for (const name of requiredNames) {
    if (array.children[name]?.kind !== 'primitive') {
      addInvalidLayout(
        `${path}.${name}`,
        `Separated coordinates require primitive ${name}.`,
        issues
      );
    }
  }
}

function addInvalidLayout(path: string, message: string, issues: GeoArrowValidationIssue[]): void {
  issues.push({code: 'invalid-layout', path, message});
}

function collectStorageKinds(array: GeoArrowArray, kinds: GeoArrowArray['kind'][]): void {
  kinds.push(array.kind);
  switch (array.kind) {
    case 'fixed-size-list':
    case 'list':
      collectStorageKinds(array.child, kinds);
      break;
    case 'struct':
      for (const child of Object.values(array.children)) collectStorageKinds(child, kinds);
      break;
    case 'dense-union':
      for (const child of array.children) collectStorageKinds(child.data, kinds);
      break;
    default:
      break;
  }
}

function collectArrayBuffers(array: GeoArrowArray, buffers: Set<ArrayBuffer>): void {
  if (array.validity) addBuffer(array.validity.values.buffer, buffers);
  switch (array.kind) {
    case 'primitive':
      addBuffer(array.values.buffer, buffers);
      break;
    case 'fixed-size-list':
      collectArrayBuffers(array.child, buffers);
      break;
    case 'list':
      addBuffer(array.offsets.buffer, buffers);
      collectArrayBuffers(array.child, buffers);
      break;
    case 'struct':
      for (const child of Object.values(array.children)) collectArrayBuffers(child, buffers);
      break;
    case 'dense-union':
      addBuffer(array.typeIds.buffer, buffers);
      addBuffer(array.valueOffsets.buffer, buffers);
      for (const child of array.children) collectArrayBuffers(child.data, buffers);
      break;
    case 'serialized':
      addBuffer(array.offsets.buffer, buffers);
      addBuffer(array.values.buffer, buffers);
      break;
  }
}

function addBuffer(buffer: ArrayBufferLike, buffers: Set<ArrayBuffer>): void {
  if (buffer instanceof ArrayBuffer) buffers.add(buffer);
}

function normalizeSliceIndex(index: number, length: number): number {
  const normalized = index < 0 ? Math.max(0, length + index) : Math.min(length, index);
  return Math.max(0, Math.trunc(normalized));
}

/** Returns a concrete encoding for a geometry value. */
export function getEncodingForGeometryValue(geometry: GeoArrowGeometryValue): GeoArrowEncoding {
  return getGeoArrowEncodingForGeometry(geometry.type);
}
