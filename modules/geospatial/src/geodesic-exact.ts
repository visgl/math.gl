// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2012-2025)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Auxiliary-sphere, Cayley longitude and Jacobi formulae adapted from GeographicLib 2.7 GeodesicExact/GeodesicLineExact. Original quadrature and typed API. See ../GEOGRAPHICLIB-LICENSE.txt.
import type {GeodesicParameters, GeodesicResult, GeodesicLine} from './ellipsoid-geodesic';
import {exactInverseEngine, angleMath, library} from './geodesic-exact/inverse-engine';
import {ellipticIntegrals} from './geodesic-exact/quadrature';
import {areaCorrection} from './geodesic-exact/area';
export type ExactGeodesicOptions = {unrollLongitude?: boolean; area?: boolean};
const DEG = Math.PI / 180;
function point(lat: number, lon: number) {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 1e6)
    throw new RangeError('Expected latitude in [-90,90] and longitude in [-1e6,1e6]');
}
function finite(x: number) {
  if (!Number.isFinite(x)) throw new RangeError('Expected finite geodesic argument');
}
/** Elliptic-integral revolution geodesics, independently selected from the series solver.
 * Angles are degrees. Qualified axis ratio b/a is [0.25,4], axis scales [1e-60,1e60].
 * Signed edge area is opt-in and uses squared axis units.
 */
export class EllipsoidGeodesicExact {
  private readonly engine: ReturnType<typeof exactInverseEngine>;
  private readonly axes: readonly [number, number];
  constructor({semiMajorAxis: a, semiMinorAxis: b}: GeodesicParameters) {
    if (
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      Math.min(a, b) < 1e-60 ||
      Math.max(a, b) > 1e60 ||
      b / a < 0.25 ||
      b / a > 4
    )
      throw new RangeError('Exact geodesics require axes in [1e-60,1e60] and b/a in [0.25,4]');
    this.axes = Object.freeze([a, b] as const);
    this.engine = exactInverseEngine(a, b);
  }
  get semiMajorAxis(): number {
    return this.axes[0];
  }
  get semiMinorAxis(): number {
    return this.axes[1];
  }
  get surfaceArea(): number {
    return 4 * Math.PI * this.engine._c2;
  }
  inverse(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    options: ExactGeodesicOptions = {}
  ): GeodesicResult {
    point(lat1, lon1);
    point(lat2, lon2);
    const result = this.engine.Inverse(
      lat1,
      lon1,
      lat2,
      lon2,
      (library.ALL & ~library.AREA) | (options.unrollLongitude ? library.LONG_UNROLL : 0)
    );
    if (
      ![result.s12, result.azi1, result.azi2, result.m12, result.M12, result.M21, result.a12].every(
        Number.isFinite
      )
    )
      throw new RangeError('Exact inverse did not converge');
    let azimuth = result.azi1,
      distance = result.s12;
    const target = angleMath.sincosd(lat2),
      f1 = this.semiMinorAxis / this.semiMajorAxis;
    const denominator = Math.sqrt(1 - (1 - f1 * f1) * target.s * target.s);
    const meridian = (this.semiMajorAxis * f1 * f1) / denominator ** 3;
    const parallel = (this.semiMajorAxis * target.c) / denominator;
    for (let iteration = 0; iteration < 8; iteration++) {
      const endpoint = this.direct(lat1, lon1, azimuth, distance, {area: options.area});
      const north = meridian * (lat2 - endpoint.lat2) * DEG;
      const east =
        parallel * angleMath.AngNormalize(angleMath.AngNormalize(lon2) - endpoint.lon2) * DEG;
      // Propagate angular subtraction roundoff into physical endpoint units.
      // Longitude labels near 180 degrees can lose several ulps even on short routes.
      const rounding =
        8 *
          Number.EPSILON *
          (options.area &&
          Math.abs(distance) < 1e-5 * Math.max(this.semiMajorAxis, this.semiMinorAxis)
            ? Math.abs(distance)
            : Math.max(this.semiMajorAxis, this.semiMinorAxis)) +
        4 *
          Number.EPSILON *
          DEG *
          (Math.abs(meridian) * (Math.abs(lat2) + Math.abs(endpoint.lat2)) +
            Math.abs(parallel) *
              (Math.abs(angleMath.AngNormalize(lon2)) + Math.abs(endpoint.lon2)));
      if (Math.hypot(north, east) <= rounding) {
        let edgeArea = endpoint.S12;
        if (options.area && Math.abs(lat1) < Math.abs(lat2) && Math.abs(lat2) < 90) {
          // Evaluate area from the more polar endpoint, so terminal bearing
          // roundoff is not amplified at a nearly polar endpoint. Reversal is
          // algebraically exact; the reversed call cannot take this branch.
          edgeArea = -this.inverse(lat2, lon2, lat1, lon1, {area: true}).S12!;
        }
        return {
          ...endpoint,
          lat2,
          lon1: result.lon1,
          lon2: result.lon2,
          ...(options.area ? {S12: edgeArea} : {}),
          ...(options.area && Math.abs(lat2) === 90
            ? {S12: this.engine._c2 * angleMath.AngNormalize(result.azi2 - result.azi1) * DEG}
            : {}),
          azi2:
            Math.abs(lat2) === 90
              ? angleMath.AngNormalize(
                  endpoint.azi2 + Math.sign(lat2) * (angleMath.AngNormalize(lon2) - endpoint.lon2)
                )
              : endpoint.azi2
        };
      }
      if (distance === 0 || Math.abs(endpoint.m12) < 1e-15 * this.semiMajorAxis) break;
      const heading = angleMath.sincosd(endpoint.azi2);
      distance += heading.c * north + heading.s * east;
      azimuth += (heading.c * east - heading.s * north) / endpoint.m12 / DEG;
    }
    throw new RangeError('Exact inverse endpoint residual');
  }

  direct(
    lat: number,
    lon: number,
    azimuth: number,
    distance: number,
    options: ExactGeodesicOptions = {}
  ): GeodesicResult {
    return this.line(lat, lon, azimuth, options).position(distance);
  }
  line(
    lat: number,
    lon: number,
    azimuth: number,
    options: ExactGeodesicOptions = {}
  ): GeodesicLine {
    point(lat, lon);
    finite(azimuth);
    const a = this.semiMajorAxis,
      b = this.semiMinorAxis,
      f1 = b / a,
      ep2 = (a / b) ** 2 - 1,
      e2 = 1 - f1 * f1;
    const phi = angleMath.sincosd(lat),
      alpha = angleMath.sincosd(angleMath.AngNormalize(azimuth));
    const norm = Math.hypot(phi.s * f1, phi.c),
      sb1 = (phi.s * f1) / norm,
      cb1 = Math.max(1e-150, phi.c / norm);
    const sa0 = alpha.s * cb1,
      ca0 = Math.hypot(alpha.c, alpha.s * sb1);
    let s1 = sb1,
      c1 = sb1 !== 0 || alpha.c !== 0 ? cb1 * alpha.c : 1;
    const sigmaNorm = Math.hypot(s1, c1);
    s1 /= sigmaNorm;
    c1 /= sigmaNorm;
    const sig1 = Math.atan2(s1, c1);
    const k2 = ca0 * ca0 * ep2,
      I = ellipticIntegrals(k2, ep2),
      dn1 = Math.sqrt(1 + k2 * s1 * s1);
    const sign = sa0 < 0 || Object.is(sa0, -0) ? -1 : 1;
    const includeArea = Boolean(options.area);
    const unroll = Boolean(options.unrollLongitude),
      azi1 = angleMath.AngNormalize(azimuth);
    const distanceLimit = b * I.E(sig1, 4 * Math.PI);
    const evaluate = (delta: number, distance?: number): GeodesicResult => {
      const s2 = s1 * Math.cos(delta) + c1 * Math.sin(delta),
        c2 = c1 * Math.cos(delta) - s1 * Math.sin(delta);
      const dn2 = Math.sqrt(1 + k2 * s2 * s2),
        J = I.J(sig1, delta);
      const chi2 = Math.atan2(sign * sa0 * s2, f1 * dn2 * c2),
        signedChi1 = Math.atan2(sign * sa0 * s1, f1 * dn1 * c1);
      const t = (k2 * (s2 - s1) * (s2 + s1)) / (dn1 + dn2);
      // Form short angular differences from cross/dot products, avoiding subtraction
      // of near-pi phases on tiny edges. The dn difference is rationalized above.
      const chi =
        sa0 === 0
          ? Math.round(
              (sign * (delta - (Math.atan2(s2, c2) - Math.atan2(s1, c1)) + (chi2 - signedChi1))) /
                Math.PI
            ) * Math.PI
          : sign *
            (delta -
              Math.atan2(Math.sin(delta), Math.cos(delta)) +
              Math.atan2(
                sign * sa0 * f1 * (dn1 * Math.sin(delta) - t * s1 * c2),
                f1 * f1 * dn1 * dn2 * c1 * c2 + sa0 * sa0 * s1 * s2
              ));
      const longitude =
        (unroll ? lon : angleMath.AngNormalize(lon)) +
        (chi - (e2 / f1) * sa0 * I.H(sig1, delta)) / DEG;
      const cosine = Math.cos(delta);
      return {
        lat1: lat,
        lon1: unroll ? lon : angleMath.AngNormalize(lon),
        azi1,
        lat2: angleMath.atan2d(ca0 * s2, f1 * Math.hypot(sa0, ca0 * c2)),
        lon2: unroll ? longitude : angleMath.AngNormalize(longitude),
        azi2: angleMath.atan2d(sa0, ca0 * c2),
        s12: distance === undefined ? b * I.E(sig1, delta) : distance,
        a12: delta / DEG,
        m12: b * (dn2 * (c1 * s2) - dn1 * (s1 * c2) - c1 * c2 * J),
        M12: cosine + ((t * s2 - c2 * J) * s1) / dn1,
        M21: cosine - ((t * s1 - c1 * J) * s2) / dn2,
        ...(includeArea
          ? {
              S12: (() => {
                const sd = Math.sin(delta),
                  cd = Math.cos(delta);
                const sine =
                  ca0 *
                  sa0 *
                  (cd <= 0 ? c1 * (1 - cd) + sd * s1 : sd * ((c1 * sd) / (1 + cd) + s1));
                const cosine = sa0 * sa0 + ca0 * ca0 * c1 * c2;
                const angle =
                  ca0 === 0 || sa0 === 0
                    ? Math.atan2(
                        sa0 * alpha.c - ca0 * c2 * alpha.s,
                        ca0 * c2 * alpha.c + sa0 * alpha.s
                      )
                    : Math.atan2(sine, cosine);
                return (
                  this.engine._c2 * angle +
                  (a * a * e2 * ca0 * sa0 === 0
                    ? 0
                    : a * a * e2 * ca0 * sa0 * areaCorrection(ep2, k2, s1, c1, delta))
                );
              })()
            }
          : {})
      };
    };
    return {
      arcPosition: (arc: number) => {
        finite(arc);
        if (Math.abs(arc) > 720) throw new RangeError('Exact line arc exceeds 720 degrees');
        return evaluate(arc * DEG);
      },
      position: (distance: number) => {
        finite(distance);
        if (Math.abs(distance) > distanceLimit)
          throw new RangeError('Exact line distance exceeds support profile');
        const target = distance / b,
          lowDn = Math.min(1, a / b),
          highDn = Math.max(1, a / b);
        let lower = Math.max(-4 * Math.PI, Math.min(target / lowDn, target / highDn)),
          upper = Math.min(4 * Math.PI, Math.max(target / lowDn, target / highDn));
        let delta = Math.max(lower, Math.min(upper, target / I.meanE()));
        for (let i = 0; i < 80; i++) {
          const residual = I.E(sig1, delta) - target;
          if (Math.abs(residual) <= Number.EPSILON * Math.max(Math.abs(target), 1e-300))
            return evaluate(delta, distance);
          if (residual > 0) upper = delta;
          else lower = delta;
          const next = delta - residual / Math.sqrt(1 + k2 * Math.sin(sig1 + delta) ** 2);
          const value = next > lower && next < upper ? next : (lower + upper) / 2;
          if (value === delta) return evaluate(delta, distance);
          delta = value;
        }
        throw new RangeError('Exact distance inversion did not converge');
      }
    };
  }
}

export {GeodesicPolygonExact} from './geodesic-exact/polygon';
export type {
  SurfacePolygonOptions as ExactPolygonOptions,
  SurfacePolygonResult as ExactPolygonResult
} from './ellipsoid-helpers/surface-polygon';
