// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {WellKnownDimension, WellKnownGeometry} from './types';
export {
  getWellKnownDimensionSize,
  inferWellKnownGeometryDimension
} from './types';

export type {WKBParseOptions, WKBParseResult} from './wkb';
export {parseWKB, writeWKB} from './wkb';

export type {
  WKBBounds,
  WKBDialect,
  WKBGeometryCounts,
  WKBGeometryType,
  WKBHeader,
  WKBScanResult,
  WKBTraversalOptions,
  WKBVisitor
} from './wkb-reader';
export {inspectWKBHeader, scanWKB, visitWKB} from './wkb-reader';

export type {
  WKBBuilderBaseOptions,
  WKBBuilderMeasureOptions,
  WKBBuilderOptions,
  WKBBuilderWriteOptions,
  WKBCoordinateTransform,
  WKBGeometryArray,
  WKBGeometryWriter
} from './wkb-builder';
export {WKBBuilder} from './wkb-builder';

export {formatWKT, parseWKT} from './wkt';
