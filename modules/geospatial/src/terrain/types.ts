// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type TerrainArray = Float32Array | Float64Array;
export type TerrainRegistration = 'vertex' | 'cell';
/** Grid-index endpoints of the shared cell diagonal. */
export type TerrainDiagonal = '00-11' | '10-01';
export type TerrainInterpolation = 'nearest' | 'bilinear' | 'triangle';

export const TerrainSampleStatus = {
  VALID: 0,
  OUTSIDE_DOMAIN: 1,
  NO_DATA: 2,
  INVALID_INPUT: 3,
  NUMERIC_ERROR: 4,
  UNAVAILABLE: 5,
  NOT_RESIDENT: 6
} as const;

export type TerrainSampleStatus = (typeof TerrainSampleStatus)[keyof typeof TerrainSampleStatus];

/** An affine, local Cartesian grid. Horizontal coordinates and heights are in meters. */
export type HeightFieldProps = {
  width: number;
  height: number;
  heights: TerrainArray;
  /** Zero is missing; any nonzero byte is valid. Nonfinite heights are always missing. */
  validity?: Uint8Array;
  /** Input element offset and row stride, shared by heights and validity. */
  offset?: number;
  stride?: number;
  /** For cell registration, origin is the corner before the first cell center. */
  origin?: readonly [number, number];
  columnStep?: readonly [number, number];
  rowStep?: readonly [number, number];
  registration?: TerrainRegistration;
  diagonal?: TerrainDiagonal;
  /** Opaque provenance label only. No vertical-reference conversion is performed. */
  heightReference?: string;
};

export type TerrainSampleOptions = {interpolation?: TerrainInterpolation};

/** Numeric values are zero when their associated status is not VALID. */
export type TerrainSample = {
  status: TerrainSampleStatus;
  height: number;
  gradientStatus: TerrainSampleStatus;
  gradientX: number;
  gradientY: number;
  normalX: number;
  normalY: number;
  normalZ: number;
};

/** Caller-owned output buffers. Heights/statuses have N entries, gradients 2N, normals 3N. */
export type TerrainSampleBatch = {
  heights: TerrainArray;
  statuses: Uint8Array;
  gradients?: TerrainArray;
  normals?: TerrainArray;
  /** Required when gradients or normals are requested. */
  gradientStatuses?: Uint8Array;
};
