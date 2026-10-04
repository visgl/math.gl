// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Direct TypeScript port of proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  en: number[];
  n: number;
  m: number;
  C_y: number;
  C_x: number;
};
import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import pj_enfn from '../common/pj_enfn';
var MAX_ITER = 20;
import pj_mlfn from '../common/pj_mlfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';
import {EPSLN, HALF_PI} from '../common/constants';

import asinz from '../common/asinz';

function initialize(state: State): void {
  /* Place parameters in static storage for common use
    ------------------------------------------------- */
  state.long0 = state.long0 || 0;

  if (!state.sphere) {
    state.en = pj_enfn(state.es);
  } else {
    state.n = 1;
    state.m = 0;
    state.es = 0;
    state.C_y = Math.sqrt((state.m + 1) / state.n);
    state.C_x = state.C_y / (state.m + 1);
  }
}

/* Sinusoidal forward equations--mapping lat,long to x,y
  ----------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var x, y;
  var lon = p.x;
  var lat = p.y;
  /* Forward equations
    ----------------- */
  lon = adjust_lon(lon - state.long0, state.over);

  if (state.sphere) {
    if (!state.m) {
      lat = state.n !== 1 ? Math.asin(state.n * Math.sin(lat)) : lat;
    } else {
      var k = state.n * Math.sin(lat);
      for (var i = MAX_ITER; i; --i) {
        var V = (state.m * lat + Math.sin(lat) - k) / (state.m + Math.cos(lat));
        lat -= V;
        if (Math.abs(V) < EPSLN) {
          break;
        }
      }
    }
    x = state.a * state.C_x * lon * (state.m + Math.cos(lat));
    y = state.a * state.C_y * lat;
  } else {
    var s = Math.sin(lat);
    var c = Math.cos(lat);
    y = state.a * pj_mlfn(lat, s, c, state.en);
    x = (state.a * lon * c) / Math.sqrt(1 - state.es * s * s);
  }

  p.x = x;
  p.y = y;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var lat, temp, lon, s;

  p.x -= state.x0;
  lon = p.x / state.a;
  p.y -= state.y0;
  lat = p.y / state.a;

  if (state.sphere) {
    lat /= state.C_y;
    lon = lon / (state.C_x * (state.m + Math.cos(lat)));
    if (state.m) {
      lat = asinz((state.m * lat + Math.sin(lat)) / state.n);
    } else if (state.n !== 1) {
      lat = asinz(Math.sin(lat) / state.n);
    }
    lon = adjust_lon(lon + state.long0, state.over);
    lat = adjust_lat(lat);
  } else {
    lat = pj_inv_mlfn(p.y / state.a, state.es, state.en);
    s = Math.abs(lat);
    if (s < HALF_PI) {
      s = Math.sin(lat);
      temp = state.long0 + (p.x * Math.sqrt(1 - state.es * s * s)) / (state.a * Math.cos(lat));
      // temp = state.long0 + p.x / (state.a * Math.cos(lat));
      lon = adjust_lon(temp, state.over);
    } else if (s - EPSLN < HALF_PI) {
      lon = state.long0;
    }
  }
  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, en: [], n: 0, m: 0, C_y: 0, C_x: 0, ...options};
  initialize(state);
  return state;
}
