// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {withAngularRenderingProfile} from '../angular-rendering-profile';
import {sphericalAzimuthalBounds} from '../azimuthal-rendering-bounds';
import type {ProjectionPlugin} from '../types';
import {
  catalogueParameters,
  catalogueBoundsParameters,
  bindCatalogueKernel,
  horizonGuard
} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/gnom';

export const gnomonic: ProjectionPlugin = {
  name: 'gnom',
  aliases: [],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    // Keep the rendering boundary finite without restricting raw conversion.
    return withAngularRenderingProfile(
      bindCatalogueKernel('gnom', context, state, forward, inverse, horizonGuard(base)),
      base,
      (Math.PI * 80) / 180,
      (region, domain) =>
        sphericalAzimuthalBounds(catalogueBoundsParameters(base, context), region, domain, 'gnom'),
      Math.PI / 2
    );
  }
};
