// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyLambertConformalConic: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
    {
      name: 'lcc',
      aliases: [
        'Lambert Tangential Conformal Conic Projection',
        'Lambert_Conformal_Conic',
        'Lambert_Conformal_Conic_1SP',
        'Lambert_Conformal_Conic_2SP',
        'Lambert Conic Conformal (1SP)',
        'Lambert Conic Conformal (2SP)'
      ]
    },
    async () => (await import('@math.gl/projection/projections/lcc')).lambertConformalConic
  );
