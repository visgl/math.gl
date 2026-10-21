// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Adapted from proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution. math.gl uses the higher-order meridional series shared with Cassini, rather than the upstream truncated e0/e1/e2/e3 series. Qualified against PROJ 9.5.1.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  temp: number;
  en: number[];
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
import pj_enfn from '../common/pj_enfn';
import pj_mlfn from '../common/pj_mlfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';
import msfnz from '../common/msfnz';
import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import {EPSLN} from '../common/constants';

function initialize(state: State): void {
  /* Place parameters in static storage for common use
      ------------------------------------------------- */
  // Standard Parallels cannot be equal and on opposite sides of the equator
  if (Math.abs(state.lat1 + state.lat2) < EPSLN) {
    return;
  }
  // kernelParameters defaults omitted parallels; an explicit zero is meaningful.
  state.temp = state.b / state.a;
  state.es = 1 - Math.pow(state.temp, 2);
  state.e = Math.sqrt(state.es);
  state.en = pj_enfn(state.es);

  state.sin_phi = Math.sin(state.lat1);
  state.cos_phi = Math.cos(state.lat1);

  state.ms1 = msfnz(state.e, state.sin_phi, state.cos_phi);
  state.ml1 = pj_mlfn(state.lat1, Math.sin(state.lat1), Math.cos(state.lat1), state.en);

  if (Math.abs(state.lat1 - state.lat2) < EPSLN) {
    state.ns = state.sin_phi;
  } else {
    state.sin_phi = Math.sin(state.lat2);
    state.cos_phi = Math.cos(state.lat2);
    state.ms2 = msfnz(state.e, state.sin_phi, state.cos_phi);
    state.ml2 = pj_mlfn(state.lat2, Math.sin(state.lat2), Math.cos(state.lat2), state.en);
    state.ns = (state.ms1 - state.ms2) / (state.ml2 - state.ml1);
  }
  state.g = state.ml1 + state.ms1 / state.ns;
  state.ml0 = pj_mlfn(state.lat0, Math.sin(state.lat0), Math.cos(state.lat0), state.en);
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
    var ml = pj_mlfn(lat, Math.sin(lat), Math.cos(lat), state.en);
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
    lat = pj_inv_mlfn(ml, state.es, state.en);
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
    en: [],
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
