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
    return guardAzimuthalDomain(base, bindKernel('sterea', createState(base), forward, inverse));
  }
};
