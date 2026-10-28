// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {clipGeographicPolygon, clipGeographicPolyline, subdivideGeographicCutRing,
 type GeographicClipOptions, type GeographicCutEdge} from '@math.gl/geospatial';
const options: GeographicClipOptions = {edgeModel:'geodesic', latitudeRange:[0,90]};
const input = [{positions: [-40,-40,40,-40,40,40,-40,40]}];
const polygon = clipGeographicPolygon(input, options);
const edge: GeographicCutEdge = polygon[0].rings[0].edges[0];
const sampled = subdivideGeographicCutRing(input,polygon[0].rings[0],{...options,size:2,transform:p=>p,tolerance:.01});
clipGeographicPolyline([0,-20,10,20],options);
void [edge,sampled];
// @ts-expect-error latitude limits are required
clipGeographicPolygon(input, {edgeModel:'linear'});
// @ts-expect-error cut solvers are constructed from the supplied axes
clipGeographicPolyline([], {...options, geodesic:{}});
