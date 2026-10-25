// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import coordinates = require('@math.gl/geospatial/coordinates');
import buffers = require('@math.gl/geospatial/geodesic-buffer');
import ellipsoid = require('@math.gl/geospatial/ellipsoid');
import triaxial = require('@math.gl/geospatial/triaxial');
const grid:coordinates.GridCoordinate=coordinates.projectGrid(20,30);
coordinates.unprojectGrid(grid);coordinates.parseMGRS(coordinates.formatMGRS(20,30));
const line=new ellipsoid.EllipsoidGeodesic({semiMajorAxis:1,semiMinorAxis:1}).line(20,30,40);
new buffers.GeodesicLineBuffer(line,2).positions([0,1],new Float64Array(16));
new triaxial.TriaxialEllipsoid({radii:[4,2,1]}).sampleSurface(()=>.1);
