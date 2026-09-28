// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ProjectionParameters} from './types';

export const DEGREES_TO_RADIANS = Math.PI / 180;

/** Read a finite decimal parameter, rejecting flags, empty values and other syntaxes. */
export function numberParameter(
  parameters: ProjectionParameters,
  name: string,
  fallback: number
): number {
  if (!Object.prototype.hasOwnProperty.call(parameters, name)) return fallback;
  const value = parameters[name];
  if (typeof value !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
    throw new Error(`Invalid numeric PROJ parameter: +${name}`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid numeric PROJ parameter: +${name}`);
  return number;
}

export function latitudeParameter(parameters: ProjectionParameters, name: string): number {
  const degrees = numberParameter(parameters, name, 0);
  if (Math.abs(degrees) >= 90) throw new Error(`+${name} must be between -90 and 90 degrees`);
  return degrees * DEGREES_TO_RADIANS;
}

export function wrapLongitude(longitude: number): number {
  if (Math.abs(longitude) <= Math.PI) return longitude;
  const circle = 2 * Math.PI;
  return ((((longitude + Math.PI) % circle) + circle) % circle) - Math.PI;
}
