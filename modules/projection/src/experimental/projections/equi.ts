// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/equi';

export const equirectangular: ProjectionPlugin = {
  name: 'equi',
  aliases: [],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0'],
  create(context) {
    const base = catalogueParameters(context);
    if (Math.abs(base.lat0) >= Math.PI / 2)
      throw new Error('Equirectangular standard parallel must be away from the poles');
    const state = createState(base);
    return bindCatalogueKernel('equi', context, state, forward, inverse);
  }
};
