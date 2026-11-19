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
import {geographicLatitude, normalizeLongitude} from './refinement.js';

const SEA_LEVEL_RADIUS = 180;

/**
 * Geographic point where the view ray through a pixel meets sea level.
 * Works on the globe (morph 0) and on the flat map (morph 1); returns null
 * between them, or when the ray misses the globe.
 */
export function pickSeaLevelPoint(viewport, x, y, morph, projection) {
  if (morph !== 0 && morph !== 1) return null;
  const near = viewport.unproject([x, y, 0]);
  const far = viewport.unproject([x, y, 1]);
  const direction = far.map((value, i) => value - near[i]);
  const camera = viewport.cameraPosition;
  const closest = candidates => {
    const points = candidates.map(t => near.map((value, i) => value + t * direction[i]));
    const distance = point => Math.hypot(...point.map((value, i) => value - camera[i]));
    return points.sort((a, b) => distance(a) - distance(b))[0];
  };
  if (morph === 1) {
    if (Math.abs(direction[1]) < 1e-12) return null;
    const [longitude, , ordinate] = closest([(-SEA_LEVEL_RADIUS - near[1]) / direction[1]]);
    const latitude = geographicLatitude(ordinate, projection);
    if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) return null;
    return {longitude, latitude};
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
  const at = (i, j) => heights[(y0 + j) * width + x0 + i];
  return (
    (1 - fy) * ((1 - fx) * at(0, 0) + fx * at(1, 0)) + fy * ((1 - fx) * at(0, 1) + fx * at(1, 1))
  );
}

/**
 * Sound speed and absorption from the sea surface to the seafloor.
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
      absorption: getSoundAbsorptionFrancoisGarrison({
        frequency,
        temperature: insituTemperature,
        salinity,
        depth
      })
    };
  });
  const minimum = levels.reduce((best, level) =>
    level.soundSpeed < best.soundSpeed ? level : best
  );
  // One-way vertical absorption loss, trapezoidal over depth (dB/km × km).
  let verticalLoss = 0;
  for (let i = 1; i < levels.length; i++)
    verticalLoss +=
      ((levels[i].absorption + levels[i - 1].absorption) / 2) *
      ((levels[i].depth - levels[i - 1].depth) / 1000);
  return {levels, minimum, verticalLoss, truncated: seafloorDepth > depths.at(-1)};
}
