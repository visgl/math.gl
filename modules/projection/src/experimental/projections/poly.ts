// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {polyconicBounds} from '../regional-rendering-bounds';
import {createAngularRanges} from '../geographic-bounds';
import {withRectangleRenderingProfile} from '../rectangular-rendering-profile';
import type {ProjectionPlugin} from '../types';
import {
  catalogueParameters,
  catalogueBoundsParameters,
  bindCatalogueKernel
} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/poly';

export const polyconic: ProjectionPlugin = {
  name: 'poly',
  aliases: ['Polyconic', 'American_Polyconic'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    // Use a regional meridian strip for polyconic rendering.
    const projection = bindCatalogueKernel('poly', context, state, forward, inverse);
    return withRectangleRenderingProfile(
      projection,
      createAngularRanges(
        base.long0 - Math.PI / 6,
        Math.max(-Math.PI / 2 + 1e-8, base.lat0 - Math.PI / 2 + 1e-8),
        base.long0 + Math.PI / 6,
        Math.min(Math.PI / 2 - 1e-8, base.lat0 + Math.PI / 2 - 1e-8)
      ),
      ranges =>
        polyconicBounds(catalogueBoundsParameters(base, context), projection.forward, ranges),
      base.primeMeridian,
      base.over
    );
  }
};
