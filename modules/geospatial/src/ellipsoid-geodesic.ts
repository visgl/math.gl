// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original typed facade over the separately attributed GeographicLib geodesic solver. See ../GEOGRAPHICLIB-LICENSE.txt.
import {geodesic} from './vendor/geographiclib-geodesic/runtime';

/** Two-axis revolution geometry. For compatibility, semiMajorAxis means the
 * equatorial radius a and semiMinorAxis the polar radius b, also when b > a.
 */
export type GeodesicParameters = {readonly semiMajorAxis: number; readonly semiMinorAxis: number};

export type GeodesicOptions = {
  /** Preserve longitude winding rather than normalizing to [-180, 180]. */
  unrollLongitude?: boolean;
};

/** Angles and azimuths are degrees; distances and reduced lengths use the axes' units. */
export type GeodesicResult = {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
  azi1: number;
  azi2: number;
  s12: number;
  m12: number;
  M12: number;
  M21: number;
  a12: number;
};

interface EngineLine {
  Position(distance: number, mask: number): GeodesicResult;
  ArcPosition(arc: number, mask: number): GeodesicResult;
}
interface Engine {
  Inverse(lat1: number, lon1: number, lat2: number, lon2: number, mask: number): GeodesicResult;
  Line(latitude: number, longitude: number, azimuth: number, caps: number): EngineLine;
}
interface Namespace {
  Geodesic: new (a: number, f: number) => Engine;
  STANDARD: number;
  REDUCEDLENGTH: number;
  GEODESICSCALE: number;
  DISTANCE_IN: number;
  LONG_UNROLL: number;
}
const library = geodesic.Geodesic as unknown as Namespace;
const mask = library.STANDARD | library.REDUCEDLENGTH | library.GEODESICSCALE;

/** A geodesic with a fixed starting point and initial azimuth. */
export interface GeodesicLine {
  position(distance: number): GeodesicResult;
  arcPosition(arc: number): GeodesicResult;
}

/** Geodesics on an oblate or prolate ellipsoid of revolution, or sphere, using Karney's series solver.
 * This class snapshots the axes. It does not accept triaxial ellipsoids or infer a CRS.
 */
export class EllipsoidGeodesic {
  private readonly engine: Engine;

  constructor({semiMajorAxis: a, semiMinorAxis: b}: GeodesicParameters) {
    if (!(Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0)) {
      throw new Error('Geodesics require finite positive equatorial and polar axes');
    }
    this.engine = new library.Geodesic(a, (a - b) / a);
  }

  inverse(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    options: GeodesicOptions = {}
  ): GeodesicResult {
    validatePoint(lat1, lon1);
    validatePoint(lat2, lon2);
    return this.engine.Inverse(lat1, lon1, lat2, lon2, outputMask(options));
  }

  direct(
    latitude: number,
    longitude: number,
    azimuth: number,
    distance: number,
    options: GeodesicOptions = {}
  ): GeodesicResult {
    return this.line(latitude, longitude, azimuth, options).position(distance);
  }

  arcDirect(
    latitude: number,
    longitude: number,
    azimuth: number,
    arc: number,
    options: GeodesicOptions = {}
  ): GeodesicResult {
    return this.line(latitude, longitude, azimuth, options).arcPosition(arc);
  }

  line(
    latitude: number,
    longitude: number,
    azimuth: number,
    options: GeodesicOptions = {}
  ): GeodesicLine {
    validatePoint(latitude, longitude);
    if (!Number.isFinite(azimuth)) throw new Error('Geodesic azimuth must be finite');
    const selectedMask = outputMask(options);
    const line = this.engine.Line(latitude, longitude, azimuth, selectedMask | library.DISTANCE_IN);
    return {
      position(distance: number): GeodesicResult {
        if (!Number.isFinite(distance)) throw new Error('Geodesic distance must be finite');
        return line.Position(distance, selectedMask);
      },
      arcPosition(arc: number): GeodesicResult {
        if (!Number.isFinite(arc)) throw new Error('Geodesic arc must be finite');
        return line.ArcPosition(arc, selectedMask);
      }
    };
  }
}

function validatePoint(latitude: number, longitude: number): void {
  if (!(Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude))) {
    throw new Error('Geodesic coordinates require finite longitude and latitude in [-90, 90]');
  }
}

function outputMask(options: GeodesicOptions): number {
  return mask | (options.unrollLongitude ? library.LONG_UNROLL : 0);
}
