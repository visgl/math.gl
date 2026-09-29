// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  e0: number;
  e1: number;
  e2: number;
  e3: number;
  ml0: number;
};
import mlfn from '../common/mlfn';
import e0fn from '../common/e0fn';
import e1fn from '../common/e1fn';
import e2fn from '../common/e2fn';
import e3fn from '../common/e3fn';
import gN from '../common/gN';
import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import imlfn from '../common/imlfn';
import {HALF_PI, EPSLN} from '../common/constants';

function initialize(state: State): void {
  if (!state.sphere) {
    state.e0 = e0fn(state.es);
    state.e1 = e1fn(state.es);
    state.e2 = e2fn(state.es);
    state.e3 = e3fn(state.es);
    state.ml0 = state.a * mlfn(state.e0, state.e1, state.e2, state.e3, state.lat0);
  }
}

/* Cassini forward equations--mapping lat,long to x,y
  ----------------------------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  /* Forward equations
      ----------------- */
  var x, y;
  var lam = p.x;
  var phi = p.y;
  lam = adjust_lon(lam - state.long0, state.over);

  if (state.sphere) {
    x = state.a * Math.asin(Math.cos(phi) * Math.sin(lam));
    y = state.a * (Math.atan2(Math.tan(phi), Math.cos(lam)) - state.lat0);
  } else {
    // ellipsoid
    var sinphi = Math.sin(phi);
    var cosphi = Math.cos(phi);
    var nl = gN(state.a, state.e, sinphi);
    var tl = Math.tan(phi) * Math.tan(phi);
    var al = lam * Math.cos(phi);
    var asq = al * al;
    var cl = (state.es * cosphi * cosphi) / (1 - state.es);
    var ml = state.a * mlfn(state.e0, state.e1, state.e2, state.e3, phi);

    x = nl * al * (1 - asq * tl * (1 / 6 - ((8 - tl + 8 * cl) * asq) / 120));
    y = ml - state.ml0 + ((nl * sinphi) / cosphi) * asq * (0.5 + ((5 - tl + 6 * cl) * asq) / 24);
  }

  p.x = x + state.x0;
  p.y = y + state.y0;
  return p;
}

/* Inverse equations
  ----------------- */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.x0;
  p.y -= state.y0;
  var x = p.x / state.a;
  var y = p.y / state.a;
  var phi, lam;

  if (state.sphere) {
    var dd = y + state.lat0;
    phi = Math.asin(Math.sin(dd) * Math.cos(x));
    lam = Math.atan2(Math.tan(x), Math.cos(dd));
  } else {
    /* ellipsoid */
    var ml1 = state.ml0 / state.a + y;
    var phi1 = imlfn(ml1, state.e0, state.e1, state.e2, state.e3);
    if (Math.abs(Math.abs(phi1) - HALF_PI) <= EPSLN) {
      p.x = state.long0;
      p.y = HALF_PI;
      if (y < 0) {
        p.y *= -1;
      }
      return p;
    }
    var nl1 = gN(state.a, state.e, Math.sin(phi1));

    var rl1 = ((nl1 * nl1 * nl1) / state.a / state.a) * (1 - state.es);
    var tl1 = Math.pow(Math.tan(phi1), 2);
    var dl = (x * state.a) / nl1;
    var dsq = dl * dl;
    phi = phi1 - ((nl1 * Math.tan(phi1)) / rl1) * dl * dl * (0.5 - ((1 + 3 * tl1) * dl * dl) / 24);
    lam = (dl * (1 - dsq * (tl1 / 3 + ((1 + 3 * tl1) * tl1 * dsq) / 15))) / Math.cos(phi1);
  }

  p.x = adjust_lon(lam + state.long0, state.over);
  p.y = adjust_lat(phi);
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, e0: 0, e1: 0, e2: 0, e3: 0, ml0: 0, ...options};
  initialize(state);
  return state;
}
