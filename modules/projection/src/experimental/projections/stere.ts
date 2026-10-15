// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {withAngularRenderingProfile} from '../rendering-profile/angular-rendering-profile';
import {
  sphericalAzimuthalBounds,
  ellipsoidalStereographicBounds
} from '../rendering-profile/azimuthal-rendering-bounds';
import type {ProjectionPlugin} from '../types';
import {
  bindKernel,
  guardAzimuthalDomain,
  kernelParameters,
  ORIGIN_PARAMETERS,
  SCALE_PARAMETERS
} from '../kernel';
import {createState, forward, inverse} from '../kernels/stere';

export const stereographic: ProjectionPlugin = {
  name: 'stere',
  aliases: [
    'Stereographic_South_Pole',
    'Polar_Stereographic_variant_A',
    'Polar_Stereographic_variant_B',
    'Polar_Stereographic'
  ],
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS, 'lat_ts'],
  create(context) {
    const base = kernelParameters(context);

    const state = createState(base);
    const projection = guardAzimuthalDomain(base, bindKernel('stere', state, forward, inverse));
    return withAngularRenderingProfile(projection, base, (150 * Math.PI) / 180, (region, domain) =>
      state.sphere
        ? sphericalAzimuthalBounds(state, region, domain, 'stere')
        : ellipsoidalStereographicBounds(
            state,
            latitude =>
              2 *
                Math.atan(
                  Math.tan(Math.PI / 4 + latitude / 2) *
                    Math.pow(
                      (1 - state.e * Math.sin(latitude)) / (1 + state.e * Math.sin(latitude)),
                      state.e / 2
                    )
                ) -
              Math.PI / 2,
            state.X0,
            2 *
              state.a *
              state.k0 *
              (Math.abs(state.coslat0) < 1e-10 ? 1 / state.cons : state.ms1 / state.cosX0),
            region,
            domain
          )
    );
  }
};
