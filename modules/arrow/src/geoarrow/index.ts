// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  makeGeoArrowColumnFromArrowVector,
  makeArrowVectorFromGeoArrowColumn,
  inferGeoArrowEncodingFromArrowType,
  inferGeoArrowDimensionFromArrowType,
  inferGeoArrowCoordinateLayoutFromArrowType
} from './arrow-adapter';
export type {MakeGeoArrowColumnFromArrowVectorOptions} from './arrow-adapter';
export {getGeoArrowExtensionMetadata} from './metadata';
export type {GeoArrowExtensionMetadata} from './metadata';
export {
  getGeoArrowFieldInfo,
  getGeometryColumnsFromSchema,
  inspectGeoArrowVector,
  getGeoArrowBounds,
  getGeoArrowRowBounds,
  getGeoArrowVertexCount,
  mapGeoArrowCoordinates,
  rewindGeoArrow
} from './vector-utils';
export type {GeoArrowFieldInfo} from './vector-utils';
