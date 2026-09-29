// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import type {ProjectionParameters} from '../types';

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
export class TypeScriptCRSError extends Error {
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
