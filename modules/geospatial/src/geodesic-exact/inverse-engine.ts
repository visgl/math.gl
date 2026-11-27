// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2012-2025)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Length/Jacobi and Cayley-longitude formulae adapted from GeographicLib 2.7 GeodesicExact.cpp; original quadrature bridge. See ../../GEOGRAPHICLIB-LICENSE.txt.
import {geodesic} from '../vendor/geographiclib-geodesic/runtime';
import type {GeodesicResult} from '../ellipsoid-geodesic';
import {ellipticIntegrals} from './quadrature';
type State = {
  sig12: number;
  eps: number;
  ssig1: number;
  csig1: number;
  ssig2: number;
  csig2: number;
  salp2: number;
  calp2: number;
  lam12: number;
  domg12: number;
  dlam12: number;
};
type Lengths = {s12b: number; m12b: number; m0: number; M12: number; M21: number};
interface Engine {
  a: number;
  f: number;
  _b: number;
  _f1: number;
  _ep2: number;
  _e2: number;
  _c2: number;
  Inverse: (a: number, b: number, c: number, d: number, mask: number) => GeodesicResult;
  Lengths: (
    eps: number,
    sig12: number,
    s1: number,
    c1: number,
    d1: number,
    s2: number,
    c2: number,
    d2: number,
    cb1: number,
    cb2: number,
    mask: number,
    c1a?: number[],
    c2a?: number[]
  ) => Lengths;
  Lambda12: (
    sb1: number,
    cb1: number,
    dn1: number,
    sb2: number,
    cb2: number,
    dn2: number,
    sa1: number,
    ca1: number,
    sl: number,
    cl: number,
    diff: boolean,
    c1a: number[],
    c2a: number[],
    c3a: number[]
  ) => State;
  InverseStart: (
    sb1: number,
    cb1: number,
    dn1: number,
    sb2: number,
    cb2: number,
    dn2: number,
    lam: number,
    sl: number,
    cl: number,
    c1a: number[],
    c2a: number[]
  ) => {sig12: number; salp1: number; calp1: number};
}
type Namespace = {
  Geodesic: new (a: number, f: number) => Engine;
  ALL: number;
  AREA: number;
  LONG_UNROLL: number;
};
export const library = geodesic.Geodesic as unknown as Namespace;
export const angleMath = (
  geodesic as unknown as {
    Math: {
      sincosd: (x: number) => {s: number; c: number};
      AngNormalize: (x: number) => number;
      atan2d: (y: number, x: number) => number;
    };
  }
).Math;
/** Per-instance overrides only: the existing series engine and its prototype remain unchanged. */
export function exactInverseEngine(a: number, b: number): Engine {
  const engine = new library.Geodesic(a, (a - b) / a);
  engine.Lengths = function (eps, delta, s1, c1, d1, s2, c2, d2, cb1, cb2) {
    const k2 = (4 * eps) / (1 - eps) ** 2,
      I = ellipticIntegrals(k2, this._ep2),
      start = Math.atan2(s1, c1);
    const J = I.J(start, delta),
      t = (this._ep2 * (cb1 - cb2) * (cb1 + cb2)) / (d1 + d2);
    const cosine = c1 * c2 + s1 * s2;
    return {
      s12b: I.E(start, delta),
      m12b: d2 * (c1 * s2) - d1 * (s1 * c2) - c1 * c2 * J,
      m0: I.meanJ(),
      M12: cosine + ((t * s2 - c2 * J) * s1) / d1,
      M21: cosine - ((t * s1 - c1 * J) * s2) / d2
    };
  };
  // Force the bracketed solve rather than a series short-line approximation.
  engine.InverseStart = function (sb1, cb1, _d1, sb2, cb2, _d2, _lam, sl, cl) {
    let s = cb2 * sl,
      c = cb1 * sb2 - sb1 * cb2 * cl;
    const length = Math.hypot(s, c);
    if (length > 0 && s > 0) {
      s /= length;
      c /= length;
    } else {
      s = 1;
      c = 0;
    }
    return {sig12: -1, salp1: s, calp1: c};
  };
  const baseLambda = engine.Lambda12;
  engine.Lambda12 = function (sb1, cb1, dn1, sb2, cb2, dn2, sa1, ca1, sl, cl, diff, c1a, c2a, c3a) {
    const result = baseLambda.call(
      this,
      sb1,
      cb1,
      dn1,
      sb2,
      cb2,
      dn2,
      sa1,
      ca1,
      sl,
      cl,
      diff,
      c1a,
      c2a,
      c3a
    );
    const sa0 = sa1 * cb1,
      ca0 = Math.hypot(ca1, sa1 * sb1),
      k2 = ca0 * ca0 * this._ep2;
    const om1 = sa0 * sb1,
      co1 = ca1 * cb1,
      om2 = sa0 * sb2,
      co2 = result.calp2 * cb2;
    const ch1 = this._f1 * dn1 * co1,
      ch2 = this._f1 * dn2 * co2;
    const sch = Math.max(0, ch1 * om2 - om1 * ch2),
      cch = ch1 * ch2 + om1 * om2;
    const so = Math.max(0, co1 * om2 - om1 * co2),
      co = co1 * co2 + om1 * om2;
    const correction =
      (-this._e2 / this._f1) *
      sa0 *
      ellipticIntegrals(k2, this._ep2).H(Math.atan2(result.ssig1, result.csig1), result.sig12);
    result.lam12 = Math.atan2(sch * cl - cch * sl, cch * cl + sch * sl) + correction;
    result.domg12 = correction + Math.atan2(sch * co - cch * so, cch * co + sch * so);
    return result;
  };
  return engine;
}
