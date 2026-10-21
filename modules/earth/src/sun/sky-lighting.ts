// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original photometric composition; derived solar data attribution in ../LICENSE-HOSEK-WILKIE.
import {getSunLight} from './sunlight';
import {getMoonLight} from './moonlight';
import {getMoonAppearance} from './moon-appearance';
import {createSkyAtmosphere, getSkyLuminance} from './sky-brightness';
import type {SkyAtmosphereOptions} from './sky-brightness';
import {SUNLIGHT_DATA} from './data/sunlight';
import {getScatteredMoonLuminance} from './moon-sky-brightness';

export type SkyLightingOptions = SkyAtmosphereOptions & {
  moonPhaseAngle: number;
  moonDistance?: number;
  moonSunSeparation: number;
};
/** Shared weather with explicit photometric units; diffuse twilight stays continuous. */
export function getSkyLighting(
  sunAltitude: number,
  moonAltitude: number,
  options: SkyLightingOptions
) {
  const atmosphere = createSkyAtmosphere(options);
  // Rendering mapping from aerosol optical depth to lookup turbidity, not Linke turbidity.
  const sunlight = getSunLight(sunAltitude, {
    turbidity: Math.min(10, 1 + 20 * atmosphere.aerosolOpticalDepth),
    cloudCover: atmosphere.cloudCover,
    cloudOpticalDepth: atmosphere.cloudOpticalDepth
  });
  const moonlight = getMoonLight(moonAltitude, {
    ...atmosphere,
    phaseAngle: options.moonPhaseAngle,
    distance: options.moonDistance
  });
  const appearance = getMoonAppearance(moonAltitude, sunAltitude, {
    ...atmosphere,
    phaseAngle: options.moonPhaseAngle,
    distance: options.moonDistance,
    sunSeparation: options.moonSunSeparation
  });
  const reference = Math.max(...SUNLIGHT_DATA[0][90].slice(0, 3));
  const directSunIlluminance =
    sunlight.intensity *
    reference *
    683 *
    (0.2126 * sunlight.color[0] + 0.7152 * sunlight.color[1] + 0.0722 * sunlight.color[2]);
  // Hemisphere integral of directional luminance with projected solid angle.
  // Sun is on azimuth zero by rotational symmetry; midpoint quadrature in sin(alt).
  let diffuseSkyIlluminance = 0;
  let diffuseMoonIlluminance = 0;
  for (let i = 0; i < 8; i++) {
    const u = (i + 0.5) / 8;
    const altitude = Math.asin(u);
    for (let j = 0; j < 16; j++) {
      const azimuth = ((j + 0.5) * 2 * Math.PI) / 16;
      const separation = Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            u * Math.sin(sunAltitude) +
              Math.cos(altitude) * Math.cos(sunAltitude) * Math.cos(azimuth)
          )
        )
      );
      diffuseSkyIlluminance +=
        (getSkyLuminance(sunAltitude, altitude, separation, atmosphere) * u * 2 * Math.PI) / 128;
      const moonSeparation = Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            u * Math.sin(moonAltitude) +
              Math.cos(altitude) * Math.cos(moonAltitude) * Math.cos(azimuth)
          )
        )
      );
      // Lunar integral is rotationally symmetric and can use azimuth zero
      // independently of the solar integral; no Sun/Moon angle reconstruction.
      diffuseMoonIlluminance +=
        (getScatteredMoonLuminance(options.moonPhaseAngle, moonAltitude, altitude, moonSeparation, {
          ...atmosphere,
          distance: options.moonDistance
        }) *
          u *
          2 *
          Math.PI) /
        128;
    }
  }
  const twilightColor = [0.65, 0.75, 1];
  const daylight = Math.max(0, Math.min(1, ((sunAltitude * 180) / Math.PI + 5) / 5));
  const diffuseSkyColor = twilightColor.map(
    (value, i) =>
      ((1 - daylight) * value + daylight * sunlight.diffuse.color[i]) *
        (1 - atmosphere.cloudCover) +
      atmosphere.cloudCover
  ) as [number, number, number];
  const peak = Math.max(...diffuseSkyColor);
  return {
    sun: {
      ...sunlight,
      illuminance: directSunIlluminance,
      horizontalIlluminance: directSunIlluminance * Math.max(0, Math.sin(sunAltitude))
    },
    moon: {
      ...moonlight,
      illuminance: appearance.illuminance,
      horizontalIlluminance: appearance.horizontalIlluminance
    },
    diffuseSkyIlluminance: diffuseSkyIlluminance + diffuseMoonIlluminance,
    diffuseMoonIlluminance,
    // RGB tint is an illustrative rendering approximation, separate from V-band photometry.
    diffuseSkyColor: diffuseSkyColor.map(value => value / peak) as [number, number, number],
    photometricUnits: 'lux' as const
  };
}
