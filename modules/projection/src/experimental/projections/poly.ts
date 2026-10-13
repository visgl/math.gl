// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {withRectangleRenderingProfile} from '../rendering-profile';
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/poly';

export const polyconic: ProjectionPlugin = {
  name: 'poly',
  aliases: ['Polyconic', 'American_Polyconic'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    // Use a regional meridian strip for polyconic rendering.
    return withRectangleRenderingProfile(
      bindCatalogueKernel('poly', context, state, forward, inverse),
      [
        base.long0 - Math.PI / 6,
        Math.max(-Math.PI / 2 + 1e-8, base.lat0 - Math.PI / 2 + 1e-8),
        base.long0 + Math.PI / 6,
        Math.min(Math.PI / 2 - 1e-8, base.lat0 + Math.PI / 2 - 1e-8)
      ]
    );
  }
};
