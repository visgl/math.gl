// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/eck6';

export const eckertVI: ProjectionPlugin = {
  name: 'eck6',
  aliases: ['Eckert_VI'],
  parameters: ['lon_0', 'x_0', 'y_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    return bindCatalogueKernel('eck6', context, state, forward, inverse);
  }
};
