// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
  CRSInput,
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

export type {CRSMetadata, CRSUnit} from './crs-metadata';
export {getCRSSignature} from './crs-metadata';
export {linearUnits} from './units-table';

// Public named exports. Implementations remain in independently tree-shakable files.
export {createCRSDictionaryProvider, createCRSResolver, CRSResolutionError} from './resolver';
export type {
  CRSDefinitionProvider,
  CRSLookup,
  CRSResolution,
  CRSResolverOptions,
  CRSResolver
} from './resolver';

export {createCRSDescriptor} from './crs-descriptor';
export type {CRSDescriptorOptions} from './crs-descriptor';
export type {
  CRSCoordinate,
  CRSOutput,
  CRSDescriptor,
  CRSConversion,
  CRSConverter,
  CRSBounds,
  CRSRenderingScale,
  CRSRenderingScaleCallback
} from './crs-descriptor-types';

export {createCRSProjectionDomain} from './projection-domain';
export type {
  CRSProjectionDomainPoint,
  CRSProjectionDomainRing,
  CRSProjectionDomainPolygon,
  CRSProjectionPeriod,
  CRSProjectionDomain
} from './projection-domain';

export {createCRSExecutionIdentity, getCRSExecutionKey} from './execution-identity';
export type {CRSExecutionIdentity} from './execution-identity';
