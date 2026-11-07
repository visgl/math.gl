// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {geoEquirectangular, geoOrthographic} from 'd3-geo';
import {geoInterruptedMollweide} from 'd3-geo-polygon';
export type ProjectionName = 'equirectangular' | 'orthographic' | 'interrupted';
export function createProjection(name: ProjectionName) {
  const projection = name === 'orthographic' ? geoOrthographic().rotate([-20, 30]).clipAngle(90)
    : name === 'interrupted' ? geoInterruptedMollweide()
    : name === 'equirectangular' ? geoEquirectangular() : null;
  if (!projection) throw new Error('Unknown projection');
  return projection.scale(140).translate([0, 0]).precision(0.2);
}
