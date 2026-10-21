// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented Krisciunas & Schaefer (1991), Equations 3, 15, 19–21; no reference code copied.
// https://doi.org/10.1086/132921
import {validateRange} from './celestial';
import {createSkyAtmosphere} from './sky-brightness';
import type {SkyAtmosphereOptions} from './sky-brightness';
/** Scattered moonlight luminance, cd/m²; empirical clear-sky model with averaged clouds. */
export function getScatteredMoonLuminance(
  phaseAngle: number,
  moonAltitude: number,
  viewAltitude: number,
  separation: number,
  options: SkyAtmosphereOptions & {distance?: number; extinction?: number} = {}
): number {
  validateRange('Phase angle', phaseAngle, 0, Math.PI);
  validateRange('Moon altitude', moonAltitude, -Math.PI / 2, Math.PI / 2);
  validateRange('View altitude', viewAltitude, -Math.PI / 2, Math.PI / 2);
  validateRange('Moon separation', separation, 0, Math.PI);
  const atmosphere = createSkyAtmosphere(options);
  const distance = options.distance ?? 384400;
  validateRange('Moon distance', distance, 1737.4, Number.MAX_VALUE);
  const k =
    options.extinction ??
    1.085736 *
      ((0.008735 * 0.55 ** -4.08 * atmosphere.pressure) / 1013.25 + atmosphere.aerosolOpticalDepth);
  validateRange('Extinction', k, 0, 20);
  const radius = Math.asin(1737.4 / distance);
  if (moonAltitude <= -radius || viewAltitude < 0 || phaseAngle === Math.PI) return 0;
  // Original uniform-disk horizon blend; the published model uses center altitude.
  const h = Math.max(-1, Math.min(1, moonAltitude / radius));
  const visibleFraction = (Math.acos(-h) + h * Math.sqrt(1 - h * h)) / Math.PI;
  const degrees = (phaseAngle * 180) / Math.PI;
  const brightness =
    Math.min(
      10 ** (-0.4 * (0.026 * degrees + 4e-9 * degrees ** 4)),
      (1 + Math.cos(phaseAngle)) / 2
    ) *
    10 ** (-0.4 * 3.84);
  const rho = Math.max(0.25, (separation * 180) / Math.PI);
  const scattering =
    10 ** 5.36 * (1.06 + Math.cos(separation) ** 2) +
    (rho < 10 ? 6.2e7 / rho ** 2 : 10 ** (6.15 - rho / 40));
  // Scattering air mass is the paper's Eq. 3, deliberately distinct from
  // direct-beam Kasten–Young air mass: different emitting height distributions.
  const x = (altitude: number) => 1 / Math.sqrt(1 - 0.96 * Math.cos(altitude) ** 2);
  const clouds =
    1 -
    atmosphere.cloudCover +
    atmosphere.cloudCover *
      Math.exp(-atmosphere.cloudOpticalDepth / Math.max(0.05, Math.sin(moonAltitude)));
  return (
    (scattering *
      brightness *
      10 ** (-0.4 * k * x(moonAltitude)) *
      (1 - 10 ** (-0.4 * k * x(viewAltitude))) *
      (384400 / distance) ** 2 *
      clouds *
      visibleFraction *
      1e-5) /
    Math.PI
  );
}
