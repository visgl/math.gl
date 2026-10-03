// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/omerc';
import {numberParameter} from '../parameters';
import {flagParameter} from '../kernel';

export const obliqueMercator: ProjectionPlugin = {
  name: 'omerc',
  aliases: [
    'Hotine_Oblique_Mercator',
    'Hotine Oblique Mercator',
    'Hotine_Oblique_Mercator_variant_A',
    'Hotine_Oblique_Mercator_Variant_B',
    'Hotine_Oblique_Mercator_Azimuth_Natural_Origin',
    'Hotine_Oblique_Mercator_Two_Point_Natural_Origin',
    'Hotine_Oblique_Mercator_Azimuth_Center',
    'Oblique_Mercator'
  ],
  parameters: [
    'lon_0',
    'x_0',
    'y_0',
    'lat_0',
    'k',
    'k_0',
    'alpha',
    'gamma',
    'lonc',
    'lon_1',
    'lon_2',
    'lat_1',
    'lat_2',
    'no_off',
    'no_uoff',
    'no_rot'
  ],
  flags: ['no_off', 'no_uoff', 'no_rot'],
  create(context) {
    const base = catalogueParameters(context);
    if (Math.abs(base.lat0) >= Math.PI / 2)
      throw new Error('Oblique Mercator origin must be away from the poles');
    const hasAzimuth =
      Object.prototype.hasOwnProperty.call(context.parameters, 'alpha') ||
      Object.prototype.hasOwnProperty.call(context.parameters, 'gamma');
    const required = hasAzimuth ? ['lonc'] : ['lon_1', 'lat_1', 'lon_2', 'lat_2'];
    for (const name of required)
      if (!Object.prototype.hasOwnProperty.call(context.parameters, name))
        throw new Error('Oblique Mercator requires ' + name);
    const state = createState(base, {
      projName: context.parameters['proj'] || 'omerc',
      alpha: (numberParameter(context.parameters, 'alpha', NaN) * Math.PI) / 180,
      rectified_grid_angle: (numberParameter(context.parameters, 'gamma', NaN) * Math.PI) / 180,
      longc: (numberParameter(context.parameters, 'lonc', 0) * Math.PI) / 180,
      long1: (numberParameter(context.parameters, 'lon_1', 0) * Math.PI) / 180,
      long2: (numberParameter(context.parameters, 'lon_2', 0) * Math.PI) / 180,
      no_off: flagParameter(context.parameters, 'no_off'),
      no_uoff: flagParameter(context.parameters, 'no_uoff'),
      no_rot: flagParameter(context.parameters, 'no_rot')
    });
    return bindCatalogueKernel('omerc', context, state, forward, inverse);
  }
};
