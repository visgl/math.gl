// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original equations-based implementation; no reference code copied.
// Rayleigh phase function: Bruneton & Neyret (2008), https://doi.org/10.1111/j.1467-8659.2008.01245.x
// Henyey & Greenstein (1941), https://doi.org/10.1086/144246
// Cornette & Shanks (1992), https://doi.org/10.1364/AO.31.003152
// Ren & MacKenzie (2007), https://doi.org/10.1002/asl.154
// Chapman (1931), https://doi.org/10.1088/0959-5309/43/5/302
import {validateRange} from './celestial';

/** The constant `a` of the Ren & MacKenzie (2007) approximation of erfcx. */
const REN_MACKENZIE_CONSTANT = 2.911;
const SQRT_PI = Math.sqrt(Math.PI);

/**
 * Returns the Rayleigh phase function, per steradian: 3 (1 + μ²) / (16 π), where μ is the
 * cosine of the scattering angle. It integrates to 1 over the sphere.
 *
 * Reference: Bruneton & Neyret (2008), "Precomputed Atmospheric Scattering", Computer Graphics
 * Forum 27(4), doi:10.1111/j.1467-8659.2008.01245.x. The depolarization of the air
 * (about 3 %) is not modeled.
 * @param cosineOfScatteringAngle - μ, from −1 to 1. 1 is forward scattering.
 * @returns The phase function, per steradian.
 * @throws {RangeError} When the input is not finite or is out of its range.
 */
export function getRayleighPhaseFunction(cosineOfScatteringAngle: number): number {
  validateRange('Cosine of scattering angle', cosineOfScatteringAngle, -1, 1);
  return (3 * (1 + cosineOfScatteringAngle * cosineOfScatteringAngle)) / (16 * Math.PI);
}

/**
 * Returns the Henyey-Greenstein phase function, per steradian:
 * (1 − g²) / (4 π (1 + g² − 2 g μ)^(3/2)). It integrates to 1 over the sphere, and its mean
 * cosine is g.
 *
 * Reference: Henyey & Greenstein (1941), "Diffuse radiation in the Galaxy", Astrophysical
 * Journal 93, 70, doi:10.1086/144246.
 * @param cosineOfScatteringAngle - μ, from −1 to 1. 1 is forward scattering.
 * @param asymmetryParameter - g, greater than −1 and less than 1. Positive g scatters forward.
 * @returns The phase function, per steradian. It can be much larger than 1 near μ = 1.
 * @throws {RangeError} When an input is not finite or is out of its range.
 */
export function getHenyeyGreensteinPhaseFunction(
  cosineOfScatteringAngle: number,
  asymmetryParameter: number
): number {
  validateRange('Cosine of scattering angle', cosineOfScatteringAngle, -1, 1);
  validateAsymmetry(asymmetryParameter);
  const g = asymmetryParameter;
  const denominator = getPhaseDenominator(cosineOfScatteringAngle, g);
  return (1 - g * g) / (4 * Math.PI * denominator * Math.sqrt(denominator));
}

/**
 * Returns the Cornette-Shanks phase function, per steradian:
 * 3 (1 − g²) (1 + μ²) / (8 π (2 + g²) (1 + g² − 2 g μ)^(3/2)). It integrates to 1 over the
 * sphere. At g = 0 it is the Rayleigh phase function. Its mean cosine is
 * 3 g (4 + g²) / (5 (2 + g²)), not g.
 *
 * Reference: Cornette & Shanks (1992), "Physically reasonable analytic expression for the
 * single-scattering phase function", Applied Optics 31(16), 3152, doi:10.1364/AO.31.003152.
 * @param cosineOfScatteringAngle - μ, from −1 to 1. 1 is forward scattering.
 * @param asymmetryParameter - g, greater than −1 and less than 1.
 * @returns The phase function, per steradian.
 * @throws {RangeError} When an input is not finite or is out of its range.
 */
export function getCornetteShanksPhaseFunction(
  cosineOfScatteringAngle: number,
  asymmetryParameter: number
): number {
  validateRange('Cosine of scattering angle', cosineOfScatteringAngle, -1, 1);
  validateAsymmetry(asymmetryParameter);
  const g = asymmetryParameter;
  const mu = cosineOfScatteringAngle;
  const denominator = getPhaseDenominator(mu, g);
  return (
    (3 * (1 - g * g) * (1 + mu * mu)) /
    (8 * Math.PI * (2 + g * g) * denominator * Math.sqrt(denominator))
  );
}

/**
 * Returns an approximation of the scaled complementary error function,
 * erfcx(x) = exp(x²) erfc(x), for x ≥ 0:
 * a / ((a − 1) √π x + √(π x² + a²)) with a = 2.911.
 *
 * Reference: Ren & MacKenzie (2007), "Closed-form approximations to the error and complementary
 * error functions and their applications in atmospheric science", Atmospheric Science Letters
 * 8(3), 70-73, doi:10.1002/asl.154. The approximation is exact at 0 (1) and has the correct
 * asymptote 1 / (√π x). Its largest relative error on [0, ∞) is 0.331 %, near x = 1.75, measured
 * against 30-digit values. It is not a full-precision erfcx.
 * @param argument - x, 0 or greater. +Infinity gives 0.
 * @returns The approximate erfcx(x), in (0, 1].
 * @throws {RangeError} When the argument is NaN or negative.
 */
export function getApproximateErfcx(argument: number): number {
  if (!(argument >= 0)) {
    throw new RangeError('The erfcx argument must be 0 or greater');
  }
  const a = REN_MACKENZIE_CONSTANT;
  if (argument <= 1) {
    return a / ((a - 1) * SQRT_PI * argument + Math.sqrt(Math.PI * argument * argument + a * a));
  }
  // The same expression with x factored out, so that x² cannot overflow.
  const inverse = a / argument;
  return inverse / ((a - 1) * SQRT_PI + Math.sqrt(Math.PI + inverse * inverse));
}

/**
 * Returns the Chapman grazing-incidence function Ch(x, z): the column of an exponential
 * atmosphere along a ray to infinity, divided by the vertical column from the same point.
 *
 * x is the radius of the start point from the center of the body, in scale heights, and z is the
 * zenith angle of the ray at that point. For cos z ≥ 0, Ch = √(π x / 2) erfcx(√(x / 2) cos z)
 * (Chapman 1931, asymptotic form), with erfcx from {@link getApproximateErfcx}. For cos z < 0
 * the ray goes down to the tangent radius x₀ = x sin z and up again:
 * Ch = 2 √(π x₀ / 2) exp(x − x₀) − Ch(x, π − z). The function counts the column as if the body
 * were not there: when x₀ is less than the radius of the surface the ray hits the surface, and
 * the caller must test for that.
 *
 * Multiply by exp(−h), where h is the height of the start point above a reference radius in scale
 * heights, to get the column in units of the vertical column above that reference radius.
 *
 * Domain and accuracy, measured against 30-digit quadrature for cos z from −0.15 to 1: the
 * relative error is below 1 % for x ≥ 100, and below 0.5 % for x ≥ 300 (the Earth, H = 8 km, is
 * x ≈ 800; Mars, H = 11.1 km, is x ≈ 306). The error grows as 1 / x below 100. For cos z < 0 the same bounds hold
 * with the tangent radius x₀ in place of x. For cos z < 0, the
 * result overflows when x − x₀ exceeds about 700.
 *
 * Reference: Chapman (1931), "The absorption and dissociative or ionizing effect of monochromatic
 * radiation in an atmosphere on a rotating earth part II. Grazing incidence", Proceedings of the
 * Physical Society 43(5), 483-501, doi:10.1088/0959-5309/43/5/302.
 * @param radiusInScaleHeights - x, the radius of the start point divided by the scale height, 1 or greater.
 * @param cosineOfZenithAngle - cos z, from −1 to 1. 1 is straight up.
 * @returns Ch(x, z). The exact value is 1 for a vertical ray; the asymptotic form gives
 * 1 − O(1 / x), for example 0.9988 at x = 797.
 * @throws {RangeError} When an input is not finite or is out of its range, or when cos z < 0
 * and the tangent radius x sin z is less than 1.
 */
export function getChapmanGrazingIncidenceFunction(
  radiusInScaleHeights: number,
  cosineOfZenithAngle: number
): number {
  validateRange('Radius in scale heights', radiusInScaleHeights, 1, Number.MAX_VALUE);
  validateRange('Cosine of zenith angle', cosineOfZenithAngle, -1, 1);
  if (cosineOfZenithAngle >= 0) {
    return upwardChapman(radiusInScaleHeights, cosineOfZenithAngle);
  }
  const sineOfZenithAngle = Math.sqrt(1 - cosineOfZenithAngle * cosineOfZenithAngle);
  const tangentRadius = radiusInScaleHeights * sineOfZenithAngle;
  if (!(tangentRadius >= 1)) {
    throw new RangeError('The tangent radius x sin z must be 1 scale height or greater');
  }
  return (
    2 * Math.sqrt((Math.PI / 2) * tangentRadius) * Math.exp(radiusInScaleHeights - tangentRadius) -
    upwardChapman(radiusInScaleHeights, -cosineOfZenithAngle)
  );
}

/** The asymptotic Chapman function for cos z ≥ 0. */
function upwardChapman(radiusInScaleHeights: number, cosineOfZenithAngle: number): number {
  return (
    Math.sqrt((Math.PI / 2) * radiusInScaleHeights) *
    getApproximateErfcx(Math.sqrt(radiusInScaleHeights / 2) * cosineOfZenithAngle)
  );
}

/**
 * Returns 1 + g² − 2 g μ, written as (1 − g)² + 2 g (1 − μ) for g ≥ 0 and as
 * (1 + g)² − 2 g (1 + μ) for g < 0, so that the forward or backward peak keeps full precision
 * when |g| is near 1.
 */
function getPhaseDenominator(cosineOfScatteringAngle: number, asymmetryParameter: number): number {
  const g = asymmetryParameter;
  return g >= 0
    ? (1 - g) * (1 - g) + 2 * g * (1 - cosineOfScatteringAngle)
    : (1 + g) * (1 + g) - 2 * g * (1 + cosineOfScatteringAngle);
}

/** Throws a `RangeError` unless the asymmetry parameter is finite and strictly between −1 and 1. */
function validateAsymmetry(asymmetryParameter: number): void {
  if (!(Math.abs(asymmetryParameter) < 1)) {
    throw new RangeError('Asymmetry parameter must be finite and between -1 and 1, exclusive');
  }
}
