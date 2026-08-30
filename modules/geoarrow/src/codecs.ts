// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {formatWKT, inspectWKBHeader, parseWKB, parseWKT, visitWKB} from '@math.gl/wkb';
import type {WKBGeometryWriter, WKBHeader} from '@math.gl/wkb';
import {WKBBuilder} from '@math.gl/wkb';
import type {
  GeoArrowColumn,
  GeoArrowDimension,
  GeoArrowGeometryValue,
  GeoArrowSerialized
} from './types';
import {getGeoArrowDimensionSize} from './types';
import {GeoArrowBuilder, makeGeoArrowColumnFromGeometryRows} from './builder';
import {getGeoArrowOffset, isGeoArrowValueValid, materializeGeometryRow} from './layout';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Decodes a GeoArrow WKB column into native physical geometry buffers. */
export function decodeGeoArrowWKB(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding !== 'geoarrow.wkb') throw new Error('Expected a geoarrow.wkb column');
  const records: Array<{bytes: Uint8Array; header: WKBHeader} | null> = [];
  let hasGeometryCollection = false;
  for (const chunk of column.chunks) {
    if (chunk.kind !== 'serialized') throw new Error('Serialized column contains native storage');
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      if (!isGeoArrowValueValid(chunk.validity, rowIndex)) {
        records.push(null);
        continue;
      }
      const bytes = getSerializedBytes(chunk, rowIndex);
      const header = inspectWKBHeader(bytes);
      hasGeometryCollection ||= header.geometryType === 'GeometryCollection';
      records.push({bytes, header});
    }
  }

  // Geometry collections have a nested union topology. Keep the compatibility path until the
  // collection builder grows a fully direct event representation; all concrete families below
  // are decoded directly into measured native buffers.
  if (hasGeometryCollection) {
    const rows = normalizeRowsToDimension(
      records.map(record => (record ? parseWKB(record.bytes).geometry : null)),
      column.dimension
    );
    return copyMetadata(
      column,
      makeGeoArrowColumnFromGeometryRows(rows, {dimension: column.dimension})
    );
  }

  const groups = new Map<
    string,
    {
      type: WKBHeader['geometryType'];
      dimension: GeoArrowDimension;
      records: {bytes: Uint8Array; header: WKBHeader}[];
    }
  >();
  for (const record of records) {
    if (!record) continue;
    const key = `${record.header.geometryType}:${record.header.dimension}`;
    const group = groups.get(key) || {
      type: record.header.geometryType,
      dimension: record.header.dimension,
      records: []
    };
    group.records.push(record);
    groups.set(key, group);
  }
  if (groups.size <= 1) {
    const group = groups.values().next().value as
      | {
          type: WKBHeader['geometryType'];
          dimension: GeoArrowDimension;
          records: {bytes: Uint8Array; header: WKBHeader}[];
        }
      | undefined;
    const type = group?.type || 'Point';
    const targetEncoding = encodingFromGeometryType(type);
    const measure = new GeoArrowBuilder({
      encoding: targetEncoding,
      dimension: column.dimension,
      mode: 'measure'
    });
    for (const record of records) {
      if (!record) measure.append(null);
      else visitWKBIntoBuilder(record.bytes, measure);
    }
    const write = new GeoArrowBuilder({
      encoding: targetEncoding,
      dimension: column.dimension,
      mode: 'write',
      target: measure.allocateTarget()
    });
    for (const record of records) {
      if (!record) write.append(null);
      else visitWKBIntoBuilder(record.bytes, write);
    }
    return copyMetadata(column, write.finish());
  }

  const children = [...groups.values()].map(group => {
    const encoding = encodingFromGeometryType(group.type);
    const measure = new GeoArrowBuilder({encoding, dimension: group.dimension, mode: 'measure'});
    for (const record of group.records) visitWKBIntoBuilder(record.bytes, measure);
    const write = new GeoArrowBuilder({
      encoding,
      dimension: group.dimension,
      mode: 'write',
      target: measure.allocateTarget()
    });
    for (const record of group.records) visitWKBIntoBuilder(record.bytes, write);
    const built = write.finish();
    return {
      name: group.type,
      typeId: getGeometryTypeId(group.type, group.dimension),
      encoding,
      dimension: group.dimension,
      coordinateLayout: built.coordinateLayout,
      data: built.chunks[0]
    };
  });
  const typeIds = new Int8Array(records.length);
  const valueOffsets = new Int32Array(records.length);
  const validity = new Uint8Array(Math.ceil(records.length / 8));
  const groupIndices = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  children.forEach((child, index) => groupIndices.set(`${child.name}:${child.dimension}`, index));
  for (let rowIndex = 0; rowIndex < records.length; rowIndex++) {
    const record = records[rowIndex];
    if (!record) continue;
    const key = `${record.header.geometryType}:${record.header.dimension}`;
    const child = children[groupIndices.get(key)!];
    typeIds[rowIndex] = child.typeId;
    valueOffsets[rowIndex] = groupCounts.get(key) || 0;
    groupCounts.set(key, valueOffsets[rowIndex] + 1);
    validity[rowIndex >> 3] |= 1 << (rowIndex & 7);
  }
  return copyMetadata(column, {
    encoding: 'geoarrow.geometry',
    dimension: column.dimension,
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'dense-union',
        length: records.length,
        typeIds,
        valueOffsets,
        children,
        validity: {values: validity}
      }
    ]
  });
}

/** Replays one serialized geometry directly into a two-pass GeoArrowBuilder. */
function visitWKBIntoBuilder(bytes: Uint8Array, builder: GeoArrowBuilder): void {
  let rootType: WKBHeader['geometryType'] | undefined;
  let rootDimension: GeoArrowDimension | undefined;
  visitWKB(bytes, {
    geometry: (header, _count, depth) => {
      if (depth === 0) {
        rootType = header.geometryType;
        rootDimension = header.dimension;
        builder.beginGeometry(header.geometryType, header.dimension, _count);
      } else if (rootType === 'MultiLineString' && header.geometryType === 'LineString') {
        builder.beginRing(_count);
      } else if (rootType === 'MultiPolygon' && header.geometryType === 'Polygon') {
        builder.beginPolygon();
      }
    },
    ring: pointCount => {
      if (rootType === 'Polygon' || rootType === 'MultiPolygon') builder.beginRing(pointCount);
    },
    coordinate: (x, y, z, m, dimension) => {
      const values =
        dimension === 'xym'
          ? [x, y, m!]
          : dimension === 'xyzm'
            ? [x, y, z!, m!]
            : dimension === 'xyz'
              ? [x, y, z!]
              : [x, y];
      // WKB collection members carry their own dimensional header. Normalize each member to the
      // root geometry dimension before passing it to the builder state, then let the builder apply
      // the column-level dimension conversion.
      builder.writeCoordinate(resizeWKBCoordinate(values, dimension, rootDimension!));
    }
  });
  builder.endGeometry();
}

function resizeWKBCoordinate(
  coordinate: readonly number[],
  sourceDimension: GeoArrowDimension,
  targetDimension: GeoArrowDimension
): number[] {
  if (sourceDimension === targetDimension) return [...coordinate];
  const sourceNames = getDimensionNames(sourceDimension);
  return getDimensionNames(targetDimension).map(name => {
    const index = sourceNames.indexOf(name);
    return index >= 0 ? (coordinate[index] ?? 0) : 0;
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

function encodingFromGeometryType(
  type: WKBHeader['geometryType']
): Exclude<
  GeoArrowColumn['encoding'],
  | 'geoarrow.geometry'
  | 'geoarrow.geometrycollection'
  | 'geoarrow.box'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt'
> {
  if (type === 'GeometryCollection')
    throw new Error('GeometryCollection requires collection storage');
  return `geoarrow.${type.toLowerCase()}` as Exclude<
    GeoArrowColumn['encoding'],
    | 'geoarrow.geometry'
    | 'geoarrow.geometrycollection'
    | 'geoarrow.box'
    | 'geoarrow.wkb'
    | 'geoarrow.wkt'
  >;
}

function getGeometryTypeId(type: WKBHeader['geometryType'], dimension: GeoArrowDimension): number {
  const family = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection'
  ].indexOf(type);
  const dimensionIndex = ['xy', 'xyz', 'xym', 'xyzm'].indexOf(dimension);
  return family < 0 || dimensionIndex < 0 ? 1 : family * 4 + dimensionIndex + 1;
}

/** Encodes a native GeoArrow column as variable-width WKB bytes. */
export function encodeGeoArrowWKB(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding === 'geoarrow.wkb') return column;
  const writers: Array<WKBGeometryWriter | null> = [];
  const dimensions: GeoArrowDimension[] = [];
  for (const chunk of column.chunks) {
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      if (!isGeoArrowValueValid(chunk.validity, rowIndex)) {
        writers.push(null);
        dimensions.push(column.dimension);
        continue;
      }
      dimensions.push(
        getPhysicalGeometryDimension(chunk, rowIndex, column.encoding, column.dimension)
      );
      writers.push(builder =>
        writePhysicalGeometry(builder, chunk, rowIndex, column.encoding, column.dimension)
      );
    }
  }
  const built = WKBBuilder.buildGeometryArray(writers, {
    dimension: column.dimension,
    dimensionResolver: index => dimensions[index] || column.dimension
  });
  return copyMetadata(column, {
    encoding: 'geoarrow.wkb',
    dimension: column.dimension,
    coordinateLayout: null,
    chunks: [
      {
        kind: 'serialized',
        encoding: 'binary',
        length: writers.length,
        offsets: built.valueOffsets,
        values: built.values,
        ...(built.nullBitmap ? {validity: {values: built.nullBitmap}} : {})
      }
    ]
  });
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
  const values: Array<Uint8Array | null> = [];
  for (const chunk of column.chunks) {
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      const row = isGeoArrowValueValid(chunk.validity, rowIndex)
        ? materializeGeometryRow(chunk, rowIndex, column.encoding)
        : null;
      values.push(row ? textEncoder.encode(formatWKT(row, column.dimension)) : null);
    }
  }
  return copyMetadata(column, makeSerializedColumn(values, 'geoarrow.wkt', column.dimension));
}

function writePhysicalGeometry(
  builder: WKBBuilder,
  array: import('./types').GeoArrowArray,
  rowIndex: number,
  encoding: import('./types').GeoArrowEncoding,
  dimension: GeoArrowDimension
): void {
  const depth = getEncodingDepth(encoding);
  if (encoding === 'geoarrow.geometry' && array.kind === 'dense-union') {
    const physical = (array.offset || 0) + rowIndex;
    const typeId = array.typeIds[physical];
    const child = array.children.find(candidate => candidate.typeId === typeId);
    if (!child) throw new Error('Dense-union row references an unknown child');
    const childDimension = child.dimension || dimension;
    builder.withDimension(childDimension, () =>
      writePhysicalGeometry(
        builder,
        child.data,
        array.valueOffsets[physical],
        child.encoding || encodingFromName(child.name),
        childDimension
      )
    );
    return;
  }
  if (encoding === 'geoarrow.geometrycollection' && array.kind === 'list') {
    const [first, last] = getListRange(array, rowIndex);
    builder.beginGeometry('GeometryCollection', last - first);
    if (array.child.kind !== 'dense-union')
      throw new Error('GeometryCollection requires dense union child');
    const union = array.child;
    for (let index = first; index < last; index++) {
      const physical = (union.offset || 0) + index;
      const child = union.children.find(candidate => candidate.typeId === union.typeIds[physical]);
      if (child) {
        const childDimension = child.dimension || dimension;
        builder.withDimension(childDimension, () =>
          writePhysicalGeometry(
            builder,
            child.data,
            union.valueOffsets[physical],
            child.encoding || encodingFromName(child.name),
            childDimension
          )
        );
      }
    }
    return;
  }
  if (array.kind !== 'list' && depth > 0) throw new Error(`Invalid ${encoding} storage`);
  const writeCoordinate = (leaf: import('./types').GeoArrowArray, index: number): void => {
    const coordinate = readPhysicalCoordinate(leaf, index);
    if (!coordinate) throw new Error('Invalid GeoArrow coordinate storage');
    if (dimension === 'xym')
      builder.writeCoordinate(coordinate[0], coordinate[1], undefined, coordinate[2]);
    else if (dimension === 'xyzm')
      builder.writeCoordinate(coordinate[0], coordinate[1], coordinate[2], coordinate[3]);
    else builder.writeCoordinate(coordinate[0], coordinate[1], coordinate[2]);
  };
  const writeSequence = (
    leaf: import('./types').GeoArrowArray,
    first: number,
    last: number
  ): void => {
    for (let index = first; index < last; index++) writeCoordinate(leaf, index);
  };
  if (encoding === 'geoarrow.point') {
    builder.beginPoint();
    writeCoordinate(array, rowIndex);
  } else if (encoding === 'geoarrow.linestring' || encoding === 'geoarrow.multipoint') {
    const [first, last] = getListRange(array as import('./types').GeoArrowList, rowIndex);
    if (encoding === 'geoarrow.linestring') {
      builder.beginLineString(last - first);
      writeSequence((array as import('./types').GeoArrowList).child, first, last);
    } else {
      builder.beginMultiPoint(last - first);
      const leaf = (array as import('./types').GeoArrowList).child;
      for (let index = first; index < last; index++) {
        builder.beginPoint();
        writeCoordinate(leaf, index);
      }
    }
  } else if (encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multilinestring') {
    const [first, last] = getListRange(array as import('./types').GeoArrowList, rowIndex);
    const parts = (array as import('./types').GeoArrowList).child;
    if (encoding === 'geoarrow.polygon') builder.beginPolygon(last - first);
    else builder.beginMultiLineString(last - first);
    for (let partIndex = first; partIndex < last; partIndex++) {
      const [ringFirst, ringLast] = getListRange(
        parts as import('./types').GeoArrowList,
        partIndex
      );
      const leaf = (parts as import('./types').GeoArrowList).child;
      if (encoding === 'geoarrow.polygon') builder.beginLinearRing(ringLast - ringFirst);
      else builder.beginLineString(ringLast - ringFirst);
      writeSequence(leaf, ringFirst, ringLast);
    }
  } else if (encoding === 'geoarrow.multipolygon') {
    const [first, last] = getListRange(array as import('./types').GeoArrowList, rowIndex);
    const polygons = (array as import('./types').GeoArrowList).child;
    builder.beginMultiPolygon(last - first);
    for (let polygonIndex = first; polygonIndex < last; polygonIndex++) {
      const [partFirst, partLast] = getListRange(
        polygons as import('./types').GeoArrowList,
        polygonIndex
      );
      const parts = (polygons as import('./types').GeoArrowList).child;
      builder.beginPolygon(partLast - partFirst);
      for (let partIndex = partFirst; partIndex < partLast; partIndex++) {
        const [ringFirst, ringLast] = getListRange(
          parts as import('./types').GeoArrowList,
          partIndex
        );
        builder.beginLinearRing(ringLast - ringFirst);
        writeSequence((parts as import('./types').GeoArrowList).child, ringFirst, ringLast);
      }
    }
  }
}

function getPhysicalGeometryDimension(
  array: import('./types').GeoArrowArray,
  rowIndex: number,
  encoding: import('./types').GeoArrowEncoding,
  dimension: GeoArrowDimension
): GeoArrowDimension {
  if (encoding !== 'geoarrow.geometry' || array.kind !== 'dense-union') return dimension;
  const physical = (array.offset || 0) + rowIndex;
  const child = array.children.find(candidate => candidate.typeId === array.typeIds[physical]);
  return child?.dimension || dimension;
}

function readPhysicalCoordinate(
  array: import('./types').GeoArrowArray,
  index: number
): number[] | null {
  if (array.kind === 'fixed-size-list' && array.child.kind === 'primitive') {
    const logical = (array.offset || 0) + index;
    const values: number[] = [];
    for (let component = 0; component < array.size; component++)
      values.push(
        Number(
          array.child.values[
            (array.child.offset || 0) +
              (logical * array.size + component) * (array.child.stride || 1)
          ]
        )
      );
    return values;
  }
  if (array.kind === 'struct') {
    const logical = (array.offset || 0) + index;
    return ['x', 'y', 'z', 'm'].flatMap(name => {
      const child = array.children[name];
      return child?.kind === 'primitive'
        ? [Number(child.values[(child.offset || 0) + logical * (child.stride || 1)])]
        : [];
    });
  }
  return null;
}

function getListRange(list: import('./types').GeoArrowList, index: number): [number, number] {
  const offset = (list.offset || 0) + index;
  const base =
    typeof (list.offsetBase ?? 0) === 'bigint'
      ? Number(list.offsetBase)
      : Number(list.offsetBase ?? 0);
  return [
    getGeoArrowOffset(list.offsets, offset) - base,
    getGeoArrowOffset(list.offsets, offset + 1) - base
  ];
}

function getEncodingDepth(encoding: import('./types').GeoArrowEncoding): number {
  return encoding === 'geoarrow.point'
    ? 0
    : encoding === 'geoarrow.linestring' || encoding === 'geoarrow.multipoint'
      ? 1
      : encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multilinestring'
        ? 2
        : 3;
}

function encodingFromName(name: string): import('./types').GeoArrowEncoding {
  return `geoarrow.${name.toLowerCase()}` as import('./types').GeoArrowEncoding;
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
  if (array.views) {
    const viewIndex = ((array.offset || 0) + rowIndex) * 4;
    const length = array.views[viewIndex];
    // Arrow BinaryView stores short values inline in the 16-byte view record.
    if (length <= 12) {
      const byteOffset = array.views.byteOffset + viewIndex * 4 + 4;
      return new Uint8Array(array.views.buffer, byteOffset, length);
    }
    const bufferIndex = array.views[viewIndex + 2];
    const byteOffset = array.views[viewIndex + 3];
    const data = array.dataBuffers?.[bufferIndex];
    if (!data) throw new Error(`Serialized view references missing data buffer ${bufferIndex}`);
    return data.subarray(byteOffset, byteOffset + length);
  }
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
