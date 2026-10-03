// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel, horizonGuard} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/tpers';
import {numberParameter} from '../parameters';

export const tiltedPerspective: ProjectionPlugin = {
  name: 'tpers',
  aliases: ['Tilted_Perspective'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0', 'h', 'tilt', 'azi'],
  create(context) {
    const base = catalogueParameters(context);
    const h = numberParameter(context.parameters, 'h', 100000);
    const tilt = (numberParameter(context.parameters, 'tilt', 0) * Math.PI) / 180;
    const azi = (numberParameter(context.parameters, 'azi', 0) * Math.PI) / 180;
    if (Math.abs(tilt) >= Math.PI / 2)
      throw new Error('Perspective tilt must be between -90 and 90 degrees');
    const state = createState(base, {h, tilt, azi});
    return bindCatalogueKernel(
      'tpers',
      context,
      state,
      forward,
      inverse,
      horizonGuard(base, 1 / (1 + h / base.a))
    );
  }
};
