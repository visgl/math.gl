// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SpatialReference} from '../crs/index';
import type {TypedArray} from '@math.gl/core';
/** Minimal tagged geometry shape used only by compatibility builders.
 *
 * The physical GeoArrow APIs never create these values. Keeping the structural type here avoids
 * making the descriptor package depend on the WKB format package.
 */
export type GeoArrowGeometryValue =
  | {type: 'Point'; coordinates: readonly number[]}
  | {type: 'LineString'; coordinates: readonly (readonly number[])[]}
  | {type: 'Polygon'; coordinates: readonly (readonly (readonly number[])[])[]}
  | {type: 'MultiPoint'; coordinates: readonly (readonly number[])[]}
  | {type: 'MultiLineString'; coordinates: readonly (readonly (readonly number[])[])[]}
  | {type: 'MultiPolygon'; coordinates: readonly (readonly (readonly (readonly number[])[])[])[]}
  | {type: 'GeometryCollection'; geometries: readonly GeoArrowGeometryValue[]};

/** GeoArrow concrete, mixed, bounding-box, and serialized encodings. */
export type GeoArrowEncoding =
  | 'geoarrow.point'
  | 'geoarrow.linestring'
  | 'geoarrow.polygon'
  | 'geoarrow.multipoint'
  | 'geoarrow.multilinestring'
  | 'geoarrow.multipolygon'
  | 'geoarrow.geometry'
  | 'geoarrow.geometrycollection'
  | 'geoarrow.box'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt';

/** Semantic coordinate dimensions. M is never interpreted as Z. */
export type GeoArrowDimension = 'xy' | 'xyz' | 'xym' | 'xyzm';

/** Physical coordinate organization for native geometries. */
export type GeoArrowCoordinateLayout = 'interleaved' | 'separated';

/** Supported list-offset buffers. */
export type GeoArrowOffsets = Int32Array | BigInt64Array;

/** Numeric physical storage accepted by GeoArrow descriptors. */
export type GeoArrowNumericArray = TypedArray | BigInt64Array | BigUint64Array;

/** Borrowed validity bitmap. Set bits are valid rows. */
export type GeoArrowValidity = Readonly<{
  values: Uint8Array;
  /** Bit position corresponding to logical row zero. */
  bitOffset?: number;
}>;

/** Properties shared by all physical arrays. */
export type GeoArrowArrayBase = Readonly<{
  /** Number of logical values represented by this array. */
  length: number;
  /** Optional borrowed validity bitmap for this nesting level. */
  validity?: GeoArrowValidity;
}>;

/** Primitive scalar storage, optionally strided within a typed array. */
export type GeoArrowPrimitive = GeoArrowArrayBase &
  Readonly<{
    kind: 'primitive';
    values: GeoArrowNumericArray;
    /** Scalar offset of logical value zero. */
    offset?: number;
    /** Scalars between consecutive logical values. Defaults to one. */
    stride?: number;
  }>;

/** Fixed-size list storage, used for interleaved coordinate tuples. */
export type GeoArrowFixedSizeList = GeoArrowArrayBase &
  Readonly<{
    kind: 'fixed-size-list';
    size: number;
    child: GeoArrowArray;
    /** Logical list offset into the child. */
    offset?: number;
  }>;

/** Variable-size list storage. */
export type GeoArrowList = GeoArrowArrayBase &
  Readonly<{
    kind: 'list';
    offsets: GeoArrowOffsets;
    /** Index of logical row zero in `offsets`. */
    offset?: number;
    /** Value subtracted from offsets before indexing the supplied child view. */
    offsetBase?: number | bigint;
    child: GeoArrowArray;
  }>;

/** Named separated children, used for separated coordinates and boxes. */
export type GeoArrowStruct = GeoArrowArrayBase &
  Readonly<{
    kind: 'struct';
    children: Readonly<Record<string, GeoArrowArray>>;
    /** Logical struct offset applied to every child. */
    offset?: number;
  }>;

/** Struct storage used by `geoarrow.box` minimum/maximum ordinate columns. */
export type GeoArrowBox = GeoArrowStruct;

/** One dense-union child and its stable type ID. */
export type GeoArrowDenseUnionChild = Readonly<{
  name: string;
  typeId: number;
  /** Child-specific physical encoding (required for mixed-dimensional unions). */
  encoding?: GeoArrowEncoding;
  /** Child-specific semantic dimension. Falls back to the column dimension for legacy data. */
  dimension?: GeoArrowDimension;
  /** Child-specific coordinate layout. Falls back to the column layout for legacy data. */
  coordinateLayout?: GeoArrowCoordinateLayout | null;
  data: GeoArrowArray;
}>;

/** Dense-union storage for mixed geometry families. */
export type GeoArrowDenseUnion = GeoArrowArrayBase &
  Readonly<{
    kind: 'dense-union';
    typeIds: Int8Array | Uint8Array;
    valueOffsets: Int32Array;
    children: readonly GeoArrowDenseUnionChild[];
    /** Logical row offset into typeIds and valueOffsets. */
    offset?: number;
  }>;

/** Variable-width binary or UTF-8 storage for WKB and WKT. */
export type GeoArrowSerialized = GeoArrowArrayBase &
  Readonly<{
    kind: 'serialized';
    encoding: 'binary' | 'utf8';
    offsets: GeoArrowOffsets;
    values: Uint8Array;
    /** Optional Arrow BinaryView-style records (four uint32 words per row). */
    views?: Uint32Array;
    /** Borrowed out-of-line buffers referenced by BinaryView records. */
    dataBuffers?: readonly Uint8Array[];
    /** Index of logical row zero in `offsets`. */
    offset?: number;
    /** Value subtracted from offsets before indexing `values`. */
    offsetBase?: number | bigint;
  }>;

/** Arrow-compatible physical array tree without Arrow runtime classes. */
export type GeoArrowArray =
  | GeoArrowPrimitive
  | GeoArrowFixedSizeList
  | GeoArrowList
  | GeoArrowStruct
  | GeoArrowDenseUnion
  | GeoArrowSerialized;

/** One logical GeoArrow geometry column backed by borrowed chunks. */
export type GeoArrowColumn = Readonly<{
  encoding: GeoArrowEncoding;
  dimension: GeoArrowDimension;
  coordinateLayout: GeoArrowCoordinateLayout | null;
  chunks: readonly GeoArrowArray[];
  spatialReference?: SpatialReference | null;
  edges?: 'planar' | 'spherical';
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Coordinate callback used by mapping kernels. */
export type GeoArrowCoordinateMapper = (
  coordinate: readonly number[],
  rowIndex: number
) => readonly number[];

/** Four-value XY bounds. */
export type GeoArrowBounds = readonly [number, number, number, number];

/** Returns the number of coordinate components for a semantic dimension. */
export function getGeoArrowDimensionSize(dimension: GeoArrowDimension): 2 | 3 | 4 {
  switch (dimension) {
    case 'xy':
      return 2;
    case 'xyz':
    case 'xym':
      return 3;
    case 'xyzm':
      return 4;
  }
}

/** Combines semantic dimensions without confusing a measure ordinate with elevation. */
export function mergeGeoArrowDimensions(
  left: GeoArrowDimension,
  right: GeoArrowDimension
): GeoArrowDimension {
  const hasZ = left === 'xyz' || left === 'xyzm' || right === 'xyz' || right === 'xyzm';
  const hasM = left === 'xym' || left === 'xyzm' || right === 'xym' || right === 'xyzm';
  return hasZ && hasM ? 'xyzm' : hasZ ? 'xyz' : hasM ? 'xym' : 'xy';
}

/**
 * Infers the dimensions present in coordinate arrays of a tagged geometry value.
 * Three ordinates are interpreted as XYZ; callers with XYM data should supply that semantic
 * dimension explicitly instead of inferring it from tuple length.
 */
export function inferGeoArrowGeometryDimension(geometry: GeoArrowGeometryValue): GeoArrowDimension {
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.reduce(
      (dimension, child) =>
        mergeGeoArrowDimensions(dimension, inferGeoArrowGeometryDimension(child)),
      'xy' as GeoArrowDimension
    );
  }
  return inferCoordinateDimensions(geometry.coordinates);
}

/** Infers the combined dimensions of nested coordinate tuples. */
function inferCoordinateDimensions(coordinates: readonly unknown[]): GeoArrowDimension {
  if (typeof coordinates[0] === 'number') {
    return coordinates.length >= 4 ? 'xyzm' : coordinates.length === 3 ? 'xyz' : 'xy';
  }
  let dimension: GeoArrowDimension = 'xy';
  for (const child of coordinates) {
    if (Array.isArray(child)) {
      dimension = mergeGeoArrowDimensions(dimension, inferCoordinateDimensions(child));
    }
  }
  return dimension;
}

/** Returns the concrete geometry family associated with an encoding. */
export function getGeoArrowGeometryType(
  encoding: GeoArrowEncoding
): Exclude<GeoArrowGeometryValue['type'], 'GeometryCollection'> | 'GeometryCollection' | null {
  switch (encoding) {
    case 'geoarrow.point':
      return 'Point';
    case 'geoarrow.linestring':
      return 'LineString';
    case 'geoarrow.polygon':
      return 'Polygon';
    case 'geoarrow.multipoint':
      return 'MultiPoint';
    case 'geoarrow.multilinestring':
      return 'MultiLineString';
    case 'geoarrow.multipolygon':
      return 'MultiPolygon';
    case 'geoarrow.geometrycollection':
      return 'GeometryCollection';
    default:
      return null;
  }
}

/** Returns the canonical concrete encoding for a materialized geometry family. */
export function getGeoArrowEncodingForGeometry(
  type: GeoArrowGeometryValue['type']
): GeoArrowEncoding {
  return `geoarrow.${type.toLowerCase()}` as GeoArrowEncoding;
}
