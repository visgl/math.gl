// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/// <reference lib="es2025.float16" preserve="true" />

/** Serialized CRS or a PROJJSON object. Structural to avoid a geospatial/SQL dependency cycle. */
export type RasterCRS = string | object;
/** Numeric representations shared with loaders.gl. */
export type RasterChannelDataType =
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'float32'
  | 'float64';
/** Supported numeric sample buffers. */
export type RasterArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float16Array
  | Float32Array
  | Float64Array;
/** x=a*column+b*row+c; y=d*column+e*row+f. */
export type RasterAffineTransform = [number, number, number, number, number, number];
/** Raw-domain band interpretation, compatible with loaders.gl. */
export type RasterBandMetadata = {
  /** Original source band index, not its position in a selected payload. */
  index: number;
  /** Actual sample representation. */
  dtype: RasterChannelDataType;
  /** Display label. */
  name?: string;
  /** Physical units. */
  units?: string;
  /** Raw-to-physical multiplier. */
  scale?: number;
  /** Raw-to-physical offset. */
  offset?: number;
  /** Raw-domain missing value; null explicitly disables inherited nodata. */
  noData?: number | null;
  /** Categorical bands must not be interpolated. */
  categorical?: boolean;
};
/** Byte mask; zero is invalid and cannot override raw nodata. */
export type RasterValidityMask = {
  /** Mask buffer. */
  data: Uint8Array;
  /** Payload band position; omitted means every band. */
  band?: number;
  /** Mask dimensions. */
  width: number;
  /** Mask row count. */
  height: number;
  /** Initial byte offset. */
  offset?: number;
  /** Column stride, default one. */
  pixelStride?: number;
  /** Row stride, default width. */
  rowStride?: number;
};
/** Resident grid metadata; georeferencing is required only for spatial operations. */
export type RasterMetadata = {
  /** Grid width. */
  width: number;
  /** Grid height. */
  height: number;
  /** Payload band count. */
  bandCount: number;
  /** Common representation or mixed planar representations. */
  dtype: RasterChannelDataType | 'mixed';
  /** Band interpretations in payload order. */
  bands?: RasterBandMetadata[];
  /** Fallback raw missing value. */
  noData?: number | null;
  /** Grid-to-world transform. */
  transform?: RasterAffineTransform;
  /** Area centers are at +0.5; point centers at integer grid coordinates. */
  pixelRegistration?: 'area' | 'point';
  /** Coordinate reference definition. */
  crs?: RasterCRS;
};
/** Numeric payload structurally compatible with loaders.gl NumericRasterData. */
export type NumericRasterData = RasterMetadata & {
  /** Planar arrays, a packed planar buffer, or an interleaved buffer. */
  data: RasterArray | RasterArray[];
  /** True for pixel-interleaved buffers. */
  interleaved?: boolean;
  /** Optional strided masks. */
  validityMasks?: RasterValidityMask[];
  /** Borrowed buffers must remain stable for the lifetime of their source. */
  ownership?: 'borrowed' | 'owned' | 'transferred';
};
/** Native grid window; all indices are zero-based. */
export type RasterWindow = {
  /** First column. */
  x: number;
  /** First row. */
  y: number;
  /** Number of columns. */
  width: number;
  /** Number of rows. */
  height: number;
  /** Payload band positions, default all. */
  bands?: number[];
  /** Cooperative cancellation. */
  signal?: AbortSignal;
};
/** Synchronous source of immutable numeric windows; no network I/O during SQL evaluation. */
export interface SyncRasterSource {
  /** Immutable description of this source's grid, not an upstream dataset. */
  readonly metadata: Readonly<RasterMetadata>;
  /** Returns a locally georeferenced window; consumers never mutate its buffers. */
  readWindow(window: RasterWindow): NumericRasterData;
}
/** Polygon rings in source-world coordinates, with an explicit CRS. */
export type RasterPolygon = {
  /** Exterior ring followed by holes. */
  coordinates: readonly (readonly (readonly number[])[])[];
  /** Coordinate reference definition. */
  crs: RasterCRS;
};
/** Exact, raw-domain band statistics. */
export type RasterSummary = {
  /** Valid samples. */
  count: number;
  /** Sum, zero for an empty valid set. */
  sum: number;
  /** Mean or null for an empty valid set. */
  mean: number | null;
  /** Population standard deviation. */
  stddev: number | null;
  /** Minimum or null. */
  min: number | null;
  /** Maximum or null. */
  max: number | null;
};
