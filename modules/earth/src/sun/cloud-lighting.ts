// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original equations-based implementation; no reference code copied.
// Spherical exponential atmosphere and Beer-Lambert extinction: Bruneton & Neyret (2008),
// https://ebruneton.github.io/precomputed_atmospheric_scattering/
// Spectral Rayleigh/Angstrom approximation: Preetham et al. (1999),
// https://doi.org/10.1145/311535.311545
// Henyey-Greenstein phase function: https://www.pbr-book.org/3ed-2018/Volume_Scattering/Phase_Functions
import {getCloudSunSpectrum} from './cloud-spectral';
import {validateRange} from './celestial';
import {createSkyAtmosphere, getSkyLuminance} from './sky-brightness';
import {getSunLight} from './sunlight';
import type {SkyAtmosphereOptions} from './sky-brightness';
import type {LightColor} from './sunlight';

export type CloudLightingOptions = SkyAtmosphereOptions & {
  /** Cloud sample altitude above mean sea level, meters, [0, 50000]. Default 2000. */
  cloudAltitude?: number;
  /** Aerosol wavelength exponent, [0, 4]. Default 1.3. */
  angstromExponent?: number;
  /** Optical depth of the cloud segment being rendered. Default 10, inherited from atmosphere. */
  cloudOpticalDepth?: number;
  /** Other clouds/material between this sample and the Sun, along the actual ray. Default 0. */
  sunOpticalDepth?: number;
  /** Cloud material between this sample and the viewer, along the actual ray. Default 0. */
  viewOpticalDepth?: number;
  /** Angle between Sun and cloud sightlines, radians [0, PI]. Default PI/2. */
  sunSeparation?: number;
  /** Henyey-Greenstein asymmetry, [-0.95, 0.95]. Default 0.7 (forward scattering). */
  asymmetry?: number;
  /** Fraction of cloud extinction due to scattering, [0, 1]. Default 0.999. */
  singleScatteringAlbedo?: number;
  /** Even Simpson quadrature steps, [32, 2048]. Default 512. */
  integrationSteps?: number;
};

export type CloudLighting = {
  /** Relative incident beam irradiance: unattenuated 5778 K solar peak is one. */
  direct: LightColor;
  /** Approximate incident hemispherical sky irradiance on the same relative scale. */
  diffuse: LightColor;
  /** Approximate single-scattered radiance, relative irradiance per steradian; not lux. */
  scattered: LightColor;
  /** Fraction of the geometric solar disk above the cloud's depressed Earth horizon. */
  sunVisibleFraction: number;
  /** Earth horizon below the cloud's local horizontal plane, radians. */
  horizonAltitude: number;
  /** Exponential density columns divided by their sea-level vertical scale heights. */
  rayleighAirMass: number;
  aerosolAirMass: number;
  /** Henyey-Greenstein value in inverse steradians. Can exceed one. */
  phaseFunction: number;
  /** Extinction opacity of the rendered cloud segment; distinct from coverage. */
  opacity: number;
};
const EARTH_RADIUS = 6371000;
const ATMOSPHERE_TOP = 100000;
const RAYLEIGH_HEIGHT = 8000;
const AEROSOL_HEIGHT = 1200;
const SUN_RADIUS = (0.266 * Math.PI) / 180;
// Approximate clear zenith solar illuminance used only to scale ambient photometry.
const REFERENCE_ILLUMINANCE = 110000;

/**
 * Cloud-sample lighting from geometric Sun altitude relative to its local horizontal.
 * Cloud height is MSL, not height above the viewer. Refraction and ozone are omitted.
 * Direct extinction uses a spherical spectral atmosphere; ambient and cloud scattering
 * are rendering approximations, not a volumetric multiple-scattering solution.
 */
export function getCloudLighting(
  sunAltitude: number,
  options: CloudLightingOptions = {}
): CloudLighting {
  validateRange('Sun altitude', sunAltitude, -Math.PI / 2, Math.PI / 2);
  const atmosphere = createSkyAtmosphere(options);
  const {
    cloudAltitude = 2000,
    angstromExponent = 1.3,
    sunOpticalDepth = 0,
    viewOpticalDepth = 0,
    sunSeparation = Math.PI / 2,
    asymmetry = 0.7,
    singleScatteringAlbedo = 0.999,
    integrationSteps = 512
  } = options;
  validateRange('Cloud altitude', cloudAltitude, 0, 50000);
  validateRange('Angstrom exponent', angstromExponent, 0, 4);
  validateRange('Sun optical depth', sunOpticalDepth, 0, 1000);
  validateRange('View optical depth', viewOpticalDepth, 0, 1000);
  validateRange('Sun separation', sunSeparation, 0, Math.PI);
  validateRange('Asymmetry', asymmetry, -0.95, 0.95);
  validateRange('Single-scattering albedo', singleScatteringAlbedo, 0, 1);
  validateRange('Integration steps', integrationSteps, 32, 2048);
  if (!Number.isInteger(integrationSteps) || integrationSteps % 2)
    throw new RangeError('Integration steps must be an even integer');
  const radius = EARTH_RADIUS + cloudAltitude;
  const horizonAltitude = -Math.acos(EARTH_RADIUS / radius);
  const diskHeight =
    sunAltitude <= horizonAltitude - SUN_RADIUS
      ? -1
      : sunAltitude >= horizonAltitude + SUN_RADIUS
        ? 1
        : (sunAltitude - horizonAltitude) / SUN_RADIUS;
  const theta = Math.acos(-diskHeight);
  // Stable circular-segment area near the first sliver, where subtraction loses precision.
  const segmentArea =
    theta < 0.01
      ? theta ** 3 * (2 / 3 - (2 * theta ** 2) / 15 + (4 * theta ** 4) / 315)
      : theta - Math.sin(theta) * Math.cos(theta);
  const sunVisibleFraction = Math.max(0, Math.min(1, segmentArea / Math.PI));
  // A visible segment's vertical centroid supplies one representative atmospheric ray.
  const centroid = segmentArea > 0 ? ((2 / 3) * Math.sin(theta) ** 3) / segmentArea : 0;
  const rayAltitude = Math.max(horizonAltitude, sunAltitude + centroid * SUN_RADIUS);
  let rayleighAirMass = 0,
    aerosolAirMass = 0;
  const directRGB: [number, number, number] = [0, 0, 0];
  if (sunVisibleFraction > 0) {
    const mu = Math.sin(rayAltitude);
    const top = EARTH_RADIUS + ATMOSPHERE_TOP;
    const rayLength = -radius * mu + Math.sqrt((radius * mu) ** 2 + top * top - radius * radius);
    const step = rayLength / integrationSteps;
    for (let i = 0; i <= integrationSteps; i++) {
      const s = i * step;
      const radialSquared = radius * radius + 2 * radius * mu * s + s * s;
      const height = Math.max(
        0,
        (radialSquared - EARTH_RADIUS ** 2) / (Math.sqrt(radialSquared) + EARTH_RADIUS)
      );
      const weight = i === 0 || i === integrationSteps ? 1 : i % 2 ? 4 : 2;
      rayleighAirMass += weight * Math.exp(-height / RAYLEIGH_HEIGHT);
      aerosolAirMass += weight * Math.exp(-height / AEROSOL_HEIGHT);
    }
    rayleighAirMass *= step / (3 * RAYLEIGH_HEIGHT);
    aerosolAirMass *= step / (3 * AEROSOL_HEIGHT);
    const spectrum = getCloudSunSpectrum(
      rayleighAirMass,
      aerosolAirMass,
      atmosphere.pressure,
      atmosphere.aerosolOpticalDepth,
      angstromExponent
    );
    const transmission = sunVisibleFraction * Math.exp(-sunOpticalDepth);
    for (let channel = 0; channel < 3; channel++)
      directRGB[channel] = spectrum[channel] * transmission;
  }
  // Empirical ground-column sky brightness reused at the cloud's location. Height
  // correction for ambient multiple scattering is deliberately not inferred here.
  const skyLuminance = getSkyLuminance(
    sunAltitude,
    Math.PI / 2,
    Math.PI / 2 - sunAltitude,
    atmosphere
  );
  const skyIrradiance = (Math.PI * skyLuminance) / REFERENCE_ILLUMINANCE;
  const sky = getSunLight(Math.max(0, sunAltitude), {
    turbidity: Math.min(10, 1 + 20 * atmosphere.aerosolOpticalDepth)
  }).diffuse.color;
  const daylight = smoothstep((-5 * Math.PI) / 180, 0, sunAltitude);
  const diffuseRGB = [0.45, 0.65, 1].map((twilight, i) => {
    const tint =
      (twilight * (1 - daylight) + sky[i] * daylight) * (1 - atmosphere.cloudCover) +
      atmosphere.cloudCover;
    return skyIrradiance * tint;
  }) as [number, number, number];
  const phaseFunction =
    (1 - asymmetry * asymmetry) /
    (4 * Math.PI * (1 + asymmetry * asymmetry - 2 * asymmetry * Math.cos(sunSeparation)) ** 1.5);
  const opacity = -Math.expm1(-atmosphere.cloudOpticalDepth);
  const throughput = singleScatteringAlbedo * opacity * Math.exp(-viewOpticalDepth);
  // Ambient hemisphere replaced by an isotropic incident field, not HG integration.
  const scatteredRGB = directRGB.map(
    (value, i) => throughput * (value * phaseFunction + diffuseRGB[i] / (2 * Math.PI))
  ) as [number, number, number];
  return {
    direct: normalize(directRGB),
    diffuse: normalize(diffuseRGB),
    scattered: normalize(scatteredRGB),
    sunVisibleFraction,
    horizonAltitude,
    rayleighAirMass,
    aerosolAirMass,
    phaseFunction,
    opacity
  };
}
function normalize(rgb: [number, number, number]): LightColor {
  const intensity = Math.max(...rgb);
  return {
    color:
      intensity > 0 ? (rgb.map(value => value / intensity) as [number, number, number]) : [0, 0, 0],
    intensity
  };
}
function smoothstep(lower: number, upper: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - lower) / (upper - lower)));
  return t * t * (3 - 2 * t);
}
