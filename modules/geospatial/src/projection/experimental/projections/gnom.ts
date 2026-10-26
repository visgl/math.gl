// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {withAngularRenderingProfile} from '../rendering-profile/angular-rendering-profile';
import {
  sphericalAzimuthalBounds,
  ellipsoidalGnomonicBounds
} from '../rendering-profile/azimuthal-rendering-bounds';
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
      bindCatalogueKernel(
        'gnom',
        context,
        state,
        forward,
        inverse,
        base.sphere ? horizonGuard(base) : undefined
      ),
      base,
      Math.min((Math.PI * 80) / 180, (1 - base.es) * Math.PI * 0.45),
      (region, domain) =>
        base.sphere
          ? sphericalAzimuthalBounds(
              catalogueBoundsParameters(base, context),
              region,
              domain,
              'gnom'
            )
          : ellipsoidalGnomonicBounds(catalogueBoundsParameters(base, context), region, domain),
      ((1 - base.es) * Math.PI) / 2
    );
  }
};
