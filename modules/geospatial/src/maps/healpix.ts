// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DiscontinuousMap, type MapRegion} from './map-layout';
import {RAD} from './math';

export type HealpixMapOptions = {radius?: number; centralMeridian?: number};

/** Spherical HEALPix (H=4, K=3), in unit-sphere radians times radius.
 * Independent implementation of the published HEALPix equations:
 * M. R. Calabretta (2004), https://arxiv.org/abs/astro-ph/0412607.
 * The latitude-dependent formula lives inside each octant; all clipping
 * boundaries remain great-circle arcs. This is not the rHEALPix rearrangement.
 */
export function createHealpixMap({radius = 1, centralMeridian = 0}: HealpixMapOptions = {}) {
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(centralMeridian))
    throw new Error('Expected a positive finite radius and finite centralMeridian');
  const quarter = Math.PI / 4;
  const wrap = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;
  centralMeridian = wrap(centralMeridian);
  const regions: MapRegion[] = [];
  for (const sign of [1, -1]) {
    for (let i = 0; i < 4; i++) {
      const west = -180 + i * 90;
      const center = west + 45;
      regions.push({
        id: `${sign > 0 ? 'north' : 'south'}-${i}`,
        boundary: [
          [west, 0],
          [west + 90, 0],
          [west + 90, (sign * Math.asin(2 / 3)) / RAD],
          [center, sign * 90],
          [west, (sign * Math.asin(2 / 3)) / RAD]
        ].map(([lon, lat]) => [lon + centralMeridian, lat]),
        interior: [center + centralMeridian, sign * 45],
        placement: [radius, 0, 0, radius, 0, 0],
        project: ([lon, lat]) => {
          const delta = wrap(lon - centralMeridian - center) * RAD;
          const sine = Math.sin(lat * RAD);
          if (Math.abs(sine) <= 2 / 3) return [center * RAD + delta, ((3 * Math.PI) / 8) * sine];
          const sigma = Math.sqrt(3 * (1 - Math.abs(sine)));
          return [center * RAD + delta * sigma, Math.sign(lat) * quarter * (2 - sigma)];
        },
        unproject: ([x, y]) => {
          if (Math.abs(y) > 2 * quarter + 1e-10) return null;
          const relative = x - center * RAD;
          if (Math.abs(y) <= quarter)
            return [x / RAD + centralMeridian, Math.asin((y * 8) / (3 * Math.PI)) / RAD];
          const sigma = Math.max(0, 2 - Math.abs(y) / quarter);
          if (Math.abs(relative) > quarter * sigma + 1e-10) return null;
          return [
            center + centralMeridian + (sigma > 1e-12 ? relative / (sigma * RAD) : 0),
            (Math.sign(y) * Math.asin(1 - (sigma * sigma) / 3)) / RAD
          ];
        }
      });
    }
  }
  return new DiscontinuousMap(regions);
}
