// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original meridian/isometric divided-integral rhumb solver. Independently compared with GeographicLib 2.7 Rhumb (Charles Karney, MIT); no upstream rhumb implementation copied. See ../GEOGRAPHICLIB-LICENSE.txt.
import {EllipsoidMetrics, integrate} from './ellipsoid-metrics';
import type {GeodesicParameters} from './ellipsoid-geodesic';

export type RhumbOptions = {
  area?: boolean;
  unrollLongitude?: boolean;
  /** Extra whole turns added to the shortest inverse longitude difference. */
  longitudeTurns?: number;
};
export type RhumbResult = {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
  azi12: number;
  s12: number;
  S12?: number;
};
export interface RhumbLine {
  position(distance: number): RhumbResult;
}

/** A physical rhumb endpoint is undefined here, as distinct from invalid input or failed convergence. */
export class RhumbDomainError extends RangeError {
  constructor(readonly reason: 'pole' | 'pole-crossing') {
    super(
      reason === 'pole'
        ? 'Rhumb longitude/bearing is undefined at an exact pole'
        : 'Rhumb crosses a pole; continuation longitude is undefined'
    );
    this.name = 'RhumbDomainError';
  }
}
const DEG = Math.PI / 180;

/** Constant-bearing paths on a revolution ellipsoid; explicit degrees and axis units.
 * Original integral algorithm, qualified for 0.5 <= b/a <= 2. Exact poles are
 * rejected rather than replaced by an arbitrary epsilon latitude.
 */
export class EllipsoidRhumb {
  readonly surfaceArea: number;
  private readonly a: number;
  private readonly r: number;
  private readonly metrics: EllipsoidMetrics;
  constructor({semiMajorAxis: a, semiMinorAxis: b}: GeodesicParameters) {
    if (!(Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0))
      throw new RangeError('Rhumbs require finite positive axes');
    this.a = a;
    this.r = b / a;
    this.metrics = new EllipsoidMetrics({semiMajorAxis: 1, semiMinorAxis: this.r});
    this.surfaceArea = a * this.metrics.surfaceArea * a;
    if (!(Number.isFinite(this.surfaceArea) && this.surfaceArea > 0))
      throw new RangeError('Rhumb surface area is unrepresentable');
    Object.freeze(this);
  }

  inverse(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    options: RhumbOptions = {}
  ): RhumbResult {
    validateRhumbPoint(lat1, lon1);
    validateRhumbPoint(lat2, lon2);
    const turns = options.longitudeTurns ?? 0;
    if (!Number.isSafeInteger(turns))
      throw new RangeError('Rhumb longitudeTurns must be a safe integer');
    const longitude = angleDifference(lon1, lon2) + 360 * turns;
    if (!Number.isFinite(longitude)) throw new RangeError('Unrepresentable rhumb winding');
    const dphi = (lat2 - lat1) * DEG;
    const [meanM, meanP] = this.means(lat1, lat2);
    const dx = (longitude * DEG * meanM) / meanP;
    const distance = this.a * Math.hypot(dphi * meanM, dx);
    const azi = Math.atan2(longitude * DEG, dphi * meanP) / DEG;
    const result: RhumbResult = {
      lat1,
      lon1,
      lat2,
      lon2: options.unrollLongitude ? lon1 + longitude : normalize(lon2),
      azi12: azi,
      s12: distance
    };
    if (options.area) result.S12 = this.area(lat1, lat2, longitude * DEG);
    if (!Number.isFinite(distance)) throw new RangeError('Unrepresentable rhumb distance');
    return result;
  }

  direct(
    latitude: number,
    longitude: number,
    azimuth: number,
    distance: number,
    options: RhumbOptions = {}
  ): RhumbResult {
    return this.line(latitude, longitude, azimuth, options).position(distance);
  }

  line(
    latitude: number,
    longitude: number,
    azimuth: number,
    options: RhumbOptions = {}
  ): RhumbLine {
    validateRhumbPoint(latitude, longitude);
    if (!Number.isFinite(azimuth)) throw new RangeError('Rhumb azimuth must be finite');
    const [sa, ca] = sincosDegrees(azimuth);
    const area = Boolean(options.area),
      unroll = Boolean(options.unrollLongitude);
    const azi = normalize(azimuth);
    return {
      position: (distance: number): RhumbResult => {
        if (!Number.isFinite(distance)) throw new RangeError('Rhumb distance must be finite');
        const delta = distance / this.a;
        if (!Number.isFinite(delta)) throw new RangeError('Unrepresentable rhumb distance');
        const north = delta * ca;
        if (north !== 0) {
          // Integrate the pole gap directly: subtracting two absolute meridian
          // ordinates discards valid steps close to a pole, even away from it.
          const gap =
            north > 0 ? this.meridianDelta(latitude, 90) : this.meridianDelta(-90, latitude);
          if (Math.abs(north) > gap) throw new RhumbDomainError('pole-crossing');
          if (Math.abs(north) === gap) throw new RhumbDomainError('pole');
        }
        const lat2 = north === 0 ? latitude : this.inverseMeridian(latitude, north);
        if (Math.abs(lat2) === 90) throw new RhumbDomainError('pole');
        const [meanM, meanP] = this.means(latitude, lat2);
        const dlon = (delta * sa * meanP) / meanM / DEG;
        const lon2 = unroll ? longitude + dlon : normalize(normalize(longitude) + dlon);
        if (!Number.isFinite(lon2)) throw new RangeError('Unrepresentable rhumb longitude');
        const result: RhumbResult = {
          lat1: latitude,
          lon1: longitude,
          lat2,
          lon2,
          azi12: azi,
          s12: distance
        };
        if (area) result.S12 = this.area(latitude, lat2, dlon * DEG);
        return result;
      }
    };
  }

  private means(lat1: number, lat2: number): [number, number] {
    const d = (lat2 - lat1) * DEG;
    const mid = (lat1 + lat2) / 2;
    const meanM = this.meridianMean(lat1, lat2);
    const cmin = Math.min(latitudeSinCos(lat1)[1], latitudeSinCos(lat2)[1]);
    // Divided integral, not subtraction of nearly equal meridian/isometric values.
    const meanP =
      Math.abs(d) < 0.25 * cmin
        ? integrate(
            t => {
              const [s, c] = latitudeSinCos(mid + (t * (lat2 - lat1)) / 2);
              return this.r ** 2 / (c * (c * c + (this.r * s) ** 2));
            },
            -1,
            1
          ) / 2
        : (this.psi(lat2) - this.psi(lat1)) / d;
    return [meanM, meanP];
  }

  private psi(latitude: number): number {
    return this.metrics.latitudeToAuxiliary(latitude, 'isometric') * DEG;
  }

  private meridianMean(lat1: number, lat2: number): number {
    const mid = (lat1 + lat2) / 2;
    return (
      integrate(
        t => {
          const [s, c] = latitudeSinCos(mid + (t * (lat2 - lat1)) / 2);
          return this.r ** 2 / Math.hypot(c, this.r * s) ** 3;
        },
        -1,
        1
      ) / 2
    );
  }

  private meridianDelta(lat1: number, lat2: number): number {
    return (lat2 - lat1) * DEG * this.meridianMean(lat1, lat2);
  }

  private inverseMeridian(start: number, displacement: number): number {
    let lo = -90,
      hi = 90;
    let phi = start + displacement / this.metrics.meridionalCurvatureRadius(start) / DEG;
    if (!(phi > lo && phi < hi)) phi = (start + Math.sign(displacement) * 90) / 2;
    for (let i = 0; i < 64; i++) {
      const residual = this.meridianDelta(start, phi) - displacement;
      if (residual === 0) return phi;
      if (residual < 0) lo = phi;
      else hi = phi;
      const next = phi - residual / this.metrics.meridionalCurvatureRadius(phi) / DEG;
      if (next === phi) return phi;
      phi = next > lo && next < hi ? next : (lo + hi) / 2;
      if (phi === lo || phi === hi) {
        // Select a representable non-pole endpoint with the smaller residual.
        const candidates = [lo, hi].filter(v => Math.abs(v) < 90);
        return candidates.reduce((best, v) =>
          Math.abs(this.meridianDelta(start, v) - displacement) <
          Math.abs(this.meridianDelta(start, best) - displacement)
            ? v
            : best
        );
      }
    }
    throw new Error('Rhumb meridian inversion did not converge');
  }

  private inversePsi(psi: number): number {
    // Bracketed Newton retains small isometric ordinates instead of bisecting
    // a fixed 180-degree interval down to a fixed absolute resolution.
    let lo = -90,
      hi = 90,
      phi = Math.atan(Math.sinh(psi)) / DEG;
    if (Math.abs(phi) === 90) phi = Math.sign(psi) * (90 - 2 ** -46);
    for (let i = 0; i < 32; i++) {
      const value = this.psi(phi) - psi;
      if (value === 0) return phi;
      if (value < 0) lo = phi;
      else hi = phi;
      const [s, c] = latitudeSinCos(phi);
      const next = phi - (value * c * (c * c + (this.r * s) ** 2)) / this.r ** 2 / DEG;
      if (next === phi) return phi;
      phi = next > lo && next < hi ? next : (lo + hi) / 2;
      if (phi === lo || phi === hi) return phi;
    }
    throw new Error('Rhumb isometric inversion did not converge');
  }

  private potential(latitude: number): number {
    const [s, c] = latitudeSinCos(latitude),
      e2 = (1 - this.r) * (1 + this.r),
      e = Math.sqrt(Math.abs(e2));
    const I = e === 0 ? s : (e2 > 0 ? Math.atanh(e * s) : Math.atan(e * s)) / e;
    return (this.r ** 2 * (s / (c * c + (this.r * s) ** 2) + I)) / 2;
  }

  private area(lat1: number, lat2: number, dlon: number): number {
    if (dlon === 0 || lat1 === -lat2) return 0;
    if (lat1 === lat2) {
      const value = this.a * dlon * (this.a * this.potential(lat1));
      if (!Number.isFinite(value)) throw new RangeError('Unrepresentable rhumb area');
      return value;
    }
    const p1 = this.psi(lat1),
      p2 = this.psi(lat2),
      mid = (p1 + p2) / 2,
      half = (p2 - p1) / 2;
    // Isometric integration resolves the logarithmic pole approach uniformly.
    const pieces = Math.max(1, Math.ceil(Math.abs(p2 - p1) / 2));
    let sum = 0;
    for (let j = 0; j < pieces; j++)
      sum += integrate(
        t => this.potential(this.inversePsi(mid + half * t)),
        -1 + (2 * j) / pieces,
        -1 + (2 * (j + 1)) / pieces
      );
    const value = this.a * dlon * (this.a * (sum / 2));
    if (!Number.isFinite(value)) throw new RangeError('Unrepresentable rhumb area');
    return value;
  }
}

/** @internal Shared with RhumbPolygon so even its first vertex rejects exact poles. */
export function validateRhumbPoint(latitude: number, longitude: number): void {
  if (!(Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude)))
    throw new RangeError('Rhumb coordinates require finite longitude and latitude in [-90,90]');
  if (Math.abs(latitude) === 90) throw new RhumbDomainError('pole');
}
function latitudeSinCos(phi: number): [number, number] {
  const p = Math.abs(phi);
  return p <= 45
    ? [Math.sin(phi * DEG), Math.cos(phi * DEG)]
    : [Math.sign(phi) * Math.cos((90 - p) * DEG), Math.sin((90 - p) * DEG)];
}
function sincosDegrees(angle: number): [number, number] {
  const reduced = angle % 360,
    q = Math.round(reduced / 90),
    d = reduced - 90 * q,
    x = d * DEG;
  const s = Math.sin(x),
    c = Math.cos(x);
  switch (((q % 4) + 4) % 4) {
    case 0:
      return [s, c];
    case 1:
      return [c, -s];
    case 2:
      return [-s, -c];
    default:
      return [-c, s];
  }
}
function normalize(angle: number): number {
  let a = angle % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}
function angleDifference(a: number, b: number): number {
  // Reduce before subtraction so common winding cannot swallow small differences.
  const difference = normalize(b) - normalize(a),
    result = normalize(difference);
  return Math.abs(result) === 180 ? (b - a < 0 ? -180 : 180) : result;
}
