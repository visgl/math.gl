// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original typed facade over the separately attributed GeographicLib geodesic solver. See ../GEOGRAPHICLIB-LICENSE.txt.
import type {SpheroidParameters} from '@math.gl/core/types';
import {geodesic} from './vendor/geographiclib-geodesic/runtime';

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
}
const library = geodesic.Geodesic as unknown as Namespace;
const mask = library.STANDARD | library.REDUCEDLENGTH | library.GEODESICSCALE;

/** A geodesic with a fixed starting point and initial azimuth. */
export interface GeodesicLine {
  position(distance: number): GeodesicResult;
}

/** Shortest geodesics on an oblate ellipsoid or sphere, using Karney's series solver.
 * This class snapshots the axes. It does not accept triaxial ellipsoids or infer a CRS.
 */
export class EllipsoidGeodesic {
  private readonly engine: Engine;

  constructor({semiMajorAxis: a, semiMinorAxis: b}: SpheroidParameters) {
    if (!(Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0 && b <= a)) {
      throw new Error('Geodesics require finite positive axes with semiMinorAxis <= semiMajorAxis');
    }
    this.engine = new library.Geodesic(a, (a - b) / a);
  }

  inverse(lat1: number, lon1: number, lat2: number, lon2: number): GeodesicResult {
    validatePoint(lat1, lon1);
    validatePoint(lat2, lon2);
    return this.engine.Inverse(lat1, lon1, lat2, lon2, mask);
  }

  direct(latitude: number, longitude: number, azimuth: number, distance: number): GeodesicResult {
    return this.line(latitude, longitude, azimuth).position(distance);
  }

  line(latitude: number, longitude: number, azimuth: number): GeodesicLine {
    validatePoint(latitude, longitude);
    if (!Number.isFinite(azimuth)) throw new Error('Geodesic azimuth must be finite');
    const line = this.engine.Line(latitude, longitude, azimuth, mask | library.DISTANCE_IN);
    return {
      position(distance: number): GeodesicResult {
        if (!Number.isFinite(distance)) throw new Error('Geodesic distance must be finite');
        return line.Position(distance, mask);
      }
    };
  }
}

function validatePoint(latitude: number, longitude: number): void {
  if (!(Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude))) {
    throw new Error('Geodesic coordinates require finite longitude and latitude in [-90, 90]');
  }
}
