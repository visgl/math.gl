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
