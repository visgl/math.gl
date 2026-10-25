// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {runWorkerTask} from '@math.gl/geospatial/workers';
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import {prepareDiscontinuousGrid, DISCONTINUOUS_VIEWS} from './discontinuous-views.js';
import {cacheProjectionGrid, prepareProjectionGrid} from './projection-grid.js';

const cache = new Map();

/** Dedicated jobs make even synchronous map construction immediately cancellable. */
export async function prepareMapGrid(view, step, {signal, onProgress = () => {}} = {}) {
  signal?.throwIfAborted();
  const key = `${view}:${step}`;
  if (cache.has(key)) {
    onProgress({phase: 'ready', completed: 1, total: 1});
    return cache.get(key);
  }
  const discontinuous = Boolean(DISCONTINUOUS_VIEWS[view]);
  let result;
  if (typeof Worker !== 'undefined') {
    const data = await runWorkerTask(
      () => new Worker(new URL('./discontinuous-grid-worker.js', import.meta.url), {type: 'module'}),
      discontinuous ? 'map-grid' : 'projection-grid',
      {view, step},
      {signal, onProgress}
    );
    signal?.throwIfAborted();
    // Restore renderer methods without rerunning hinge selection or adaptive bounds sampling.
    if (discontinuous) {
      const {preparedMap, ...grid} = data;
      result = {...grid, map: MapEngine.fromPrepared(preparedMap)};
    } else result = data;
  } else if (discontinuous) {
    result = await prepareDiscontinuousGrid(view, step, {signal, onProgress});
  } else {
    result = await prepareProjectionGrid(view, {
      report: onProgress,
      yieldTask: async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        signal?.throwIfAborted();
      }
    });
  }
  signal?.throwIfAborted();
  if (!discontinuous) cacheProjectionGrid(view, result);
  if (cache.size >= 3) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  onProgress({phase: 'ready', completed: 1, total: 1});
  return result;
}
