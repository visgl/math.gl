// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original synthetic model qualification against independent native PROJ references.
import {fromArrayBuffer} from 'geotiff';
import {loadVelocityGeoTIFFGrid} from '@math.gl/projection/grids/velocity-geotiff';
import {qualifyDeformations} from '../test/deformation-workload';
export async function qualifyDeformation() {
  const response = await fetch('/deformation/linear-enu.tif');
  if (!response.ok) throw new Error('Missing authored velocity grid');
  const grid = await loadVelocityGeoTIFFGrid(await fromArrayBuffer(await response.arrayBuffer()));
  return qualifyDeformations(grid);
}
