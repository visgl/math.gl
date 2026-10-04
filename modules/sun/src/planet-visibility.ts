// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original, uncalibrated twilight visibility heuristic; no reference code copied.
// Air mass: Kasten & Young (1989), https://doi.org/10.1364/AO.28.004735
// Visibility context only (not a reproduction of its model): Tousey & Koomen (1953),
// https://doi.org/10.1364/JOSA.43.000177
import {validateRange} from './celestial';

export type PlanetVisibilityOptions = {
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
 * Angle arguments use radians. No daylight detection, lunar glare or cloud model.
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
  const extinctedMagnitude = magnitude + extinction * airMass;
  // Original illustrative anchors, not a fit to the cited visibility paper:
  // Sun 0/-6/-12/-18 degrees -> limiting magnitude -4/1/4.5/6.
  const sunDegrees = sunAltitude * degrees;
  let twilightLimit: number;
  if (sunDegrees >= -6) twilightLimit = -4 - (sunDegrees * 5) / 6;
  else if (sunDegrees >= -12) twilightLimit = 1 + ((-sunDegrees - 6) * 3.5) / 6;
  else if (sunDegrees >= -18)
    twilightLimit = 4.5 + ((-sunDegrees - 12) * (darkSkyLimitingMagnitude - 4.5)) / 6;
  else twilightLimit = darkSkyLimitingMagnitude;
  const limitingMagnitude = Math.min(darkSkyLimitingMagnitude, twilightLimit);
  const brightnessMargin = limitingMagnitude - extinctedMagnitude;
  const eligible =
    sunAltitude < 0 && altitude >= minimumAltitude && sunSeparation >= minimumSunSeparation;
  const fade =
    sunAltitude >= 0
      ? 0
      : smoothstep(-0.5, 0.5, brightnessMargin) *
        smoothstep(minimumAltitude - Math.PI / 180, minimumAltitude + Math.PI / 180, altitude) *
        smoothstep(
          minimumSunSeparation - (2 * Math.PI) / 180,
          minimumSunSeparation + (2 * Math.PI) / 180,
          sunSeparation
        ) *
        smoothstep(0, Math.PI / 360, -sunAltitude);
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
