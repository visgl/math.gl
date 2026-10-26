// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2008-2022)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Zone exceptions and extended envelope rules adapted from GeographicLib 2.7 UTMUPS.cpp (MIT); original WGS84 facade reuses the existing attributed projection kernels. See ../../GEOGRAPHICLIB-LICENSE.txt.
import {universalTransverseMercator} from '../projection/experimental/projections/utm';
import type {ProjectionImplementation} from '../projection/experimental/types';
import {stereographic} from '../projection/experimental/projections/stere';
export type GridCoordinate = {
  zone: number;
  north: boolean;
  easting: number;
  northing: number;
};
const DEG = Math.PI / 180,
  A = 6378137,
  F = 1 / 298.257223563;
export function standardGridZone(latitude: number, longitude: number): number {
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    throw new RangeError('Expected latitude/longitude degrees in [-90,90]/[-180,180]');
  if (latitude < -80 || latitude >= 84) return 0;
  const lon = longitude === 180 ? -180 : longitude;
  let zone = Math.floor((Math.floor(lon) + 186) / 6);
  if (latitude >= 56 && latitude < 64 && lon >= 3 && lon < 12) zone = 32;
  if (latitude >= 72 && lon >= 0 && lon < 42)
    zone = 2 * Math.floor((Math.floor(lon) + 183) / 12) + 1;
  return zone;
}
const prepared = new Map<number, ProjectionImplementation>();
function projection(zone: number, north: boolean) {
  if (!Number.isInteger(zone) || zone < 0 || zone > 60 || typeof north !== 'boolean')
    throw new RangeError('Invalid UTM/UPS zone or hemisphere');
  const key = 2 * zone + Number(north),
    cached = prepared.get(key);
  if (cached) return cached;
  const parameters = zone
    ? {zone: String(zone), ...(north ? {} : {south: undefined})}
    : {
        lat_0: north ? '90' : '-90',
        k_0: '0.994',
        x_0: '2000000',
        y_0: '2000000'
      };
  const result = (zone ? universalTransverseMercator : stereographic).create({
    semiMajorAxis: A,
    eccentricitySquared: F * (2 - F),
    parameters
  });
  prepared.set(key, result);
  return result;
}
export type GridOptions = {
  zone?: number;
  north?: boolean;
  extended?: boolean;
};
/** Force a zone/hemisphere without changing datum. Extended ranges are opt-in. */
export function projectGrid(
  latitude: number,
  longitude: number,
  options: GridOptions = {}
): GridCoordinate {
  const standard = standardGridZone(latitude, longitude),
    zone = options.zone ?? standard,
    naturalNorth = !(latitude < 0 || Object.is(latitude, -0)),
    north = options.north ?? naturalNorth;
  validateZone(zone, north);
  if (zone === 0 && (Math.abs(latitude) < 70 || north !== naturalNorth))
    throw new RangeError('UPS requires its matching polar hemisphere');
  if (zone && Math.abs(((longitude - (6 * zone - 183) + 540) % 360) - 180) > 60)
    throw new RangeError('Longitude too far from UTM central meridian');
  if (zone === 0 && Math.abs(latitude) === 90)
    return {zone, north, easting: 2000000, northing: 2000000};
  const p = projection(zone, north).forward(longitude * DEG, latitude * DEG);
  // Degree-exact cardinal meridians must not select a neighboring MGRS cell
  // because sin(pi) or cos(pi/2) leaves a radian roundoff residual.
  if (zone === 0) {
    if (longitude % 180 === 0) p[0] = 2000000;
    if (Math.abs(longitude) === 90) p[1] = 2000000;
  }
  const result = {zone, north, easting: p[0], northing: p[1]};
  validateGrid(result, options.extended === true);
  return result;
}
function validateZone(zone: number, north: boolean) {
  if (!Number.isInteger(zone) || zone < 0 || zone > 60 || typeof north !== 'boolean')
    throw new RangeError('Invalid UTM/UPS zone or hemisphere');
}
function validateGrid({zone, north, easting, northing}: GridCoordinate, extended: boolean) {
  validateZone(zone, north);
  const polar = zone === 0,
    slop = extended ? 100000 : 0,
    low = polar ? (north ? 1300000 : 800000) : 100000,
    high = polar ? (north ? 2700000 : 3200000) : 900000,
    lowY = polar ? low : north ? (extended ? -9000000 : 0) : 1000000,
    highY = polar ? high : north ? 9500000 : extended ? 19500000 : 10000000;
  if (
    !Number.isFinite(easting) ||
    !Number.isFinite(northing) ||
    easting < low - slop ||
    easting > high + slop ||
    northing < lowY - slop ||
    northing > highY + slop
  )
    throw new RangeError('Grid coordinates outside the supported envelope');
}
export function unprojectGrid(
  grid: GridCoordinate,
  options: {extended?: boolean} = {}
): {
  latitude: number;
  longitude: number;
} {
  validateGrid(grid, options.extended === true);
  const p = projection(grid.zone, grid.north).inverse(grid.easting, grid.northing);
  return {latitude: p[1] / DEG, longitude: p[0] / DEG};
}
/** Re-express a grid point, preserving exact coordinates for same-zone transfers. */
export function transferGrid(grid: GridCoordinate, options: GridOptions = {}): GridCoordinate {
  validateGrid(grid, options.extended === true);
  const zone = options.zone ?? grid.zone,
    north = options.north ?? grid.north;
  validateZone(zone, north);
  if (zone === grid.zone) {
    if (zone === 0 && north !== grid.north) throw new RangeError('Cannot transfer UPS hemispheres');
    const result = {
      ...grid,
      north,
      northing: grid.northing + (north === grid.north ? 0 : north ? -1e7 : 1e7)
    };
    validateGrid(result, options.extended === true);
    return result;
  }
  const p = unprojectGrid(grid, options);
  return projectGrid(p.latitude, p.longitude, {...options, zone, north});
}
