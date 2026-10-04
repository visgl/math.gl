// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented legacy twilight heuristic and optional Crumey contrast equations; no reference code copied.
// Crumey (2014): https://arxiv.org/abs/1405.4209
// Air mass: Kasten & Young (1989), https://doi.org/10.1364/AO.28.004735
// Visibility context only (not a reproduction of its model): Tousey & Koomen (1953),
// https://doi.org/10.1364/JOSA.43.000177
import {validateRange} from './celestial';
import {getSkyLuminance, getSkyTransmission} from './sky-brightness';
import type {SkyAtmosphereOptions} from './sky-brightness';

export type PlanetVisibilityOptions = {
  /** Published contrast model, or backward-compatible twilight heuristic. Default legacy. */
  model?: 'legacy' | 'contrast';
  atmosphere?: SkyAtmosphereOptions;
  /** Human visual field factor in the contrast model. Default 2. */
  observerFactor?: number;
  /** Additional directional luminance (e.g. scattered moonlight), cd/m². Default 0. */
  additionalSkyLuminance?: number;
  /** Faintest extincted magnitude at a fully dark sky. Default 6. */
  darkSkyLimitingMagnitude?: number;
  /** Atmospheric extinction in visual magnitudes per air mass. Default 0.2. */
  extinction?: number;
  /** Minimum geometric planet altitude in radians. Default 5 degrees. */
  minimumAltitude?: number;
  /** Minimum angle from the Sun in radians. Default 10 degrees. */
  minimumSunSeparation?: number;
};
export type PlanetVisibility = {
  /** Estimated detectability under the specified heuristic, not guaranteed visibility. */
  visible: boolean;
  /** Smooth rendering fade around the visibility threshold, from 0 to 1. */
  fade: number;
  /** Approximate faintest detectable magnitude, including the dark-sky cap. */
  limitingMagnitude: number;
  /** Catalog magnitude plus atmospheric extinction. */
  extinctedMagnitude: number;
  /** Positive when brightness exceeds the approximate sky threshold, in magnitudes. */
  brightnessMargin: number;
  /** Geometric Sun altitude in radians used for the estimate. */
  sunAltitude: number;
};

/**
 * Rendering estimate of naked-eye detectability during twilight and darkness.
 * Angle arguments use radians. Default legacy model excludes daylight;
 * optional contrast model uses directional sky background and atmospheric transmission.
 */
export function getPlanetVisibility(
  magnitude: number,
  altitude: number,
  sunAltitude: number,
  sunSeparation: number,
  options: PlanetVisibilityOptions = {}
): PlanetVisibility {
  const {
    darkSkyLimitingMagnitude = 6,
    extinction = 0.2,
    minimumAltitude = (5 * Math.PI) / 180,
    minimumSunSeparation = (10 * Math.PI) / 180
  } = options;
  validateRange('Magnitude', magnitude, -30, 30);
  validateRange('Altitude', altitude, -Math.PI / 2, Math.PI / 2);
  validateRange('Sun altitude', sunAltitude, -Math.PI / 2, Math.PI / 2);
  validateRange('Sun separation', sunSeparation, 0, Math.PI);
  validateRange('Dark sky limiting magnitude', darkSkyLimitingMagnitude, -10, 15);
  validateRange('Extinction', extinction, 0, 5);
  validateRange('Minimum altitude', minimumAltitude, 0, Math.PI / 2);
  validateRange('Minimum Sun separation', minimumSunSeparation, 0, Math.PI);
  const degrees = 180 / Math.PI;
  const elevation = Math.max(0, altitude);
  const airMass =
    1 / (Math.sin(elevation) + 0.50572 * Math.pow(elevation * degrees + 6.07995, -1.6364));
  if (options.model !== undefined && options.model !== 'legacy' && options.model !== 'contrast')
    throw new RangeError('Unknown visibility model');
  const contrastModel = options.model === 'contrast';
  const observerFactor = options.observerFactor ?? 2;
  validateRange('Observer factor', observerFactor, 1, 100);
  validateRange(
    'Additional sky luminance',
    options.additionalSkyLuminance ?? 0,
    0,
    Number.MAX_VALUE
  );
  const extinctedMagnitude = contrastModel
    ? magnitude -
      2.5 * Math.log10(Math.max(1e-30, getSkyTransmission(altitude, options.atmosphere)))
    : magnitude + extinction * airMass;
  // Original illustrative anchors, not a fit to the cited visibility paper:
  // Sun 0/-6/-12/-18 degrees -> limiting magnitude -4/1/4.5/6.
  const sunDegrees = sunAltitude * degrees;
  let twilightLimit: number;
  if (sunDegrees >= -6) twilightLimit = -4 - (sunDegrees * 5) / 6;
  else if (sunDegrees >= -12) twilightLimit = 1 + ((-sunDegrees - 6) * 3.5) / 6;
  else if (sunDegrees >= -18)
    twilightLimit = 4.5 + ((-sunDegrees - 12) * (darkSkyLimitingMagnitude - 4.5)) / 6;
  else twilightLimit = darkSkyLimitingMagnitude;
  // Crumey (2014), point-source Blackwell threshold. Original implementation:
  // https://arxiv.org/abs/1405.4209 ; illuminance-to-magnitude zero point -13.99.
  const background = Math.max(
    1e-5,
    getSkyLuminance(sunAltitude, altitude, sunSeparation, options.atmosphere) +
      (options.additionalSkyLuminance ?? 0)
  );
  const threshold =
    background <= 0.0708
      ? Math.pow(6.505e-4 * background ** 0.25 - 8.461e-4 * background ** 0.5, 2)
      : Math.pow(1.772e-4 * background ** 0.25 + 7.167e-5 * background ** 0.5, 2);
  const limitingMagnitude = Math.min(
    darkSkyLimitingMagnitude,
    contrastModel ? -2.5 * Math.log10(threshold * observerFactor) - 13.99 : twilightLimit
  );
  const brightnessMargin = limitingMagnitude - extinctedMagnitude;
  const eligible =
    (contrastModel || sunAltitude < 0) &&
    altitude >= minimumAltitude &&
    sunSeparation >= minimumSunSeparation;
  const fade =
    !contrastModel && sunAltitude >= 0
      ? 0
      : smoothstep(-0.5, 0.5, brightnessMargin) *
        smoothstep(minimumAltitude - Math.PI / 180, minimumAltitude + Math.PI / 180, altitude) *
        smoothstep(
          minimumSunSeparation - (2 * Math.PI) / 180,
          minimumSunSeparation + (2 * Math.PI) / 180,
          sunSeparation
        ) *
        (contrastModel ? 1 : smoothstep(0, Math.PI / 360, -sunAltitude));
  return {
    visible: eligible && brightnessMargin >= 0,
    fade,
    limitingMagnitude,
    extinctedMagnitude,
    brightnessMargin,
    sunAltitude
  };
}

function smoothstep(minimum: number, maximum: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
  return t * t * (3 - 2 * t);
}
