// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/cea';

export const cylindricalEqualArea: ProjectionPlugin = {
  name: 'cea',
  aliases: [],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_ts'],
  create(context) {
    const base = catalogueParameters(context);
    if (Math.abs(base.lat_ts) >= Math.PI / 2)
      throw new Error('CEA standard parallel must be away from the poles');
    const state = createState(base);
    return bindCatalogueKernel('cea', context, state, forward, inverse);
  }
};
