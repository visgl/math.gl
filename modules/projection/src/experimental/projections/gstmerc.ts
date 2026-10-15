// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {transverseBounds} from '../rendering-bounds';
import invlatiso from '../common/invlatiso';
import {createAngularRanges} from '../geographic-bounds';
import {withRectangleRenderingProfile} from '../rectangular-rendering-profile';
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/gstmerc';

export const gaussSchreiberTransverseMercator: ProjectionPlugin = {
  name: 'gstmerc',
  aliases: ['gstmerg'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0', 'k', 'k_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    // Avoid the transverse Mercator singularity in the rendering domain.
    const projection = bindCatalogueKernel('gstmerc', context, state, forward, inverse);
    return withRectangleRenderingProfile(
      projection,
      createAngularRanges(
        base.long0 - Math.PI / 6,
        -Math.PI / 3,
        base.long0 + Math.PI / 6,
        Math.PI / 3
      ),
      ranges =>
        transverseBounds(
          projection.forward,
          ranges,
          base.long0,
          base.over,
          invlatiso(state.e, -state.cp / state.rs)
        ),
      base.primeMeridian,
      base.over
    );
  }
};
