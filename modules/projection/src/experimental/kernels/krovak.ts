// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  s45: number;
  s90: number;
  fi0: number;
  e2: number;
  alfa: number;
  uq: number;
  u0: number;
  g: number;
  k: number;
  k1: number;
  n0: number;
  s0: number;
  n: number;
  ro0: number;
  ad: number;
  czech: boolean;
};
import adjust_lon from '../common/adjust_lon';

function initialize(state: State): void {
  state.a = 6377397.155;
  state.es = 0.006674372230614;
  state.e = Math.sqrt(state.es);

  /* if scale not set default to 0.9999 */

  state.s45 = 0.785398163397448; /* 45 */
  state.s90 = 2 * state.s45;
  state.fi0 = state.lat0;
  state.e2 = state.es;
  state.e = Math.sqrt(state.e2);
  state.alfa = Math.sqrt(1 + (state.e2 * Math.pow(Math.cos(state.fi0), 4)) / (1 - state.e2));
  state.uq = 1.04216856380474;
  state.u0 = Math.asin(Math.sin(state.fi0) / state.alfa);
  state.g = Math.pow(
    (1 + state.e * Math.sin(state.fi0)) / (1 - state.e * Math.sin(state.fi0)),
    (state.alfa * state.e) / 2
  );
  state.k =
    (Math.tan(state.u0 / 2 + state.s45) /
      Math.pow(Math.tan(state.fi0 / 2 + state.s45), state.alfa)) *
    state.g;
  state.k1 = state.k0;
  state.n0 =
    (state.a * Math.sqrt(1 - state.e2)) / (1 - state.e2 * Math.pow(Math.sin(state.fi0), 2));
  state.s0 = 1.37008346281555;
  state.n = Math.sin(state.s0);
  state.ro0 = (state.k1 * state.n0) / Math.tan(state.s0);
  state.ad = state.s90 - state.uq;
}

/* ellipsoid */
/* calculate xy from lat/lon */
/* Constants, identical to inverse transform function */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var gfi, u, deltav, s, d, eps, ro;
  var lon = p.x;
  var lat = p.y;
  var delta_lon = adjust_lon(lon - state.long0, state.over);
  /* Transformation */
  gfi = Math.pow(
    (1 + state.e * Math.sin(lat)) / (1 - state.e * Math.sin(lat)),
    (state.alfa * state.e) / 2
  );
  u =
    2 *
    (Math.atan((state.k * Math.pow(Math.tan(lat / 2 + state.s45), state.alfa)) / gfi) - state.s45);
  deltav = -delta_lon * state.alfa;
  s = Math.asin(
    Math.cos(state.ad) * Math.sin(u) + Math.sin(state.ad) * Math.cos(u) * Math.cos(deltav)
  );
  d = Math.asin((Math.cos(u) * Math.sin(deltav)) / Math.cos(s));
  eps = state.n * d;
  ro =
    (state.ro0 * Math.pow(Math.tan(state.s0 / 2 + state.s45), state.n)) /
    Math.pow(Math.tan(s / 2 + state.s45), state.n);
  p.y = (ro * Math.cos(eps)) / 1;
  p.x = (ro * Math.sin(eps)) / 1;

  if (!state.czech) {
    p.y *= -1;
    p.x *= -1;
  }
  return p;
}

/* calculate lat/lon from xy */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  var u, deltav, s, d, eps, ro, fi1;
  var ok;

  /* Transformation */
  /* revert y, x */
  var tmp = p.x;
  p.x = p.y;
  p.y = tmp;
  if (!state.czech) {
    p.y *= -1;
    p.x *= -1;
  }
  ro = Math.sqrt(p.x * p.x + p.y * p.y);
  eps = Math.atan2(p.y, p.x);
  d = eps / Math.sin(state.s0);
  s =
    2 *
    (Math.atan(Math.pow(state.ro0 / ro, 1 / state.n) * Math.tan(state.s0 / 2 + state.s45)) -
      state.s45);
  u = Math.asin(Math.cos(state.ad) * Math.sin(s) - Math.sin(state.ad) * Math.cos(s) * Math.cos(d));
  deltav = Math.asin((Math.cos(s) * Math.sin(d)) / Math.cos(u));
  p.x = state.long0 - deltav / state.alfa;
  fi1 = u;
  ok = 0;
  var iter = 0;
  do {
    p.y =
      2 *
      (Math.atan(
        Math.pow(state.k, -1 / state.alfa) *
          Math.pow(Math.tan(u / 2 + state.s45), 1 / state.alfa) *
          Math.pow((1 + state.e * Math.sin(fi1)) / (1 - state.e * Math.sin(fi1)), state.e / 2)
      ) -
        state.s45);
    if (Math.abs(fi1 - p.y) < 0.0000000001) {
      ok = 1;
    }
    fi1 = p.y;
    iter += 1;
  } while (ok === 0 && iter < 15);
  if (iter >= 15) {
    return null;
  }

  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,
    s45: 0,
    s90: 0,
    fi0: 0,
    e2: 0,
    alfa: 0,
    uq: 0,
    u0: 0,
    g: 0,
    k: 0,
    k1: 0,
    n0: 0,
    s0: 0,
    n: 0,
    ro0: 0,
    ad: 0,
    czech: false,
    ...options
  };
  initialize(state);
  return state;
}
