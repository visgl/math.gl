// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GeoArrowArray,
  GeoArrowColumn,
  GeoArrowCoordinateLayout,
  GeoArrowDenseUnion,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowGeometryValue,
  GeoArrowOffsets,
  GeoArrowStruct
} from './types';
import {
  getGeoArrowDimensionSize,
  getGeoArrowEncodingForGeometry,
  getGeoArrowGeometryType
} from './types';

/** Concrete native encodings accepted by {@link GeoArrowBuilder}. */
export type GeoArrowBuilderEncoding = Exclude<
  GeoArrowEncoding,
  | 'geoarrow.geometry'
  | 'geoarrow.geometrycollection'
  | 'geoarrow.box'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt'
>;

/** Buffer counts produced by a measure pass. */
export type GeoArrowBuilderMeasurement = Readonly<{
  length: number;
  nullCount: number;
  coordinateCount: number;
  geometryOffsetCount: number;
  partOffsetCount: number;
  ringOffsetCount: number;
}>;

/** Caller-owned buffers filled by a builder write pass. */
export type GeoArrowBuilderTarget = {
  validity: Uint8Array;
  coordinates:
    | Float32Array
    | Float64Array
    | {
        x: Float32Array | Float64Array;
        y: Float32Array | Float64Array;
        z?: Float32Array | Float64Array;
        m?: Float32Array | Float64Array;
      };
  geometryOffsets?: GeoArrowOffsets;
  partOffsets?: GeoArrowOffsets;
  ringOffsets?: GeoArrowOffsets;
};

/** Common builder options. */
export type GeoArrowBuilderOptions = Readonly<{
  encoding: GeoArrowBuilderEncoding;
  dimension?: GeoArrowDimension;
  coordinateLayout?: GeoArrowCoordinateLayout;
  offsetType?: 'int32' | 'int64';
  coordinateType?: 'float32' | 'float64';
}>;

/** Options for materializing a column from geometry values. */
export type GeoArrowColumnFromRowsOptions = Omit<GeoArrowBuilderOptions, 'encoding'> &
  Readonly<{
    /** Forces homogeneous values into a dense-union column. */
    encoding?: 'geoarrow.geometry';
  }>;

/** Measure-pass options. */
export type GeoArrowBuilderMeasureOptions = GeoArrowBuilderOptions & Readonly<{mode: 'measure'}>;

/** Write-pass options. */
export type GeoArrowBuilderWriteOptions = GeoArrowBuilderOptions &
  Readonly<{mode: 'write'; target: GeoArrowBuilderTarget}>;

/** Options accepted by the incremental builder. */
export type GeoArrowBuilderModeOptions =
  | GeoArrowBuilderMeasureOptions
  | GeoArrowBuilderWriteOptions;

/**
 * Two-pass writer for homogeneous native GeoArrow geometry columns.
 *
 * Feed the same rows to a measure builder, allocate its target, and then feed them to a write
 * builder. The write result borrows the supplied target buffers.
 */
export class GeoArrowBuilder {
  readonly encoding: GeoArrowBuilderEncoding;
  readonly dimension: GeoArrowDimension;
  readonly coordinateLayout: GeoArrowCoordinateLayout;
  readonly offsetType: 'int32' | 'int64';
  readonly coordinateType: 'float32' | 'float64';
  private readonly mode: 'measure' | 'write';
  private readonly target?: GeoArrowBuilderTarget;
  private length = 0;
  private nullCount = 0;
  private coordinateCount = 0;
  private partCount = 0;
  private ringCount = 0;

  constructor(options: GeoArrowBuilderModeOptions) {
    this.mode = options.mode;
    this.encoding = options.encoding;
    this.dimension = options.dimension || 'xy';
    this.coordinateLayout = options.coordinateLayout || 'interleaved';
    this.offsetType = options.offsetType || 'int32';
    this.coordinateType = options.coordinateType || 'float64';
    this.target = options.mode === 'write' ? options.target : undefined;
    if (this.target) this.initializeTargetOffsets(this.target);
  }

  /** Appends one geometry row or null. */
  append(geometry: GeoArrowGeometryValue | null | undefined): this {
    const rowIndex = this.length++;
    if (!geometry) {
      this.nullCount++;
      this.appendNull(rowIndex);
      return this;
    }
    const expectedType = getGeoArrowGeometryType(this.encoding);
    if (geometry.type !== expectedType) {
      throw new Error(`GeoArrowBuilder for ${this.encoding} cannot append ${geometry.type}`);
    }
    if (geometry.type === 'GeometryCollection') {
      throw new Error('GeoArrowBuilder only accepts concrete geometry families');
    }
    if (this.target) setValidityBit(this.target.validity, rowIndex);

    const depth = getBuilderDepth(this.encoding);
    const coordinates = geometry.coordinates as readonly unknown[];
    if (depth === 0) {
      this.writeCoordinate(coordinates as readonly number[]);
    } else if (depth === 1) {
      this.writeCoordinateList(coordinates as readonly (readonly number[])[]);
      this.writeOffset(this.target?.geometryOffsets, rowIndex + 1, this.coordinateCount);
    } else if (depth === 2) {
      for (const part of coordinates as readonly (readonly (readonly number[])[])[]) {
        this.writeCoordinateList(part);
        this.partCount++;
        this.writeOffset(this.target?.partOffsets, this.partCount, this.coordinateCount);
      }
      this.writeOffset(this.target?.geometryOffsets, rowIndex + 1, this.partCount);
    } else {
      for (const polygon of coordinates as readonly (readonly (readonly (readonly number[])[])[])[]) {
        for (const ring of polygon) {
          this.writeCoordinateList(ring);
          this.ringCount++;
          this.writeOffset(this.target?.ringOffsets, this.ringCount, this.coordinateCount);
        }
        this.partCount++;
        this.writeOffset(this.target?.partOffsets, this.partCount, this.ringCount);
      }
      this.writeOffset(this.target?.geometryOffsets, rowIndex + 1, this.partCount);
    }
    return this;
  }

  /** Returns current exact allocation counts. */
  getMeasurement(): GeoArrowBuilderMeasurement {
    const depth = getBuilderDepth(this.encoding);
    return {
      length: this.length,
      nullCount: this.nullCount,
      coordinateCount: this.coordinateCount,
      geometryOffsetCount: depth >= 1 ? this.length + 1 : 0,
      partOffsetCount: depth >= 2 ? this.partCount + 1 : 0,
      ringOffsetCount: depth >= 3 ? this.ringCount + 1 : 0
    };
  }

  /** Allocates a write target from the current measure pass. */
  allocateTarget(): GeoArrowBuilderTarget {
    if (this.mode !== 'measure') throw new Error('Only a measure builder can allocate a target');
    return allocateGeoArrowBuilderTarget(this.getMeasurement(), {
      encoding: this.encoding,
      dimension: this.dimension,
      coordinateLayout: this.coordinateLayout,
      offsetType: this.offsetType,
      coordinateType: this.coordinateType
    });
  }

  /** Finishes a write pass and returns a one-chunk borrowed column. */
  finish(): GeoArrowColumn {
    if (!this.target) throw new Error('A measure builder has no finished column');
    const measurement = this.getMeasurement();
    assertTargetCapacity(this.target, measurement, getGeoArrowDimensionSize(this.dimension));
    const coordinates = makeCoordinateArray(
      this.target.coordinates,
      measurement.coordinateCount,
      this.dimension,
      this.coordinateLayout
    );
    const depth = getBuilderDepth(this.encoding);
    let chunk: GeoArrowArray = coordinates;
    if (depth >= 3) {
      chunk = {
        kind: 'list',
        length: this.ringCount,
        offsets: this.target.ringOffsets!,
        child: chunk
      };
    }
    if (depth >= 2) {
      chunk = {
        kind: 'list',
        length: this.partCount,
        offsets: this.target.partOffsets!,
        child: chunk
      };
    }
    if (depth >= 1) {
      chunk = {
        kind: 'list',
        length: this.length,
        offsets: this.target.geometryOffsets!,
        child: chunk,
        validity: {values: this.target.validity}
      };
    } else {
      chunk = {...chunk, validity: {values: this.target.validity}};
    }
    return {
      encoding: this.encoding,
      dimension: this.dimension,
      coordinateLayout: this.coordinateLayout,
      chunks: [chunk]
    };
  }

  /** Builds a homogeneous column using an internal measure/write pair. */
  static build(
    rows: readonly (GeoArrowGeometryValue | null | undefined)[],
    options: GeoArrowBuilderOptions
  ): GeoArrowColumn {
    const measure = new GeoArrowBuilder({...options, mode: 'measure'});
    for (const row of rows) measure.append(row);
    const write = new GeoArrowBuilder({
      ...options,
      mode: 'write',
      target: measure.allocateTarget()
    });
    for (const row of rows) write.append(row);
    return write.finish();
  }

  private appendNull(rowIndex: number): void {
    const depth = getBuilderDepth(this.encoding);
    if (depth === 0) {
      this.writeCoordinate(new Array(getGeoArrowDimensionSize(this.dimension)).fill(0));
    } else {
      this.writeOffset(
        this.target?.geometryOffsets,
        rowIndex + 1,
        depth === 1 ? this.coordinateCount : this.partCount
      );
    }
  }

  private writeCoordinateList(coordinates: readonly (readonly number[])[]): void {
    for (const coordinate of coordinates) this.writeCoordinate(coordinate);
  }

  private writeCoordinate(coordinate: readonly number[]): void {
    const size = getGeoArrowDimensionSize(this.dimension);
    if (coordinate.length !== size) {
      throw new Error(`Expected ${size} coordinate values for ${this.dimension}`);
    }
    if (this.target)
      writeCoordinate(this.target.coordinates, this.coordinateCount, coordinate, this.dimension);
    this.coordinateCount++;
  }

  private writeOffset(target: GeoArrowOffsets | undefined, index: number, value: number): void {
    if (!target) return;
    if (target instanceof BigInt64Array) target[index] = BigInt(value);
    else target[index] = value;
  }

  private initializeTargetOffsets(target: GeoArrowBuilderTarget): void {
    this.writeOffset(target.geometryOffsets, 0, 0);
    this.writeOffset(target.partOffsets, 0, 0);
    this.writeOffset(target.ringOffsets, 0, 0);
  }
}

/** Allocates exact buffers for one measured builder pass. */
export function allocateGeoArrowBuilderTarget(
  measurement: GeoArrowBuilderMeasurement,
  options: GeoArrowBuilderOptions
): GeoArrowBuilderTarget {
  const dimension = options.dimension || 'xy';
  const size = getGeoArrowDimensionSize(dimension);
  const FloatArray = options.coordinateType === 'float32' ? Float32Array : Float64Array;
  const coordinateLayout = options.coordinateLayout || 'interleaved';
  const coordinates =
    coordinateLayout === 'interleaved'
      ? new FloatArray(measurement.coordinateCount * size)
      : makeSeparatedCoordinateTarget(FloatArray, measurement.coordinateCount, dimension);
  const OffsetArray = options.offsetType === 'int64' ? BigInt64Array : Int32Array;
  return {
    validity: new Uint8Array(Math.ceil(measurement.length / 8)),
    coordinates,
    geometryOffsets: measurement.geometryOffsetCount
      ? new OffsetArray(measurement.geometryOffsetCount)
      : undefined,
    partOffsets: measurement.partOffsetCount
      ? new OffsetArray(measurement.partOffsetCount)
      : undefined,
    ringOffsets: measurement.ringOffsetCount
      ? new OffsetArray(measurement.ringOffsetCount)
      : undefined
  };
}

/** Builds a concrete or dense-union column from materialized rows. */
export function makeGeoArrowColumnFromGeometryRows(
  rows: readonly (GeoArrowGeometryValue | null)[],
  options: GeoArrowColumnFromRowsOptions = {}
): GeoArrowColumn {
  const geometryTypes = [...new Set(rows.filter(Boolean).map(row => row!.type))];
  const dimension = options.dimension || inferRowsDimension(rows);
  if (options.encoding === 'geoarrow.geometry') {
    return {
      encoding: 'geoarrow.geometry',
      dimension,
      coordinateLayout: options.coordinateLayout || 'interleaved',
      chunks: [makeDenseUnionArray(rows, options, dimension)]
    };
  }
  if (geometryTypes.length === 0) {
    return GeoArrowBuilder.build(rows, {...options, dimension, encoding: 'geoarrow.point'});
  }
  if (geometryTypes.length === 1 && geometryTypes[0] !== 'GeometryCollection') {
    return GeoArrowBuilder.build(rows, {
      ...options,
      dimension,
      encoding: getGeoArrowEncodingForGeometry(geometryTypes[0]) as GeoArrowBuilderEncoding
    });
  }
  if (geometryTypes.length === 1 && geometryTypes[0] === 'GeometryCollection') {
    return {
      encoding: 'geoarrow.geometrycollection',
      dimension,
      coordinateLayout: options.coordinateLayout || 'interleaved',
      chunks: [makeGeometryCollectionArray(rows, options, dimension)]
    };
  }
  return {
    encoding: 'geoarrow.geometry',
    dimension,
    coordinateLayout: options.coordinateLayout || 'interleaved',
    chunks: [makeDenseUnionArray(rows, options, dimension)]
  };
}

function makeDenseUnionArray(
  rows: readonly (GeoArrowGeometryValue | null)[],
  options: GeoArrowColumnFromRowsOptions,
  dimension: GeoArrowDimension
): GeoArrowDenseUnion {
  const nonNullTypes = [...new Set(rows.filter(Boolean).map(row => row!.type))];
  const fallbackType = nonNullTypes[0] || 'Point';
  const childRows = new Map<GeoArrowGeometryValue['type'], GeoArrowGeometryValue[]>();
  for (const type of nonNullTypes.length ? nonNullTypes : [fallbackType]) childRows.set(type, []);
  const typeIds = new Int8Array(rows.length);
  const valueOffsets = new Int32Array(rows.length);
  const validity = new Uint8Array(Math.ceil(rows.length / 8));
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const geometry = rows[rowIndex];
    const type = geometry?.type || fallbackType;
    const values = childRows.get(type) || [];
    typeIds[rowIndex] = getGeometryTypeId(type);
    valueOffsets[rowIndex] = values.length;
    if (geometry) {
      values.push(geometry);
      childRows.set(type, values);
      setValidityBit(validity, rowIndex);
    }
  }
  const children = [...childRows.entries()]
    .sort(([left], [right]) => getGeometryTypeId(left) - getGeometryTypeId(right))
    .map(([type, values]) => {
      const data =
        type === 'GeometryCollection'
          ? makeGeometryCollectionArray(values, options, dimension)
          : GeoArrowBuilder.build(values, {
              ...options,
              dimension,
              encoding: getGeoArrowEncodingForGeometry(type) as GeoArrowBuilderEncoding
            }).chunks[0];
      return {name: type, typeId: getGeometryTypeId(type), data};
    });
  return {
    kind: 'dense-union',
    length: rows.length,
    typeIds,
    valueOffsets,
    children,
    validity: {values: validity}
  };
}

function makeGeometryCollectionArray(
  rows: readonly (GeoArrowGeometryValue | null)[],
  options: GeoArrowColumnFromRowsOptions,
  dimension: GeoArrowDimension
): GeoArrowArray {
  const offsets = new Int32Array(rows.length + 1);
  const validity = new Uint8Array(Math.ceil(rows.length / 8));
  const flattened: GeoArrowGeometryValue[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row?.type === 'GeometryCollection') {
      flattened.push(...row.geometries);
      setValidityBit(validity, rowIndex);
    }
    offsets[rowIndex + 1] = flattened.length;
  }
  return {
    kind: 'list',
    length: rows.length,
    offsets,
    child: makeDenseUnionArray(flattened, options, dimension),
    validity: {values: validity}
  };
}

function makeCoordinateArray(
  coordinates: GeoArrowBuilderTarget['coordinates'],
  coordinateCount: number,
  dimension: GeoArrowDimension,
  layout: GeoArrowCoordinateLayout
): GeoArrowArray {
  const size = getGeoArrowDimensionSize(dimension);
  if (layout === 'interleaved') {
    const values = coordinates as Float32Array | Float64Array;
    return {
      kind: 'fixed-size-list',
      length: coordinateCount,
      size,
      child: {kind: 'primitive', length: coordinateCount * size, values}
    };
  }
  const separated = coordinates as Exclude<
    GeoArrowBuilderTarget['coordinates'],
    Float32Array | Float64Array
  >;
  const children: Record<string, GeoArrowArray> = {
    x: {kind: 'primitive', length: coordinateCount, values: separated.x},
    y: {kind: 'primitive', length: coordinateCount, values: separated.y}
  };
  if (separated.z) {
    children['z'] = {kind: 'primitive', length: coordinateCount, values: separated.z};
  }
  if (separated.m) {
    children['m'] = {kind: 'primitive', length: coordinateCount, values: separated.m};
  }
  return {kind: 'struct', length: coordinateCount, children} as GeoArrowStruct;
}

function makeSeparatedCoordinateTarget(
  FloatArray: Float32ArrayConstructor | Float64ArrayConstructor,
  count: number,
  dimension: GeoArrowDimension
): Exclude<GeoArrowBuilderTarget['coordinates'], Float32Array | Float64Array> {
  return {
    x: new FloatArray(count),
    y: new FloatArray(count),
    z: dimension === 'xyz' || dimension === 'xyzm' ? new FloatArray(count) : undefined,
    m: dimension === 'xym' || dimension === 'xyzm' ? new FloatArray(count) : undefined
  };
}

function writeCoordinate(
  target: GeoArrowBuilderTarget['coordinates'],
  coordinateIndex: number,
  coordinate: readonly number[],
  dimension: GeoArrowDimension
): void {
  if (target instanceof Float32Array || target instanceof Float64Array) {
    target.set(coordinate, coordinateIndex * coordinate.length);
    return;
  }
  target.x[coordinateIndex] = coordinate[0];
  target.y[coordinateIndex] = coordinate[1];
  if (dimension === 'xyz') target.z![coordinateIndex] = coordinate[2];
  else if (dimension === 'xym') target.m![coordinateIndex] = coordinate[2];
  else if (dimension === 'xyzm') {
    target.z![coordinateIndex] = coordinate[2];
    target.m![coordinateIndex] = coordinate[3];
  }
}

function setValidityBit(validity: Uint8Array, index: number): void {
  validity[index >> 3] |= 1 << (index & 7);
}

function getBuilderDepth(encoding: GeoArrowBuilderEncoding): 0 | 1 | 2 | 3 {
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
  }
}

function getGeometryTypeId(type: GeoArrowGeometryValue['type']): number {
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

function inferRowsDimension(rows: readonly (GeoArrowGeometryValue | null)[]): GeoArrowDimension {
  let size = 2;
  const visit = (value: unknown): void => {
    if (!Array.isArray(value) || value.length === 0) return;
    if (typeof value[0] === 'number') size = Math.max(size, value.length);
    else for (const child of value) visit(child);
  };
  const visitGeometry = (geometry: GeoArrowGeometryValue): void => {
    if (geometry.type === 'GeometryCollection') {
      for (const child of geometry.geometries) visitGeometry(child);
    } else {
      visit(geometry.coordinates);
    }
  };
  for (const row of rows) {
    if (row) visitGeometry(row);
  }
  return size >= 4 ? 'xyzm' : size === 3 ? 'xyz' : 'xy';
}

function assertTargetCapacity(
  target: GeoArrowBuilderTarget,
  measurement: GeoArrowBuilderMeasurement,
  size: number
): void {
  const coordinateLength =
    target.coordinates instanceof Float32Array || target.coordinates instanceof Float64Array
      ? target.coordinates.length / size
      : target.coordinates.x.length;
  if (
    coordinateLength < measurement.coordinateCount ||
    target.validity.length * 8 < measurement.length
  ) {
    throw new Error('GeoArrowBuilder target is smaller than its measured output');
  }
}
