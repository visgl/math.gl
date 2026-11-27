// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createSpatialReference} from './spatial-reference';
import type {SpatialReference} from './spatial-reference';

/** JSON spatial reference for current coordinate values in schema or field metadata. */
export const SPATIAL_REFERENCE_METADATA_KEY = 'vis.gl:spatial_reference';

/**
 * Returns a copy of metadata containing the spatial reference for current coordinate values.
 * Other entries and caller-owned objects are preserved. Invalid descriptors throw.
 */
export function setSpatialReferenceMetadata(
  metadata: ReadonlyMap<string, string> | undefined,
  spatialReference: SpatialReference
): Map<string, string> {
  validateSpatialReference(spatialReference);
  const result = new Map(metadata);
  result.set(SPATIAL_REFERENCE_METADATA_KEY, JSON.stringify(spatialReference));
  return result;
}

/**
 * Reads an immutable spatial reference, or undefined when the metadata key is missing.
 * Malformed JSON or descriptors throw; CRS definitions are not parsed or resolved.
 */
export function getSpatialReferenceMetadata(
  metadata: ReadonlyMap<string, string> | undefined
): SpatialReference | undefined {
  const value = metadata?.get(SPATIAL_REFERENCE_METADATA_KEY);
  if (value === undefined) {
    return undefined;
  }
  const reference: unknown = JSON.parse(value);
  validateSpatialReference(reference);
  return createSpatialReference(reference);
}

/**
 * Resolves a coordinate field's declaration before the schema default.
 * Explicit unknown or absent field references block inheritance. The caller identifies coordinate
 * fields and handles format-specific metadata such as GeoArrow before using this convention.
 */
export function resolveSpatialReferenceMetadata(
  schemaMetadata: ReadonlyMap<string, string> | undefined,
  fieldMetadata?: ReadonlyMap<string, string>
): SpatialReference | undefined {
  return getSpatialReferenceMetadata(fieldMetadata) ?? getSpatialReferenceMetadata(schemaMetadata);
}

/** Validate the descriptor envelope without importing a CRS parser or projection engine. */
function validateSpatialReference(value: unknown): asserts value is SpatialReference {
  if (
    !isObject(value) ||
    !isReference(value['crs']) ||
    (value['vertical'] !== undefined && !isReference(value['vertical'])) ||
    !['geographic', 'geocentric', 'projected', 'local', 'unknown'].includes(
      value['coordinateFrame'] as string
    ) ||
    !isStringArray(value['coordinateOrder']) ||
    (value['units'] !== undefined && !isStringArray(value['units'])) ||
    (value['coordinateEpoch'] !== undefined &&
      (typeof value['coordinateEpoch'] !== 'number' || !Number.isFinite(value['coordinateEpoch'])))
  ) {
    throw new Error('Invalid spatial reference metadata');
  }
}

/** Check known and unresolved reference variants, including alternate representations. */
function isReference(value: unknown): boolean {
  if (
    !isObject(value) ||
    !['metadata', 'format-default', 'caller-override', 'legacy-assumption', 'unknown'].includes(
      value['provenance'] as string
    )
  ) {
    return false;
  }
  if (value['state'] === 'unknown' || value['state'] === 'absent') {
    return (
      value['definition'] === undefined &&
      value['representation'] === undefined &&
      value['alternatives'] === undefined
    );
  }
  return (
    (value['state'] === 'explicit' || value['state'] === 'default') &&
    isDefinition(value) &&
    (value['alternatives'] === undefined ||
      (Array.isArray(value['alternatives']) && value['alternatives'].every(isDefinition)))
  );
}

/** Check representation and serialized value shape without validating CRS semantics. */
function isDefinition(value: unknown): boolean {
  if (!isObject(value)) {
    return false;
  }
  if (value['representation'] === 'projjson') {
    return isObject(value['definition']);
  }
  return (
    ['identifier', 'wkt', 'proj-string', 'opaque'].includes(value['representation'] as string) &&
    typeof value['definition'] === 'string'
  );
}

/** Exclude arrays and null from JSON objects. */
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Check coordinate order and unit arrays. */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value['every'](item => typeof item === 'string');
}
