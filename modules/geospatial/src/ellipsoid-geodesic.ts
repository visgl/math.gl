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
  /** Include the signed geodesic edge area S12 in squared axis units. */
  area?: boolean;
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
  S12?: number;
};

interface EngineLine {
  Position(distance: number, mask: number): GeodesicResult;
  ArcPosition(arc: number, mask: number): GeodesicResult;
}
interface Engine {
  _c2: number;
  Inverse(lat1: number, lon1: number, lat2: number, lon2: number, mask: number): GeodesicResult;
  Line(latitude: number, longitude: number, azimuth: number, caps: number): EngineLine;
}
interface Namespace {
  Geodesic: new (a: number, f: number) => Engine;
  AREA: number;
  ALL: number;
  DISTANCE_IN: number;
  LONG_UNROLL: number;
}
const library = geodesic.Geodesic as unknown as Namespace;

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
    this.engine = createGeodesicEngine({semiMajorAxis: a, semiMinorAxis: b});
  }

  /** Total area in squared axis units, with the same normalization as S12. */
  get surfaceArea(): number {
    return 4 * Math.PI * this.engine._c2;
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
    validateFinite(azimuth);
    const selectedMask = outputMask(options);
    const line = this.engine.Line(latitude, longitude, azimuth, selectedMask | library.DISTANCE_IN);
    return {
      position(distance: number): GeodesicResult {
        validateFinite(distance);
        return line.Position(distance, selectedMask);
      },
      arcPosition(arc: number): GeodesicResult {
        validateFinite(arc);
        return line.ArcPosition(arc, selectedMask);
      }
    };
  }
}

function validatePoint(latitude: number, longitude: number): void {
  if (!(Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude))) {
    throw new Error('Invalid geodesic coordinates');
  }
}

function outputMask(options: GeodesicOptions): number {
  return (
    (library.ALL & ~(options.area ? 0 : library.AREA)) |
    (options.unrollLongitude ? library.LONG_UNROLL : 0)
  );
}

function validateFinite(value: number): void {
  if (!Number.isFinite(value))
    throw new Error('Geodesic axes, azimuth, distance and arc must be finite');
}

/** @internal Shared engine and non-area mask for projections. Keeping the raw
 * kernel separate lets projection bundles discard the public optional facade.
 */
export const nonAreaGeodesicMask = library.ALL & ~library.AREA;
export function createGeodesicEngine({
  semiMajorAxis: a,
  semiMinorAxis: b
}: GeodesicParameters): Engine {
  validateFinite(a);
  validateFinite(b);
  // The engine validates positivity of both derived axes.
  return new library.Geodesic(a, (a - b) / a);
}
