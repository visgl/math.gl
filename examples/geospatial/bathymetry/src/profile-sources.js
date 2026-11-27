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
  /** Idealized profile at a latitude; the longitude has no effect. */
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
  /** Index of the axis value nearest to `value`; `period` wraps longitudes. */
  const nearest = (values, value, period = Infinity) => {
    /** Distance to `value`, the short way around for a periodic axis. */
    const distance = other => {
      const d = Math.abs(other - value) % period;
      return Math.min(d, period - d);
    };
    return values.reduce(
      (best, current, i) => (distance(current) < distance(values[best]) ? i : best),
      0
    );
  };
  return {
    name: 'NOAA NCEI World Ocean Atlas 2023, annual 1° climatology, 1955–2022 (Locarnini et al. 2023; Reagan et al. 2023); 2° display preview',
    /** Profile of the nearest preview cell, or null where the cell has no data at the surface. */
    getProfile(longitude, latitude) {
      const offset =
        (nearest(latitudes, latitude) * longitudes.length + nearest(longitudes, longitude, 360)) *
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

/** WOA23 display preview in the deck.gl-data Earth catalog, pinned to its dataset commit.
 * The Git LFS preview uses the media endpoint; the JSON manifest uses the raw endpoint. */
/** deck.gl-data dataset commit that holds the WOA23 preview. */
const WOA23_COMMIT = 'ddd9edb07c99282cc4c142706f804e2208a0bfe0';
/** Folder of the WOA23 assets in deck.gl-data. */
const WOA23_PATH = 'earth/oceanography/v1/woa23';
/** Pinned URL of the gzip preview (Git LFS, media endpoint). */
export const WOA23_PREVIEW_URL = `https://media.githubusercontent.com/media/visgl/deck.gl-data/${WOA23_COMMIT}/${WOA23_PATH}/preview.bin.gz`;
/** Pinned URL of the preview manifest (raw endpoint). */
export const WOA23_MANIFEST_URL = `https://raw.githubusercontent.com/visgl/deck.gl-data/${WOA23_COMMIT}/${WOA23_PATH}/preview-manifest.json`;

/** Load the WOA23 preview (598 KB gzip) and return its profile source. */
export async function loadWoa23ProfileSource({
  manifestUrl = WOA23_MANIFEST_URL,
  previewUrl = WOA23_PREVIEW_URL,
  signal
} = {}) {
  /** Fetch one asset and fail on an HTTP error status. */
  const get = async url => {
    const response = await fetch(url, {signal});
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url.split('/').at(-1)}`);
    return response;
  };
  const [manifest, compressed] = await Promise.all([
    get(manifestUrl).then(response => response.json()),
    get(previewUrl)
  ]);
  const buffer = await new Response(
    compressed.body.pipeThrough(new DecompressionStream('gzip'))
  ).arrayBuffer();
  return createPreviewProfileSource(manifest, buffer);
}
