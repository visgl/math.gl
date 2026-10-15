// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {withAngularRenderingProfile} from '../rendering-profile/angular-rendering-profile';
import {ellipsoidalStereographicBounds} from '../rendering-profile/azimuthal-rendering-bounds';
import type {ProjectionPlugin} from '../types';
import {
  bindKernel,
  guardAzimuthalDomain,
  kernelParameters,
  ORIGIN_PARAMETERS,
  SCALE_PARAMETERS
} from '../kernel';
import {createState, forward, inverse} from '../kernels/sterea';

export const obliqueStereographic: ProjectionPlugin = {
  name: 'sterea',
  aliases: [
    'Stereographic_North_Pole',
    'Oblique_Stereographic',
    'Oblique Stereographic Alternative',
    'Double_Stereographic'
  ],
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS],
  create(context) {
    const base = kernelParameters(context);
    if (Math.abs(base.lat0) === Math.PI / 2)
      throw new Error('sterea requires a non-polar origin; use stere at the poles');
    const state = createState(base);
    // Keep the rendering boundary finite without restricting raw conversion.
    return withAngularRenderingProfile(
      guardAzimuthalDomain(base, bindKernel('sterea', state, forward, inverse)),
      base,
      (Math.PI * 150) / 180,
      (region, domain) =>
        ellipsoidalStereographicBounds(
          base,
          latitude =>
            2 *
              Math.atan(
                state.K *
                  Math.pow(Math.tan(Math.PI / 4 + latitude / 2), state.C) *
                  Math.pow(
                    (1 - base.e * Math.sin(latitude)) / (1 + base.e * Math.sin(latitude)),
                    state.ratexp
                  )
              ) -
            Math.PI / 2,
          state.phic0,
          base.a * base.k0 * state.R2,
          region,
          domain,
          state.C,
          Math.abs(Math.log(state.C)) +
            Math.abs(Math.log(state.K)) +
            state.C * base.e * Math.atanh(base.e)
        )
    );
  }
};
