// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS, 'lat_ts'],
  create(context) {
    const base = kernelParameters(context);

    return guardAzimuthalDomain(base, bindKernel('stere', createState(base), forward, inverse));
  }
};
