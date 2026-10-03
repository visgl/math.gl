// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/somerc';

export const swissObliqueMercator: ProjectionPlugin = {
  name: 'somerc',
  aliases: [],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0', 'k', 'k_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base, {rf: base.a === base.b ? Infinity : 1 / (1 - base.b / base.a)});
    return bindCatalogueKernel('somerc', context, state, forward, inverse);
  }
};
