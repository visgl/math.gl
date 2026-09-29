// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/vandg';

export const vanDerGrinten: ProjectionPlugin = {
  name: 'vandg',
  aliases: ['Van_der_Grinten_I', 'VanDerGrinten', 'Van_der_Grinten'],
  parameters: ['lon_0', 'x_0', 'y_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    return bindCatalogueKernel('vandg', context, state, forward, inverse);
  }
};
