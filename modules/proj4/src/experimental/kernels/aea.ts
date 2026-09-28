// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  temp: number;
  e3: number;
  sin_po: number;
  cos_po: number;
  t1: number;
  con: number;
  ms1: number;
  qs1: number;
  t2: number;
  ms2: number;
  qs2: number;
  t3: number;
  qs0: number;
  ns0: number;
  c: number;
  rh: number;
  sin_phi: number;
  cos_phi: number;
};
import msfnz from '../common/msfnz';
import qsfnz from '../common/qsfnz';
import adjust_lon from '../common/adjust_lon';
import asinz from '../common/asinz';
import {EPSLN} from '../common/constants';

function initialize(state: State): void {
  if (Math.abs(state.lat1 + state.lat2) < EPSLN) {
    return;
  }
  state.temp = state.b / state.a;
  state.es = 1 - Math.pow(state.temp, 2);
  state.e3 = Math.sqrt(state.es);

  state.sin_po = Math.sin(state.lat1);
  state.cos_po = Math.cos(state.lat1);
  state.t1 = state.sin_po;
  state.con = state.sin_po;
  state.ms1 = msfnz(state.e3, state.sin_po, state.cos_po);
  state.qs1 = qsfnz(state.e3, state.sin_po);

  state.sin_po = Math.sin(state.lat2);
  state.cos_po = Math.cos(state.lat2);
  state.t2 = state.sin_po;
  state.ms2 = msfnz(state.e3, state.sin_po, state.cos_po);
  state.qs2 = qsfnz(state.e3, state.sin_po);

  state.sin_po = Math.sin(state.lat0);
  state.cos_po = Math.cos(state.lat0);
  state.t3 = state.sin_po;
  state.qs0 = qsfnz(state.e3, state.sin_po);

  if (Math.abs(state.lat1 - state.lat2) > EPSLN) {
    state.ns0 = (state.ms1 * state.ms1 - state.ms2 * state.ms2) / (state.qs2 - state.qs1);
  } else {
    state.ns0 = state.con;
  }
  state.c = state.ms1 * state.ms1 + state.ns0 * state.qs1;
  state.rh = (state.a * Math.sqrt(state.c - state.ns0 * state.qs0)) / state.ns0;
}

/* Albers Conical Equal Area forward equations--mapping lat,long to x,y
  ------------------------------------------------------------------- */

export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;

  state.sin_phi = Math.sin(lat);
  state.cos_phi = Math.cos(lat);

  var qs = qsfnz(state.e3, state.sin_phi);
  var rh1 = (state.a * Math.sqrt(state.c - state.ns0 * qs)) / state.ns0;
  var theta = state.ns0 * adjust_lon(lon - state.long0, state.over);
  var x = rh1 * Math.sin(theta) + state.x0;
  var y = state.rh - rh1 * Math.cos(theta) + state.y0;

  p.x = x;
  p.y = y;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var rh1, qs, con, theta, lon, lat;

  p.x -= state.x0;
  p.y = state.rh - p.y + state.y0;
  if (state.ns0 >= 0) {
    rh1 = Math.sqrt(p.x * p.x + p.y * p.y);
    con = 1;
  } else {
    rh1 = -Math.sqrt(p.x * p.x + p.y * p.y);
    con = -1;
  }
  theta = 0;
  if (rh1 !== 0) {
    theta = Math.atan2(con * p.x, con * p.y);
  }
  con = (rh1 * state.ns0) / state.a;
  if (state.sphere) {
    lat = Math.asin((state.c - con * con) / (2 * state.ns0));
  } else {
    qs = (state.c - con * con) / state.ns0;
    lat = phi1z(state.e3, qs);
  }

  lon = adjust_lon(theta / state.ns0 + state.long0, state.over);
  p.x = lon;
  p.y = lat;
  return p;
}

/* Function to compute phi1, the latitude for the inverse of the
   Albers Conical Equal-Area projection.
------------------------------------------- */
function phi1z(eccent: number, qs: number): number | null {
  var sinphi, cosphi, con, com, dphi;
  var phi = asinz(0.5 * qs);
  if (eccent < EPSLN) {
    return phi;
  }

  var eccnts = eccent * eccent;
  for (var i = 1; i <= 25; i++) {
    sinphi = Math.sin(phi);
    cosphi = Math.cos(phi);
    con = eccent * sinphi;
    com = 1 - con * con;
    dphi =
      ((0.5 * com * com) / cosphi) *
      (qs / (1 - eccnts) - sinphi / com + (0.5 / eccent) * Math.log((1 - con) / (1 + con)));
    phi = phi + dphi;
    if (Math.abs(dphi) <= 1e-7) {
      return phi;
    }
  }
  return null;
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    temp: 0,
    e3: 0,
    sin_po: 0,
    cos_po: 0,
    t1: 0,
    con: 0,
    ms1: 0,
    qs1: 0,
    t2: 0,
    ms2: 0,
    qs2: 0,
    t3: 0,
    qs0: 0,
    ns0: 0,
    c: 0,
    rh: 0,
    sin_phi: 0,
    cos_phi: 0
  };
  initialize(state);
  return state;
}
