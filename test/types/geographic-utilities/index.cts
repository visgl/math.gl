// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import coordinates = require('@math.gl/geospatial');
import buffers = require('@math.gl/geospatial');
import ellipsoid = require('@math.gl/geospatial');
import triaxial = require('@math.gl/geospatial');
const grid:coordinates.GridCoordinate=coordinates.projectGrid(20,30);
coordinates.unprojectGrid(grid);coordinates.parseMGRS(coordinates.formatMGRS(20,30));
const line=new ellipsoid.EllipsoidGeodesic({semiMajorAxis:1,semiMinorAxis:1}).line(20,30,40);
new buffers.GeodesicLineBuffer(line,2).positions([0,1],new Float64Array(16));
new triaxial.TriaxialEllipsoid({radii:[4,2,1]}).sampleSurface(()=>.1);

const {projectGrid, transferGrid, unprojectGrid, parseMGRSZone, formatMGRSZone,
  parseMGRS, formatMGRS, formatAngle, parseGeographicCoordinates, formatGeographicCoordinates} = coordinates;
const forced = projectGrid(60,6,{zone:31,north:true,extended:true});
transferGrid(forced,{zone:32});
unprojectGrid(forced,{extended:true});
parseMGRSZone(formatMGRSZone(60,6,{zone:31}));
parseMGRS(formatMGRS(60,6,11,{zone:31}));
formatAngle(12.5,{format:'dm'});
parseGeographicCoordinates('3E, 60N',{longitudeFirst:true});
formatGeographicCoordinates(60,3,{longitudeFirst:true,format:'dm'});
// @ts-expect-error Hemispheres are explicit booleans.
projectGrid(60,6,{north:'N'});
