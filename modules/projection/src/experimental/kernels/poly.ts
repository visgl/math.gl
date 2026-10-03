// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  temp: number;
  e0: number;
  e1: number;
  e2: number;
  e3: number;
  ml0: number;
};
import e0fn from '../common/e0fn';
import e1fn from '../common/e1fn';
import e2fn from '../common/e2fn';
import e3fn from '../common/e3fn';
import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import mlfn from '../common/mlfn';
import {EPSLN} from '../common/constants';

import gN from '../common/gN';

var MAX_ITER = 20;

function initialize(state: State): void {
  /* Place parameters in static storage for common use
      ------------------------------------------------- */
  state.temp = state.b / state.a;
  state.es = 1 - Math.pow(state.temp, 2); // devait etre dans tmerc.js mais n y est pas donc je commente sinon retour de valeurs nulles
  state.e = Math.sqrt(state.es);
  state.e0 = e0fn(state.es);
  state.e1 = e1fn(state.es);
  state.e2 = e2fn(state.es);
  state.e3 = e3fn(state.es);
  state.ml0 = state.a * mlfn(state.e0, state.e1, state.e2, state.e3, state.lat0); // si que des zeros le calcul ne se fait pas
}

/* Polyconic forward equations--mapping lat,long to x,y
    --------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;
  var x, y, el;
  var dlon = adjust_lon(lon - state.long0, state.over);
  el = dlon * Math.sin(lat);
  if (state.sphere) {
    if (Math.abs(lat) <= EPSLN) {
      x = state.a * dlon;
      y = -1 * state.a * state.lat0;
    } else {
      x = (state.a * Math.sin(el)) / Math.tan(lat);
      y = state.a * (adjust_lat(lat - state.lat0) + (1 - Math.cos(el)) / Math.tan(lat));
    }
  } else {
    if (Math.abs(lat) <= EPSLN) {
      x = state.a * dlon;
      y = -1 * state.ml0;
    } else {
      var nl = gN(state.a, state.e, Math.sin(lat)) / Math.tan(lat);
      x = nl * Math.sin(el);
      y =
        state.a * mlfn(state.e0, state.e1, state.e2, state.e3, lat) -
        state.ml0 +
        nl * (1 - Math.cos(el));
    }
  }
  p.x = x + state.x0;
  p.y = y + state.y0;
  return p;
}

/* Inverse equations
  ----------------- */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  var lon, lat, x, y, i;
  var al, bl;
  var phi, dphi;
  x = p.x - state.x0;
  y = p.y - state.y0;

  if (state.sphere) {
    if (Math.abs(y + state.a * state.lat0) <= EPSLN) {
      lon = adjust_lon(x / state.a + state.long0, state.over);
      lat = 0;
    } else {
      al = state.lat0 + y / state.a;
      bl = (x * x) / state.a / state.a + al * al;
      phi = al;
      var tanphi;
      for (i = MAX_ITER; i; --i) {
        tanphi = Math.tan(phi);
        dphi =
          (-1 * (al * (phi * tanphi + 1) - phi - 0.5 * (phi * phi + bl) * tanphi)) /
          ((phi - al) / tanphi - 1);
        phi += dphi;
        if (Math.abs(dphi) <= EPSLN) {
          lat = phi;
          break;
        }
      }
      lon = adjust_lon(
        state.long0 + Math.asin((x * Math.tan(phi)) / state.a) / Math.sin(lat),
        state.over
      );
    }
  } else {
    if (Math.abs(y + state.ml0) <= EPSLN) {
      lat = 0;
      lon = adjust_lon(state.long0 + x / state.a, state.over);
    } else {
      al = (state.ml0 + y) / state.a;
      bl = (x * x) / state.a / state.a + al * al;
      phi = al;
      var cl, mln, mlnp, ma;
      var con;
      for (i = MAX_ITER; i; --i) {
        con = state.e * Math.sin(phi);
        cl = Math.sqrt(1 - con * con) * Math.tan(phi);
        mln = state.a * mlfn(state.e0, state.e1, state.e2, state.e3, phi);
        mlnp =
          state.e0 -
          2 * state.e1 * Math.cos(2 * phi) +
          4 * state.e2 * Math.cos(4 * phi) -
          6 * state.e3 * Math.cos(6 * phi);
        ma = mln / state.a;
        dphi =
          (al * (cl * ma + 1) - ma - 0.5 * cl * (ma * ma + bl)) /
          ((state.es * Math.sin(2 * phi) * (ma * ma + bl - 2 * al * ma)) / (4 * cl) +
            (al - ma) * (cl * mlnp - 2 / Math.sin(2 * phi)) -
            mlnp);
        phi -= dphi;
        if (Math.abs(dphi) <= EPSLN) {
          lat = phi;
          break;
        }
      }

      // lat=phi4z(state.e,state.e0,state.e1,state.e2,state.e3,al,bl,0,0);
      cl = Math.sqrt(1 - state.es * Math.pow(Math.sin(lat), 2)) * Math.tan(lat);
      lon = adjust_lon(state.long0 + Math.asin((x * cl) / state.a) / Math.sin(lat), state.over);
    }
  }

  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, temp: 0, e0: 0, e1: 0, e2: 0, e3: 0, ml0: 0, ...options};
  initialize(state);
  return state;
}
