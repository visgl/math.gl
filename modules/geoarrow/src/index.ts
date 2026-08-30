// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {
  GeoArrowArray,
  GeoArrowArrayBase,
  GeoArrowBox,
  GeoArrowBounds,
  GeoArrowColumn,
  GeoArrowCoordinateLayout,
  GeoArrowCoordinateMapper,
  GeoArrowDenseUnion,
  GeoArrowDenseUnionChild,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowFixedSizeList,
  GeoArrowGeometryValue,
  GeoArrowList,
  GeoArrowNumericArray,
  GeoArrowOffsets,
  GeoArrowPrimitive,
  GeoArrowSerialized,
  GeoArrowStruct,
  GeoArrowValidity
} from './types';
export {
  getGeoArrowDimensionSize,
  getGeoArrowEncodingForGeometry,
  getGeoArrowGeometryType
} from './types';

export type {
  GeoArrowColumnInspection,
  GeoArrowValidationIssue,
  GeoArrowValidationResult
} from './layout';
export {
  getGeoArrowRowCount,
  getGeoArrowTransferList,
  getGeoArrowVertexCount,
  inspectGeoArrowColumn,
  isGeoArrowValueValid,
  sliceGeoArrowArray,
  sliceGeoArrowColumn,
  validateGeoArrowColumn,
  visitGeoArrowCoordinates
} from './layout';

export type {
  GeoArrowBuilderEncoding,
  GeoArrowBuilderMeasurement,
  GeoArrowBuilderModeOptions,
  GeoArrowBuilderOptions,
  GeoArrowColumnFromRowsOptions,
  GeoArrowBuilderTarget
} from './builder';
export {
  allocateGeoArrowBuilderTarget,
  GeoArrowBuilder,
  makeGeoArrowColumnFromGeometryRows
} from './builder';

export type {
  ConvertGeoArrowColumnOptions,
  GeoArrowResourceLimitOptions,
  GeoArrowRingOrientation,
  MapGeoArrowCoordinatesOptions,
  RewindGeoArrowOptions
} from './kernels';
export {
  assertGeoArrowResourceLimits,
  convertGeoArrowColumn,
  getGeoArrowBounds,
  getGeoArrowRowBounds,
  interleaveGeoArrowCoordinates,
  mapGeoArrowCoordinates,
  mapGeoArrowCoordinatesInto,
  normalizeGeoArrowUnion,
  rewindGeoArrow
} from './kernels';

export {
  decodeGeoArrowWKB,
  decodeGeoArrowWKT,
  encodeGeoArrowWKB,
  encodeGeoArrowWKT
} from './codecs';

export type {
  GeoArrowTessellation,
  TessellateGeoArrowPolygonsOptions
} from './tessellate';
export {tessellateGeoArrowPolygons} from './tessellate';
