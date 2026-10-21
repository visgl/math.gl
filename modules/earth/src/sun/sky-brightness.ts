// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented published equations; no reference code copied.
// Patat et al. (2006), V-band twilight fit, Table 1: https://arxiv.org/abs/astro-ph/0604128
// Crumey (2014), Blackwell contrast thresholds: https://arxiv.org/abs/1405.4209
// Kasten & Young (1989): https://doi.org/10.1364/AO.28.004735
import {validateRange} from './celestial';

export type SkyAtmosphereOptions = {
  /** Pressure in hPa. Default 1013.25. */
  pressure?: number;
  /** Aerosol optical depth at 550 nm. Default 0.1. */
  aerosolOpticalDepth?: number;
  cloudCover?: number;
  cloudOpticalDepth?: number;
  /** Natural zenith night-sky luminance, cd/m². Default 0.0002. */
  darkSkyLuminance?: number;
  /** Additional artificial sky luminance, cd/m². Default 0. */
  lightPollutionLuminance?: number;
};
export function createSkyAtmosphere(options: SkyAtmosphereOptions = {}) {
  const {
    pressure = 1013.25,
    aerosolOpticalDepth = 0.1,
    cloudCover = 0,
    cloudOpticalDepth = 10,
    darkSkyLuminance = 0.0002,
    lightPollutionLuminance = 0
  } = options;
  const atmosphere = {
    pressure,
    aerosolOpticalDepth,
    cloudCover,
    cloudOpticalDepth,
    darkSkyLuminance,
    lightPollutionLuminance
  };
  validateRange('Pressure', atmosphere.pressure, 0, 1100);
  validateRange('Aerosol optical depth', atmosphere.aerosolOpticalDepth, 0, 10);
  validateRange('Cloud cover', atmosphere.cloudCover, 0, 1);
  validateRange('Cloud optical depth', atmosphere.cloudOpticalDepth, 0, 1000);
  validateRange('Dark sky luminance', atmosphere.darkSkyLuminance, 0, 100);
  validateRange('Light pollution luminance', atmosphere.lightPollutionLuminance, 0, 100);
  return Object.freeze(atmosphere);
}

/** Relative optical air mass; finite horizon value, geometric altitude in radians. */
export function getSkyAirMass(altitude: number): number {
  validateRange('Altitude', altitude, -Math.PI / 2, Math.PI / 2);
  const a = Math.max(0, altitude);
  return 1 / (Math.sin(a) + 0.50572 * Math.pow((a * 180) / Math.PI + 6.07995, -1.6364));
}
/** V-band direct transmission; opaque partial coverage is averaged, not a weather map. */
export function getSkyTransmission(altitude: number, options: SkyAtmosphereOptions = {}): number {
  const a = createSkyAtmosphere(options);
  const tau = (0.008735 * Math.pow(0.55, -4.08) * a.pressure) / 1013.25 + a.aerosolOpticalDepth;
  return (
    Math.exp(-getSkyAirMass(altitude) * tau) *
    (1 -
      a.cloudCover +
      a.cloudCover * Math.exp(-a.cloudOpticalDepth / Math.max(0.05, Math.sin(altitude))))
  );
}

/**
 * Directional sky luminance in cd/m². Twilight zenith fit is measured; daylight,
 * glare, haze, clouds and non-zenith extrapolations are rendering approximations.
 */
export function getSkyLuminance(
  sunAltitude: number,
  viewAltitude: number,
  sunSeparation: number,
  options: SkyAtmosphereOptions = {}
): number {
  validateRange('Sun altitude', sunAltitude, -Math.PI / 2, Math.PI / 2);
  validateRange('View altitude', viewAltitude, -Math.PI / 2, Math.PI / 2);
  validateRange('Sun separation', sunSeparation, 0, Math.PI);
  const a = createSkyAtmosphere(options);
  const degrees = (sunAltitude * 180) / Math.PI;
  if (a.pressure === 0) return a.darkSkyLuminance + a.lightPollutionLuminance;
  const fit = (depression: number) =>
    (Math.pow(
      10,
      (12.58 - (11.84 + 1.518 * (depression - 5) - 0.057 * Math.pow(depression - 5, 2))) / 2.5
    ) *
      a.pressure) /
    743;
  let zenith: number;
  if (degrees >= -5) {
    // Smoothly connect the measured -5° twilight luminance to an approximate
    // clear daytime zenith. Do not extrapolate the quadratic into daylight.
    zenith = fit(5) * Math.exp(((degrees + 5) * Math.log(3000 / fit(5))) / 5);
    if (degrees > 0) zenith = 3000 + 7000 * Math.sin(sunAltitude);
  } else if (degrees >= -15) zenith = fit(-degrees);
  else {
    const t = Math.min(1, (-degrees - 15) / 3);
    const smooth = t * t * (3 - 2 * t);
    zenith = fit(15) * (1 - smooth) + a.darkSkyLuminance * smooth;
  }
  const night = a.darkSkyLuminance + a.lightPollutionLuminance;
  const daylightWeight = Math.max(0, Math.min(1, (degrees + 15) / 10));
  // Forward-scattering lobe, normalized at the zenith for this solar altitude.
  const g = 0.8;
  const phase = (angle: number) => (1 - g * g) / Math.pow(1 + g * g - 2 * g * Math.cos(angle), 1.5);
  const scattering = (angle: number) =>
    1 + Math.cos(angle) ** 2 + 0.1 * (1 + a.aerosolOpticalDepth * 10) * phase(angle);
  const directional = scattering(sunSeparation) / scattering(Math.PI / 2 - sunAltitude);
  const horizon = 1 + daylightWeight * Math.max(0, getSkyAirMass(viewAltitude) - 1) * 0.08;
  const clear =
    night +
    Math.max(0, zenith - a.darkSkyLuminance) *
      (1 - daylightWeight + daylightWeight * directional) *
      horizon;
  const cloudTransmission = 1 / (1 + 0.12 * a.cloudOpticalDepth);
  // Cloud-covered sky is more isotropic; artificial light is reflected back.
  const cloudy =
    a.darkSkyLuminance +
    a.lightPollutionLuminance * (1 + a.cloudOpticalDepth * 0.1) +
    Math.max(0, zenith - a.darkSkyLuminance) * cloudTransmission;
  return clear * (1 - a.cloudCover) + cloudy * a.cloudCover;
}

/** Crumey/Blackwell threshold for a uniform extended target of solid angle in sr. */
export function getSkyContrastThreshold(
  backgroundLuminance: number,
  solidAngle: number,
  observerFactor = 2
): number {
  validateRange('Background luminance', backgroundLuminance, 0, Number.MAX_VALUE);
  validateRange('Solid angle', solidAngle, Number.MIN_VALUE, 4 * Math.PI);
  validateRange('Observer factor', observerFactor, 1, 100);
  const b = Math.max(1e-5, backgroundLuminance);
  const r =
    b <= 0.0708
      ? Math.pow(6.505e-4 * Math.pow(b, -0.25) - 8.461e-4, 2)
      : Math.pow(1.772e-4 * Math.pow(b, -0.25) + 7.167e-5, 2);
  const largeTarget = b < 0.354 ? 7.633e-3 * Math.pow(b, -0.25) - 7.174e-3 : 2.72e-3;
  const q =
    b < 0.193 ? 0.6 : b < 3.4 ? 0.8861 + 0.4 * Math.log10(b) : 1.146 - 0.0885 * Math.log10(b);
  // The empirical q fit covers terrestrial sky backgrounds, not arbitrarily
  // luminous sources; cap to its positive range for finite numerical behavior.
  const exponent = Math.max(0.2, q);
  return (
    observerFactor *
    Math.pow(Math.pow(r / solidAngle, exponent) + Math.pow(largeTarget, exponent), 1 / exponent)
  );
}
