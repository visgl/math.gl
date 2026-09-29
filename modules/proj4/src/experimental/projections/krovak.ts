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
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0', 'k', 'k_0', 'czech', 'alpha', 'lat_ts'],
  flags: ['czech'],
  create(context) {
    // The upstream kernel fixes these angles. Accept the two published azimuth
    // spellings (legacy PROJ and EPSG), but never silently ignore custom angles.
    const alpha = numberParameter(context.parameters, 'alpha', 30.28813972222222);
    const parallel = numberParameter(context.parameters, 'lat_ts', 78.5);
    if (![30.28813972222222, 30.28813975277778].some(value => Math.abs(alpha - value) <= 1e-10))
      throw new Error('Krovak requires its fixed cone-axis co-latitude');
    if (Math.abs(parallel - 78.5) > 1e-10)
      throw new Error('Krovak requires its fixed 78.5 degree pseudo standard parallel');
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
