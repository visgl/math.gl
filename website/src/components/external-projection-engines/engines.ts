// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import proj4 from 'proj4';
import {geoMercator} from 'd3-geo';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import type {CreateProjectionOptions, ProjectionEngine} from '@math.gl/geospatial/projection/types';
import {pointProjection} from './point-projection';

export type Backend = 'math.gl' | 'proj4js' | 'D3';
export const RADIUS = 6378137;
export const OPTIONS = {from: 'WGS84', to: 'EPSG:3857'} as const;

/** Bounded XY recipe: longitude/latitude degrees to spherical Mercator metres. */
export function createExampleEngine(backend: Backend): ProjectionEngine {
  if (backend === 'math.gl') return new FullProjectionEngine();
  if (backend !== 'proj4js' && backend !== 'D3') throw new Error('Unknown backend');
  return {
    createProjection(options: CreateProjectionOptions = OPTIONS) {
      const {from = 'WGS84', to = 'EPSG:3857', enforceAxis, mode} = options;
      if (from !== 'WGS84' || to !== 'EPSG:3857' || enforceAxis || mode !== undefined) {
        throw new Error('This example supports WGS84 XY to EPSG:3857 only');
      }
      if (backend === 'proj4js') {
        const pair = proj4('EPSG:4326', 'EPSG:3857');
        return pointProjection(point => pair.forward(point), point => pair.inverse(point));
      }
      // This exact D3 configuration matches the spherical Web Mercator point formula.
      // It does not make arbitrary D3 projections into EPSG coordinate operations.
      const projection = geoMercator().scale(RADIUS).translate([0, 0]).reflectY(true);
      return pointProjection(point => projection(point), point => projection.invert!(point));
    },
    async createProjectionAsync(options = OPTIONS) {
      return this.createProjection(options) as ReturnType<typeof pointProjection>;
    }
  };
}

/** Application code is unchanged when the injected engine changes. */
export async function prepareMap(engine: ProjectionEngine) {
  return engine.createProjectionAsync(OPTIONS);
}
