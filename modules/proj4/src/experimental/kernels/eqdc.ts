// math.gl
// SPDX-License-Identifier: MIT
// Adapted from proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  temp: number;
  e0: number;
  e1: number;
  e2: number;
  e3: number;
  sin_phi: number;
  cos_phi: number;
  ms1: number;
  ml1: number;
  ns: number;
  ms2: number;
  ml2: number;
  g: number;
  ml0: number;
  rh: number;
};
import e0fn from '../common/e0fn';
import e1fn from '../common/e1fn';
import e2fn from '../common/e2fn';
import e3fn from '../common/e3fn';
import msfnz from '../common/msfnz';
import mlfn from '../common/mlfn';
import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import imlfn from '../common/imlfn';
import {EPSLN} from '../common/constants';

function initialize(state: State): void {
  /* Place parameters in static storage for common use
      ------------------------------------------------- */
  // Standard Parallels cannot be equal and on opposite sides of the equator
  if (Math.abs(state.lat1 + state.lat2) < EPSLN) {
    return;
  }
  state.lat2 = state.lat2 || state.lat1;
  state.temp = state.b / state.a;
  state.es = 1 - Math.pow(state.temp, 2);
  state.e = Math.sqrt(state.es);
  state.e0 = e0fn(state.es);
  state.e1 = e1fn(state.es);
  state.e2 = e2fn(state.es);
  state.e3 = e3fn(state.es);

  state.sin_phi = Math.sin(state.lat1);
  state.cos_phi = Math.cos(state.lat1);

  state.ms1 = msfnz(state.e, state.sin_phi, state.cos_phi);
  state.ml1 = mlfn(state.e0, state.e1, state.e2, state.e3, state.lat1);

  if (Math.abs(state.lat1 - state.lat2) < EPSLN) {
    state.ns = state.sin_phi;
  } else {
    state.sin_phi = Math.sin(state.lat2);
    state.cos_phi = Math.cos(state.lat2);
    state.ms2 = msfnz(state.e, state.sin_phi, state.cos_phi);
    state.ml2 = mlfn(state.e0, state.e1, state.e2, state.e3, state.lat2);
    state.ns = (state.ms1 - state.ms2) / (state.ml2 - state.ml1);
  }
  state.g = state.ml1 + state.ms1 / state.ns;
  state.ml0 = mlfn(state.e0, state.e1, state.e2, state.e3, state.lat0);
  state.rh = state.a * (state.g - state.ml0);
}

/* Equidistant Conic forward equations--mapping lat,long to x,y
  ----------------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;
  var rh1;

  /* Forward equations
      ----------------- */
  if (state.sphere) {
    rh1 = state.a * (state.g - lat);
  } else {
    var ml = mlfn(state.e0, state.e1, state.e2, state.e3, lat);
    rh1 = state.a * (state.g - ml);
  }
  var theta = state.ns * adjust_lon(lon - state.long0, state.over);
  var x = state.x0 + rh1 * Math.sin(theta);
  var y = state.y0 + state.rh - rh1 * Math.cos(theta);
  p.x = x;
  p.y = y;
  return p;
}

/* Inverse equations
  ----------------- */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.x0;
  p.y = state.rh - p.y + state.y0;
  var con, rh1, lat, lon;
  if (state.ns >= 0) {
    rh1 = Math.sqrt(p.x * p.x + p.y * p.y);
    con = 1;
  } else {
    rh1 = -Math.sqrt(p.x * p.x + p.y * p.y);
    con = -1;
  }
  var theta = 0;
  if (rh1 !== 0) {
    theta = Math.atan2(con * p.x, con * p.y);
  }

  if (state.sphere) {
    lon = adjust_lon(state.long0 + theta / state.ns, state.over);
    lat = adjust_lat(state.g - rh1 / state.a);
    p.x = lon;
    p.y = lat;
    return p;
  } else {
    var ml = state.g - rh1 / state.a;
    lat = imlfn(ml, state.e0, state.e1, state.e2, state.e3);
    lon = adjust_lon(state.long0 + theta / state.ns, state.over);
    p.x = lon;
    p.y = lat;
    return p;
  }
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    temp: 0,
    e0: 0,
    e1: 0,
    e2: 0,
    e3: 0,
    sin_phi: 0,
    cos_phi: 0,
    ms1: 0,
    ml1: 0,
    ns: 0,
    ms2: 0,
    ml2: 0,
    g: 0,
    ml0: 0,
    rh: 0
  };
  initialize(state);
  return state;
}
