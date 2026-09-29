// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  phi1: number;
  en: number[];
  m1: number;
  am1: number;
  cphi1: number;
};
import adjust_lat from '../common/adjust_lat';
import adjust_lon from '../common/adjust_lon';
import hypot from '../common/hypot';
import pj_enfn from '../common/pj_enfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';
import pj_mlfn from '../common/pj_mlfn';
import {HALF_PI} from '../common/constants';

var EPS10 = 1e-10;

function initialize(state: State): void {
  var c;

  state.phi1 = state.lat1;
  if (Math.abs(state.phi1) < EPS10) {
    throw new Error();
  }
  if (state.es) {
    state.en = pj_enfn(state.es);
    state.am1 = Math.sin(state.phi1);
    c = Math.cos(state.phi1);
    state.m1 = pj_mlfn(state.phi1, state.am1, c, state.en);
    state.am1 = c / (Math.sqrt(1 - state.es * state.am1 * state.am1) * state.am1);
  } else {
    if (Math.abs(state.phi1) + EPS10 >= HALF_PI) {
      state.cphi1 = 0;
    } else {
      state.cphi1 = 1 / Math.tan(state.phi1);
    }
  }
}

function e_fwd(state: State, p: Point): Point {
  var lam = adjust_lon(p.x - (state.long0 || 0), state.over);
  var phi = p.y;
  var rh, E, c;
  E = Math.sin(phi);
  c = Math.cos(phi);
  rh = state.am1 + state.m1 - pj_mlfn(phi, E, c, state.en);
  E = (c * lam) / (rh * Math.sqrt(1 - state.es * E * E));
  p.x = rh * Math.sin(E);
  p.y = state.am1 - rh * Math.cos(E);

  p.x = state.a * p.x + (state.x0 || 0);
  p.y = state.a * p.y + (state.y0 || 0);
  return p;
}

function e_inv(state: State, p: Point): Point {
  p.x = (p.x - (state.x0 || 0)) / state.a;
  p.y = (p.y - (state.y0 || 0)) / state.a;

  var s, rh, lam, phi;
  p.y = state.am1 - p.y;
  rh = hypot(p.x, p.y);
  if (state.phi1 < 0) rh = -rh;
  phi = pj_inv_mlfn(state.am1 + state.m1 - rh, state.es, state.en);
  s = Math.abs(phi);
  if (s < HALF_PI) {
    s = Math.sin(phi);
    lam =
      (rh *
        Math.atan2(Math.sign(state.phi1) * p.x, Math.sign(state.phi1) * p.y) *
        Math.sqrt(1 - state.es * s * s)) /
      Math.cos(phi);
  } else if (Math.abs(s - HALF_PI) <= EPS10) {
    lam = 0;
  } else {
    throw new Error();
  }
  p.x = adjust_lon(lam + (state.long0 || 0), state.over);
  p.y = adjust_lat(phi);
  return p;
}

function s_fwd(state: State, p: Point): Point {
  var lam = adjust_lon(p.x - (state.long0 || 0), state.over);
  var phi = p.y;
  var E, rh;
  rh = state.cphi1 + state.phi1 - phi;
  if (Math.abs(rh) > EPS10) {
    E = (lam * Math.cos(phi)) / rh;
    p.x = rh * Math.sin(E);
    p.y = state.cphi1 - rh * Math.cos(E);
  } else {
    p.x = p.y = 0;
  }

  p.x = state.a * p.x + (state.x0 || 0);
  p.y = state.a * p.y + (state.y0 || 0);
  return p;
}

function s_inv(state: State, p: Point): Point {
  p.x = (p.x - (state.x0 || 0)) / state.a;
  p.y = (p.y - (state.y0 || 0)) / state.a;

  var lam, phi;
  p.y = state.cphi1 - p.y;
  var rh = hypot(p.x, p.y);
  if (state.phi1 < 0) rh = -rh;
  phi = state.cphi1 + state.phi1 - rh;
  if (Math.abs(phi) > HALF_PI) {
    throw new Error();
  }
  if (Math.abs(Math.abs(phi) - HALF_PI) <= EPS10) {
    lam = 0;
  } else {
    lam =
      (rh * Math.atan2(Math.sign(state.phi1) * p.x, Math.sign(state.phi1) * p.y)) / Math.cos(phi);
  }
  p.x = adjust_lon(lam + (state.long0 || 0), state.over);
  p.y = adjust_lat(phi);
  return p;
}

export function forward(state: State, p: Point): Point {
  return state.es ? e_fwd(state, p) : s_fwd(state, p);
}
export function inverse(state: State, p: Point): Point {
  return state.es ? e_inv(state, p) : s_inv(state, p);
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, phi1: 0, en: [], m1: 0, am1: 0, cphi1: 0, ...options};
  initialize(state);
  return state;
}
