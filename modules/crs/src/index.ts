// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  PROJJSON_SCHEMA_URL,
  PROJJSON_SCHEMA_VERSION
} from './projjson-schema-constants';
export type {
  CRSDefinition,
  CRSIdentifier,
  CRSStringDefinition,
  PROJJSONCRS,
  PROJJSONCRSByType,
  PROJJSONCRSType,
  PROJStringDefinition,
  WKTCRSDefinition
} from './crs';
export type {
  CreateSpatialReferenceOptions,
  CRSReference,
  KnownCRSReference,
  ReadonlyCRSDefinition,
  ReadonlyPROJJSONCRS,
  SpatialReference,
  SpatialReferenceAlternative,
  SpatialReferenceCoordinateFrame,
  SpatialReferenceProvenance,
  SpatialReferenceRepresentation,
  SpatialReferenceState,
  UnresolvedCRSReference
} from './spatial-reference';
export {createSpatialReference, inferCRSRepresentation} from './spatial-reference';
export type {
  EncodeWKTCRSOptions,
  ParseWKTCRSOptions,
  ValidateWKTCRSOptions,
  WKTCRSAst,
  WKTCRSDelimiter,
  WKTCRSEnumeration,
  WKTCRSNode,
  WKTCRSNumber,
  WKTCRSProfile,
  WKTCRSString,
  WKTCRSValidationIssue,
  WKTCRSValidationIssueCode,
  WKTCRSValue
} from './wkt-crs';
export {
  encodeWKTCRS,
  parseWKTCRS,
  validateWKTCRS,
  WKTCRSSyntaxError,
  WKTCRSValidationError
} from './wkt-crs';
export type {EncodePROJStringOptions, PROJParameter, PROJStringAst} from './proj-string';
export {
  encodePROJString,
  parsePROJString,
  PROJStringSyntaxError
} from './proj-string';
