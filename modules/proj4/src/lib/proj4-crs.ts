// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import proj4 from 'proj4';
import type {CRSDefinition, PROJJSONCRS, PROJJSONCRSByType} from '@math.gl/crs';

/** PROJJSON object variants currently parsed by proj4js 2.20.9. */
export type Proj4PROJJSONCRS = PROJJSONCRSByType<
  'GeographicCRS' | 'GeodeticCRS' | 'ProjectedCRS' | 'BoundCRS'
>;

/** A CRS definition currently accepted by proj4js 2.20.9. */
export type Proj4CRSDefinition = CRSDefinition<Proj4PROJJSONCRS>;

export type Proj4CRSConversionMode = 'strict' | 'horizontal';

export type Proj4SerializedCRSCheckMode = 'probe' | 'unknown' | 'accept';

export type ToProj4CRSDefinitionOptions = {
  /** Allow an explicit, lossy extraction of the horizontal component of a CompoundCRS. */
  mode?: Proj4CRSConversionMode;
};

export type CheckProj4CRSCompatibilityOptions = {
  /** Select strict conversion or explicit horizontal extraction for CompoundCRS objects. */
  mode?: Proj4CRSConversionMode;
  /** Select how serialized CRS strings are treated. Defaults to a proj4js construction probe. */
  serialized?: Proj4SerializedCRSCheckMode;
};

export type Proj4CRSCompatibilityStatus = 'supported' | 'unsupported' | 'unknown';

export type Proj4CRSCompatibilityReason =
  | 'unsupported-crs-type'
  | 'missing-horizontal-crs'
  | 'ambiguous-horizontal-crs'
  | 'proj4js-parse-error'
  | 'serialized-definition-not-checked';

export type Proj4CRSCompatibilityResult = {
  status: Proj4CRSCompatibilityStatus;
  /** Whether proj4js construction was actually attempted. */
  checked: boolean;
  /** True when the selected definition represents only part of the input CRS. */
  lossy: boolean;
  /** The top-level PROJJSON type, when the input is an object. */
  type?: string;
  reason?: Proj4CRSCompatibilityReason;
  message?: string;
};

/** Thrown when a CRS cannot be converted to the requested Proj4 definition mode. */
export class Proj4CRSCompatibilityError extends Error {
  readonly compatibility: Proj4CRSCompatibilityResult;

  constructor(compatibility: Proj4CRSCompatibilityResult) {
    super(compatibility.message || 'CRS is not compatible with proj4js');
    this.name = 'Proj4CRSCompatibilityError';
    this.compatibility = compatibility;
  }
}

type Proj4Runtime = (from: Proj4CRSDefinition, to: Proj4CRSDefinition) => unknown;

const proj4Runtime = proj4 as unknown as Proj4Runtime;

const PROJ4_CRS_TYPES = new Set<Proj4PROJJSONCRS['type']>([
  'GeographicCRS',
  'GeodeticCRS',
  'ProjectedCRS',
  'BoundCRS'
]);

function isCRSObject(definition: CRSDefinition): definition is PROJJSONCRS {
  return typeof definition === 'object' && definition !== null;
}

function getCRSType(definition: PROJJSONCRS): string | undefined {
  return typeof definition.type === 'string' ? definition.type : undefined;
}

function isProj4CRSObject(definition: PROJJSONCRS): definition is Proj4PROJJSONCRS {
  return PROJ4_CRS_TYPES.has(definition.type as Proj4PROJJSONCRS['type']);
}

function isHorizontalProj4CRSObject(definition: PROJJSONCRS): definition is Proj4PROJJSONCRS {
  if (!isProj4CRSObject(definition)) {
    return false;
  }
  return definition.type !== 'BoundCRS' || isHorizontalProj4CRSObject(definition.source_crs);
}

function unsupportedResult(
  type: string | undefined,
  reason: Proj4CRSCompatibilityReason,
  message: string,
  lossy = false
): Proj4CRSCompatibilityResult {
  return {status: 'unsupported', checked: false, lossy, type, reason, message};
}

function findHorizontalComponent(
  definition: PROJJSONCRS
): {definition: Proj4PROJJSONCRS} | {reason: Proj4CRSCompatibilityReason; message: string} {
  if (definition.type !== 'CompoundCRS' || !Array.isArray(definition.components)) {
    return {
      reason: 'missing-horizontal-crs',
      message: 'CompoundCRS does not contain a components array'
    };
  }

  const horizontalComponents = definition.components.filter(
    (component): component is Proj4PROJJSONCRS => isHorizontalProj4CRSObject(component)
  );

  if (horizontalComponents.length === 0) {
    return {
      reason: 'missing-horizontal-crs',
      message: 'CompoundCRS does not contain a Proj4-compatible horizontal CRS'
    };
  }
  if (horizontalComponents.length > 1) {
    return {
      reason: 'ambiguous-horizontal-crs',
      message: 'CompoundCRS contains more than one Proj4-compatible horizontal CRS'
    };
  }
  return {definition: horizontalComponents[0]};
}

function getProj4Definition(
  definition: CRSDefinition,
  mode: Proj4CRSConversionMode
): {definition: Proj4CRSDefinition; lossy: boolean; type?: string} {
  if (!isCRSObject(definition)) {
    return {definition: definition as Proj4CRSDefinition, lossy: false};
  }

  if (isProj4CRSObject(definition)) {
    return {definition, lossy: false, type: getCRSType(definition)};
  }

  if (mode === 'horizontal' && definition.type === 'CompoundCRS') {
    const horizontal = findHorizontalComponent(definition);
    if ('reason' in horizontal) {
      throw new Proj4CRSCompatibilityError(
        unsupportedResult(getCRSType(definition), horizontal.reason, horizontal.message, true)
      );
    }
    return {definition: horizontal.definition, lossy: true, type: getCRSType(definition)};
  }

  const type = getCRSType(definition);
  throw new Proj4CRSCompatibilityError(
    unsupportedResult(
      type,
      'unsupported-crs-type',
      type ? `${type} is not supported by proj4js` : 'CRS object has no supported type'
    )
  );
}

function probeProj4Definition(
  definition: Proj4CRSDefinition,
  type: string | undefined,
  lossy: boolean
): Proj4CRSCompatibilityResult {
  try {
    // Constructing the converter parses and initializes the definitions; no coordinates are used.
    proj4Runtime(definition, 'WGS84');
    return {status: 'supported', checked: true, lossy, type};
  } catch (error) {
    return {
      status: 'unsupported',
      checked: true,
      lossy,
      type,
      reason: 'proj4js-parse-error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/** Convert a broad CRS definition to the Proj4-executable CRS definition type. */
export function toProj4CRSDefinition(
  definition: CRSDefinition,
  options?: ToProj4CRSDefinitionOptions
): Proj4CRSDefinition {
  return getProj4Definition(definition, options?.mode || 'strict').definition;
}

/** Check whether a CRS definition can be constructed and used by proj4js. */
export function checkProj4CRSCompatibility(
  definition: CRSDefinition,
  options?: CheckProj4CRSCompatibilityOptions
): Proj4CRSCompatibilityResult {
  const mode = options?.mode || 'strict';

  if (!isCRSObject(definition)) {
    const serialized = options?.serialized || 'probe';
    if (serialized === 'unknown') {
      return {
        status: 'unknown',
        checked: false,
        lossy: false,
        reason: 'serialized-definition-not-checked',
        message: 'Serialized CRS definition was not checked with proj4js'
      };
    }
    if (serialized === 'accept') {
      return {status: 'supported', checked: false, lossy: false};
    }
    return probeProj4Definition(definition as Proj4CRSDefinition, undefined, false);
  }

  try {
    const converted = getProj4Definition(definition, mode);
    return probeProj4Definition(converted.definition, converted.type, converted.lossy);
  } catch (error) {
    if (error instanceof Proj4CRSCompatibilityError) {
      return error.compatibility;
    }
    throw error;
  }
}
