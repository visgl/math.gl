// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the ellipsoidal orthographic kernel.
import {withAngularRenderingProfile} from '../rendering-profile/angular-rendering-profile';
import {orthographicBounds} from '../rendering-profile/azimuthal-rendering-bounds';
import type {ProjectionPlugin} from '../types';
import {
  catalogueParameters,
  catalogueBoundsParameters,
  bindCatalogueKernel,
  horizonGuard
} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/ortho';

export const orthographic: ProjectionPlugin = {
  name: 'ortho',
  aliases: [],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0', 'k', 'k_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    // Keep the rendering boundary finite without restricting raw conversion.
    return withAngularRenderingProfile(
      bindCatalogueKernel('ortho', context, state, forward, inverse, horizonGuard(base, 0, true)),
      base,
      Math.PI / 2,
      (region, domain) =>
        orthographicBounds(catalogueBoundsParameters(base, context), region, domain),
      Math.PI / 2
    );
  }
};
