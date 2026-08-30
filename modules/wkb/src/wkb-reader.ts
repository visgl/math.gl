// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WellKnownDimension, WellKnownGeometry} from './types';
import {getWellKnownDimensionSize} from './types';

/** Geometry family encoded by a WKB header. */
export type WKBGeometryType = WellKnownGeometry['type'];

/** WKB dialect identified from one geometry header. */
export type WKBDialect = 'wkb' | 'iso-wkb' | 'ewkb';

/** Immutable facts decoded from one WKB geometry header. */
export type WKBHeader = Readonly<{
  geometryType: WKBGeometryType;
  dimension: WellKnownDimension;
  dialect: WKBDialect;
  littleEndian: boolean;
  /** Offset of the endian byte, relative to the supplied input view. */
  byteOffset: number;
  /** Offset of the geometry body, relative to the supplied input view. */
  bodyByteOffset: number;
  /** Number of bytes occupied by the header. */
  byteLength: number;
  /** EWKB spatial reference identifier, when present. */
  srid?: number;
}>;

/** Defensive limits shared by WKB traversal and scanning. */
export type WKBTraversalOptions = Readonly<{
  /** Maximum recursive geometry nesting. Defaults to 64. */
  maximumDepth?: number;
  /** Maximum total declared list elements. Defaults to 100 million. */
  maximumElements?: number;
}>;

/** Direct callbacks invoked while traversing WKB bytes without materializing geometry rows. */
export type WKBVisitor = Readonly<{
  /** Called at the start of each geometry. `count` is points, rings, or child geometries. */
  geometry?: (header: WKBHeader, count: number | undefined, depth: number) => void;
  /** Called at the start of each polygon ring. */
  ring?: (pointCount: number, ringIndex: number, depth: number) => void;
  /**
   * Called for each coordinate without allocating a coordinate array.
   * Missing Z or M ordinates are passed as `undefined`.
   */
  coordinate?: (
    x: number,
    y: number,
    z: number | undefined,
    m: number | undefined,
    dimension: WellKnownDimension,
    byteOffset: number,
    depth: number
  ) => void;
}>;

/** Finite coordinate bounds collected by {@link scanWKB}. */
export type WKBBounds = Readonly<{
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  zmin?: number;
  zmax?: number;
  mmin?: number;
  mmax?: number;
}>;

/** Per-family geometry counts collected by {@link scanWKB}. */
export type WKBGeometryCounts = Readonly<Record<WKBGeometryType, number>>;

/** Structural statistics collected without materializing geometry rows. */
export type WKBScanResult = Readonly<{
  header: WKBHeader;
  byteLength: number;
  coordinateCount: number;
  ringCount: number;
  geometryCount: number;
  maximumDepth: number;
  geometryTypes: readonly WKBGeometryType[];
  geometryCounts: WKBGeometryCounts;
  bounds?: WKBBounds;
}>;

type MutableBounds = {
  xmin?: number;
  ymin?: number;
  xmax?: number;
  ymax?: number;
  zmin?: number;
  zmax?: number;
  mmin?: number;
  mmax?: number;
};

type TraversalState = {
  maximumDepth: number;
  maximumElements: number;
  elementCount: number;
  visitor: WKBVisitor;
};

const GEOMETRY_TYPES: readonly WKBGeometryType[] = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection'
];

/** Inspects one WKB/ISO WKB/EWKB header without reading its coordinate payload. */
export function inspectWKBHeader(
  input: ArrayBufferLike | ArrayBufferView,
  byteOffset = 0
): WKBHeader {
  return inspectWKBHeaderView(getDataView(input), byteOffset);
}

/**
 * Traverses exactly one WKB geometry without constructing coordinate or geometry objects.
 * Returns the number of bytes consumed.
 */
export function visitWKB(
  input: ArrayBufferLike | ArrayBufferView,
  visitor: WKBVisitor,
  options: WKBTraversalOptions = {}
): number {
  const view = getDataView(input);
  const state: TraversalState = {
    maximumDepth: validateLimit(options.maximumDepth, 64, 'maximumDepth'),
    maximumElements: validateLimit(options.maximumElements, 100_000_000, 'maximumElements'),
    elementCount: 0,
    visitor
  };
  const byteLength = visitGeometry(view, 0, state, 0).byteOffset;
  if (byteLength !== view.byteLength) throw new Error('WKB contains trailing bytes');
  return byteLength;
}

/** Collects geometry counts and XYZM bounds without materializing geometry rows. */
export function scanWKB(
  input: ArrayBufferLike | ArrayBufferView,
  options: WKBTraversalOptions = {}
): WKBScanResult {
  const header = inspectWKBHeader(input);
  const geometryCounts: Record<WKBGeometryType, number> = {
    Point: 0,
    LineString: 0,
    Polygon: 0,
    MultiPoint: 0,
    MultiLineString: 0,
    MultiPolygon: 0,
    GeometryCollection: 0
  };
  const geometryTypes = new Set<WKBGeometryType>();
  const bounds: MutableBounds = {};
  let coordinateCount = 0;
  let ringCount = 0;
  let geometryCount = 0;
  let maximumDepth = 0;

  const byteLength = visitWKB(
    input,
    {
      geometry: (geometryHeader, _count, depth) => {
        geometryCounts[geometryHeader.geometryType]++;
        geometryTypes.add(geometryHeader.geometryType);
        geometryCount++;
        maximumDepth = Math.max(maximumDepth, depth);
      },
      ring: () => ringCount++,
      coordinate: (x, y, z, m) => {
        coordinateCount++;
        updateBounds(bounds, 'x', x);
        updateBounds(bounds, 'y', y);
        if (z !== undefined) updateBounds(bounds, 'z', z);
        if (m !== undefined) updateBounds(bounds, 'm', m);
      }
    },
    options
  );

  const concreteBounds = makeBounds(bounds);
  return {
    header,
    byteLength,
    coordinateCount,
    ringCount,
    geometryCount,
    maximumDepth,
    geometryTypes: GEOMETRY_TYPES.filter(type => geometryTypes.has(type)),
    geometryCounts,
    ...(concreteBounds ? {bounds: concreteBounds} : {})
  };
}

function visitGeometry(
  view: DataView,
  byteOffset: number,
  state: TraversalState,
  depth: number,
  expectedType?: WKBGeometryType
): {byteOffset: number; header: WKBHeader} {
  if (depth > state.maximumDepth) throw new Error('WKB geometry nesting exceeds maximumDepth');
  const header = inspectWKBHeaderView(view, byteOffset);
  if (expectedType && header.geometryType !== expectedType) {
    throw new Error(`WKB ${expectedType} collection contains a ${header.geometryType} child`);
  }
  byteOffset = header.bodyByteOffset;

  switch (header.geometryType) {
    case 'Point':
      state.visitor.geometry?.(header, undefined, depth);
      byteOffset = visitCoordinate(view, byteOffset, header, state.visitor, depth);
      break;
    case 'LineString': {
      const pointCount = readCount(view, byteOffset, header.littleEndian, state);
      byteOffset += 4;
      state.visitor.geometry?.(header, pointCount, depth);
      byteOffset = visitCoordinateSequence(view, byteOffset, pointCount, header, state, depth);
      break;
    }
    case 'Polygon': {
      const ringCount = readCount(view, byteOffset, header.littleEndian, state);
      byteOffset += 4;
      state.visitor.geometry?.(header, ringCount, depth);
      for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
        const pointCount = readCount(view, byteOffset, header.littleEndian, state);
        byteOffset += 4;
        state.visitor.ring?.(pointCount, ringIndex, depth);
        byteOffset = visitCoordinateSequence(view, byteOffset, pointCount, header, state, depth);
      }
      break;
    }
    case 'MultiPoint':
    case 'MultiLineString':
    case 'MultiPolygon':
    case 'GeometryCollection': {
      const childCount = readCount(view, byteOffset, header.littleEndian, state);
      byteOffset += 4;
      state.visitor.geometry?.(header, childCount, depth);
      const childType =
        header.geometryType === 'MultiPoint'
          ? 'Point'
          : header.geometryType === 'MultiLineString'
            ? 'LineString'
            : header.geometryType === 'MultiPolygon'
              ? 'Polygon'
              : undefined;
      for (let childIndex = 0; childIndex < childCount; childIndex++) {
        byteOffset = visitGeometry(view, byteOffset, state, depth + 1, childType).byteOffset;
      }
      break;
    }
  }
  return {byteOffset, header};
}

function visitCoordinateSequence(
  view: DataView,
  byteOffset: number,
  pointCount: number,
  header: WKBHeader,
  state: TraversalState,
  depth: number
): number {
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    byteOffset = visitCoordinate(view, byteOffset, header, state.visitor, depth);
  }
  return byteOffset;
}

function visitCoordinate(
  view: DataView,
  byteOffset: number,
  header: WKBHeader,
  visitor: WKBVisitor,
  depth: number
): number {
  const coordinateByteLength = getWellKnownDimensionSize(header.dimension) * 8;
  assertRemaining(view, byteOffset, coordinateByteLength);
  if (!visitor.coordinate) return byteOffset + coordinateByteLength;
  const x = view.getFloat64(byteOffset, header.littleEndian);
  const y = view.getFloat64(byteOffset + 8, header.littleEndian);
  const third =
    header.dimension === 'xy' ? undefined : view.getFloat64(byteOffset + 16, header.littleEndian);
  const fourth =
    header.dimension === 'xyzm' ? view.getFloat64(byteOffset + 24, header.littleEndian) : undefined;
  const z = header.dimension === 'xyz' || header.dimension === 'xyzm' ? third : undefined;
  const m = header.dimension === 'xym' ? third : fourth;
  visitor.coordinate?.(x, y, z, m, header.dimension, byteOffset, depth);
  return byteOffset + coordinateByteLength;
}

function inspectWKBHeaderView(view: DataView, byteOffset: number): WKBHeader {
  const startByteOffset = byteOffset;
  assertRemaining(view, byteOffset, 5);
  const byteOrder = view.getUint8(byteOffset++);
  if (byteOrder !== 0 && byteOrder !== 1) throw new Error('Invalid WKB byte order');
  const littleEndian = byteOrder === 1;
  const typeCode = view.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const hasZ = Boolean(typeCode & 0x80000000);
  const hasM = Boolean(typeCode & 0x40000000);
  const hasSrid = Boolean(typeCode & 0x20000000);
  let geometryCode = typeCode & 0x1fffffff;
  let dimension: WellKnownDimension;
  if (geometryCode >= 3000 && geometryCode < 4000) {
    dimension = 'xyzm';
    geometryCode -= 3000;
  } else if (geometryCode >= 2000 && geometryCode < 3000) {
    dimension = 'xym';
    geometryCode -= 2000;
  } else if (geometryCode >= 1000 && geometryCode < 2000) {
    dimension = 'xyz';
    geometryCode -= 1000;
  } else {
    dimension = hasZ && hasM ? 'xyzm' : hasZ ? 'xyz' : hasM ? 'xym' : 'xy';
  }
  const geometryType = GEOMETRY_TYPES[geometryCode - 1];
  if (!geometryType) throw new Error(`Unsupported WKB geometry type ${geometryCode}`);

  let srid: number | undefined;
  if (hasSrid) {
    assertRemaining(view, byteOffset, 4);
    srid = view.getUint32(byteOffset, littleEndian);
    byteOffset += 4;
  }
  const dialect: WKBDialect =
    hasZ || hasM || hasSrid ? 'ewkb' : dimension === 'xy' ? 'wkb' : 'iso-wkb';
  return {
    geometryType,
    dimension,
    dialect,
    littleEndian,
    byteOffset: startByteOffset,
    bodyByteOffset: byteOffset,
    byteLength: byteOffset - startByteOffset,
    ...(srid === undefined ? {} : {srid})
  };
}

function readCount(
  view: DataView,
  byteOffset: number,
  littleEndian: boolean,
  state: TraversalState
): number {
  assertRemaining(view, byteOffset, 4);
  const count = view.getUint32(byteOffset, littleEndian);
  state.elementCount += count;
  if (state.elementCount > state.maximumElements) {
    throw new Error('WKB element count exceeds maximumElements');
  }
  return count;
}

function updateBounds(bounds: MutableBounds, axis: 'x' | 'y' | 'z' | 'm', value: number): void {
  if (!Number.isFinite(value)) return;
  const minimum = `${axis}min` as keyof MutableBounds;
  const maximum = `${axis}max` as keyof MutableBounds;
  bounds[minimum] = bounds[minimum] === undefined ? value : Math.min(bounds[minimum]!, value);
  bounds[maximum] = bounds[maximum] === undefined ? value : Math.max(bounds[maximum]!, value);
}

function makeBounds(bounds: MutableBounds): WKBBounds | undefined {
  if (
    bounds.xmin === undefined ||
    bounds.ymin === undefined ||
    bounds.xmax === undefined ||
    bounds.ymax === undefined
  ) {
    return undefined;
  }
  return bounds as WKBBounds;
}

function getDataView(input: ArrayBufferLike | ArrayBufferView): DataView {
  return ArrayBuffer.isView(input)
    ? new DataView(input.buffer, input.byteOffset, input.byteLength)
    : new DataView(input);
}

function assertRemaining(view: DataView, byteOffset: number, byteLength: number): void {
  if (byteOffset < 0 || byteOffset + byteLength > view.byteLength) {
    throw new Error('Unexpected end of WKB');
  }
}

function validateLimit(value: number | undefined, fallback: number, name: string): number {
  const limit = value ?? fallback;
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
  return limit;
}
