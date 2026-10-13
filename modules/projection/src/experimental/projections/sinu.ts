// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {withRectangleRenderingProfile} from '../rendering-profile';
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/sinu';

export const sinusoidal: ProjectionPlugin = {
  name: 'sinu',
  aliases: ['Sinusoidal'],
  parameters: ['lon_0', 'x_0', 'y_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    // The rendering target covers one world; +over still permits conversion beyond it.
    return withRectangleRenderingProfile(
      bindCatalogueKernel('sinu', context, state, forward, inverse),
      [base.long0 - Math.PI, -Math.PI / 2, base.long0 + Math.PI, Math.PI / 2]
    );
  }
};
