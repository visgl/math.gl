// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import proj4 from 'proj4';
import {
  geoMercator,
  geoEqualEarth,
  geoConicEqualArea,
  geoConicConformal,
  geoStereographic
} from 'd3-geo';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import type {CreateProjectionOptions, ProjectionEngine} from '@math.gl/geospatial/projection/types';
import {pointProjection} from './point-projection';

export type Backend = 'math.gl' | 'proj4js' | 'D3';
export const RADIUS = 6378137;
export const OPTIONS = {from: 'WGS84', to: 'EPSG:3857'} as const;

// Albers in proj4js requires explicit offsets even when both are zero.
const sphere = `+R=${RADIUS} +x_0=0 +y_0=0 +units=m +no_defs`;
export const MAPS = {
  mercator: {
    label: 'Mercator',
    to: 'EPSG:3857',
    minLatitude: -80,
    specs: 'Central meridian: 0°',
    d3: () => geoMercator()
  },
  equalEarth: {
    label: 'Equal Earth',
    to: `+proj=eqearth +lon_0=0 ${sphere}`,
    minLatitude: -80,
    specs: 'Central meridian: 0°',
    d3: () => geoEqualEarth()
  },
  albers: {
    label: 'Albers Equal Area',
    to: `+proj=aea +lat_0=0 +lon_0=0 +lat_1=20 +lat_2=50 ${sphere}`,
    minLatitude: -60,
    specs: 'Origin: 0°, 0° · Standard parallels: 20°, 50°',
    d3: () => geoConicEqualArea().parallels([20, 50])
  },
  lambert: {
    label: 'Lambert Conformal Conic',
    to: `+proj=lcc +lat_0=0 +lon_0=0 +lat_1=20 +lat_2=50 ${sphere}`,
    minLatitude: -60,
    specs: 'Origin: 0°, 0° · Standard parallels: 20°, 50°',
    d3: () => geoConicConformal().parallels([20, 50])
  },
  stereographic: {
    label: 'Stereographic',
    to: `+proj=stere +lat_0=90 +lon_0=0 +k=1 ${sphere}`,
    minLatitude: -50,
    specs: 'Origin: North Pole · Central meridian: 0° · Scale factor: 1',
    d3: () => geoStereographic().rotate([0, -90])
  }
} as const;
export type MapName = keyof typeof MAPS;

/** Prepare matching spherical XY operations for the example's projection presets. */
export function createExampleEngine(backend: Backend): ProjectionEngine {
  if (backend === 'math.gl') return new FullProjectionEngine();
  if (backend !== 'proj4js' && backend !== 'D3') throw new Error('Unknown backend');
  return {
    createProjection(options: CreateProjectionOptions = OPTIONS) {
      const {from = 'WGS84', to = 'EPSG:3857', enforceAxis, mode} = options;
      const preset = Object.values(MAPS).find(map => map.to === to);
      if (from !== 'WGS84' || !preset || enforceAxis || mode !== undefined) {
        throw new Error('Unsupported example projection options');
      }
      if (backend === 'proj4js') {
        const pair = proj4('EPSG:4326', to);
        return pointProjection(
          point => pair.forward(point),
          point => pair.inverse(point)
        );
      }
      // D3's stereographic raw formula uses half the conventional unit-sphere scale.
      // Reset conic defaults so the PROJ and D3 origins and axes coincide in metres.
      const scale = preset === MAPS.stereographic ? 2 * RADIUS : RADIUS;
      const projection = preset.d3().center([0, 0]).scale(scale).translate([0, 0]).reflectY(true);
      return pointProjection(
        point => projection(point),
        point => projection.invert!(point)
      );
    },
    async createProjectionAsync(options = OPTIONS) {
      return this.createProjection(options) as ReturnType<typeof pointProjection>;
    }
  };
}

/** Application code is unchanged when the injected engine changes. */
export async function prepareMap(engine: ProjectionEngine, map: MapName = 'mercator') {
  return engine.createProjectionAsync({from: OPTIONS.from, to: MAPS[map].to});
}
