// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {GeographicCutAtlas,createOrthographicCutAtlas,createOctahedralCutAtlas,createOctahedralCutGraph,type GeographicCutGraph,type GeographicAtlasRing} from '@math.gl/geospatial';
const graph:GeographicCutGraph=createOctahedralCutGraph();
const atlas=new GeographicCutAtlas(graph,{edgeModel:'rhumb'});
const inputs=[{positions:[-40,-40,40,-40,40,40,-40,40]}];
const ring:GeographicAtlasRing=atlas.clipPolygon(inputs)[0].rings[0];
const view=createOrthographicCutAtlas({viewDirection:[1,2,3],edgeModel:'geodesic'});
view.atlas.subdivideRing(inputs,ring,{transform:view.project,tolerance:10});
const part=view.atlas.clipPolyline([0,-20,20,40])[0];
view.atlas.subdividePolyline([0,-20,20,40],part,{transform:view.project,tolerance:10});
const map=createOctahedralCutAtlas({edgeModel:'linear'});
map.project('1/1/1',[10,10]);
// @ts-expect-error the edge model is explicit
new GeographicCutAtlas(graph,{});
