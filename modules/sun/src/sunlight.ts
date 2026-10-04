// SPDX-License-Identifier: MIT
// Model/data reference: https://cgg.mff.cuni.cz/projects/SkylightModelling/
// Derived BSD-3-Clause data and notices: ./data/sunlight.ts and ../LICENSE-HOSEK-WILKIE.
import {SUNLIGHT_DATA} from './data/sunlight';

export type SunLightOptions = {
  /** Atmospheric turbidity, from 1 (clear) to 10 (hazy). Default 3. */
  turbidity?: number;
  /** Fractional cloud coverage in [0, 1]. Default 0. Represents averaged conditions. */
  cloudCover?: number;
  /** Vertical cloud optical depth, nonnegative. Default 10. */
  cloudOpticalDepth?: number;
};

export type LightColor = {
  /** Normalized linear sRGB, with maximum component 1 when illuminated. */
  color: [number, number, number];
  /** Relative peak-channel irradiance. Multiply by color to recover RGB irradiance. */
  intensity: number;
};

export type SunLight = LightColor & {
  /** Hemispherical diffuse irradiance on a horizontal surface, on the same relative scale. */
  diffuse: LightColor;
};

const SUN_RADIUS = (0.255 * Math.PI) / 180;
// Fixed reference: brightest channel of clear (turbidity 1), zenith direct sunlight.
const REFERENCE_IRRADIANCE = Math.max(...SUNLIGHT_DATA[0][90].slice(0, 3));

/**
 * Estimate direct sunlight and hemispherical diffuse skylight from altitude in radians.
 * Uses spectrally integrated Hošek-Wilkie 1.4a lookup data at sea level with black ground.
 * Clouds use a separate neutral, energy-bounded approximation, not the Hošek-Wilkie model.
 */
export function getSunLight(altitude: number, options: SunLightOptions = {}): SunLight {
  const {turbidity = 3, cloudCover = 0, cloudOpticalDepth = 10} = options;
  validateRange('Sun altitude', altitude, -Math.PI / 2, Math.PI / 2);
  validateRange('Turbidity', turbidity, 1, 10);
  validateRange('Cloud cover', cloudCover, 0, 1);
  validateRange('Cloud optical depth', cloudOpticalDepth, 0, Number.MAX_VALUE);
  if (altitude <= -SUN_RADIUS) {
    return {color: [0, 0, 0], intensity: 0, diffuse: {color: [0, 0, 0], intensity: 0}};
  }

  const elevation = Math.max(0, altitude);
  const degrees = (elevation * 180) / Math.PI;
  const altitudeIndex = Math.min(89, Math.floor(degrees));
  const altitudeFraction = degrees - altitudeIndex;
  const turbidityIndex = Math.min(8, Math.floor(turbidity) - 1);
  const turbidityFraction = turbidity - turbidityIndex - 1;
  const sample = (channel: number): number => {
    const lower = SUNLIGHT_DATA[turbidityIndex];
    const upper = SUNLIGHT_DATA[turbidityIndex + 1];
    const low = interpolate(
      lower[altitudeIndex][channel],
      lower[altitudeIndex + 1][channel],
      altitudeFraction
    );
    const high = interpolate(
      upper[altitudeIndex][channel],
      upper[altitudeIndex + 1][channel],
      altitudeFraction
    );
    return interpolate(low, high, turbidityFraction) / REFERENCE_IRRADIANCE;
  };

  // Uniform-disk horizon clipping. Limb darkening is included in the full-disk lookup,
  // but this partial-disk fade omits its spatial variation and atmospheric refraction.
  const diskHeight = Math.min(1, altitude / SUN_RADIUS);
  const visibility =
    (Math.acos(-diskHeight) + diskHeight * Math.sqrt(1 - diskHeight * diskHeight)) / Math.PI;
  const mu = Math.sin(elevation);
  // Beer-Lambert transmission of the covered fraction. The path is bounded near the
  // horizon because this simple plane-parallel cloud layer cannot model curved geometry.
  const cloudTransmission = Math.exp(-cloudOpticalDepth / Math.max(0.05, mu));
  const directTransmission = 1 - cloudCover + cloudCover * cloudTransmission;
  // Heuristic transmission of redistributed light through the cloud layer, including
  // loss upward. This is not a fitted weather model. It never creates incident energy.
  const diffuseTransmission = 1 / (1 + 0.12 * cloudOpticalDepth);
  const direct: [number, number, number] = [0, 0, 0];
  const diffuse: [number, number, number] = [0, 0, 0];
  for (let channel = 0; channel < 3; channel++) {
    const beam = sample(channel) * visibility;
    const sky = sample(channel + 3) * visibility;
    direct[channel] = beam * directTransmission;
    diffuse[channel] =
      (1 - cloudCover) * sky +
      cloudCover * diffuseTransmission * (sky + beam * mu * (1 - cloudTransmission));
  }
  return {...normalize(direct), diffuse: normalize(diffuse)};
}

function interpolate(a: number, b: number, fraction: number): number {
  return a + (b - a) * fraction;
}

function normalize(rgb: [number, number, number]): LightColor {
  const intensity = Math.max(...rgb);
  return {
    color: intensity > 0 ? [rgb[0] / intensity, rgb[1] / intensity, rgb[2] / intensity] : [0, 0, 0],
    intensity
  };
}

function validateRange(name: string, value: number, minimum: number, maximum: number): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be finite and between ${minimum} and ${maximum}`);
  }
}
