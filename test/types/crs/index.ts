// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  checkProj4CRSCompatibility,
  Proj4Projection,
  toProj4CRSDefinition,
  type Proj4CRSCompatibilityResult,
  type Proj4CRSDefinition
} from '@math.gl/proj4';
import type {CRSDefinition, PROJJSONCRSByType} from '@math.gl/crs';

const serialized: CRSDefinition = 'EPSG:4326';
const geographic: PROJJSONCRSByType<'GeographicCRS'> = {
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum: {
    name: 'World Geodetic System 1984',
    ellipsoid: {
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    }
  }
};
const definition: Proj4CRSDefinition = geographic;
const convertedDefinition: Proj4CRSDefinition = toProj4CRSDefinition(geographic);
const compatibility: Proj4CRSCompatibilityResult = checkProj4CRSCompatibility(geographic);

new Proj4Projection({from: definition, to: serialized});
void convertedDefinition;
void compatibility;
