// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  getAbsoluteSalinity,
  getConservativeTemperature,
  getSeaPressureFromHeight,
  getSeawaterSoundSpeed,
  getSoundAbsorptionFrancoisGarrison
} from '@math.gl/earth/ocean';
import {geographicLatitude, mapLatitude, normalizeLongitude} from './refinement.js';

/** Radius of the sea-level sphere in display units; `mesh.js` uses the same globe radius. */
const SEA_LEVEL_RADIUS = 180;

/**
 * Geographic point where the view ray through a pixel meets sea level.
 * Works on the globe (morph 0) and on the flat map (morph 1); returns null
 * between them, when the ray misses the globe, or outside the rendered map
 * (Mercator stops at ±85.051129°).
 * @param {import('@deck.gl/core').Viewport} viewport
 * @param {number} x Pixel x.
 * @param {number} y Pixel y.
 * @param {number} morph Globe → map morph, 0 to 1.
 * @param {'equirectangular' | 'mercator'} projection Flat map projection.
 * @returns {{longitude: number, latitude: number} | null}
 */
export function pickSeaLevelPoint(viewport, x, y, morph, projection) {
  if (morph !== 0 && morph !== 1) return null;
  const near = viewport.unproject([x, y, 0]);
  const far = viewport.unproject([x, y, 1]);
  const direction = far.map((value, i) => value - near[i]);
  const camera = viewport.cameraPosition;
  /** Of the ray points at the parameters `candidates`, the one nearest to the camera. */
  const closest = candidates => {
    const points = candidates.map(t => near.map((value, i) => value + t * direction[i]));
    const distance = point => Math.hypot(...point.map((value, i) => value - camera[i]));
    return points.sort((a, b) => distance(a) - distance(b))[0];
  };
  if (morph === 1) {
    if (Math.abs(direction[1]) < 1e-12) return null;
    const [longitude, , ordinate] = closest([(-SEA_LEVEL_RADIUS - near[1]) / direction[1]]);
    // mapLatitude clamps Mercator to the rendered ±85.051129° edge.
    if (Math.abs(longitude) > 180 || Math.abs(ordinate) > mapLatitude(90, projection)) return null;
    return {longitude, latitude: geographicLatitude(ordinate, projection)};
  }
  const a = direction.reduce((sum, value) => sum + value * value, 0);
  const b = 2 * direction.reduce((sum, value, i) => sum + value * near[i], 0);
  const c = near.reduce((sum, value) => sum + value * value, 0) - SEA_LEVEL_RADIUS ** 2;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const root = Math.sqrt(discriminant);
  const [px, py, pz] = closest([(-b - root) / (2 * a), (-b + root) / (2 * a)]);
  return {
    longitude: normalizeLongitude((Math.atan2(px, -py) * 180) / Math.PI),
    latitude: (Math.asin(Math.max(-1, Math.min(1, pz / SEA_LEVEL_RADIUS))) * 180) / Math.PI
  };
}

/** Bilinear ETOPO1 height in meters; rows run south to north, columns west to east. */
export function sampleHeight(heights, longitude, latitude, width = 721, height = 361) {
  const x = ((normalizeLongitude(longitude) + 180) / 360) * (width - 1);
  const y = ((Math.max(-90, Math.min(90, latitude)) + 90) / 180) * (height - 1);
  const x0 = Math.min(width - 2, Math.floor(x)),
    y0 = Math.min(height - 2, Math.floor(y));
  const fx = x - x0,
    fy = y - y0;
  /** Grid height at offset (i, j) from the lower-left node of the cell. */
  const at = (i, j) => heights[(y0 + j) * width + x0 + i];
  return (
    (1 - fy) * ((1 - fx) * at(0, 0) + fx * at(1, 0)) + fy * ((1 - fx) * at(0, 1) + fx * at(1, 1))
  );
}

/**
 * Temperature (°C), Practical Salinity and depth (m) domain of
 * `getSoundAbsorptionFrancoisGarrison`, from its TSDoc. The TEOS-10 sound-speed chain accepts
 * wider values, for example the salinity above 40 of the Red Sea and the Persian Gulf.
 * A test pins these bounds against the function.
 */
export const FRANCOIS_GARRISON_DOMAIN = {
  temperature: [-2, 30],
  salinity: [0, 40],
  depth: [0, 10000]
};

/** True when a level is inside {@link FRANCOIS_GARRISON_DOMAIN}. */
export function isInAbsorptionDomain(level) {
  return Object.entries(FRANCOIS_GARRISON_DOMAIN).every(
    ([name, [min, max]]) => level[name] >= min && level[name] <= max
  );
}

/**
 * Sound speed and absorption from the sea surface to the seafloor.
 * A level outside {@link FRANCOIS_GARRISON_DOMAIN} keeps its sound speed and has
 * `absorption: null`. The vertical loss sums only the intervals with absorption at both ends,
 * so it is partial when a level has no absorption, and null when no interval has it.
 * @param {{depths: number[], temperature: number[], practicalSalinity: number[]}} profile
 *   In-situ temperature (°C, ITS-90) and Practical Salinity at depths in meters.
 * @param {{latitude: number, seafloorDepth: number, frequency: number}} options
 *   Seafloor depth is positive down, in meters; frequency is in Hz.
 */
export function computeSoundProfile(profile, {latitude, seafloorDepth, frequency}) {
  const {depths, temperature, practicalSalinity} = profile;
  const deepest = Math.min(seafloorDepth, depths.at(-1));
  const samples = [];
  for (let i = 0; i < depths.length && depths[i] <= deepest; i++)
    samples.push([depths[i], temperature[i], practicalSalinity[i]]);
  if (samples.length && samples.at(-1)[0] < deepest) {
    const i = samples.length;
    const t = (deepest - depths[i - 1]) / (depths[i] - depths[i - 1]);
    /** Linear interpolation of a profile variable at the seafloor depth. */
    const mix = values => values[i - 1] + t * (values[i] - values[i - 1]);
    samples.push([deepest, mix(temperature), mix(practicalSalinity)]);
  }
  const levels = samples.map(([depth, insituTemperature, salinity]) => {
    const seaPressure = getSeaPressureFromHeight(-depth, latitude);
    const absoluteSalinity = getAbsoluteSalinity(salinity);
    const conservativeTemperature = getConservativeTemperature(
      absoluteSalinity,
      insituTemperature,
      seaPressure
    );
    return {
      depth,
      seaPressure,
      soundSpeed: getSeawaterSoundSpeed(absoluteSalinity, conservativeTemperature, seaPressure),
      absorption: isInAbsorptionDomain({temperature: insituTemperature, salinity, depth})
        ? getSoundAbsorptionFrancoisGarrison({
            frequency,
            temperature: insituTemperature,
            salinity,
            depth
          })
        : null
    };
  });
  const minimum = levels.reduce((best, level) =>
    level.soundSpeed < best.soundSpeed ? level : best
  );
  // One-way vertical absorption loss, trapezoidal over depth (dB/km × km).
  let verticalLoss = 0;
  let intervals = 0;
  for (let i = 1; i < levels.length; i++) {
    const [upper, lower] = [levels[i - 1].absorption, levels[i].absorption];
    if (upper === null || lower === null) continue;
    verticalLoss += ((upper + lower) / 2) * ((levels[i].depth - levels[i - 1].depth) / 1000);
    intervals++;
  }
  const levelsWithoutAbsorption = levels.filter(level => level.absorption === null).length;
  if (levelsWithoutAbsorption && !intervals) verticalLoss = null;
  return {
    levels,
    minimum,
    verticalLoss,
    levelsWithoutAbsorption,
    truncated: seafloorDepth > depths.at(-1)
  };
}
