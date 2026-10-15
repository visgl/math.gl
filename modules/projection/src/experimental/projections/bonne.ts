// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {bonneBounds} from '../regional-rendering-bounds';
import {createAngularRanges} from '../geographic-bounds';
import {withRectangleRenderingProfile} from '../rectangular-rendering-profile';
import type {ProjectionPlugin} from '../types';
import {
  catalogueParameters,
  catalogueBoundsParameters,
  bindCatalogueKernel
} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/bonne';

export const bonne: ProjectionPlugin = {
  name: 'bonne',
  aliases: ['Bonne (Werner lat_1=90)'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_1'],
  create(context) {
    const base = catalogueParameters(context);
    if (
      !Object.prototype.hasOwnProperty.call(context.parameters, 'lat_1') ||
      Math.abs(base.lat1) < 1e-10
    )
      throw new Error('Bonne requires a nonzero lat_1');
    const state = createState(base);
    // The finite world is the rendering target, including both polar limits.
    const projection = bindCatalogueKernel('bonne', context, state, forward, inverse);
    return withRectangleRenderingProfile(
      projection,
      createAngularRanges(base.long0 - Math.PI, -Math.PI / 2, base.long0 + Math.PI, Math.PI / 2),
      ranges => bonneBounds(catalogueBoundsParameters(state, context), projection.forward, ranges),
      base.primeMeridian,
      base.over
    );
  }
};
