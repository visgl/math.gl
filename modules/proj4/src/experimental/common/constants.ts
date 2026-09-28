// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export const EPSLN = 1e-10;
export const HALF_PI = Math.PI / 2;
export const FORTPI = Math.PI / 4;
export const TWO_PI = Math.PI * 2;
// Preserve upstream tolerance at the antimeridian.
export const SPI = 3.14159265359;

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;
export const SEC_TO_RAD = Math.PI / (180 * 3600);
