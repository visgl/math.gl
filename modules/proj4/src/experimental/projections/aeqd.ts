// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ProjectionPlugin} from '../types';
import {bindKernel, guardAzimuthalDomain, kernelParameters, ORIGIN_PARAMETERS} from '../kernel';
import {createState, forward, inverse} from '../kernels/aeqd';

export const azimuthalEquidistant: ProjectionPlugin = {
  name: 'aeqd',
  parameters: ORIGIN_PARAMETERS,
  create(context) {
    const base = kernelParameters(context);

    return guardAzimuthalDomain(base, bindKernel('aeqd', createState(base), forward, inverse));
  }
};
