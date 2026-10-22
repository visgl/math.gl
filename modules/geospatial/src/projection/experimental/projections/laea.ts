// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {authalicLatitude} from '../authalic-latitude';
import {withAngularRenderingProfile} from '../rendering-profile/angular-rendering-profile';
import {equalAreaAzimuthalBounds} from '../rendering-profile/azimuthal-rendering-bounds';
import type {ProjectionPlugin} from '../types';
import {bindKernel, guardAzimuthalDomain, kernelParameters, ORIGIN_PARAMETERS} from '../kernel';
import {createState, forward, inverse} from '../kernels/laea';

export const lambertAzimuthalEqualArea: ProjectionPlugin = {
  name: 'laea',
  aliases: ['Lambert Azimuthal Equal Area', 'Lambert_Azimuthal_Equal_Area'],
  parameters: ORIGIN_PARAMETERS,
  create(context) {
    const base = kernelParameters(context);

    const state = createState(base);
    // Keep the rendering boundary finite without restricting raw conversion.
    return withAngularRenderingProfile(
      guardAzimuthalDomain(base, bindKernel('laea', state, forward, inverse)),
      base,
      (Math.PI * 179) / 180,
      (region, domain) =>
        equalAreaAzimuthalBounds(
          base,
          base.sphere ? 1 : state.xmf || Math.sqrt(state.qp / 2),
          base.sphere ? 1 : state.ymf || Math.sqrt(state.qp / 2),
          region,
          domain,
          base.sphere ? base.lat0 : authalicLatitude(base.e, state.qp, base.lat0),
          base.sphere
            ? latitude => latitude
            : latitude => authalicLatitude(base.e, state.qp, latitude)
        )
    );
  }
};
