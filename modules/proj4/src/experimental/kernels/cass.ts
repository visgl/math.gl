// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.
// Corrected series signs and inverse refinement informed by PROJ 9.5.1 cass.cpp.
// See ../../../PROJ-LICENSE.txt. Newton solver implementation is original math.gl code.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  en: number[];
  scratch: Point;
  ml0: number;
};
import pj_enfn from '../common/pj_enfn';
import pj_mlfn from '../common/pj_mlfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';
import gN from '../common/gN';
import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import {HALF_PI, EPSLN} from '../common/constants';

function initialize(state: State): void {
  if (!state.sphere) {
    state.en = pj_enfn(state.es);
    state.ml0 = state.a * pj_mlfn(state.lat0, Math.sin(state.lat0), Math.cos(state.lat0), state.en);
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
    var ml = state.a * pj_mlfn(phi, sinphi, cosphi, state.en);

    x = nl * al * (1 - asq * tl * (1 / 6 + ((8 - tl + 8 * cl) * asq) / 120));
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
    var phi1 = pj_inv_mlfn(ml1, state.es, state.en);
    if (Math.abs(Math.abs(phi1) - HALF_PI) <= EPSLN) {
      p.x = state.long0;
      p.y = Math.sign(phi1) * HALF_PI;
      return p;
    }
    var nl1 = gN(state.a, state.e, Math.sin(phi1));

    var rl1 = ((nl1 * nl1 * nl1) / state.a / state.a) * (1 - state.es);
    var tl1 = Math.pow(Math.tan(phi1), 2);
    var dl = (x * state.a) / nl1;
    var dsq = dl * dl;
    phi = phi1 - ((nl1 * Math.tan(phi1)) / rl1) * dl * dl * (0.5 - ((1 + 3 * tl1) * dl * dl) / 24);
    lam = (dl * (1 - dsq * (tl1 / 3 - ((1 + 3 * tl1) * tl1 * dsq) / 15))) / Math.cos(phi1);
  }

  if (!state.sphere) {
    // Invert the actual forward series rather than accepting the truncated inverse.
    // Reuse instance scratch storage, including for typed-array batches.
    const targetX = p.x + state.x0,
      targetY = p.y + state.y0;
    const q = state.scratch;
    let converged = false;
    for (let iteration = 0; iteration < 12; iteration++) {
      evaluate(state, lam, phi);
      const rx = q.x - targetX,
        ry = q.y - targetY;
      if (Math.max(Math.abs(rx), Math.abs(ry)) < 1e-7) {
        converged = true;
        break;
      }
      const h = 1e-7,
        stepPhi = phi > HALF_PI - h ? -h : h;
      const x0 = q.x,
        y0 = q.y;
      evaluate(state, lam + h, phi);
      const a = (q.x - x0) / h,
        c = (q.y - y0) / h;
      evaluate(state, lam, phi + stepPhi);
      const b = (q.x - x0) / stepPhi,
        d = (q.y - y0) / stepPhi;
      const determinant = a * d - b * c;
      if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) break;
      lam -= (d * rx - b * ry) / determinant;
      phi -= (a * ry - c * rx) / determinant;
      if (!Number.isFinite(lam) || Math.abs(phi) > HALF_PI) break;
    }
    if (!converged) throw new Error('Cassini inverse did not converge');
  }
  p.x = adjust_lon(lam + state.long0, state.over);
  p.y = adjust_lat(phi);
  return p;
}

function evaluate(state: State, longitude: number, latitude: number): void {
  state.scratch.x = longitude + state.long0;
  state.scratch.y = latitude;
  forward(state, state.scratch);
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, en: [], scratch: {x: 0, y: 0}, ml0: 0, ...options};
  initialize(state);
  return state;
}
