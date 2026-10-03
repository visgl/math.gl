// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  en: number[];
  ml0: number;
};
// Heavily based on this tmerc projection implementation
// https://github.com/mbloch/mapshaper-proj/blob/master/src/projections/tmerc.js

import pj_enfn from '../common/pj_enfn';
import pj_mlfn from '../common/pj_mlfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';
import adjust_lon from '../common/adjust_lon';

import {EPSLN, HALF_PI} from '../common/constants';
import sign from '../common/sign';

function initialize(state: State): void {
  state.x0 = state.x0 !== undefined ? state.x0 : 0;
  state.y0 = state.y0 !== undefined ? state.y0 : 0;
  state.long0 = state.long0 !== undefined ? state.long0 : 0;
  state.lat0 = state.lat0 !== undefined ? state.lat0 : 0;

  if (state.es) {
    state.en = pj_enfn(state.es);
    state.ml0 = pj_mlfn(state.lat0, Math.sin(state.lat0), Math.cos(state.lat0), state.en);
  }
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;

  var delta_lon = adjust_lon(lon - state.long0, state.over);
  var con;
  var x, y;
  var sin_phi = Math.sin(lat);
  var cos_phi = Math.cos(lat);

  if (!state.es) {
    var b = cos_phi * Math.sin(delta_lon);

    if (Math.abs(Math.abs(b) - 1) < EPSLN) {
      return 93;
    } else {
      x = 0.5 * state.a * state.k0 * Math.log((1 + b) / (1 - b)) + state.x0;
      y = (cos_phi * Math.cos(delta_lon)) / Math.sqrt(1 - Math.pow(b, 2));
      b = Math.abs(y);

      if (b >= 1) {
        if (b - 1 > EPSLN) {
          return 93;
        } else {
          y = 0;
        }
      } else {
        y = Math.acos(y);
      }

      if (lat < 0) {
        y = -y;
      }

      y = state.a * state.k0 * (y - state.lat0) + state.y0;
    }
  } else {
    var al = cos_phi * delta_lon;
    var als = Math.pow(al, 2);
    var c = state.ep2 * Math.pow(cos_phi, 2);
    var cs = Math.pow(c, 2);
    var tq = Math.abs(cos_phi) > EPSLN ? Math.tan(lat) : 0;
    var t = Math.pow(tq, 2);
    var ts = Math.pow(t, 2);
    con = 1 - state.es * Math.pow(sin_phi, 2);
    al = al / Math.sqrt(con);
    var ml = pj_mlfn(lat, sin_phi, cos_phi, state.en);

    x =
      state.a *
        (state.k0 *
          al *
          (1 +
            (als / 6) *
              (1 -
                t +
                c +
                (als / 20) *
                  (5 -
                    18 * t +
                    ts +
                    14 * c -
                    58 * t * c +
                    (als / 42) * (61 + 179 * ts - ts * t - 479 * t))))) +
      state.x0;

    y =
      state.a *
        (state.k0 *
          (ml -
            state.ml0 +
            ((sin_phi * delta_lon * al) / 2) *
              (1 +
                (als / 12) *
                  (5 -
                    t +
                    9 * c +
                    4 * cs +
                    (als / 30) *
                      (61 +
                        ts -
                        58 * t +
                        270 * c -
                        330 * t * c +
                        (als / 56) * (1385 + 543 * ts - ts * t - 3111 * t)))))) +
      state.y0;
  }

  p.x = x;
  p.y = y;

  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var con, phi;
  var lat, lon;
  var x = (p.x - state.x0) * (1 / state.a);
  var y = (p.y - state.y0) * (1 / state.a);

  if (!state.es) {
    var f = Math.exp(x / state.k0);
    var g = 0.5 * (f - 1 / f);
    var temp = state.lat0 + y / state.k0;
    var h = Math.cos(temp);
    con = Math.sqrt((1 - Math.pow(h, 2)) / (1 + Math.pow(g, 2)));
    lat = Math.asin(con);

    // The sign comes from absolute latitude, not northing relative to lat_0.
    if (Math.sin(temp) < 0) {
      lat = -lat;
    }

    if (g === 0 && h === 0) {
      lon = 0;
    } else {
      lon = adjust_lon(Math.atan2(g, h) + state.long0, state.over);
    }
  } else {
    // ellipsoidal form
    con = state.ml0 + y / state.k0;
    phi = pj_inv_mlfn(con, state.es, state.en);

    if (Math.abs(phi) < HALF_PI) {
      var sin_phi = Math.sin(phi);
      var cos_phi = Math.cos(phi);
      var tan_phi = Math.abs(cos_phi) > EPSLN ? Math.tan(phi) : 0;
      var c = state.ep2 * Math.pow(cos_phi, 2);
      var cs = Math.pow(c, 2);
      var t = Math.pow(tan_phi, 2);
      var ts = Math.pow(t, 2);
      con = 1 - state.es * Math.pow(sin_phi, 2);
      var d = (x * Math.sqrt(con)) / state.k0;
      var ds = Math.pow(d, 2);
      con = con * tan_phi;

      lat =
        phi -
        ((con * ds) / (1 - state.es)) *
          0.5 *
          (1 -
            (ds / 12) *
              (5 +
                3 * t -
                9 * c * t +
                c -
                4 * cs -
                (ds / 30) *
                  (61 +
                    90 * t -
                    252 * c * t +
                    45 * ts +
                    46 * c -
                    (ds / 56) * (1385 + 3633 * t + 4095 * ts + 1574 * ts * t))));

      lon = adjust_lon(
        state.long0 +
          (d *
            (1 -
              (ds / 6) *
                (1 +
                  2 * t +
                  c -
                  (ds / 20) *
                    (5 +
                      28 * t +
                      24 * ts +
                      8 * c * t +
                      6 * c -
                      (ds / 42) * (61 + 662 * t + 1320 * ts + 720 * ts * t))))) /
            cos_phi,
        state.over
      );
    } else {
      lat = HALF_PI * sign(y);
      lon = 0;
    }
  }

  p.x = lon;
  p.y = lat;

  return p;
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    en: [],
    ml0: 0
  };
  initialize(state);
  return state;
}
