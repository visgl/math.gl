// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Adapted from visgl/deck.gl PR #10966 (MIT); rings use D3 spherical winding here.
import {GeoArrowBuilder} from '@math.gl/geospatial/geoarrow';
export const names = ['Antimeridian', 'Polygon with hole', 'South pole'];
export function fixtureColumn() {
  return GeoArrowBuilder.build([
    {type: 'Polygon', coordinates: [[
      [170, -15], [170, 15], [-170, 15], [-170, -15], [170, -15]
    ]]},
    {type: 'Polygon', coordinates: [
      [[-30, -25], [-30, 25], [30, 25], [30, -25], [-30, -25]],
      [[-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]]
    ]},
    {type: 'Polygon', coordinates: [[
      [-180, -70], [-90, -70], [0, -70], [90, -70], [180, -70], [-180, -70]
    ]]}
  ], {encoding: 'geoarrow.polygon', dimension: 'xy'});
}
