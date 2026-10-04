// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {ProjectionScratch} from './projection-scratch';
import type {ProjectionImplementation, ProjectionPoint} from './types';

/** One equation implementation shared by scalar adapters and the mutable pipeline. */
export function createProjection(
  forward: (point: ProjectionPoint) => void,
  inverse: (point: ProjectionPoint) => void
): ProjectionImplementation {
  const scratch = new ProjectionScratch();
  const scalar = (
    x: number,
    y: number,
    operation: (point: ProjectionPoint) => void
  ): [number, number] => {
    const point = scratch.acquire();
    try {
      point.x = x;
      point.y = y;
      point.z = 0;
      operation(point);
      return [point.x, point.y];
    } finally {
      scratch.release(point);
    }
  };
  return {
    forward(x, y) {
      return scalar(x, y, forward);
    },
    inverse(x, y) {
      return scalar(x, y, inverse);
    },
    forwardInPlace: forward,
    inverseInPlace: inverse
  };
}
/** Resolve once at construction. Legacy custom plugins can still allocate their own arrays. */
export function projectionOperation(
  implementation: ProjectionImplementation,
  inverse: boolean,
  geocentric = false
): (point: ProjectionPoint) => void {
  const mutable = inverse ? implementation.inverseInPlace : implementation.forwardInPlace;
  if (mutable) return mutable.bind(implementation);
  if (geocentric) {
    const operation = inverse ? implementation.inverse3D : implementation.forward3D;
    return point => {
      const output = operation.call(implementation, [point.x, point.y, point.z]);
      point.x = output[0];
      point.y = output[1];
      point.z = output[2];
    };
  }
  const operation = inverse ? implementation.inverse : implementation.forward;
  return point => {
    const output = operation.call(implementation, point.x, point.y);
    point.x = output[0];
    point.y = output[1];
  };
}
