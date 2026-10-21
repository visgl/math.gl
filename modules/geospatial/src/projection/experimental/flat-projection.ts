// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original batch adapter; numerical equations retain their own proj4js provenance.
import {createProjection} from './mutable-projection';
import {ProjectionScratch} from './projection-scratch';
import type {ProjectionFlatContext, ProjectionFlatOperation, ProjectionPoint} from './types';

/** Fuse eligible geographic/projected pipelines into one buffer traversal. */
export function createFlatProjection(
  forward: (point: ProjectionPoint) => void,
  inverse: (point: ProjectionPoint) => void
) {
  return {
    ...createProjection(forward, inverse),
    createForwardFlat(context: ProjectionFlatContext) {
      // A custom decorator that replaces a mutable hook must keep its own semantics.
      return this.forwardInPlace === forward
        ? createFlatOperation(forward, false, context)
        : undefined;
    },
    createInverseFlat(context: ProjectionFlatContext) {
      return this.inverseInPlace === inverse
        ? createFlatOperation(inverse, true, context)
        : undefined;
    }
  };
}

function createFlatOperation(
  project: (point: ProjectionPoint) => void,
  inverse: boolean,
  {inputScale, outputScale}: ProjectionFlatContext
): ProjectionFlatOperation {
  const scratch = new ProjectionScratch();
  return (coordinates, dimension) => {
    const point = scratch.acquire();
    try {
      const float32 = coordinates instanceof Float32Array;
      for (let offset = 0; offset < coordinates.length; offset += dimension) {
        point.x = coordinates[offset];
        point.y = coordinates[offset + 1];
        point.z = dimension >= 3 ? coordinates[offset + 2] : 0;
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z))
          throw new Error('Coordinates must contain finite x, y and optional z values');
        if (inputScale !== 1) {
          point.x *= inputScale;
          point.y *= inputScale;
        }
        if (inverse) project(point);
        if (
          Math.abs(point.y) > Math.PI / 2 ||
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y)
        )
          throw new Error('Coordinate is outside the geographic domain');
        // Match the general pipeline's zero prime-meridian arithmetic, including -0.
        point.x += 0;
        point.x -= 0;
        if (!inverse) project(point);
        if (outputScale !== 1) {
          point.x /= outputScale;
          point.y /= outputScale;
        }
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
          throw new Error('Projection produced non-finite coordinates');
        if (
          float32 &&
          (Math.abs(point.x) > 3.4028234663852886e38 || Math.abs(point.y) > 3.4028234663852886e38)
        )
          throw new Error('Projected coordinate exceeds Float32 range');
        // Only completed records are committed. Height and trailing ordinates stay in storage.
        coordinates[offset] = point.x;
        coordinates[offset + 1] = point.y;
      }
    } finally {
      scratch.release(point);
    }
  };
}
