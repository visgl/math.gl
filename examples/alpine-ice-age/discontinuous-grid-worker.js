// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {installWorkerTasks} from '@math.gl/geospatial/workers';
import {geospatialWorkerTasks} from '@math.gl/geospatial/workers/operations';
import {prepareDiscontinuousGrid} from './discontinuous-views.js';
import {prepareProjectionGrid} from './projection-grid.js';

installWorkerTasks(self, {
  ...geospatialWorkerTasks,
  'map-grid': async ({view, step}, context) => {
    const {map, ...grid} = await prepareDiscontinuousGrid(view, step, {
      onProgress: context.report,
      yieldTask: context.yieldTask
    });
    return {...grid, preparedMap: map.toPrepared()};
  },
  'projection-grid': ({view}, context) => prepareProjectionGrid(view, context)
});
