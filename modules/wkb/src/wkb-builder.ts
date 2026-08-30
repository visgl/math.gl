// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WellKnownDimension} from './types';
import type {WKBGeometryType} from './wkb-reader';

/** Function that writes one WKB geometry into a builder. */
export type WKBGeometryWriter = (builder: WKBBuilder) => void;

/** Transforms one complete coordinate before it is written. */
export type WKBCoordinateTransform = (
  coordinate: readonly number[],
  dimension: WellKnownDimension
) => readonly number[];

/** Options shared by WKB measuring and writing modes. */
export type WKBBuilderBaseOptions = Readonly<{
  /** Coordinate dimension written by every geometry header. Defaults to `xy`. */
  dimension?: WellKnownDimension;
  /** Optional per-row dimension resolver used by geometry-array helpers. */
  dimensionResolver?: (geometryIndex: number) => WellKnownDimension;
  /** Byte order written by every geometry header. Defaults to little endian. */
  byteOrder?: 'little-endian' | 'big-endian';
  /** Optional EWKB spatial reference identifier. */
  srid?: number;
  /** Optional coordinate transform applied during writing and measurement. */
  transform?: WKBCoordinateTransform;
}>;

/** Options for a builder that only measures byte length. */
export type WKBBuilderMeasureOptions = WKBBuilderBaseOptions & Readonly<{mode: 'measure'}>;

/** Options for a builder that writes into caller-owned storage. */
export type WKBBuilderWriteOptions = WKBBuilderBaseOptions &
  Readonly<{
    mode: 'write';
    target: ArrayBufferLike | ArrayBufferView;
    /** Starting byte offset within `target`. Defaults to zero. */
    byteOffset?: number;
  }>;

/** Constructor options for {@link WKBBuilder}. */
export type WKBBuilderOptions = WKBBuilderMeasureOptions | WKBBuilderWriteOptions;

/** Plain offset, value, and validity buffers suitable for Arrow Binary adapters. */
export type WKBGeometryArray = Readonly<{
  valueOffsets: Int32Array;
  values: Uint8Array;
  nullBitmap?: Uint8Array;
  nullCount: number;
}>;

const GEOMETRY_TYPE_CODES: Readonly<Record<WKBGeometryType, number>> = {
  Point: 1,
  LineString: 2,
  Polygon: 3,
  MultiPoint: 4,
  MultiLineString: 5,
  MultiPolygon: 6,
  GeometryCollection: 7
};

/**
 * Incremental WKB writer with matching measure and caller-buffer write modes.
 *
 * Callers run the same event sequence once in `measure` mode and once in `write`
 * mode. No Arrow or GeoJSON objects are created by the builder.
 */
export class WKBBuilder {
  readonly mode: 'measure' | 'write';
  dimension: WellKnownDimension;
  readonly littleEndian: boolean;
  readonly srid?: number;
  readonly transform?: WKBCoordinateTransform;

  private readonly dataView: DataView | null;
  private readonly startByteOffset: number;
  private readonly endByteOffset: number;
  private byteOffset: number;

  constructor(options: WKBBuilderOptions) {
    this.mode = options.mode;
    this.dimension = options.dimension ?? 'xy';
    this.littleEndian = options.byteOrder !== 'big-endian';
    this.srid = options.srid;
    this.transform = options.transform;
    validateSrid(this.srid);

    if (options.mode === 'write') {
      const dataView = getTargetDataView(options.target);
      const byteOffset = options.byteOffset ?? 0;
      if (!Number.isSafeInteger(byteOffset) || byteOffset < 0 || byteOffset > dataView.byteLength) {
        throw new Error('WKBBuilder byteOffset is outside the target');
      }
      this.dataView = dataView;
      this.startByteOffset = byteOffset;
      this.endByteOffset = dataView.byteLength;
      this.byteOffset = byteOffset;
    } else {
      this.dataView = null;
      this.startByteOffset = 0;
      this.endByteOffset = Number.POSITIVE_INFINITY;
      this.byteOffset = 0;
    }
  }

  /** Begins a geometry and writes its count field when required. */
  beginGeometry(type: WKBGeometryType, count?: number): void {
    switch (type) {
      case 'Point':
        this.beginPoint();
        break;
      case 'LineString':
        this.beginLineString(count ?? 0);
        break;
      case 'Polygon':
        this.beginPolygon(count ?? 0);
        break;
      case 'MultiPoint':
        this.beginMultiPoint(count ?? 0);
        break;
      case 'MultiLineString':
        this.beginMultiLineString(count ?? 0);
        break;
      case 'MultiPolygon':
        this.beginMultiPolygon(count ?? 0);
        break;
      case 'GeometryCollection':
        this.writeHeader('GeometryCollection');
        this.writeUint32(count ?? 0);
        break;
    }
  }

  /** Begins one point geometry. */
  beginPoint(): void {
    this.writeHeader('Point');
  }

  /** Begins one linestring geometry. */
  beginLineString(pointCount: number): void {
    this.writeHeader('LineString');
    this.writeUint32(pointCount);
  }

  /** Begins one polygon geometry. */
  beginPolygon(ringCount: number): void {
    this.writeHeader('Polygon');
    this.writeUint32(ringCount);
  }

  /** Begins one linear ring inside a polygon. */
  beginLinearRing(pointCount: number): void {
    this.writeUint32(pointCount);
  }

  /** Begins one multipoint geometry. */
  beginMultiPoint(pointCount: number): void {
    this.writeHeader('MultiPoint');
    this.writeUint32(pointCount);
  }

  /** Begins one multilinestring geometry. */
  beginMultiLineString(lineCount: number): void {
    this.writeHeader('MultiLineString');
    this.writeUint32(lineCount);
  }

  /** Begins one multipolygon geometry. */
  beginMultiPolygon(polygonCount: number): void {
    this.writeHeader('MultiPolygon');
    this.writeUint32(polygonCount);
  }

  /** Writes one coordinate using the builder's semantic dimension. */
  writeCoordinate(x: number, y: number, z?: number, m?: number): void {
    let coordinate = makeCoordinate(this.dimension, x, y, z, m);
    if (this.transform) coordinate = this.transform(coordinate, this.dimension);
    const coordinateSize = getDimensionSize(this.dimension);
    for (let index = 0; index < coordinateSize; index++) {
      this.writeFloat64(coordinate[index] ?? Number.NaN);
    }
  }

  /** Temporarily changes the semantic dimension for a nested geometry. */
  withDimension<T>(dimension: WellKnownDimension, callback: () => T): T {
    const previous = this.dimension;
    this.dimension = dimension;
    try {
      return callback();
    } finally {
      this.dimension = previous;
    }
  }

  /** Returns the number of bytes measured or written. */
  finishGeometry(): number {
    return this.byteOffset - this.startByteOffset;
  }

  /** Measures geometry callbacks and returns contiguous Binary offsets. */
  static measureGeometryArray(
    geometryWriters: readonly (WKBGeometryWriter | null | undefined)[],
    options: WKBBuilderBaseOptions = {}
  ): Int32Array {
    const valueOffsets = new Int32Array(geometryWriters.length + 1);
    for (let geometryIndex = 0; geometryIndex < geometryWriters.length; geometryIndex++) {
      const geometryWriter = geometryWriters[geometryIndex];
      const byteLength = geometryWriter
        ? measureGeometry(geometryWriter, {
            ...options,
            dimension: options.dimensionResolver?.(geometryIndex) ?? options.dimension
          })
        : 0;
      const nextOffset = valueOffsets[geometryIndex] + byteLength;
      if (nextOffset > 0x7fffffff) throw new Error('WKB geometry array exceeds Int32 offsets');
      valueOffsets[geometryIndex + 1] = nextOffset;
    }
    return valueOffsets;
  }

  /** Writes geometry callbacks into an existing contiguous values buffer. */
  static writeGeometryArray(
    geometryWriters: readonly (WKBGeometryWriter | null | undefined)[],
    valueOffsets: Int32Array,
    values: Uint8Array,
    options: WKBBuilderBaseOptions = {}
  ): Uint8Array {
    if (valueOffsets.length !== geometryWriters.length + 1) {
      throw new Error('WKB valueOffsets length must equal geometry count plus one');
    }
    if (valueOffsets[valueOffsets.length - 1] > values.byteLength) {
      throw new Error('WKB values buffer is smaller than its final offset');
    }
    for (let geometryIndex = 0; geometryIndex < geometryWriters.length; geometryIndex++) {
      const geometryWriter = geometryWriters[geometryIndex];
      if (!geometryWriter) continue;
      const builder = new WKBBuilder({
        mode: 'write',
        target: values,
        byteOffset: valueOffsets[geometryIndex],
        ...options,
        dimension: options.dimensionResolver?.(geometryIndex) ?? options.dimension
      });
      geometryWriter(builder);
      const byteLength = builder.finishGeometry();
      if (valueOffsets[geometryIndex] + byteLength !== valueOffsets[geometryIndex + 1]) {
        throw new Error('WKB measure and write passes produced different byte lengths');
      }
    }
    return values;
  }

  /** Builds plain offsets, values, and validity buffers in two passes. */
  static buildGeometryArray(
    geometryWriters: readonly (WKBGeometryWriter | null | undefined)[],
    options: WKBBuilderBaseOptions = {}
  ): WKBGeometryArray {
    const valueOffsets = WKBBuilder.measureGeometryArray(geometryWriters, options);
    const values = new Uint8Array(valueOffsets[valueOffsets.length - 1]);
    WKBBuilder.writeGeometryArray(geometryWriters, valueOffsets, values, options);
    const {nullBitmap, nullCount} = makeNullBitmap(geometryWriters);
    return {
      valueOffsets,
      values,
      ...(nullCount > 0 ? {nullBitmap} : {}),
      nullCount
    };
  }

  private writeHeader(geometryType: WKBGeometryType): void {
    this.writeUint8(this.littleEndian ? 1 : 0);
    this.writeUint32(getWKBTypeCode(geometryType, this.dimension, this.srid !== undefined));
    if (this.srid !== undefined) this.writeUint32(this.srid);
  }

  private writeUint8(value: number): void {
    this.ensureSize(1);
    this.dataView?.setUint8(this.byteOffset, value);
    this.byteOffset++;
  }

  private writeUint32(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
      throw new Error('WKB count must be an unsigned 32-bit integer');
    }
    this.ensureSize(4);
    this.dataView?.setUint32(this.byteOffset, value, this.littleEndian);
    this.byteOffset += 4;
  }

  private writeFloat64(value: number): void {
    this.ensureSize(8);
    this.dataView?.setFloat64(this.byteOffset, value, this.littleEndian);
    this.byteOffset += 8;
  }

  private ensureSize(byteLength: number): void {
    if (this.byteOffset + byteLength > this.endByteOffset) {
      throw new Error('WKBBuilder target buffer overflow');
    }
  }
}

function measureGeometry(
  geometryWriter: WKBGeometryWriter,
  options: WKBBuilderBaseOptions
): number {
  const builder = new WKBBuilder({mode: 'measure', ...options});
  geometryWriter(builder);
  return builder.finishGeometry();
}

function getTargetDataView(target: ArrayBufferLike | ArrayBufferView): DataView {
  return ArrayBuffer.isView(target)
    ? new DataView(target.buffer, target.byteOffset, target.byteLength)
    : new DataView(target);
}

function getWKBTypeCode(
  geometryType: WKBGeometryType,
  dimension: WellKnownDimension,
  hasSrid: boolean
): number {
  const geometryCode = GEOMETRY_TYPE_CODES[geometryType];
  if (hasSrid) {
    const dimensionFlags =
      dimension === 'xyz'
        ? 0x80000000
        : dimension === 'xym'
          ? 0x40000000
          : dimension === 'xyzm'
            ? 0xc0000000
            : 0;
    return (geometryCode | dimensionFlags | 0x20000000) >>> 0;
  }
  const dimensionOffset =
    dimension === 'xyz' ? 1000 : dimension === 'xym' ? 2000 : dimension === 'xyzm' ? 3000 : 0;
  return geometryCode + dimensionOffset;
}

function makeCoordinate(
  dimension: WellKnownDimension,
  x: number,
  y: number,
  z?: number,
  m?: number
): readonly number[] {
  switch (dimension) {
    case 'xy':
      return [x, y];
    case 'xyz':
      return [x, y, z ?? Number.NaN];
    case 'xym':
      return [x, y, m ?? Number.NaN];
    case 'xyzm':
      return [x, y, z ?? Number.NaN, m ?? Number.NaN];
  }
}

function getDimensionSize(dimension: WellKnownDimension): 2 | 3 | 4 {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

function validateSrid(srid: number | undefined): void {
  if (srid !== undefined && (!Number.isSafeInteger(srid) || srid < 0 || srid > 0xffffffff)) {
    throw new Error('WKBBuilder srid must be an unsigned 32-bit integer');
  }
}

function makeNullBitmap(geometryWriters: readonly (WKBGeometryWriter | null | undefined)[]): {
  nullBitmap: Uint8Array;
  nullCount: number;
} {
  const nullBitmap = new Uint8Array(Math.ceil(geometryWriters.length / 8));
  let nullCount = 0;
  for (let geometryIndex = 0; geometryIndex < geometryWriters.length; geometryIndex++) {
    if (geometryWriters[geometryIndex]) {
      nullBitmap[geometryIndex >> 3] |= 1 << (geometryIndex & 7);
    } else {
      nullCount++;
    }
  }
  return {nullBitmap, nullCount};
}
