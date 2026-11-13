// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightField, createTerrainMesh} from '@math.gl/geospatial';

/** Smooth transition from exaggerated global relief to true scale. */
export function getExaggeration(zoom, maximum = 100) {
  const t = Math.max(0, Math.min(1, zoom / 4));
  return 1 + (maximum - 1) * (1 - t * t * (3 - 2 * t));
}
const STOPS = [
  [-11000, [2, 8, 28]],
  [-6000, [9, 32, 83]],
  [-4000, [18, 75, 142]],
  [-2000, [18, 139, 168]],
  [-1, [133, 218, 199]],
  [0, [83, 122, 85]],
  [1500, [157, 147, 96]],
  [3500, [173, 152, 131]],
  [6500, [239, 239, 229]]
];
/** Colors encode original elevation in meters, independently of exaggeration. */
export function elevationColor(height) {
  for (let i = 1; i < STOPS.length; i++) {
    if (height <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1],
        [b, cb] = STOPS[i];
      const t = Math.max(0, (height - a) / (b - a));
      return ca.map((c, k) => (c + t * (cb[k] - c)) / 255);
    }
  }
  return STOPS.at(-1)[1].map(c => c / 255);
}
/** Spherical visualization mesh; source rows run south to north. */
export function createGlobeMesh(
  heights,
  exaggeration,
  width = 721,
  height = 361,
  previous,
  options = {}
) {
  if (heights.length !== width * height) throw new Error('Unexpected elevation grid dimensions');
  const {
    bounds = [-180, -90, 180, 90],
    morph = 0,
    projection = 'equirectangular',
    cutout,
    boundary
  } = options;
  const [west, south, east, north] = bounds;
  const global = east - west === 360;
  const positions = new Float32Array(heights.length * 3);
  const colors = previous?.attributes.COLOR_0.value ?? new Float32Array(positions.length);
  const normals = new Float32Array(positions.length);
  let indices = previous?.fullIndices ?? previous?.indices.value;
  if (!indices) {
    const field = new HeightField({
      width,
      height,
      heights: Float32Array.from(heights),
      diagonal: '10-01'
    });
    const grid = createTerrainMesh(field);
    indices = grid.indices;
  }
  for (let y = 0; y < height; y++) {
    const latitude = south + (y * (north - south)) / (height - 1);
    const lat = (latitude * Math.PI) / 180;
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const source =
        global && (y === 0 || y === height - 1)
          ? y * width
          : y * width + (global ? x % (width - 1) : x);
      const h = heights[source];
      const longitude = west + (x * (east - west)) / (width - 1);
      const lon = ((global && x === width - 1 ? west : longitude) * Math.PI) / 180;
      const r = 180 * (1 + (h * exaggeration) / 6371008.8);
      const cos = Math.abs(latitude) === 90 ? 0 : Math.cos(lat);
      const flatY =
        projection === 'mercator'
          ? (180 / Math.PI) *
            Math.log(
              Math.tan(
                Math.PI / 4 + (Math.max(-85.051129, Math.min(85.051129, latitude)) * Math.PI) / 360
              )
            )
          : latitude;
      // A flat longitude unit is one degree, while the radius-180 globe uses pi
      // units per equatorial degree. Mercator adds its local sec(latitude) scale.
      const flatHeight =
        ((r - 180) / Math.PI) *
        (projection === 'mercator'
          ? 1 / Math.cos((Math.max(-85.051129, Math.min(85.051129, latitude)) * Math.PI) / 180)
          : 1);
      positions.set(
        [
          (1 - morph) * r * cos * Math.sin(lon) + morph * longitude || 0,
          (1 - morph) * -r * cos * Math.cos(lon) + morph * (-180 - flatHeight),
          (1 - morph) * r * Math.sin(lat) + morph * flatY
        ],
        i * 3
      );
      if (boundary && (x === 0 || y === 0 || x === width - 1 || y === height - 1))
        positions.set(boundary(longitude, latitude), i * 3);
      if (!previous) colors.set(elevationColor(h), i * 3);
    }
  }
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3,
      b = indices[i + 1] * 3,
      c = indices[i + 2] * 3;
    const ux = positions[b] - positions[a],
      uy = positions[b + 1] - positions[a + 1],
      uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a],
      vy = positions[c + 1] - positions[a + 1],
      vz = positions[c + 2] - positions[a + 2];
    for (const offset of [a, b, c]) {
      normals[offset] += uy * vz - uz * vy;
      normals[offset + 1] += uz * vx - ux * vz;
      normals[offset + 2] += ux * vy - uy * vx;
    }
  }
  if (global && morph === 0)
    for (let y = 1; y < height - 1; y++)
      for (let k = 0; k < 3; k++) {
        const a = y * width * 3 + k,
          b = (y * width + width - 1) * 3 + k;
        normals[a] = normals[b] = normals[a] + normals[b];
      }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    for (let k = 0; k < 3; k++) normals[i + k] /= length;
  }
  const cutoutKey = cutout?.join(',');
  let displayIndices = indices;
  if (cutout) {
    if (previous?.cutoutKey === cutoutKey) displayIndices = previous.indices.value;
    else {
      const output = new Uint32Array(indices.length);
      let count = 0;
      for (let i = 0; i < indices.length; i += 3) {
        let lon = 0,
          lat = 0;
        for (let k = 0; k < 3; k++) {
          const vertex = indices[i + k];
          lon += west + ((vertex % width) * (east - west)) / (width - 1);
          lat += south + (Math.floor(vertex / width) * (north - south)) / (height - 1);
        }
        if (
          lon / 3 > cutout[0] &&
          lon / 3 < cutout[2] &&
          lat / 3 > cutout[1] &&
          lat / 3 < cutout[3]
        )
          continue;
        output[count++] = indices[i];
        output[count++] = indices[i + 1];
        output[count++] = indices[i + 2];
      }
      displayIndices = output.slice(0, count);
    }
  }
  return {
    attributes: {
      POSITION: {value: positions, size: 3},
      NORMAL: {value: normals, size: 3},
      COLOR_0: {value: colors, size: 3}
    },
    // Reuse full topology on region moves/eviction; reuse the cutout while morphing or zooming.
    fullIndices: indices,
    cutoutKey,
    indices: {value: displayIndices, size: 1}
  };
}
