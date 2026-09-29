// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import type {ProjectionParameters} from '../types';
import type {DatumGridReference} from '../grids/types';

export type CRSNormalizationOptions = {
  aliases?: Readonly<Record<string, ReadonlyCRSDefinition>>;
  parsers?: readonly CRSParser[];
  /** Explicitly discard the vertical component of a compound CRS. */
  mode?: 'strict' | 'horizontal';
};

/** Parser adapters provide execution metadata; syntax parsing stays in @math.gl/crs. */
export type ParsedCRS = {
  parameters: ProjectionParameters;
  angularUnit?: number;
  verticalUnit?: number;
  lossy?: boolean;
};
export type CRSParser = {
  readonly name: string;
  canParse(definition: ReadonlyCRSDefinition): boolean;
  parse(definition: ReadonlyCRSDefinition, options: CRSNormalizationOptions): ParsedCRS;
};
export type Ellipsoid = {
  readonly semiMajorAxis: number;
  readonly semiMinorAxis: number;
  readonly eccentricitySquared: number;
};
export type Datum = {
  readonly ellipsoid: Ellipsoid;
  /** undefined disables datum conversion; values use meters, arcseconds and ppm. */
  readonly towgs84?: readonly number[];
  /** Ordered horizontal grids; compiled instances capture the supplied grid objects. */
  readonly grids?: readonly DatumGridReference[];
};
export type NormalizedCRS = {
  readonly kind: 'geographic' | 'projected' | 'geocentric' | 'identity';
  readonly projection: string;
  readonly parameters: ProjectionParameters;
  readonly ellipsoid: Ellipsoid;
  readonly datum: Datum;
  readonly angularUnit: number;
  readonly toMeter: number;
  readonly verticalUnit: number;
  readonly primeMeridian: number;
  readonly axis: string;
  readonly storedAxis?: string;
  readonly longitudeWrap?: number;
  readonly lossy: boolean;
};
export type CRSCompatibilityReason =
  | 'unknown-syntax'
  | 'missing-parser'
  | 'missing-plugin'
  | 'missing-transform-stage'
  | 'invalid-definition';
// CJS subpaths are independently bundled; keep instanceof and capability reasons
// stable when a parser and the core come from different public entry points.
const CRS_ERROR = Symbol.for('@math.gl/proj4/TypeScriptCRSError');
export class TypeScriptCRSError extends Error {
  readonly [CRS_ERROR] = true;
  static override [Symbol.hasInstance](value: unknown): boolean {
    if (this !== TypeScriptCRSError)
      return Function.prototype[Symbol.hasInstance].call(this, value);
    return value instanceof Error && (value as TypeScriptCRSError)[CRS_ERROR] === true;
  }

  constructor(
    readonly reason: CRSCompatibilityReason,
    message: string
  ) {
    super(message);
    this.name = 'TypeScriptCRSError';
  }
}
export function unsupportedStage(message: string): never {
  throw new TypeScriptCRSError('missing-transform-stage', message);
}
