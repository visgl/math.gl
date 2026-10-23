// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2010-2023)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Area reduction and meridian transit rules adapted from GeographicLib 2.7 PolygonArea.cpp (MIT). Typed accumulation/preview facade uses the existing attributed GeographicLib accumulator. See ../GEOGRAPHICLIB-LICENSE.txt.
import {EllipsoidGeodesic, type GeodesicParameters} from './ellipsoid-geodesic';
import {geodesic} from './vendor/geographiclib-geodesic/runtime';

export type GeodesicPolygonOptions = {
  /** Clockwise positive instead of counterclockwise positive. */
  reverse?: boolean;
  /** Return [0, surfaceArea) instead of (-surfaceArea/2, surfaceArea/2]. */
  unsigned?: boolean;
};
export type GeodesicPolygonResult = {number: number; perimeter: number; area?: number};
interface Sum {
  Add(value: number): void;
  Sum(value?: number): number;
  Negate(): void;
  Remainder(value: number): void;
}
const Accumulator = geodesic.Accumulator.Accumulator as unknown as new (
  value?: number | Sum
) => Sum;
const math = geodesic.Math as unknown as {
  AngNormalize(value: number): number;
  AngDiff(a: number, b: number): {d: number; e: number};
};

/** Streaming geodesic polygon or open polyline. Point arguments are latitude,
 * longitude in degrees. Edge lengths use axis units and may be negative.
 * Self-intersections contribute algebraic area; no vertex list is retained.
 */
export class GeodesicPolygon {
  private readonly geodesic: EllipsoidGeodesic;
  readonly polyline: boolean;
  private readonly area0: number;
  private count = 0;
  private firstLat = 0;
  private firstLon = 0;
  private lastLat = 0;
  private lastLon = 0;
  private crossings = 0;
  private perimeter = new Accumulator();
  private area = new Accumulator();

  constructor(parameters: GeodesicParameters, options: {polyline?: boolean} = {}) {
    this.geodesic = new EllipsoidGeodesic(parameters);
    this.polyline = Boolean(options.polyline);
    this.area0 = this.geodesic.surfaceArea;
    if (!(Number.isFinite(this.area0) && this.area0 > 0)) {
      throw new Error('Polygon area exceeds representable range');
    }
  }

  get number(): number {
    return this.count;
  }

  clear(): this {
    this.count = this.crossings = 0;
    this.firstLat = this.firstLon = this.lastLat = this.lastLon = 0;
    this.perimeter = new Accumulator();
    this.area = new Accumulator();
    return this;
  }

  addPoint(latitude: number, longitude: number): this {
    if (!(Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude))) {
      throw new Error('Polygon point requires finite longitude and latitude in [-90, 90]');
    }
    if (this.count) {
      const edge = this.geodesic.inverse(this.lastLat, this.lastLon, latitude, longitude, {
        area: !this.polyline
      });
      this.accumulate(edge.s12, this.polyline ? 0 : edge.S12!);
      if (!this.polyline) {
        this.crossings = (this.crossings + transit(this.lastLon, longitude)) % 2;
      }
    } else {
      this.firstLat = latitude;
      this.firstLon = longitude;
    }
    this.lastLat = latitude;
    this.lastLon = longitude;
    ++this.count;
    return this;
  }

  addEdge(azimuth: number, distance: number): this {
    if (!this.count) throw new Error('Add a starting point before adding an edge');
    const edge = this.geodesic.direct(this.lastLat, this.lastLon, azimuth, distance, {
      area: !this.polyline,
      unrollLongitude: true
    });
    if (!(Number.isFinite(edge.lat2) && Number.isFinite(edge.lon2)))
      throw new Error('Unrepresentable geodesic edge');
    this.accumulate(distance, this.polyline ? 0 : edge.S12!);
    if (!this.polyline) {
      this.crossings = (this.crossings + transitDirect(this.lastLon, edge.lon2)) % 2;
    }
    this.lastLat = edge.lat2;
    this.lastLon = edge.lon2;
    ++this.count;
    return this;
  }

  compute(options: GeodesicPolygonOptions = {}): GeodesicPolygonResult {
    if (this.count < 2)
      return this.polyline
        ? {number: this.count, perimeter: 0}
        : {number: this.count, perimeter: 0, area: 0};
    if (this.polyline) return {number: this.count, perimeter: this.perimeter.Sum()};
    const edge = this.geodesic.inverse(this.lastLat, this.lastLon, this.firstLat, this.firstLon, {
      area: true
    });
    const total = new Accumulator(this.area);
    total.Add(edge.S12!);
    const area0 = this.area0;
    total.Remainder(area0);
    if ((this.crossings + transit(this.lastLon, this.firstLon)) % 2 !== 0) {
      total.Add(((total.Sum() < 0 ? 1 : -1) * area0) / 2);
    }
    if (!options.reverse) total.Negate();
    if (options.unsigned) {
      if (total.Sum() >= area0) total.Add(-area0);
      else if (total.Sum() < 0) total.Add(area0);
    } else {
      if (total.Sum() > area0 / 2) total.Add(-area0);
      else if (total.Sum() <= -area0 / 2) total.Add(area0);
    }
    return {number: this.count, perimeter: this.perimeter.Sum(edge.s12), area: 0 + total.Sum()};
  }

  /** Nonmutating preview, with the same compensated arithmetic as insertion. */
  testPoint(
    latitude: number,
    longitude: number,
    options: GeodesicPolygonOptions = {}
  ): GeodesicPolygonResult {
    return this.copy().addPoint(latitude, longitude).compute(options);
  }

  testEdge(
    azimuth: number,
    distance: number,
    options: GeodesicPolygonOptions = {}
  ): GeodesicPolygonResult {
    return this.copy().addEdge(azimuth, distance).compute(options);
  }

  private accumulate(distance: number, area: number): void {
    if (
      ![distance, area, this.perimeter.Sum(distance), this.area.Sum(area)].every(Number.isFinite)
    ) {
      throw new Error('Unrepresentable geodesic sum');
    }
    this.perimeter.Add(distance);
    if (!this.polyline) this.area.Add(area);
  }

  private copy(): GeodesicPolygon {
    // No engine setup or vertex replay for previews.
    const copy = Object.create(GeodesicPolygon.prototype) as GeodesicPolygon;
    Object.assign(copy, this);
    copy.perimeter = new Accumulator(this.perimeter);
    copy.area = new Accumulator(this.area);
    return copy;
  }
}

function transit(a: number, b: number): number {
  const delta = math.AngDiff(a, b).d;
  a = math.AngNormalize(a);
  b = math.AngNormalize(b);
  return delta > 0 && ((a < 0 && b >= 0) || (a > 0 && b === 0))
    ? 1
    : delta < 0 && a >= 0 && b < 0
      ? -1
      : 0;
}
function transitDirect(a: number, b: number): number {
  a %= 720;
  b %= 720;
  return (b >= 0 && b < 360 ? 0 : 1) - (a >= 0 && a < 360 ? 0 : 1);
}
