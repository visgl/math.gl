// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2008-2022)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Zone exceptions adapted from GeographicLib 2.7 UTMUPS.cpp (MIT); original WGS84 facade reuses the existing attributed projection kernels. See ../../GEOGRAPHICLIB-LICENSE.txt.
import {universalTransverseMercator} from '../projection/experimental/projections/utm';
import type {ProjectionImplementation} from '../projection/experimental/types';
import {stereographic} from '../projection/experimental/projections/stere';
export type GridCoordinate = {zone: number; north: boolean; easting: number; northing: number};
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
    : {lat_0: north ? '90' : '-90', k_0: '0.994', x_0: '2000000', y_0: '2000000'};
  const result = (zone ? universalTransverseMercator : stereographic).create({
    semiMajorAxis: A,
    eccentricitySquared: F * (2 - F),
    parameters
  });
  prepared.set(key, result);
  return result;
}
export function projectGrid(latitude: number, longitude: number): GridCoordinate {
  const zone = standardGridZone(latitude, longitude),
    north = !(latitude < 0 || Object.is(latitude, -0));
  if (zone === 0 && Math.abs(latitude) === 90)
    return {zone, north, easting: 2000000, northing: 2000000};
  const p = projection(zone, north).forward(longitude * DEG, latitude * DEG);
  // Degree-exact cardinal meridians must not select a neighboring MGRS cell
  // because sin(pi) or cos(pi/2) leaves a radian roundoff residual.
  if (zone === 0) {
    if (longitude % 180 === 0) p[0] = 2000000;
    if (Math.abs(longitude) === 90) p[1] = 2000000;
  }
  return {zone, north, easting: p[0], northing: p[1]};
}
export function unprojectGrid({zone, north, easting, northing}: GridCoordinate): {
  latitude: number;
  longitude: number;
} {
  const polar = zone === 0,
    low = polar ? (north ? 1300000 : 800000) : 100000;
  const high = polar ? (north ? 2700000 : 3200000) : 900000;
  const lowY = polar ? low : north ? 0 : 1000000,
    highY = polar ? high : north ? 9500000 : 10000000;
  if (
    !Number.isFinite(easting) ||
    !Number.isFinite(northing) ||
    easting < low ||
    easting > high ||
    northing < lowY ||
    northing > highY
  )
    throw new RangeError('Grid coordinates outside the supported MGRS envelope');
  const p = projection(zone, north).inverse(easting, northing);
  return {latitude: p[1] / DEG, longitude: p[0] / DEG};
}
