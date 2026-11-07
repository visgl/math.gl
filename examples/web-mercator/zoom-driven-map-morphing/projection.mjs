// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createProjectionEngine} from '@math.gl/geospatial/projection/core';
import {geocentric} from '@math.gl/geospatial/projection/projections/geocent';
import {mercator} from '@math.gl/geospatial/projection/projections/merc';

export const RADIUS = 6378137;
const RADIANS = Math.PI / 180;
const MAX_LATITUDE = 85.0511287798066;
// Both endpoints use the same sphere so the blend preserves the globe's scale and height.
const sphere = `+a=${RADIUS} +b=${RADIUS}`;
const engine = createProjectionEngine({projections: [geocentric, mercator]});
const from = `+proj=longlat ${sphere}`;
const globe = engine.createProjection({from, to: `+proj=geocent ${sphere} +units=m`});
const flat = engine.createProjection({from, to: `+proj=merc ${sphere} +units=m`});

export function getGlobeToMercatorTransition(zoom, {startZoom, endZoom}) {
  if (![zoom, startZoom, endZoom].every(Number.isFinite) || startZoom >= endZoom) {
    throw new RangeError('Expected finite zooms with startZoom < endZoom');
  }
  const t = Math.max(0, Math.min(1, (zoom - startZoom) / (endZoom - startZoom)));
  return t * t * (3 - 2 * t);
}

/** Convert projected meters to pixels at the current zoom and morph progress. */
export function getMorphScale({zoom, latitude, progress}) {
  const globeScale = (512 * 2 ** zoom) / (2 * Math.PI * RADIUS);
  // Latitude compensation belongs to the flat map; a globe should only rotate when panned.
  if (progress === 0) return globeScale;
  const mercatorCompensation = 1 / Math.cos(latitude * RADIANS);
  return globeScale * (1 + progress * (mercatorCompensation - 1));
}

/** Blend positions in meters in a view-centered east/north/up frame. */
export function createMorphProjection({longitude, latitude, progress}) {
  if (
    ![longitude, latitude, progress].every(Number.isFinite) ||
    Math.abs(latitude) > 90 || progress < 0 || progress > 1 ||
    (progress > 0 && Math.abs(latitude) > MAX_LATITUDE)
  ) {
    throw new RangeError('Invalid globe Mercator projection parameters');
  }
  const center = latitude * RADIANS;
  const cosCenter = Math.cos(center);
  const sinCenter = Math.sin(center);
  // A pure globe also supports polar centers, where Mercator is undefined.
  const centerY = progress > 0 ? flat.projectSync([0, latitude, 0])[1] : 0;

  return {
    project([pointLongitude, pointLatitude, height = 0], out = []) {
      if (
        ![pointLongitude, pointLatitude, height].every(Number.isFinite) ||
        Math.abs(pointLatitude) > 90 ||
        (progress > 0 && Math.abs(pointLatitude) > MAX_LATITUDE)
      ) {
        throw new RangeError('Position outside projection domain');
      }
      // Wrap before either projection so both endpoints share the opposite-meridian seam.
      const delta = ((((pointLongitude - longitude) % 360) + 540) % 360) - 180;
      const coordinate = [delta, pointLatitude, height];
      const [x, y, z] = globe.projectSync(coordinate);
      const east = y;
      const north = z * cosCenter - x * sinCenter;
      const up = z * sinCenter + x * cosCenter - RADIUS;
      out[0] = east;
      out[1] = north;
      out[2] = up;
      if (progress > 0) {
        const projected = flat.projectSync(coordinate);
        out[0] = east * (1 - progress) + projected[0] * cosCenter * progress;
        out[1] = north * (1 - progress) + (projected[1] - centerY) * cosCenter * progress;
        out[2] = up * (1 - progress) + height * progress;
      }
      return out;
    }
  };
}


/** Tessellate each texture bank separately, sharing positions along its seam. */
export function createSurfaceMesh({longitude, project, columns = 180, rows = 86}) {
  const start = longitude - 179.999;
  const end = longitude + 179.999;
  const boundaries = [start];
  for (let seam = (Math.floor((start + 180) / 360) + 1) * 360 - 180;
    seam < end; seam += 360) {
    boundaries.push(seam);
  }
  boundaries.push(end);
  const positions = [];
  const texCoords = [];
  const indices = [];
  for (let bank = 0; bank < boundaries.length - 1; bank++) {
    const west = boundaries[bank];
    const east = boundaries[bank + 1];
    const bankColumns = Math.max(1, Math.ceil(columns * (east - west) / (end - start)));
    const textureWest = Math.floor(((west + east) / 2 + 180) / 360) * 360 - 180;
    const offset = positions.length / 3;
    for (let y = 0; y <= rows; y++) {
      const latitude = -85 + 170 * y / rows;
      for (let x = 0; x <= bankColumns; x++) {
        // Use exact endpoints so both banks project identical seam positions.
        const pointLongitude = x === bankColumns ? east : west + (east - west) * x / bankColumns;
        positions.push(...project([pointLongitude, latitude]));
        // Duplicate seam vertices with u=1 on the west bank and u=0 on the east bank.
        texCoords.push((pointLongitude - textureWest) / 360, (90 - latitude) / 180);
      }
    }
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < bankColumns; x++) {
        const a = offset + y * (bankColumns + 1) + x;
        const b = a + 1;
        const c = a + bankColumns + 1;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  return {
    positions: new Float64Array(positions),
    texCoords: new Float32Array(texCoords),
    indices: new Uint32Array(indices),
    vertexCount: indices.length
  };
}
