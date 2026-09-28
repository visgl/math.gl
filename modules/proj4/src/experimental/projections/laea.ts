// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ProjectionPlugin} from '../types';
import {bindKernel, guardAzimuthalDomain, kernelParameters, ORIGIN_PARAMETERS} from '../kernel';
import {createState, forward, inverse} from '../kernels/laea';

export const lambertAzimuthalEqualArea: ProjectionPlugin = {
  name: 'laea',
  parameters: ORIGIN_PARAMETERS,
  create(context) {
    const base = kernelParameters(context);

    return guardAzimuthalDomain(base, bindKernel('laea', createState(base), forward, inverse));
  }
};
