// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createResourceWorker} from '@math.gl/core/worker-utils';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
await createResourceWorker({
  initialize: projection => new FullProjectionEngine().createProjection(projection),
  run: (projection, coordinates) => projection.projectFlatSync(coordinates, 2)
});
