// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * A profile source returns in-situ temperature (°C) and Practical Salinity at
 * depths in meters for one location, or null where it has no ocean data:
 * `getProfile(longitude, latitude) => {depths, temperature, practicalSalinity} | null`.
 */

/** The classic WOA standard depths that the WOA23 display preview keeps, in meters. */
export const STANDARD_DEPTHS = [
  0, 10, 20, 30, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1100,
  1200, 1300, 1400, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500
];

/**
 * Idealized, smooth profiles that depend on latitude only. They are not data:
 * a warm mixed layer and thermocline over cold deep water, which gives a deep
 * sound channel at low and middle latitudes and a surface minimum near the poles.
 */
export const syntheticProfileSource = {
  name: 'Synthetic idealized profile (not measured data)',
  getProfile(longitude, latitude) {
    const sin2 = Math.sin((latitude * Math.PI) / 180) ** 2;
    const surfaceTemperature = 28 - 29.5 * sin2;
    const deepTemperature = 2 - 3 * sin2;
    const surfaceSalinity = 35.5 - 1.5 * sin2;
    return {
      depths: STANDARD_DEPTHS,
      temperature: STANDARD_DEPTHS.map(
        z => deepTemperature + (surfaceTemperature - deepTemperature) * Math.exp(-z / 600)
      ),
      practicalSalinity: STANDARD_DEPTHS.map(
        z => 34.7 + (surfaceSalinity - 34.7) * Math.exp(-z / 400)
      )
    };
  }
};

/**
 * Profile source for the WOA23 display preview (`preview.bin.gz` after
 * decompression, and `preview-manifest.json`) that the deck.gl-data Earth
 * catalog describes. It returns the nearest preview cell and stops at the
 * first fill value.
 * @param {{latitudes: number[], longitudes: number[], depths: number[],
 *   temperature: {scale: number, fill: number}, salinity: {scale: number, fill: number}}} manifest
 * @param {ArrayBuffer} buffer
 */
export function createPreviewProfileSource(manifest, buffer) {
  const {latitudes, longitudes, depths} = manifest;
  const cells = latitudes.length * longitudes.length * depths.length;
  if (buffer.byteLength !== cells * 4) throw new Error('Unexpected WOA23 preview size');
  const temperatures = new Int16Array(buffer, 0, cells);
  const salinities = new Uint16Array(buffer, cells * 2, cells);
  const nearest = (values, value) =>
    values.reduce(
      (best, current, i) => (Math.abs(current - value) < Math.abs(values[best] - value) ? i : best),
      0
    );
  return {
    name: 'NOAA World Ocean Atlas 2023 annual climatology (display preview)',
    getProfile(longitude, latitude) {
      const offset =
        (nearest(latitudes, latitude) * longitudes.length + nearest(longitudes, longitude)) *
        depths.length;
      const profile = {depths: [], temperature: [], practicalSalinity: []};
      for (let level = 0; level < depths.length; level++) {
        const t = temperatures[offset + level],
          s = salinities[offset + level];
        if (t === manifest.temperature.fill || s === manifest.salinity.fill) break;
        profile.depths.push(depths[level]);
        profile.temperature.push(t * manifest.temperature.scale);
        profile.practicalSalinity.push(s * manifest.salinity.scale);
      }
      return profile.depths.length ? profile : null;
    }
  };
}
