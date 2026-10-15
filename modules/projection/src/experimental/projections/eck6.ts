// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {cylindricalBounds} from '../rendering-bounds';
import {createAngularRanges} from '../geographic-bounds';
import {withRectangleRenderingProfile} from '../rectangular-rendering-profile';
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
    // The rendering target covers one world; +over still permits conversion beyond it.
    const projection = bindCatalogueKernel('eck6', context, state, forward, inverse);
    return withRectangleRenderingProfile(
      projection,
      createAngularRanges(base.long0 - Math.PI, -Math.PI / 2, base.long0 + Math.PI, Math.PI / 2),
      ranges => cylindricalBounds(projection.forward, ranges, base.long0, base.over),
      base.primeMeridian,
      base.over
    );
  }
};
