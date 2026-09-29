// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original adapter for kernels directly ported from proj4js 2.22.0.
import {bindKernel, kernelParameters} from './kernel';
import type {KernelParameters, Point} from './kernel';
import {numberParameter} from './parameters';
import type {ProjectionContext, ProjectionImplementation} from './types';

export function catalogueParameters(context: ProjectionContext): KernelParameters {
  const base = kernelParameters(context);
  // False offsets are applied once by the adapter, including kernels that omit them upstream.
  return {...base, x0: 0, y0: 0, lat_ts: Number.isNaN(base.lat_ts) ? 0 : base.lat_ts};
}
export function bindCatalogueKernel<State>(
  name: string,
  context: ProjectionContext,
  state: State,
  forward: (state: State, point: Point) => Point | null | undefined | number,
  inverse: (state: State, point: Point) => Point | null | undefined | number,
  guard?: (longitude: number, latitude: number) => void
): ProjectionImplementation {
  const kernel = bindKernel(name, state, forward, inverse);
  const x0 = numberParameter(context.parameters, 'x_0', 0),
    y0 = numberParameter(context.parameters, 'y_0', 0);
  return {
    forward(longitude, latitude) {
      guard?.(longitude, latitude);
      const [x, y] = kernel.forward(longitude, latitude);
      return [x + x0, y + y0];
    },
    inverse(x, y) {
      return kernel.inverse(x - x0, y - y0);
    }
  };
}
/** Reject invisible points instead of returning a finite horizon approximation. */
export function horizonGuard(
  base: KernelParameters,
  minimumCosine = 0,
  includeBoundary = false
): (lon: number, lat: number) => void {
  return (longitude, latitude) => {
    const cosine =
      Math.sin(base.lat0) * Math.sin(latitude) +
      Math.cos(base.lat0) * Math.cos(latitude) * Math.cos(longitude - base.long0);
    if (includeBoundary ? cosine < minimumCosine - 1e-14 : cosine <= minimumCosine + 1e-14)
      throw new Error('Coordinate is outside the visible projection horizon');
  };
}
