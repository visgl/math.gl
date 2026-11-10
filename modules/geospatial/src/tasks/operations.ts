// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {MapEngine, type MapDescription, type MapEngineOptions} from '../maps/map-engine';
import type {CreateProjectionOptions, ProjectionArray, Projection} from '../projection/types';
import {mapPresets} from '../maps/presets';
import {mapGeometry} from '../maps/geometry';
import {mapTransitions} from '../maps/transitions';
import type {TaskContext} from '@math.gl/tasks';
type OperationContext = Partial<Omit<TaskContext<unknown>, 'state'>>;

export type BulkProjectionTask = {
  projection: CreateProjectionOptions;
  coordinates: ProjectionArray;
  dimension?: number;
  inverse?: boolean;
  chunkSize?: number;
};

/** Setup callbacks belong in the worker and cannot be sent in a request. */
export function setupMap(
  description: MapDescription,
  context: OperationContext,
  options?: Partial<MapEngineOptions>
): MapEngine {
  context.reportProgress?.({phase: 'map-setup', completed: 0, total: 1, unit: 'tasks'});
  const map = new MapEngine(description, {
    presets: mapPresets,
    geometry: mapGeometry,
    transitions: mapTransitions,
    ...options
  });
  map.getLayout();
  context.reportProgress?.({phase: 'map-setup', completed: 1, total: 1, unit: 'tasks'});
  return map;
}

/** Process worker-owned storage in chunks. Failed jobs return no partial result. */
export async function projectBulk(
  input: BulkProjectionTask,
  context: OperationContext,
  preparedProjection?: Projection
): Promise<ProjectionArray> {
  const {coordinates, dimension = 2, chunkSize = 4096} = input;
  if (
    !(coordinates instanceof Float32Array || coordinates instanceof Float64Array) ||
    !(coordinates.buffer instanceof ArrayBuffer) ||
    !Number.isSafeInteger(dimension) ||
    dimension < 2 ||
    coordinates.length % dimension ||
    !Number.isSafeInteger(chunkSize) ||
    chunkSize < 1
  )
    throw new Error(
      'Expected ordinary floating-point buffers, complete records and positive chunk size'
    );
  context.reportProgress?.({phase: 'projection-setup', completed: 0, total: 1, unit: 'tasks'});
  const projection =
    preparedProjection ??
    new (await import('../projection/lib/projection')).FullProjectionEngine().createProjection(
      input.projection
    );
  context.reportProgress?.({phase: 'projection-setup', completed: 1, total: 1, unit: 'tasks'});
  const total = coordinates.length / dimension;
  context.reportProgress?.({phase: 'bulk-projection', completed: 0, total, unit: 'records'});
  for (let start = 0; start < total; start += chunkSize) {
    context.throwIfAborted?.();
    context.signal?.throwIfAborted();
    const end = Math.min(total, start + chunkSize);
    const chunk = coordinates.subarray(start * dimension, end * dimension);
    if (input.inverse) projection.unprojectFlatSync(chunk, dimension);
    else projection.projectFlatSync(chunk, dimension);
    context.reportProgress?.({phase: 'bulk-projection', completed: end, total, unit: 'records'});
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return coordinates;
}
