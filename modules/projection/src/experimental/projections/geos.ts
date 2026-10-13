// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {withAngularRenderingProfile} from '../rendering-profile';
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel, horizonGuard} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/geos';
import {numberParameter} from '../parameters';

export const geostationary: ProjectionPlugin = {
  name: 'geos',
  aliases: ['Geostationary Satellite View', 'Geostationary_Satellite'],
  parameters: ['lon_0', 'x_0', 'y_0', 'h', 'sweep'],
  create(context) {
    const base = catalogueParameters(context);
    const h = numberParameter(context.parameters, 'h', NaN);
    if (!Number.isFinite(h) || h <= 0)
      throw new Error('Geostationary projection requires positive h');
    const sweep = context.parameters['sweep'] || 'y';
    if (!['x', 'y'].includes(sweep)) throw new Error('Geostationary sweep must be x or y');
    const state = createState(base, {h, sweep});
    // Ellipsoidal visibility depends on bearing through the geocentric latitude.
    const radius = 1 + h / base.a;
    const distance = (bearing: number) => {
      const q = base.es * Math.cos(bearing) ** 2;
      return Math.acos(Math.sqrt((1 - q) / (radius * radius - q))) * (1 - 1e-10);
    };
    return withAngularRenderingProfile(
      bindCatalogueKernel(
        'geos',
        context,
        state,
        forward,
        inverse,
        base.sphere ? horizonGuard({...base, lat0: 0}, 1 / (1 + h / base.a), true) : undefined
      ),
      {...base, lat0: 0},
      distance
    );
  }
};
