// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  EllipsoidGeodesicExact,
  GeodesicPolygonExact,
  type ExactGeodesicOptions
} from '@math.gl/geospatial/geodesic-exact';
import {
  TriaxialEllipsoid,
  type TriaxialCoordinates,
  type CartesianGeodesicState
} from '@math.gl/geospatial/triaxial';
const options: ExactGeodesicOptions = {unrollLongitude: true};
const exact = new EllipsoidGeodesicExact({semiMajorAxis: 1, semiMinorAxis: 2});
const solved = exact.inverse(20, 30, -40, 160, options);
exact.line(solved.lat1, solved.lon1, solved.azi1, options).arcPosition(solved.a12);
const shape = new TriaxialEllipsoid({radii: [3, 2, 1] as const});
const system: TriaxialCoordinates = 'parametric';
const p = shape.toCartesian(20, 30, system),
  v = shape.directionToCartesian(p, 40);
const state: CartesianGeodesicState = shape
  .line(new Float64Array(p), new Float64Array(v))
  .position(2);
shape.fromCartesian(state.position, system);
shape.directionFromCartesian(state.position, state.direction);
exact.direct(20, 30, 40, 1, {area: true});
// @ts-expect-error The geometry snapshot cannot be assigned.
shape.radii = [1, 1, 1];
// @ts-expect-error Invalid coordinate system.
shape.toCartesian(20, 30, 'mercator');

const polygon = new GeodesicPolygonExact({semiMajorAxis: 1, semiMinorAxis: 2});
polygon.addPoint(0, 0).addPoint(0, 10).addPoint(90, 0).compute({unsigned: true});
