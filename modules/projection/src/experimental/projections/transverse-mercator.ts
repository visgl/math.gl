// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createFlatProjection} from '../flat-projection';
import type {ProjectionContext, ProjectionImplementation, ProjectionPlugin} from '../types';
import {transverseBounds} from '../rendering-bounds';
import {createAngularRanges} from '../geographic-bounds';
import {withRectangleRenderingProfile} from '../rectangular-rendering-profile';
import {
  bindKernel,
  flagParameter,
  kernelParameters,
  ORIGIN_PARAMETERS,
  SCALE_PARAMETERS
} from '../kernel';
import {
  createState as createExtended,
  forward as extendedForward,
  inverse as extendedInverse
} from '../kernels/etmerc';
import {
  createState as createFast,
  forward as fastForward,
  inverse as fastInverse
} from '../kernels/tmerc';

export function createTransverseMercator(context: ProjectionContext): ProjectionImplementation {
  const base = kernelParameters(context);
  // A finite regional strip avoids the transverse singularities at +/-90 degrees.
  const render = (implementation: ProjectionImplementation) =>
    withRectangleRenderingProfile(
      implementation,
      createAngularRanges(
        base.long0 - Math.PI / 6,
        -Math.PI / 2,
        base.long0 + Math.PI / 6,
        Math.PI / 2
      ),
      ranges => transverseBounds(implementation.forward, ranges, base.long0, base.over),
      base.primeMeridian,
      base.over
    );
  if (flagParameter(context.parameters, 'approx')) {
    return render({
      ...bindKernel(
        'tmerc +approx',
        createFast(base),
        fastForward,
        fastInverse,
        createFlatProjection
      )
    });
  }
  if (base.sphere) throw new Error('Spherical transverse Mercator requires +approx');
  return render({
    ...bindKernel(
      'etmerc',
      createExtended(base),
      extendedForward,
      extendedInverse,
      createFlatProjection
    )
  });
}

/** Matches proj4js: tmerc uses the extended algorithm unless +approx is supplied. */
export const transverseMercator: ProjectionPlugin = {
  name: 'tmerc',
  aliases: [
    'Fast_Transverse_Mercator',
    'Fast Transverse Mercator',
    'Transverse_Mercator',
    'Transverse Mercator',
    'Gauss Kruger',
    'Gauss_Kruger'
  ],
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS, 'approx'],
  flags: ['approx'],
  create: createTransverseMercator
};

export const extendedTransverseMercator: ProjectionPlugin = {
  name: 'etmerc',
  aliases: ['Extended_Transverse_Mercator', 'Extended Transverse Mercator'],
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS, 'approx'],
  flags: ['approx'],
  create: createTransverseMercator
};
