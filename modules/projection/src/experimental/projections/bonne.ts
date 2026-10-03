// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/bonne';

export const bonne: ProjectionPlugin = {
  name: 'bonne',
  aliases: ['Bonne (Werner lat_1=90)'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_1'],
  create(context) {
    const base = catalogueParameters(context);
    if (
      !Object.prototype.hasOwnProperty.call(context.parameters, 'lat_1') ||
      Math.abs(base.lat1) < 1e-10
    )
      throw new Error('Bonne requires a nonzero lat_1');
    const state = createState(base);
    return bindCatalogueKernel('bonne', context, state, forward, inverse);
  }
};
