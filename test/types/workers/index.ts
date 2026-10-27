// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  processOnWorker,
  processOnWorkerInBatches,
  type WorkerObject
} from '@math.gl/core/worker-utils';
import {MapSetupWorker, projectBulkInWorker, setupMapInWorker} from '@math.gl/geospatial/workers';

declare const worker: WorkerObject<{count: number}, {value: number}, {precision: number}>;
const result: Promise<{value: number}> = processOnWorker(worker, {count: 2}, {precision: 2});
const batches: AsyncIterable<{value: number}> = processOnWorkerInBatches(worker, [{count: 2}], {
  precision: 2
});
// @ts-expect-error Batch input requires numeric counts.
processOnWorkerInBatches(worker, [{count: 'wrong'}]);
// @ts-expect-error Worker input requires a numeric count.
processOnWorker(worker, {count: 'wrong'});
// @ts-expect-error Processor precision is numeric.
processOnWorker(worker, {count: 2}, {precision: 'wrong'});
const projected: Promise<Float32Array> = projectBulkInWorker({
  projection: {to: 'EPSG:3857'},
  coordinates: new Float32Array(4)
});
const map = setupMapInWorker({version: 1, id: 'world', definition: {type: 'mercator'}});
const direct = processOnWorker(MapSetupWorker, {
  version: 1,
  id: 'world',
  definition: {type: 'mercator'}
});
void result;
void batches;
void projected;
void map;
void direct;
