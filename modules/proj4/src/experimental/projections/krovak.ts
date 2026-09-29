// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/krovak';
import {numberParameter} from '../parameters';
import {flagParameter, angleParameter} from '../kernel';

export const krovak: ProjectionPlugin = {
  name: 'krovak',
  aliases: [
    'Krovak',
    'Krovak Modified',
    'Krovak (North Orientated)',
    'Krovak Modified (North Orientated)'
  ],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0', 'k', 'k_0', 'czech'],
  flags: ['czech'],
  create(context) {
    const base = catalogueParameters(context);
    base.lat0 = angleParameter(context.parameters, 'lat_0', 49.5);
    base.long0 = angleParameter(context.parameters, 'lon_0', 24.83333333333333);
    base.k0 = numberParameter(
      context.parameters,
      'k_0',
      numberParameter(context.parameters, 'k', 0.9999)
    );
    const state = createState(base, {czech: flagParameter(context.parameters, 'czech')});
    return bindCatalogueKernel('krovak', context, state, forward, inverse);
  }
};
