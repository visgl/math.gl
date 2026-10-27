// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/worker-utils';
import {prepareDiscontinuousGrid} from './discontinuous-views.js';
import {prepareProjectionGrid} from './projection-grid.js';

createWorker(async ({view, step, discontinuous}, _options, context) => {
  if (!discontinuous) return prepareProjectionGrid(view, context);
  const {map, ...grid} = await prepareDiscontinuousGrid(view, step, {
    onProgress: context.reportProgress
  });
  return {...grid, preparedMap: map.toPrepared()};
});
