// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import cuts = require('@math.gl/geospatial/maps');
const ring = [[0,0],[30,0],[0,30]] as const;
const map = new cuts.MapEngine({version:1,id:'map',definition:{type:'goode'}}, {presets: [cuts.goodeMapPreset], geometry: cuts.mapGeometry});
cuts.cutSphericalPolygon([ring],{interior:'left'});
map.projectGlobalPolygon([ring],{interior:'left'});
