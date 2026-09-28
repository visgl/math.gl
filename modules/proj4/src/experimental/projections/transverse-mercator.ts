// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ProjectionContext, ProjectionImplementation, ProjectionPlugin} from '../types';
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
  if (flagParameter(context.parameters, 'approx')) {
    return bindKernel('tmerc +approx', createFast(base), fastForward, fastInverse);
  }
  if (base.sphere) throw new Error('Spherical transverse Mercator requires +approx');
  return bindKernel('etmerc', createExtended(base), extendedForward, extendedInverse);
}

/** Matches proj4js: tmerc uses the extended algorithm unless +approx is supplied. */
export const transverseMercator: ProjectionPlugin = {
  name: 'tmerc',
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS, 'approx'],
  flags: ['approx'],
  create: createTransverseMercator
};

export const extendedTransverseMercator: ProjectionPlugin = {
  name: 'etmerc',
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS, 'approx'],
  flags: ['approx'],
  create: createTransverseMercator
};
