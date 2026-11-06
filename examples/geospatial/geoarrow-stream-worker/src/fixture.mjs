// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {GeoArrowBuilder} from '@math.gl/geospatial/geoarrow';
export function fixture() {
  // Clockwise spherical exterior rings for D3; no implicit winding conversion.
  return GeoArrowBuilder.build([
    null,
    {type:'Polygon',coordinates:[[[170,-10],[170,10],[-170,10],[-170,-10],[170,-10]]]},
    {type:'Polygon',coordinates:[[[-30,-20],[-30,20],[30,20],[30,-20],[-30,-20]], [[-10,-10],[10,-10],[10,10],[-10,10],[-10,-10]]]}
  ],{encoding:'geoarrow.polygon',dimension:'xy'});
}
