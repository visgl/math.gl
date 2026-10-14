// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {nzmgBounds} from '../regional-rendering-bounds';
import {withRectangleRenderingProfile} from '../rectangular-rendering-profile';
import type {ProjectionPlugin} from '../types';
import {
  catalogueParameters,
  catalogueBoundsParameters,
  bindCatalogueKernel
} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/nzmg';
import {numberParameter} from '../parameters';

export const newZealandMapGrid: ProjectionPlugin = {
  name: 'nzmg',
  aliases: ['New_Zealand_Map_Grid'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0', 'iterations'],
  create(context) {
    const base = catalogueParameters(context);
    const iterations = numberParameter(context.parameters, 'iterations', 1);
    if (!Number.isInteger(iterations) || iterations < 0 || iterations > 10)
      throw new Error('NZMG iterations must be an integer from 0 to 10');
    if (
      !Object.prototype.hasOwnProperty.call(context.parameters, 'lat_0') ||
      !Object.prototype.hasOwnProperty.call(context.parameters, 'lon_0')
    )
      throw new Error('NZMG requires lat_0 and lon_0');
    const state = createState(base, {iterations});
    // The New Zealand polynomial is regional: render eight degrees around its origin.
    const projection = bindCatalogueKernel('nzmg', context, state, forward, inverse);
    return withRectangleRenderingProfile(
      projection,
      [
        base.long0 - Math.PI / 22.5,
        Math.max(-Math.PI / 2, base.lat0 - Math.PI / 22.5),
        base.long0 + Math.PI / 22.5,
        Math.min(Math.PI / 2, base.lat0 + Math.PI / 22.5)
      ],
      coverage => nzmgBounds(catalogueBoundsParameters(state, context), coverage)
    );
  }
};
