// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Keep orbit turns and flat-map focus in the same longitude domain. */
export function normalizeLongitude(longitude) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

/** Select a bounded 481-square region; finer zooms request finer source tiles. */
export function selectRefinement(longitude, latitude, zoom) {
  if (zoom < 1.5) return null;
  const level = Math.min(2, Math.max(0, Math.floor(zoom - 1.5)));
  const span = 80 / 2 ** level;
  const lon = normalizeLongitude(longitude);
  const west = Math.max(-180, Math.min(180 - span, Math.round((lon - span / 2) * 2) / 2));
  const south = Math.max(-80, Math.min(80 - span, Math.round((latitude - span / 2) * 2) / 2));
  return {
    bounds: [west, south, west + span, south + span],
    zoom: 4 + level,
    size: 481,
    key: `${west}/${south}/${level}`
  };
}

/** Terrarium RGB stores signed meters, including bathymetry. */
export function decodeTerrarium(r, g, b) {
  return r * 256 + g + b / 256 - 32768;
}

function tilePoint(lon, lat, zoom) {
  const n = 2 ** zoom;
  return [
    ((lon + 180) / 360) * n,
    ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  ];
}

/** Bounded image cache, scoped to a mounted example, using the public AWS Terrain Tiles service. */
export function createRefinementSource() {
  const cache = new Map();
  async function getTile(x, y, z, signal) {
    signal.throwIfAborted();
    const n = 2 ** z;
    x = ((x % n) + n) % n;
    y = Math.max(0, Math.min(n - 1, y));
    const key = `${z}/${x}/${y}`;
    if (cache.has(key)) {
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    const response = await fetch(
      `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${key}.png`,
      {signal}
    );
    if (!response.ok) throw new Error(`Elevation tile HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob());
    try {
      signal.throwIfAborted();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const context = canvas.getContext('2d', {willReadFrequently: true});
      context.drawImage(bitmap, 0, 0);
      const rgba = context.getImageData(0, 0, 256, 256).data;
      const values = new Float32Array(256 * 256);
      for (let i = 0; i < values.length; i++)
        values[i] = decodeTerrarium(rgba[4 * i], rgba[4 * i + 1], rgba[4 * i + 2]);
      cache.set(key, values);
      if (cache.size > 64) cache.delete(cache.keys().next().value);
      return values;
    } finally {
      bitmap.close();
    }
  }
  return async (request, signal) => {
    const {
      bounds: [west, south, east, north],
      zoom,
      size
    } = request;
    const a = tilePoint(west, north, zoom),
      b = tilePoint(east, south, zoom);
    const tiles = new Map(),
      jobs = [];
    // Include one-pixel halo for bilinear sampling across tile edges.
    for (let y = Math.floor(a[1] - 1 / 256); y <= Math.floor(b[1] + 1 / 256); y++)
      for (let x = Math.floor(a[0] - 1 / 256); x <= Math.floor(b[0] + 1 / 256); x++)
        jobs.push([x, y]);
    let cursor = 0;
    await Promise.all(
      Array.from({length: Math.min(4, jobs.length)}, async () => {
        while (cursor < jobs.length) {
          const [x, y] = jobs[cursor++];
          tiles.set(`${x}/${y}`, await getTile(x, y, zoom, signal));
        }
      })
    );
    const sample = (px, py) => {
      const x = Math.floor(px / 256),
        y = Math.floor(py / 256);
      return tiles.get(`${x}/${y}`)[(((py % 256) + 256) % 256) * 256 + (((px % 256) + 256) % 256)];
    };
    signal.throwIfAborted();
    const heights = new Float32Array(size * size);
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++) {
        const [tx, ty] = tilePoint(
          west + (col * (east - west)) / (size - 1),
          south + (row * (north - south)) / (size - 1),
          zoom
        );
        const px = tx * 256 - 0.5,
          py = ty * 256 - 0.5,
          x = Math.floor(px),
          y = Math.floor(py),
          u = px - x,
          v = py - y;
        heights[row * size + col] =
          (1 - v) * ((1 - u) * sample(x, y) + u * sample(x + 1, y)) +
          v * ((1 - u) * sample(x, y + 1) + u * sample(x + 1, y + 1));
      }
    return {...request, heights};
  };
}

/** Interpolate the coarse display edge exactly, avoiding gaps against fine boundary vertices. */
export function sampleCoarsePosition(mesh, longitude, latitude) {
  const x = Math.max(0, Math.min(720, (longitude + 180) * 2)),
    y = Math.max(0, Math.min(360, (latitude + 90) * 2));
  const x0 = Math.min(719, Math.floor(x)),
    y0 = Math.min(359, Math.floor(y)),
    u = x - x0,
    v = y - y0;
  const p = mesh.attributes.POSITION.value;
  return [0, 1, 2].map(
    k =>
      (1 - v) * ((1 - u) * p[(y0 * 721 + x0) * 3 + k] + u * p[(y0 * 721 + x0 + 1) * 3 + k]) +
      v * ((1 - u) * p[((y0 + 1) * 721 + x0) * 3 + k] + u * p[((y0 + 1) * 721 + x0 + 1) * 3 + k])
  );
}

/** Convert the flat display ordinate without changing its geographic meaning. */
export function mapLatitude(latitude, projection) {
  return projection === 'mercator'
    ? (180 / Math.PI) *
        Math.log(
          Math.tan(
            Math.PI / 4 + (Math.max(-85.051129, Math.min(85.051129, latitude)) * Math.PI) / 360
          )
        )
    : latitude;
}
export function geographicLatitude(ordinate, projection) {
  return projection === 'mercator'
    ? (Math.atan(Math.sinh((ordinate * Math.PI) / 180)) * 180) / Math.PI
    : ordinate;
}
