// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/worker-utils';
import {prepareDiscontinuousGrid} from './discontinuous-views.js';
import {prepareProjectionGrid} from './projection-grid.js';

createWorker(async ({view, step, discontinuous}, _options, context) => {
  if (!discontinuous) {
    const grid = await prepareProjectionGrid(view, context);
    // The worker pool reuses cached grids; transfer only independent result buffers.
    return {...grid, positions: grid.positions.slice(), indices: grid.indices.slice()};
  }
  const {map, ...grid} = await prepareDiscontinuousGrid(view, step, {
    signal: {throwIfAborted: context.throwIfAborted},
    onProgress: context.reportProgress
  });
  return {...grid, positions: grid.positions.slice(), indices: grid.indices.slice(), preparedMap: map.toPrepared()};
});
