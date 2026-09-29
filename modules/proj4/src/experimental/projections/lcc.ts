// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ProjectionPlugin} from '../types';
import {
  bindKernel,
  kernelParameters,
  ORIGIN_PARAMETERS,
  SCALE_PARAMETERS,
  validateConic
} from '../kernel';
import {createState, forward, inverse} from '../kernels/lcc';

export const lambertConformalConic: ProjectionPlugin = {
  name: 'lcc',
  aliases: [
    'Lambert Tangential Conformal Conic Projection',
    'Lambert_Conformal_Conic',
    'Lambert_Conformal_Conic_1SP',
    'Lambert_Conformal_Conic_2SP',
    'Lambert Conic Conformal (1SP)',
    'Lambert Conic Conformal (2SP)'
  ],
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS, 'lat_1', 'lat_2'],
  create(context) {
    const base = kernelParameters(context);
    validateConic(base, context.parameters);
    const state = createState(base);
    const implementation = bindKernel('lcc', state, forward, inverse);
    return {
      forward(longitude, latitude) {
        if (Math.abs(latitude) === Math.PI / 2 && latitude * state.ns < 0) {
          throw new Error('Lambert conformal conic is undefined at the opposite pole');
        }
        return implementation.forward(longitude, latitude);
      },
      inverse: implementation.inverse
    };
  }
};
