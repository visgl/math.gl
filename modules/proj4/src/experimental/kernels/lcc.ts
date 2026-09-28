// math.gl
// SPDX-License-Identifier: MIT
// Adapted from proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  ns: number;
  f0: number;
  rh: number;
};
import msfnz from '../common/msfnz';
import tsfnz from '../common/tsfnz';
import sign from '../common/sign';
import adjust_lon from '../common/adjust_lon';
import phi2z from '../common/phi2z';
import {HALF_PI, EPSLN} from '../common/constants';

function initialize(state: State): void {
  // double lat0;                    /* the reference latitude               */
  // double long0;                   /* the reference longitude              */
  // double lat1;                    /* first standard parallel              */
  // double lat2;                    /* second standard parallel             */
  // double r_maj;                   /* major axis                           */
  // double r_min;                   /* minor axis                           */
  // double false_east;              /* x offset in meters                   */
  // double false_north;             /* y offset in meters                   */

  // the above value can be set with proj4.defs
  // example: proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

  // kernelParameters defaults omitted parallels; an explicit zero is meaningful.
  if (!state.k0) {
    state.k0 = 1;
  }
  state.x0 = state.x0 || 0;
  state.y0 = state.y0 || 0;
  state.long0 = state.long0 || 0;
  // Standard Parallels cannot be equal and on opposite sides of the equator
  if (Math.abs(state.lat1 + state.lat2) < EPSLN) {
    return;
  }

  var temp = state.b / state.a;
  state.e = Math.sqrt(1 - temp * temp);

  var sin1 = Math.sin(state.lat1);
  var cos1 = Math.cos(state.lat1);
  var ms1 = msfnz(state.e, sin1, cos1);
  var ts1 = tsfnz(state.e, state.lat1, sin1);

  var sin2 = Math.sin(state.lat2);
  var cos2 = Math.cos(state.lat2);
  var ms2 = msfnz(state.e, sin2, cos2);
  var ts2 = tsfnz(state.e, state.lat2, sin2);
  var ts0 = tsfnz(state.e, state.lat0, Math.sin(state.lat0));

  if (Math.abs(state.lat1 - state.lat2) > EPSLN) {
    state.ns = Math.log(ms1 / ms2) / Math.log(ts1 / ts2);
  } else {
    state.ns = sin1;
  }
  if (Number.isNaN(state.ns)) {
    state.ns = sin1;
  }
  state.f0 = ms1 / (state.ns * Math.pow(ts1, state.ns));
  state.rh =
    Math.abs(Math.abs(state.lat0) - HALF_PI) < EPSLN
      ? 0 // Handle poles by setting rh to 0
      : state.a * state.f0 * Math.pow(ts0, state.ns);
}

// Lambert Conformal conic forward equations--mapping lat,long to x,y
// -----------------------------------------------------------------
export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;

  // singular cases :
  if (Math.abs(2 * Math.abs(lat) - Math.PI) <= EPSLN) {
    lat = sign(lat) * (HALF_PI - 2 * EPSLN);
  }

  var con = Math.abs(Math.abs(lat) - HALF_PI);
  var ts, rh1;
  if (con > EPSLN) {
    ts = tsfnz(state.e, lat, Math.sin(lat));
    rh1 = state.a * state.f0 * Math.pow(ts, state.ns);
  } else {
    con = lat * state.ns;
    if (con <= 0) {
      return null;
    }
    rh1 = 0;
  }
  var theta = state.ns * adjust_lon(lon - state.long0, state.over);
  p.x = state.k0 * (rh1 * Math.sin(theta)) + state.x0;
  p.y = state.k0 * (state.rh - rh1 * Math.cos(theta)) + state.y0;

  return p;
}

// Lambert Conformal Conic inverse equations--mapping x,y to lat/long
// -----------------------------------------------------------------
export function inverse(state: State, p: Point): Point | null | undefined | number {
  var rh1, con, ts;
  var lat, lon;
  var x = (p.x - state.x0) / state.k0;
  var y = state.rh - (p.y - state.y0) / state.k0;
  if (state.ns > 0) {
    rh1 = Math.sqrt(x * x + y * y);
    con = 1;
  } else {
    rh1 = -Math.sqrt(x * x + y * y);
    con = -1;
  }
  var theta = 0;
  if (rh1 !== 0) {
    theta = Math.atan2(con * x, con * y);
  }
  if (rh1 !== 0 || state.ns > 0) {
    con = 1 / state.ns;
    ts = Math.pow(rh1 / (state.a * state.f0), con);
    lat = phi2z(state.e, ts);
    if (lat === -9999) {
      return null;
    }
  } else {
    lat = -HALF_PI;
  }
  lon = adjust_lon(theta / state.ns + state.long0, state.over);

  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    ns: 0,
    f0: 0,
    rh: 0
  };
  initialize(state);
  return state;
}
