// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  processOnWorker,
  type ProcessOnWorkerOptions,
  type WorkerObject
} from '@math.gl/core/worker-utils';
import type {MapDescription, PreparedMap} from '../discontinuous/map-engine';
import type {ProjectionArray} from '../projection/types';
import type {BulkProjectionTask} from './operations';
declare const __filename: string;

export type {BulkProjectionTask} from './operations';
// CJS bundlers replace import.meta; __filename provides the corresponding Node URL.
const path = typeof __filename === 'string' ? __filename.replace(/\\/g, '/') : '';
const moduleUrl = path
  ? `file://${path.startsWith('/') ? '' : '/'}${encodeURI(path).replace(/#/g, '%23').replace(/\?/g, '%3F')}`
  : import.meta.url;
const descriptor = {
  module: 'geospatial',
  packageName: '@math.gl/geospatial',
  version: 'latest',
  options: {}
};
export const MapSetupWorker: WorkerObject<MapDescription, PreparedMap> = {
  ...descriptor,
  id: 'map-setup',
  name: 'Map setup',
  worker: new URL('./map-worker.js', moduleUrl).href,
  loadWorker: () => new Worker(new URL('./map-worker.js', import.meta.url), {type: 'module'})
};
export const BulkProjectionWorker: WorkerObject<BulkProjectionTask, ProjectionArray> = {
  ...descriptor,
  id: 'bulk-projection',
  name: 'Bulk projection',
  worker: new URL('./projection-worker.js', moduleUrl).href,
  loadWorker: () => new Worker(new URL('./projection-worker.js', import.meta.url), {type: 'module'})
};

export function setupMapInWorker(
  description: MapDescription,
  options: ProcessOnWorkerOptions = {}
): Promise<PreparedMap> {
  return processOnWorker(MapSetupWorker, description, {inputOwnership: 'copy', ...options});
}
export function projectBulkInWorker<T extends ProjectionArray>(
  input: BulkProjectionTask & {coordinates: T},
  options: ProcessOnWorkerOptions = {}
): Promise<T> {
  return processOnWorker(BulkProjectionWorker, input, {
    inputOwnership: 'copy',
    ...options
  }) as Promise<T>;
}
