// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSDefinition} from './crs';

/** Serialization or naming form in which a CRS definition was supplied. */
export type SpatialReferenceRepresentation =
  | 'identifier'
  | 'wkt'
  | 'proj-string'
  | 'projjson'
  | 'opaque';

/** Whether a CRS was declared, supplied by a specification default, unknown, or absent. */
export type SpatialReferenceState = 'explicit' | 'default' | 'unknown' | 'absent';

/** Origin of a normalized CRS reference. */
export type SpatialReferenceProvenance =
  | 'metadata'
  | 'format-default'
  | 'caller-override'
  | 'legacy-assumption'
  | 'unknown';

/** Broad coordinate frame used by a spatial dataset. */
export type SpatialReferenceCoordinateFrame =
  | 'geographic'
  | 'geocentric'
  | 'projected'
  | 'local'
  | 'unknown';

/** One alternate serialization of the same CRS retained by the source. */
export type SpatialReferenceAlternative = Readonly<{
  /** Original alternate CRS definition. */
  definition: CRSDefinition;
  /** Representation used by the alternate definition. */
  representation: SpatialReferenceRepresentation;
}>;

/** A known CRS and its source representation. */
export type KnownCRSReference = Readonly<{
  /** A known definition is either explicitly declared or established by a specification default. */
  state: 'explicit' | 'default';
  /** Preferred definition selected without discarding alternate source representations. */
  definition: CRSDefinition;
  /** Representation used by the preferred definition. */
  representation: SpatialReferenceRepresentation;
  /** How the preferred definition was established. */
  provenance: SpatialReferenceProvenance;
  /** Additional equivalent serializations carried by the source metadata. */
  alternatives?: readonly SpatialReferenceAlternative[];
}>;

/** An unknown or absent CRS that must not be replaced by an implicit WGS84 assumption. */
export type UnresolvedCRSReference = Readonly<{
  /** `unknown` preserves an explicit unknown value; `absent` means no value was supplied. */
  state: 'unknown' | 'absent';
  /** How the unresolved state was established. */
  provenance: SpatialReferenceProvenance;
}>;

/** Normalized CRS state, discriminated without comparing definition strings. */
export type CRSReference = KnownCRSReference | UnresolvedCRSReference;

/**
 * Format-neutral spatial-reference metadata.
 *
 * The descriptor reports how source coordinates are defined. It does not claim that coordinates,
 * bounds, or heights have been transformed. Format-specific metadata remains responsible for
 * lossless preservation of fields that cannot be represented here.
 */
export type SpatialReference = Readonly<{
  /** Primary horizontal or compound CRS state. */
  crs: CRSReference;
  /** Independently declared vertical CRS state. */
  vertical?: CRSReference;
  /** Coordinate epoch associated with source coordinates, expressed as a decimal year. */
  coordinateEpoch?: number;
  /** Broad frame in which source coordinates are stored. */
  coordinateFrame: SpatialReferenceCoordinateFrame;
  /** Component order used by stored arrays, independent of authoritative CRS axis order. */
  coordinateOrder: readonly string[];
  /** Per-component units when declared by the source. */
  units?: readonly string[];
}>;

/** Values accepted by {@link createSpatialReference}. */
export type CreateSpatialReferenceOptions = Readonly<{
  /** Primary horizontal or compound CRS state. Defaults to absent. */
  crs?: CRSReference;
  /** Independently declared vertical CRS state. */
  vertical?: CRSReference;
  /** Coordinate epoch associated with source coordinates. */
  coordinateEpoch?: number;
  /** Broad stored coordinate frame. Defaults to unknown. */
  coordinateFrame?: SpatialReferenceCoordinateFrame;
  /** Stored component order. Defaults to an empty, unknown order. */
  coordinateOrder?: readonly string[];
  /** Per-component units. */
  units?: readonly string[];
}>;

/**
 * Creates an immutable format-neutral spatial-reference descriptor.
 *
 * PROJJSON definitions and descriptor-owned arrays are cloned and recursively frozen. The
 * function does not parse definitions, resolve identifiers, or determine semantic equivalence.
 *
 * @param options - Spatial-reference discovery results to normalize.
 * @returns A readonly descriptor with cloned definitions and arrays.
 */
export function createSpatialReference(
  options: CreateSpatialReferenceOptions = {}
): SpatialReference {
  if (options.coordinateEpoch !== undefined && !Number.isFinite(options.coordinateEpoch)) {
    throw new Error('Spatial reference coordinate epoch must be a finite decimal year');
  }

  return Object.freeze({
    crs: freezeCRSReference(options.crs || {state: 'absent', provenance: 'unknown'}),
    vertical: options.vertical ? freezeCRSReference(options.vertical) : undefined,
    coordinateEpoch: options.coordinateEpoch,
    coordinateFrame: options.coordinateFrame || 'unknown',
    coordinateOrder: Object.freeze([...(options.coordinateOrder || [])]),
    units: options.units ? Object.freeze([...options.units]) : undefined
  });
}

/**
 * Infers a CRS representation from runtime syntax without resolving its meaning.
 *
 * Format adapters should pass an explicit representation when their metadata identifies one.
 * Unrecognized free-form strings are classified as `opaque`, not assumed to be identifiers.
 *
 * @param definition - CRS definition to classify syntactically.
 * @returns The apparent serialized representation.
 */
export function inferCRSRepresentation(definition: CRSDefinition): SpatialReferenceRepresentation {
  if (typeof definition === 'object') {
    return 'projjson';
  }

  const text = definition.trim();
  if (/^[A-Z][A-Z0-9_]*\s*[\[(]/i.test(text)) {
    return 'wkt';
  }
  if (/(?:^|\s)\+?proj=/i.test(text)) {
    return 'proj-string';
  }
  if (
    /^[A-Z][A-Z0-9._-]*(?::[A-Z0-9._-]+)+$/i.test(text) ||
    /^urn:ogc:def:crs:/i.test(text) ||
    /^https?:\/\//i.test(text) ||
    /^[A-Z][A-Z0-9._-]*$/i.test(text)
  ) {
    return 'identifier';
  }
  return 'opaque';
}

/** Clone and freeze one CRS reference without mutating caller-owned objects. */
function freezeCRSReference(reference: CRSReference): CRSReference {
  if (reference.state === 'explicit' || reference.state === 'default') {
    return Object.freeze({
      ...reference,
      definition: cloneAndFreezeDefinition(reference.definition),
      alternatives: reference.alternatives
        ? Object.freeze(
            reference.alternatives.map(alternative =>
              Object.freeze({
                ...alternative,
                definition: cloneAndFreezeDefinition(alternative.definition)
              })
            )
          )
        : undefined
    });
  }
  return Object.freeze({...reference});
}

/** Clone and recursively freeze a JSON CRS object while leaving string definitions unchanged. */
function cloneAndFreezeDefinition(definition: CRSDefinition): CRSDefinition {
  return typeof definition === 'string'
    ? definition
    : (cloneAndFreezeJsonValue(definition) as CRSDefinition);
}

/** Clone and freeze the JSON-compatible values used by PROJJSON definitions. */
function cloneAndFreezeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(item => cloneAndFreezeJsonValue(item)));
  }
  if (value && typeof value === 'object') {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, cloneAndFreezeJsonValue(item)])
      )
    );
  }
  return value;
}
