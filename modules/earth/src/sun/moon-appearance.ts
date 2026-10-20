// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original implementation of lunar photometry and extended-target contrast.
// Phase law: Krisciunas & Schaefer (1991), https://doi.org/10.1086/132921
// Photometric conversion and contrast: Crumey (2014), https://arxiv.org/abs/1405.4209
import {validateRange} from './celestial';
import {getSkyContrastThreshold, getSkyLuminance, getSkyTransmission} from './sky-brightness';
import type {SkyAtmosphereOptions} from './sky-brightness';
import {getScatteredMoonLuminance} from './moon-sky-brightness';

export type MoonAppearanceOptions = SkyAtmosphereOptions & {
  phaseAngle: number;
  distance?: number;
  /** Moon/Sun angular separation, radians. Required for directional glare. */
  sunSeparation: number;
  /** Human contrast threshold field factor. Default 2. */
  observerFactor?: number;
  /** Terrain horizon altitude in this direction, radians. Default 0. */
  horizonAltitude?: number;
};
/** Physical light and apparent contrast are separate; daylight never forces a zero. */
export function getMoonAppearance(
  moonAltitude: number,
  sunAltitude: number,
  options: MoonAppearanceOptions
) {
  const {
    phaseAngle,
    sunSeparation,
    distance = 384400,
    observerFactor = 2,
    horizonAltitude = 0
  } = options;
  validateRange('Moon altitude', moonAltitude, -Math.PI / 2, Math.PI / 2);
  validateRange('Phase angle', phaseAngle, 0, Math.PI);
  validateRange('Moon distance', distance, 1737.4, Number.MAX_VALUE);
  validateRange('Horizon altitude', horizonAltitude, -Math.PI / 2, Math.PI / 2);
  const backgroundLuminance =
    getSkyLuminance(sunAltitude, moonAltitude, sunSeparation, options) +
    getScatteredMoonLuminance(phaseAngle, moonAltitude, moonAltitude, 0, {...options, distance});
  const radius = Math.asin(1737.4 / distance);
  const illuminatedFraction = (1 + Math.cos(phaseAngle)) / 2;
  const degrees = (phaseAngle * 180) / Math.PI;
  const phaseBrightness = Math.min(
    Math.pow(10, -0.4 * (0.026 * degrees + 4e-9 * degrees ** 4)),
    illuminatedFraction
  );
  const h = Math.max(-1, Math.min(1, (moonAltitude - horizonAltitude) / radius));
  const visibleDiskFraction = (Math.acos(-h) + h * Math.sqrt(1 - h * h)) / Math.PI;
  // Full Moon mV=-12.73 at mean distance, E[lux]=10^(-0.4*(mV+13.99)).
  const illuminance =
    Math.pow(10, -0.4 * 1.26) *
    phaseBrightness *
    (384400 / distance) ** 2 *
    getSkyTransmission(moonAltitude, options) *
    visibleDiskFraction;
  const solidAngle =
    2 * Math.PI * (1 - Math.cos(radius)) * illuminatedFraction * visibleDiskFraction;
  const diskLuminance = solidAngle > 0 ? illuminance / solidAngle : 0;
  const contrast = diskLuminance / Math.max(1e-5, backgroundLuminance);
  const contrastThreshold = getSkyContrastThreshold(
    backgroundLuminance,
    Math.max(1e-15, solidAngle),
    observerFactor
  );
  const ratio = contrast / contrastThreshold;
  const t = Math.max(0, Math.min(1, (Math.log2(Math.max(1e-30, ratio)) + 1) / 2));
  return {
    illuminance,
    horizontalIlluminance: illuminance * Math.max(0, Math.sin(moonAltitude)),
    backgroundLuminance,
    diskLuminance,
    contrast,
    contrastThreshold,
    illuminatedFraction,
    visibleDiskFraction,
    visible: ratio >= 1 && illuminance > 0,
    fade: t * t * (3 - 2 * t)
  };
}
