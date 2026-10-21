// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {withAngularRenderingProfile} from '../rendering-profile/angular-rendering-profile';
import {equidistantAzimuthalBounds} from '../rendering-profile/azimuthal-rendering-bounds';
import type {ProjectionPlugin} from '../types';
import {bindKernel, guardAzimuthalDomain, kernelParameters, ORIGIN_PARAMETERS} from '../kernel';
import {createState, forward, inverse} from '../kernels/aeqd';

export const azimuthalEquidistant: ProjectionPlugin = {
  name: 'aeqd',
  aliases: ['Azimuthal_Equidistant'],
  parameters: ORIGIN_PARAMETERS,
  create(context) {
    const base = kernelParameters(context);

    const state = createState(base);
    // Keep the rendering boundary finite without restricting raw conversion.
    return withAngularRenderingProfile(
      guardAzimuthalDomain(base, bindKernel('aeqd', state, forward, inverse)),
      base,
      (Math.PI * 179) / 180,
      (region, domain) => equidistantAzimuthalBounds(base, region, domain)
    );
  }
};
