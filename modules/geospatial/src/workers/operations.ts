// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {MapEngine, type MapDescription, type MapEngineOptions} from '../discontinuous/map-engine';
import type {CreateProjectionOptions, ProjectionArray} from '../projection/types';
import type {WorkerTaskContext} from '../workers';

/** Worker-local setup. Install callbacks in the worker instead of sending functions. */
export function setupMap(
  description: MapDescription,
  context: WorkerTaskContext,
  options?: MapEngineOptions
): MapEngine {
  context.report({phase: 'map-setup', completed: 0, total: 1});
  const map = new MapEngine(description, options);
  map.getLayout();
  context.report({phase: 'map-setup', completed: 1, total: 1});
  return map;
}

export type BulkProjectionTask = {
  projection: CreateProjectionOptions;
  coordinates: ProjectionArray;
  dimension?: number;
  inverse?: boolean;
  chunkSize?: number;
};

/** Transform worker-owned storage in bounded chunks; errors return no partial output. */
export async function projectBulk(
  input: BulkProjectionTask,
  context: WorkerTaskContext
): Promise<ProjectionArray> {
  const {coordinates, dimension = 2, chunkSize = 4096} = input;
  if (
    !(coordinates instanceof Float32Array || coordinates instanceof Float64Array) ||
    !(coordinates.buffer instanceof ArrayBuffer) ||
    !Number.isSafeInteger(dimension) ||
    dimension < 2 ||
    coordinates.length % dimension !== 0 ||
    !Number.isSafeInteger(chunkSize) ||
    chunkSize < 1
  )
    throw new Error(
      'Expected ordinary floating-point buffers, complete records and positive chunk size'
    );
  const total = coordinates.length / dimension;
  context.report({phase: 'projection-setup', completed: 0, total: 1});
  const {FullProjectionEngine} = await import('../projection/lib/projection');
  const projection = new FullProjectionEngine().createProjection(input.projection);
  context.report({phase: 'projection-setup', completed: 1, total: 1});
  context.report({phase: 'bulk-projection', completed: 0, total});
  for (let start = 0; start < total; start += chunkSize) {
    const end = Math.min(total, start + chunkSize);
    const chunk = coordinates.subarray(start * dimension, end * dimension);
    if (input.inverse) projection.unprojectFlatSync(chunk, dimension);
    else projection.projectFlatSync(chunk, dimension);
    context.report({phase: 'bulk-projection', completed: end, total});
    await context.yieldTask();
  }
  return coordinates;
}

/** Extend these handlers with application-specific grid builders. */
export const geospatialWorkerTasks = {
  'map-setup': (description: MapDescription, context: WorkerTaskContext) => {
    const map = setupMap(description, context);
    return map.toPrepared();
  },
  'bulk-projection': projectBulk
};
