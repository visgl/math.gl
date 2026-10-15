// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {vanDerGrintenBounds} from '../rendering-profile/rendering-bounds';
import {createAngularRanges} from '../rendering-profile/geographic-bounds';
import {withRectangleRenderingProfile} from '../rendering-profile/rectangular-rendering-profile';
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
    // The rendering target covers one world; +over still permits conversion beyond it.
    const projection = bindCatalogueKernel('vandg', context, state, forward, inverse);
    return withRectangleRenderingProfile(
      projection,
      createAngularRanges(base.long0 - Math.PI, -Math.PI / 2, base.long0 + Math.PI, Math.PI / 2),
      ranges => vanDerGrintenBounds(projection.forward, ranges, base.long0, base.over),
      base.primeMeridian,
      base.over
    );
  }
};
