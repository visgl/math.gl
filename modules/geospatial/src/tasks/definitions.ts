// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Task} from '@math.gl/tasks';
import type {CreateProjectionOptions, Projection, ProjectionArray} from '../projection/types';
import type {MapDescription, PreparedMap} from '../discontinuous/map-engine';
export type ProjectCoordinatesTypes = {
  initialization: {projection?: CreateProjectionOptions};
  state: {projection?: Projection; key?: string; defaultOptions?: CreateProjectionOptions};
  input: {
    projection?: CreateProjectionOptions;
    coordinates: ProjectionArray;
    dimension?: number;
    inverse?: boolean;
  };
  output: {coordinates: ProjectionArray};
  options: {chunkSize?: number};
};

const processCoordinates: NonNullable<Task<ProjectCoordinatesTypes>['process']> = async (
  input,
  options,
  context
) => {
  const projection = input.projection ?? context.state.defaultOptions;
  if (!projection) throw new Error('Provide projection in the input or initializeTask');
  await prepareProjection(context.state, projection);
  const {projectBulk} = await import('./operations');
  const coordinates = await projectBulk(
    {...input, projection, chunkSize: options.chunkSize},
    context,
    context.state.projection
  );
  return {coordinates};
};

/** Reproject packed coordinates, retaining the prepared projection for each task lifetime. */
export const ProjectCoordinatesTask = {
  id: 'project-coordinates',
  async preload() {
    await Promise.all([import('./operations'), import('../projection/lib/projection')]);
  },
  async initialize({projection}) {
    const state: ProjectCoordinatesTypes['state'] = {defaultOptions: projection};
    if (projection) await prepareProjection(state, projection);
    return state;
  },
  destroy(state) {
    state.projection = undefined;
    state.defaultOptions = undefined;
    state.key = undefined;
  },
  process: processCoordinates,
  async *processInBatches(inputs, options, context) {
    for await (const input of inputs) {
      yield await processCoordinates(input, options, context);
    }
  }
} satisfies Task<ProjectCoordinatesTypes>;

export type PrepareMapTypes = {
  input: {description: MapDescription};
  output: {map: PreparedMap};
};

/** Build a portable map snapshot for MapEngine.fromPrepared without blocking the UI. */
export const PrepareMapTask = {
  id: 'prepare-map',
  async preload() {
    await import('./operations');
  },
  async process({description}, _options, context) {
    const {setupMap} = await import('./operations');
    return {map: setupMap(description, context).toPrepared()};
  }
} satisfies Task<PrepareMapTypes>;

async function prepareProjection(
  state: ProjectCoordinatesTypes['state'],
  options: CreateProjectionOptions
): Promise<void> {
  const key = JSON.stringify(options);
  if (!state.projection || state.key !== key) {
    const {FullProjectionEngine} = await import('../projection/lib/projection');
    const projection = new FullProjectionEngine().createProjection(options);
    state.projection = projection;
    state.key = key;
  }
}
