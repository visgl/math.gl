// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {geoEquirectangular, geoOrthographic} from 'd3-geo';
import {tessellateGeoArrowStream} from '@math.gl/geospatial/geoarrow';

export function processGeometry({column, projection: name}, _options, context) {
  const factory = {equirectangular: geoEquirectangular, orthographic: geoOrthographic}[name];
  if (!factory) throw new Error('Unknown projection');
  const projection = factory().scale(100).translate([350, 200]);
  return tessellateGeoArrowStream(column, {
    createStream: sink => projection.stream(sink),
    onRowStart: () => context?.throwIfAborted?.()
  });
}
