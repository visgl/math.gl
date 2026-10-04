// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented equations, not copied reference code:
// Krisciunas & Schaefer (1991), Equation 9: https://doi.org/10.1086/132921
// Kasten & Young (1989): https://doi.org/10.1364/AO.28.004735
import {validateRange} from './celestial';

export type MoonLightOptions = {
  /** Lunar phase angle in radians: 0 full, PI new. Default 0. */
  phaseAngle?: number;
  /** Observer-to-Moon distance in kilometers. Default 384400. Must be at least the lunar radius. */
  distance?: number;
  /** Aerosol optical depth at 550 nm. Default 0.1. */
  aerosolOpticalDepth?: number;
  /** Averaged cloud coverage in [0, 1]. Default 0. */
  cloudCover?: number;
  /** Vertical cloud optical depth, nonnegative. Default 10. */
  cloudOpticalDepth?: number;
};

export type MoonLight = {
  /** Normalized linear RGB, not gamma-encoded. */
  color: [number, number, number];
  /** Relative to unattenuated full moon at 384400 km; not the sunlight intensity scale. */
  intensity: number;
};

/** Direct moonlight approximation: phase law, distance, atmospheric extinction and clouds. */
export function getMoonLight(altitude: number, options: MoonLightOptions = {}): MoonLight {
  const {
    phaseAngle = 0,
    distance = 384400,
    aerosolOpticalDepth = 0.1,
    cloudCover = 0,
    cloudOpticalDepth = 10
  } = options;
  validateRange('Moon altitude', altitude, -Math.PI / 2, Math.PI / 2);
  validateRange('Phase angle', phaseAngle, 0, Math.PI);
  validateRange('Moon distance', distance, 1737.4, Number.MAX_VALUE);
  validateRange('Aerosol optical depth', aerosolOpticalDepth, 0, Number.MAX_VALUE);
  validateRange('Cloud cover', cloudCover, 0, 1);
  validateRange('Cloud optical depth', cloudOpticalDepth, 0, Number.MAX_VALUE);
  const radius = Math.asin(1737.4 / distance);
  if (altitude <= -radius || phaseAngle === Math.PI) return {color: [0, 0, 0], intensity: 0};
  const phaseDegrees = (phaseAngle * 180) / Math.PI;
  const magnitudeDifference = 0.026 * phaseDegrees + 4e-9 * Math.pow(phaseDegrees, 4);
  // The empirical phase law is unreliable at extreme crescents. Cap by illuminated area
  // to give a continuous zero at new moon; this cap is an additional rendering approximation.
  const phaseBrightness = Math.min(
    Math.pow(10, -0.4 * magnitudeDifference),
    (1 + Math.cos(phaseAngle)) / 2
  );
  const elevation = Math.max(0, altitude);
  const airMass =
    1 / (Math.sin(elevation) + 0.50572 * Math.pow((elevation * 180) / Math.PI + 6.07995, -1.6364));
  const diskHeight = Math.min(1, altitude / radius);
  const visibility =
    (Math.acos(-diskHeight) + diskHeight * Math.sqrt(1 - diskHeight * diskHeight)) / Math.PI;
  const cloudTransmission =
    1 -
    cloudCover +
    cloudCover * Math.exp(-cloudOpticalDepth / Math.max(0.05, Math.sin(elevation)));
  const scale = phaseBrightness * Math.pow(384400 / distance, 2) * visibility * cloudTransmission;
  // Neutral extraterrestrial moonlight, three representative wavelengths in micrometers.
  // Atmospheric warming is approximate; lunar reflectance and scotopic perception are omitted.
  const channels = [0.68, 0.55, 0.44].map(
    wavelength =>
      scale *
      Math.exp(
        -airMass *
          (0.008735 * Math.pow(wavelength, -4.08) +
            aerosolOpticalDepth * Math.pow(wavelength / 0.55, -1.3))
      )
  );
  const intensity = Math.max(...channels);
  return {
    color:
      intensity > 0
        ? [channels[0] / intensity, channels[1] / intensity, channels[2] / intensity]
        : [0, 0, 0],
    intensity
  };
}
