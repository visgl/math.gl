// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  createGeographicTerrainCutoutFrame,
  projectGeographicTerrainCutout
} from '@math.gl/geospatial/terrain';

/** Synthetic bathymetric tiles spanning the antimeridian or surrounding a pole. */
export function geographicCutoutScene(name) {
  const polar = name !== 'Antimeridian';
  const sign = name === 'South pole' ? -1 : 1;
  const frame = createGeographicTerrainCutoutFrame({center: polar ? [0, sign * 90] : [180, 0]});
  let meshes;
  if (polar) {
    const positions = projectGeographicTerrainCutout(
      Float64Array.of(
        0,
        sign * 90,
        -400,
        0,
        sign * 86,
        -1500,
        90,
        sign * 86,
        -900,
        180,
        sign * 86,
        -1200,
        -90,
        sign * 86,
        -1800
      ),
      frame
    );
    meshes = [
      [0, 3, 4, 0, 4, 1],
      [0, 1, 2, 0, 2, 3]
    ].map(ids => {
      if (sign < 0)
        for (let i = 0; i < ids.length; i += 3) [ids[i + 1], ids[i + 2]] = [ids[i + 2], ids[i + 1]];
      return {positions, indices: Uint32Array.from(ids)};
    });
  } else {
    meshes = [178, -180].map(west => {
      const geographic = new Float64Array(5 * 9 * 3);
      const indices = [];
      for (let row = 0; row < 9; row++)
        for (let col = 0; col < 5; col++) {
          const i = (row * 5 + col) * 3,
            lon = west + col / 2,
            lat = -2 + row / 2;
          geographic.set([lon, lat, -900 + 300 * Math.cos(lat)], i);
          if (row < 8 && col < 4) {
            const a = row * 5 + col;
            indices.push(a, a + 1, a + 6, a, a + 6, a + 5);
          }
        }
      return {
        positions: projectGeographicTerrainCutout(geographic, frame),
        indices: Uint32Array.from(indices)
      };
    });
  }
  return {frame, meshes};
}
