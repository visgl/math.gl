// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  projectGrid,
  transferGrid,
  formatMGRSZone,
  parseMGRSZone,
  unprojectGrid,
  standardGridZone,
  formatMGRS,
  parseMGRS,
  parseAngle,
  formatAngle,
  parseGeographicCoordinates,
  formatGeographicCoordinates,
  type GridCoordinate,
  type MGRSCoordinate
} from '@math.gl/geospatial/coordinates';
import {TriaxialEllipsoid} from '@math.gl/geospatial/triaxial';
import {EllipsoidGeodesic, EllipsoidRhumb} from '@math.gl/geospatial/ellipsoid';
import {GeodesicLineBuffer, RhumbLineBuffer} from '@math.gl/geospatial/geodesic-buffer';
const grid: GridCoordinate = projectGrid(20, 30);
unprojectGrid(grid);
standardGridZone(20, 30);
const cell: MGRSCoordinate = parseMGRS(formatMGRS(20, 30));
cell.resolution;
parseAngle('20:30N', 'latitude');
formatAngle(20, {axis: 'longitude', format: 'degrees', precision: 2});
parseGeographicCoordinates(formatGeographicCoordinates(20, 30));
new TriaxialEllipsoid({radii: [4, 2, 1]}).sampleSurface(() => 0.1);
const axes = {semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179};
const line = new EllipsoidGeodesic(axes).line(20, 30, 40),
  rhumb = new EllipsoidRhumb(axes).line(20, 30, 40);
new GeodesicLineBuffer(line, 2).positions(new Float64Array([0, 10]), new Float64Array(16));
new RhumbLineBuffer(rhumb, 2).positions([0, 10], new Float64Array(8));
// @ts-expect-error Packed output is double precision.
new GeodesicLineBuffer(line, 1).positions([0], new Float32Array(8));
// @ts-expect-error Explicit axis names.
parseAngle('20', 'easting');

const forced = projectGrid(60, 6, {zone: 31, north: true, extended: true});
transferGrid(forced, {zone: 32});
unprojectGrid(forced, {extended: true});
parseMGRSZone(formatMGRSZone(60, 6, {zone: 31}));
parseMGRS(formatMGRS(60, 6, 11, {zone: 31}));
formatAngle(12.5, {format: 'dm'});
parseGeographicCoordinates('3E, 60N', {longitudeFirst: true});
formatGeographicCoordinates(60, 3, {longitudeFirst: true, format: 'dm'});
// @ts-expect-error Hemispheres are explicit booleans.
projectGrid(60, 6, {north: 'N'});
