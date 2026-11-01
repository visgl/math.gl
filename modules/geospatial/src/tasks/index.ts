// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {isBrowser} from '@math.gl/core/worker-utils';
import type {Task} from '@math.gl/core/tasks';
import type {CreateProjectionOptions, Projection, ProjectionArray} from '../projection/types';
import type {MapDescription, PreparedMap} from '../discontinuous/map-engine';
declare const __filename: string;

// Resolve compiled worker modules in both ESM and CommonJS package entries.
const path = typeof __filename === 'string' ? __filename.replace(/\\/g, '/') : '';
const moduleUrl = path
  ? `file://${path.startsWith('/') ? '' : '/'}${encodeURI(path).replace(/#/g, '%23').replace(/\?/g, '%3F')}`
  : import.meta.url;

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
  const {projectBulk} = await import('../workers/operations');
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
  },
  worker: {
    ...(!isBrowser
      ? {url: /* @__PURE__ */ (() => new URL('./projection-worker.js', moduleUrl).href)()}
      : {
          create: () =>
            new Worker(new URL('./projection-worker.js', import.meta.url), {type: 'module'})
        }),
    capabilities: {atomic: true, streaming: true}
  }
} satisfies Task<ProjectCoordinatesTypes>;

export type PrepareMapTypes = {
  input: {description: MapDescription};
  output: {map: PreparedMap};
};

/** Build a portable map snapshot for MapEngine.fromPrepared without blocking the UI. */
export const PrepareMapTask = {
  id: 'prepare-map',
  async process({description}, _options, context) {
    const {setupMap} = await import('../workers/operations');
    return {map: setupMap(description, context).toPrepared()};
  },
  worker: {
    ...(!isBrowser
      ? {url: /* @__PURE__ */ (() => new URL('./map-worker.js', moduleUrl).href)()}
      : {create: () => new Worker(new URL('./map-worker.js', import.meta.url), {type: 'module'})}),
    capabilities: {atomic: true, streaming: false}
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
