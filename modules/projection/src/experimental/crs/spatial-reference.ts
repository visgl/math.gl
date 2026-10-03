// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {CRSReference, ReadonlyCRSDefinition, SpatialReference} from '@math.gl/crs';
import {TypeScriptCRSError, unsupportedStage} from './types';
import type {CRSNormalizationOptions, NormalizedCRS} from './types';

export type TypeScriptCRSInput = ReadonlyCRSDefinition | CRSReference | SpatialReference;
export function resolveCRSInput(
  input: TypeScriptCRSInput,
  options: CRSNormalizationOptions
): {
  definition: ReadonlyCRSDefinition;
  spatialReference?: SpatialReference;
  lossy: boolean;
} {
  if (typeof input === 'string' || 'type' in input) return {definition: input, lossy: false};
  const metadata = input as CRSReference | SpatialReference;
  const spatialReference = 'crs' in metadata ? metadata : undefined;
  const reference = 'crs' in metadata ? metadata.crs : metadata;
  if (reference.state !== 'explicit' && reference.state !== 'default')
    throw new TypeScriptCRSError(
      'unknown-syntax',
      'Cannot transform an ' + reference.state + ' CRS reference'
    );
  let lossy = false;
  if (spatialReference?.coordinateEpoch !== undefined)
    unsupportedStage('Coordinate epochs require a time-dependent transformation');
  if (spatialReference?.vertical && spatialReference.vertical.state !== 'absent') {
    if (options.mode !== 'horizontal')
      unsupportedStage(
        'A separately declared vertical CRS requires explicit horizontal extraction'
      );
    lossy = true;
  }
  return {definition: reference.definition, spatialReference, lossy};
}
/** Stored coordinate order is independent of the authoritative CRS axis order. */
export function applySpatialReference(
  crs: NormalizedCRS,
  reference?: SpatialReference
): NormalizedCRS {
  if (!reference) return crs;
  if (reference.coordinateFrame !== 'unknown' && reference.coordinateFrame !== crs.kind)
    throw new Error('SpatialReference coordinate frame disagrees with its CRS');
  const order = reference.coordinateOrder;
  const names: Record<string, string> =
    crs.kind === 'geocentric'
      ? {x: 'e', y: 'n', z: 'u'}
      : {
          longitude: 'e',
          lon: 'e',
          latitude: 'n',
          lat: 'n',
          easting: 'e',
          northing: 'n',
          height: 'u',
          altitude: 'u',
          x: 'e',
          y: 'n',
          z: 'u'
        };
  let storedAxis: string | undefined;
  if (order.length) {
    storedAxis = order
      .slice(0, 3)
      .map(name => names[name.toLowerCase()] || '?')
      .join('');
    if (storedAxis.length === 2) storedAxis += 'u';
    if (
      storedAxis.length !== 3 ||
      !storedAxis.includes('e') ||
      !storedAxis.includes('n') ||
      !storedAxis.includes('u')
    )
      unsupportedStage('Unsupported SpatialReference coordinate order');
    if (order.length > 4 || (order.length > 3 && !['m', 'measure'].includes(order[3])))
      unsupportedStage('Unsupported fourth coordinate component');
  }
  // Metadata must agree with the executable definition; never silently relabel coordinates.
  if (reference.units?.length) {
    const units: Record<string, number> = {
      m: 1,
      meter: 1,
      metre: 1,
      meters: 1,
      metres: 1,
      km: 1000,
      ft: 0.3048,
      'us-ft': 1200 / 3937,
      degree: Math.PI / 180,
      degrees: Math.PI / 180,
      radian: 1,
      radians: 1,
      grad: Math.PI / 200
    };
    for (let i = 0; i < Math.min(reference.units.length, 3); i++) {
      const vertical = (storedAxis || 'enu')[i] === 'u';
      const expected =
        crs.kind === 'geocentric'
          ? crs.toMeter
          : vertical
            ? crs.verticalUnit
            : crs.kind === 'geographic'
              ? crs.angularUnit
              : crs.toMeter;
      if (
        Math.abs((units[reference.units[i]] ?? NaN) - expected) > 1e-12 ||
        units[reference.units[i]] === undefined
      )
        unsupportedStage('SpatialReference units disagree with its CRS');
    }
  }
  return Object.freeze({...crs, storedAxis});
}
