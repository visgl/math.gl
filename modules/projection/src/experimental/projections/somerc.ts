// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {withRectangleRenderingProfile} from '../rendering-profile';
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
    // Swiss oblique Mercator has a regional, center-relative rendering target.
    return withRectangleRenderingProfile(
      bindCatalogueKernel('somerc', context, state, forward, inverse),
      [
        base.long0 - Math.PI / 18,
        Math.max(-Math.PI / 2 + 1e-8, base.lat0 - Math.PI / 18),
        base.long0 + Math.PI / 18,
        Math.min(Math.PI / 2 - 1e-8, base.lat0 + Math.PI / 18)
      ]
    );
  }
};
