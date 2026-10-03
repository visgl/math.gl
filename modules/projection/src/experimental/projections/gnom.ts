// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel, horizonGuard} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/gnom';

export const gnomonic: ProjectionPlugin = {
  name: 'gnom',
  aliases: [],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    return bindCatalogueKernel('gnom', context, state, forward, inverse, horizonGuard(base));
  }
};
