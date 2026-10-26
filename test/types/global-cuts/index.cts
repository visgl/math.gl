// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import cuts = require('@math.gl/geospatial/discontinuous');
const ring = [[0,0],[30,0],[0,30]] as const;
const map = new cuts.MapEngine({version:1,id:'map',definition:{type:'goode'}});
cuts.cutSphericalPolygon([ring],{interior:'left'});
map.projectGlobalPolygon([ring],{interior:'left'});
