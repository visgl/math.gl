// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel, horizonGuard} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/ortho';

export const orthographic: ProjectionPlugin = {
  name: 'ortho',
  aliases: [],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    return bindCatalogueKernel(
      'ortho',
      context,
      state,
      forward,
      inverse,
      horizonGuard(base, 0, true)
    );
  }
};
