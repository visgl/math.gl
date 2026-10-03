// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  no_off: boolean;
  no_rot: boolean;
  alpha: number;
  rectified_grid_angle: number;
  longc: number;
  long1: number;
  long2: number;
  B: number;
  A: number;
  E: number;
  lam0: number;
  singam: number;
  cosgam: number;
  sinrot: number;
  cosrot: number;
  rB: number;
  ArB: number;
  BrA: number;
  u_0: number;
  v_pole_n: number;
  v_pole_s: number;
  no_uoff: boolean;
  projName: string;
};
import tsfnz from '../common/tsfnz';
import adjust_lon from '../common/adjust_lon';
import phi2z from '../common/phi2z';
import {EPSLN, HALF_PI, TWO_PI, FORTPI} from '../common/constants';

var TOL = 1e-7;

function isTypeA(P: State): boolean {
  return (
    P.no_uoff ||
    P.no_off ||
    [
      'hotineobliquemercator',
      'hotineobliquemercatorvarianta',
      'hotineobliquemercatorazimuthnaturalorigin'
    ].includes(P.projName.toLowerCase().replace(/[ _-]/g, ''))
  );
}

function initialize(state: State): void {
  var con,
    com,
    cosph0,
    D,
    F,
    H,
    L,
    sinph0,
    p,
    J,
    gamma = 0,
    gamma0,
    lamc = 0,
    lam1 = 0,
    lam2 = 0,
    phi1 = 0,
    phi2 = 0,
    alpha_c = 0;

  if (!state.k0) {
    state.k0 = 1;
  }

  // only Type A uses the no_off or no_uoff property
  // https://github.com/OSGeo/proj.4/issues/104
  state.no_off = isTypeA(state);
  state.no_rot = state.no_rot;

  var alp = false;
  if (Number.isFinite(state.alpha)) {
    alp = true;
  }

  var gam = false;
  if (Number.isFinite(state.rectified_grid_angle)) {
    gam = true;
  }

  if (alp) {
    alpha_c = state.alpha;
  }

  if (gam) {
    gamma = state.rectified_grid_angle;
    if (!alp) {
      alpha_c = 0;
      alp = true;
    }
  }

  if (alp || gam) {
    lamc = state.longc;
  } else {
    lam1 = state.long1;
    phi1 = state.lat1;
    lam2 = state.long2;
    phi2 = state.lat2;

    if (
      Math.abs(phi1 - phi2) <= TOL ||
      Math.abs(phi1) <= TOL ||
      Math.abs(Math.abs(phi1) - HALF_PI) <= TOL ||
      Math.abs(Math.abs(state.lat0) - HALF_PI) <= TOL ||
      Math.abs(Math.abs(phi2) - HALF_PI) <= TOL
    ) {
      throw new Error();
    }
  }

  var one_es = 1.0 - state.es;
  com = Math.sqrt(one_es);

  if (Math.abs(state.lat0) > EPSLN) {
    sinph0 = Math.sin(state.lat0);
    cosph0 = Math.cos(state.lat0);
    con = 1 - state.es * sinph0 * sinph0;
    state.B = cosph0 * cosph0;
    state.B = Math.sqrt(1 + (state.es * state.B * state.B) / one_es);
    state.A = (state.B * state.k0 * com) / con;
    D = (state.B * com) / (cosph0 * Math.sqrt(con));
    F = D * D - 1;

    if (F <= 0) {
      F = 0;
    } else {
      F = Math.sqrt(F);
      if (state.lat0 < 0) {
        F = -F;
      }
    }

    state.E = F += D;
    state.E *= Math.pow(tsfnz(state.e, state.lat0, sinph0), state.B);
  } else {
    state.B = 1 / com;
    state.A = state.k0;
    state.E = D = F = 1;
  }

  if (alp || gam) {
    if (alp) {
      gamma0 = Math.asin(Math.sin(alpha_c) / D);
      if (!gam) {
        gamma = alpha_c;
      }
    } else {
      gamma0 = gamma;
      alpha_c = Math.asin(D * Math.sin(gamma0));
    }
    let longitudeArgument = 0.5 * (F - 1 / F) * Math.tan(gamma0);
    if (D > 1 && Math.abs(Math.cos(alpha_c)) <= 8 * Number.EPSILON) {
      // For a right-angle azimuth away from the equator, the exact argument
      // is ±1. Near the equator, cancellation in F and rounding in gamma0
      // can exceed any fixed ULP window. Use the analytic limit instead.
      longitudeArgument = Math.sign(state.lat0) * Math.sign(Math.sin(alpha_c));
    } else if (
      Math.abs(longitudeArgument) > 1 &&
      Math.abs(longitudeArgument) <= 1 + 8 * Number.EPSILON
    ) {
      // Preserve nearby azimuths and clamp only small domain overshoots.
      longitudeArgument = Math.sign(longitudeArgument);
    }
    state.lam0 = lamc - Math.asin(longitudeArgument) / state.B;
  } else {
    H = Math.pow(tsfnz(state.e, phi1, Math.sin(phi1)), state.B);
    L = Math.pow(tsfnz(state.e, phi2, Math.sin(phi2)), state.B);
    F = state.E / H;
    p = (L - H) / (L + H);
    J = state.E * state.E;
    J = (J - L * H) / (J + L * H);
    con = lam1 - lam2;

    if (con < -Math.PI) {
      lam2 -= TWO_PI;
    } else if (con > Math.PI) {
      lam2 += TWO_PI;
    }

    state.lam0 = adjust_lon(
      0.5 * (lam1 + lam2) - Math.atan((J * Math.tan(0.5 * state.B * (lam1 - lam2))) / p) / state.B,
      state.over
    );
    gamma0 = Math.atan(
      (2 * Math.sin(state.B * adjust_lon(lam1 - state.lam0, state.over))) / (F - 1 / F)
    );
    gamma = alpha_c = Math.asin(D * Math.sin(gamma0));
  }

  state.singam = Math.sin(gamma0);
  state.cosgam = Math.cos(gamma0);
  state.sinrot = Math.sin(gamma);
  state.cosrot = Math.cos(gamma);

  state.rB = 1 / state.B;
  state.ArB = state.A * state.rB;
  state.BrA = 1 / state.ArB;

  if (state.no_off) {
    state.u_0 = 0;
  } else {
    state.u_0 = Math.abs(state.ArB * Math.atan(Math.sqrt(D * D - 1) / Math.cos(alpha_c)));

    if (state.lat0 < 0) {
      state.u_0 = -state.u_0;
    }
  }

  F = 0.5 * gamma0;
  state.v_pole_n = state.ArB * Math.log(Math.tan(FORTPI - F));
  state.v_pole_s = state.ArB * Math.log(Math.tan(FORTPI + F));
}

/* Oblique Mercator forward equations--mapping lat,long to x,y
    ---------------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var coords: Point = {x: 0, y: 0};
  var S, T, U, V, W, temp, u, v;
  p.x = p.x - state.lam0;

  if (Math.abs(Math.abs(p.y) - HALF_PI) > EPSLN) {
    W = state.E / Math.pow(tsfnz(state.e, p.y, Math.sin(p.y)), state.B);

    temp = 1 / W;
    S = 0.5 * (W - temp);
    T = 0.5 * (W + temp);
    V = Math.sin(state.B * p.x);
    U = (S * state.singam - V * state.cosgam) / T;

    if (Math.abs(Math.abs(U) - 1.0) < EPSLN) {
      throw new Error();
    }

    v = 0.5 * state.ArB * Math.log((1 - U) / (1 + U));
    temp = Math.cos(state.B * p.x);

    if (Math.abs(temp) < TOL) {
      u = state.A * p.x;
    } else {
      u = state.ArB * Math.atan2(S * state.cosgam + V * state.singam, temp);
    }
  } else {
    v = p.y > 0 ? state.v_pole_n : state.v_pole_s;
    u = state.ArB * p.y;
  }

  if (state.no_rot) {
    coords.x = u;
    coords.y = v;
  } else {
    u -= state.u_0;
    coords.x = v * state.cosrot + u * state.sinrot;
    coords.y = u * state.cosrot - v * state.sinrot;
  }

  coords.x = state.a * coords.x + state.x0;
  coords.y = state.a * coords.y + state.y0;

  return coords;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var u, v, Qp, Sp, Tp, Vp, Up;
  var coords: Point = {x: 0, y: 0};

  p.x = (p.x - state.x0) * (1.0 / state.a);
  p.y = (p.y - state.y0) * (1.0 / state.a);

  if (state.no_rot) {
    v = p.y;
    u = p.x;
  } else {
    v = p.x * state.cosrot - p.y * state.sinrot;
    u = p.y * state.cosrot + p.x * state.sinrot + state.u_0;
  }

  Qp = Math.exp(-state.BrA * v);
  Sp = 0.5 * (Qp - 1 / Qp);
  Tp = 0.5 * (Qp + 1 / Qp);
  Vp = Math.sin(state.BrA * u);
  Up = (Vp * state.cosgam + Sp * state.singam) / Tp;

  if (Math.abs(Math.abs(Up) - 1) < EPSLN) {
    coords.x = 0;
    coords.y = Up < 0 ? -HALF_PI : HALF_PI;
  } else {
    coords.y = state.E / Math.sqrt((1 + Up) / (1 - Up));
    coords.y = phi2z(state.e, Math.pow(coords.y, 1 / state.B));

    if (coords.y === Infinity) {
      throw new Error();
    }

    coords.x =
      -state.rB * Math.atan2(Sp * state.cosgam - Vp * state.singam, Math.cos(state.BrA * u));
  }

  coords.x += state.lam0;

  return coords;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,
    no_off: false,
    no_rot: false,
    alpha: NaN,
    rectified_grid_angle: NaN,
    longc: 0,
    long1: 0,
    long2: 0,
    B: 0,
    A: 0,
    E: 0,
    lam0: 0,
    singam: 0,
    cosgam: 0,
    sinrot: 0,
    cosrot: 0,
    rB: 0,
    ArB: 0,
    BrA: 0,
    u_0: 0,
    v_pole_n: 0,
    v_pole_s: 0,
    no_uoff: false,
    projName: '',
    ...options
  };
  initialize(state);
  return state;
}
