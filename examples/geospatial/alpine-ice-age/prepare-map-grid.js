// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {TaskRunner} from '@math.gl/core/tasks';
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import {prepareDiscontinuousGrid, DISCONTINUOUS_VIEWS} from './discontinuous-views.js';
import {
  cacheProjectionGrid,
  getCachedProjectionGrid,
  prepareProjectionGrid
} from './projection-grid.js';

const cache = new Map();
const loadWorker = () =>
  new Worker(new URL('./discontinuous-grid-worker.js', import.meta.url), {type: 'module'});
const IceAgeGridTask = {
  id: 'ice-age-grid',
  worker: {create: loadWorker, capabilities: {atomic: true, streaming: false}}
};
async function executeTask(task, input, options) {
  const runner = new TaskRunner();
  try {
    return await runner.runTask(task, input, options);
  } finally {
    await runner.close();
  }
}

/** Cancel a queued or running job when its selection is superseded. */
export async function prepareMapGrid(
  view,
  step,
  {signal, onProgress = () => {}, runTask = executeTask} = {}
) {
  signal?.throwIfAborted();
  const key = `${view}:${step}`;
  if (cache.has(key)) return cache.get(key);
  const discontinuous = Boolean(DISCONTINUOUS_VIEWS[view]);
  if (!discontinuous) {
    const grid = getCachedProjectionGrid(view);
    if (grid) return grid;
  }
  let result;
  if (typeof Worker !== 'undefined') {
    const data = await runTask(
      IceAgeGridTask,
      {view, step, discontinuous},
      {execution: 'worker', signal, onProgress, inputOwnership: 'copy'}
    );
    signal?.throwIfAborted();
    if (discontinuous) {
      const {preparedMap, ...grid} = data;
      result = {...grid, map: MapEngine.fromPrepared(preparedMap)};
    } else result = data;
  } else if (discontinuous) {
    result = await prepareDiscontinuousGrid(view, step, {signal, onProgress});
  } else {
    result = await prepareProjectionGrid(view, {
      reportProgress: progress => {
        signal?.throwIfAborted();
        onProgress(progress);
      }
    });
  }
  signal?.throwIfAborted();
  if (!discontinuous) cacheProjectionGrid(view, result);
  if (cache.size >= 3) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}
