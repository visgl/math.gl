// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createProjection, projectionOperation} from './mutable-projection';
import {DEGREES_TO_RADIANS, numberParameter} from './parameters';
import type {ProjectionContext, ProjectionImplementation, ProjectionParameters} from './types';

export type Point = {x: number; y: number};

/** Fully initialized inputs to numerical kernels. Angles are radians, lengths meters. */
export type KernelParameters = {
  a: number;
  b: number;
  e: number;
  es: number;
  ep2: number;
  sphere: boolean;
  over: boolean;
  long0: number;
  lat0: number;
  lat1: number;
  lat2: number;
  /** NaN means a latitude of true scale was not supplied. */
  lat_ts: number;
  x0: number;
  y0: number;
  k0: number;
};

export const ORIGIN_PARAMETERS = ['lon_0', 'lat_0', 'x_0', 'y_0'] as const;
export const SCALE_PARAMETERS = ['k', 'k_0'] as const;

export function angleParameter(
  parameters: ProjectionParameters,
  name: string,
  fallback = 0
): number {
  const degrees = numberParameter(parameters, name, fallback);
  if (name !== 'lon_0' && Math.abs(degrees) > 90) {
    throw new Error('Latitude parameter must be between -90 and 90 degrees: +' + name);
  }
  return degrees * DEGREES_TO_RADIANS;
}

export function flagParameter(parameters: ProjectionParameters, name: string): boolean {
  const present = Object.prototype.hasOwnProperty.call(parameters, name);
  if (present && parameters[name] !== undefined)
    throw new Error('Expected a flag without a value: +' + name);
  return present;
}

export function kernelParameters({
  semiMajorAxis: a,
  eccentricitySquared: es,
  parameters
}: ProjectionContext): KernelParameters {
  const k0 = numberParameter(parameters, 'k_0', numberParameter(parameters, 'k', 1));
  if (k0 <= 0) throw new Error('Projection scale must be positive');
  return {
    a,
    b: a * Math.sqrt(1 - es),
    es,
    e: Math.sqrt(es),
    ep2: es / (1 - es),
    sphere: es === 0,
    over: flagParameter(parameters, 'over'),
    long0: angleParameter(parameters, 'lon_0'),
    lat0: angleParameter(parameters, 'lat_0'),
    lat1: angleParameter(parameters, 'lat_1'),
    lat2: angleParameter(parameters, 'lat_2', numberParameter(parameters, 'lat_1', 0)),
    lat_ts: angleParameter(parameters, 'lat_ts', NaN),
    x0: numberParameter(parameters, 'x_0', 0),
    y0: numberParameter(parameters, 'y_0', 0),
    k0
  };
}

export function validateConic(base: KernelParameters, parameters: ProjectionParameters): void {
  if (!Object.prototype.hasOwnProperty.call(parameters, 'lat_1')) {
    throw new Error('Conic projections require +lat_1');
  }
  if (
    Math.abs(base.lat1 + base.lat2) < 1e-10 ||
    Math.abs(base.lat1) >= Math.PI / 2 ||
    Math.abs(base.lat2) >= Math.PI / 2
  ) {
    throw new Error('Conic standard parallels must not be opposite or at a pole');
  }
}

/** Adapt kernels with explicit state into the allocation-isolated public plugin contract. */
export function bindKernel<State>(
  name: string,
  state: State,
  forward: (state: State, point: Point) => Point | null | undefined | number,
  inverse: (state: State, point: Point) => Point | null | undefined | number,
  adapt = createProjection
): ProjectionImplementation {
  const run = (operation: typeof forward, point: Point): void => {
    const result = operation(state, point);
    if (
      !result ||
      typeof result !== 'object' ||
      !Number.isFinite(result.x) ||
      !Number.isFinite(result.y)
    )
      throw new Error(name + ': coordinate outside projection domain or inverse did not converge');
    point.x = result.x;
    point.y = result.y;
  };
  return adapt(
    point => run(forward, point),
    point => run(inverse, point)
  );
}

/** Azimuthal antipodes have no unique azimuth; reject even when roundoff is finite. */
export function guardAzimuthalDomain(
  base: KernelParameters,
  implementation: ProjectionImplementation
): ProjectionImplementation {
  const forward = projectionOperation(implementation, false);
  return createProjection(
    point => {
      const longitude = point.x,
        latitude = point.y;
      const delta = Math.atan2(Math.sin(longitude - base.long0), Math.cos(longitude - base.long0));
      const polar = Math.abs(Math.abs(base.lat0) - Math.PI / 2) < 1e-10;
      if (
        Math.abs(latitude + base.lat0) < 1e-10 &&
        (polar || Math.abs(Math.abs(delta) - Math.PI) < 1e-10)
      )
        throw new Error('Azimuthal projection is undefined at the antipode');
      forward(point);
    },
    projectionOperation(implementation, true)
  );
}
