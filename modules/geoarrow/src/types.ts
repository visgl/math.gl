// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SpatialReference} from '@math.gl/crs';
import type {TypedArray} from '@math.gl/types';
import type {WellKnownGeometry} from '@math.gl/wkb';

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

/** Materialized geometry value used at codec and builder boundaries. */
export type GeoArrowGeometryValue = WellKnownGeometry;

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
