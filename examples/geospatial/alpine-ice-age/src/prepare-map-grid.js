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
/** One scene owns one warm worker session. Cancellation replaces invalid state. */
export function createMapGridPreparer({
  runner = new TaskRunner(),
  task = IceAgeGridTask,
  useWorker = typeof Worker !== 'undefined'
} = {}) {
  let handle;
  let tail = Promise.resolve();
  let closed = false;
  let closing;
  const runTask = (_task, input, options) => {
    const pending = tail.then(async () => {
      if (closed) throw new Error('Map grid preparer is closed');
      options.signal?.throwIfAborted();
      handle ??= await runner.initializeTask(
        task,
        {},
        {execution: 'worker', signal: options.signal}
      );
      try {
        return await handle.runTask(input, options);
      } catch (error) {
        const failed = handle;
        handle = undefined;
        await failed.close();
        throw error;
      }
    });
    tail = pending.catch(() => {});
    return pending;
  };
  return {
    async prepare(view, step, options = {}) {
      if (closed) throw new Error('Map grid preparer is closed');
      return prepareMapGrid(view, step, {...options, runTask: useWorker ? runTask : undefined});
    },
    terminate() {
      closed = true;
      closing ??= (async () => {
        await runner.terminate();
        await tail;
        handle = undefined;
      })();
      return closing;
    }
  };
}

/** Cancel a queued or running job when its selection is superseded. */
export async function prepareMapGrid(view, step, {signal, onProgress = () => {}, runTask} = {}) {
  signal?.throwIfAborted();
  const key = `${view}:${step}`;
  if (cache.has(key)) return cache.get(key);
  const discontinuous = Boolean(DISCONTINUOUS_VIEWS[view]);
  if (!discontinuous) {
    const grid = getCachedProjectionGrid(view);
    if (grid) return grid;
  }
  let result;
  if (runTask) {
    const data = await runTask(
      IceAgeGridTask,
      {view, step, discontinuous},
      {signal, onProgress, inputOwnership: 'copy'}
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
