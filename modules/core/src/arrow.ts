// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export * from './arrow-integration/arrow';
export * from './arrow-integration/geoarrow-utils';
export * from './arrow-integration/wkb';
export {
  makeGeoArrowColumnFromArrowVector,
  makeArrowVectorFromGeoArrowColumn,
  inferGeoArrowEncodingFromArrowType,
  inferGeoArrowDimensionFromArrowType,
  inferGeoArrowCoordinateLayoutFromArrowType,
  getGeoArrowExtensionMetadata,
  getGeoArrowFieldInfo,
  getGeometryColumnsFromSchema,
  inspectGeoArrowVector
} from './arrow-integration/geoarrow';
export type {
  MakeGeoArrowColumnFromArrowVectorOptions,
  GeoArrowExtensionMetadata,
  GeoArrowFieldInfo
} from './arrow-integration/geoarrow';
export {
  getGeoArrowBounds as getGeoArrowVectorBounds,
  getGeoArrowRowBounds as getGeoArrowVectorRowBounds,
  getGeoArrowVertexCount as getGeoArrowVectorVertexCount,
  mapGeoArrowCoordinates as mapGeoArrowVectorCoordinates,
  rewindGeoArrow as rewindGeoArrowVector
} from './arrow-integration/geoarrow';
