// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {withAngularRenderingProfile} from '../rendering-profile';
import type {ProjectionPlugin} from '../types';
import {bindKernel, guardAzimuthalDomain, kernelParameters, ORIGIN_PARAMETERS} from '../kernel';
import {createState, forward, inverse} from '../kernels/aeqd';

export const azimuthalEquidistant: ProjectionPlugin = {
  name: 'aeqd',
  aliases: ['Azimuthal_Equidistant'],
  parameters: ORIGIN_PARAMETERS,
  create(context) {
    const base = kernelParameters(context);

    // Keep the rendering boundary finite without restricting raw conversion.
    return withAngularRenderingProfile(
      guardAzimuthalDomain(base, bindKernel('aeqd', createState(base), forward, inverse)),
      base,
      (Math.PI * 179) / 180
    );
  }
};
