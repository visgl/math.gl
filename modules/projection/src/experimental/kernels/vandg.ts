// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  R: number;
};
import adjust_lon from '../common/adjust_lon';

import {HALF_PI, EPSLN} from '../common/constants';

import asinz from '../common/asinz';

function initialize(state: State): void {
  // state.R = 6370997; //Radius of earth
  state.R = state.a;
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;

  /* Forward equations
    ----------------- */
  var dlon = adjust_lon(lon - state.long0, state.over);
  var x, y;

  if (Math.abs(lat) <= EPSLN) {
    x = state.x0 + state.R * dlon;
    y = state.y0;
    p.x = x;
    p.y = y;
    return p;
  }
  var theta = asinz(2 * Math.abs(lat / Math.PI));
  if (Math.abs(dlon) <= EPSLN || Math.abs(Math.abs(lat) - HALF_PI) <= EPSLN) {
    x = state.x0;
    if (lat >= 0) {
      y = state.y0 + Math.PI * state.R * Math.tan(0.5 * theta);
    } else {
      y = state.y0 + Math.PI * state.R * -Math.tan(0.5 * theta);
    }
    p.x = x;
    p.y = y;
    return p;
  }
  var al = 0.5 * Math.abs(Math.PI / dlon - dlon / Math.PI);
  var asq = al * al;
  var sinth = Math.sin(theta);
  var costh = Math.cos(theta);

  var g = costh / (sinth + costh - 1);
  var gsq = g * g;
  var m = g * (2 / sinth - 1);
  var msq = m * m;
  var con =
    (Math.PI *
      state.R *
      (al * (g - msq) + Math.sqrt(asq * (g - msq) * (g - msq) - (msq + asq) * (gsq - msq)))) /
    (msq + asq);
  if (dlon < 0) {
    con = -con;
  }
  x = state.x0 + con;
  // con = Math.abs(con / (Math.PI * state.R));
  var q = asq + g;
  con =
    (Math.PI * state.R * (m * q - al * Math.sqrt((msq + asq) * (asq + 1) - q * q))) / (msq + asq);
  if (lat >= 0) {
    // y = state.y0 + Math.PI * state.R * Math.sqrt(1 - con * con - 2 * al * con);
    y = state.y0 + con;
  } else {
    // y = state.y0 - Math.PI * state.R * Math.sqrt(1 - con * con - 2 * al * con);
    y = state.y0 - con;
  }
  p.x = x;
  p.y = y;
  return p;
}

/* Van Der Grinten inverse equations--mapping x,y to lat/long
  --------------------------------------------------------- */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  var lon, lat;
  var xx, yy, xys, c1, c2, c3;
  var a1;
  var m1;
  var con;
  var th1;
  var d;

  /* inverse equations
    ----------------- */
  p.x -= state.x0;
  p.y -= state.y0;
  if (Math.abs(p.y) < EPSLN) {
    p.x = adjust_lon(state.long0 + p.x / state.R, state.over);
    p.y = 0;
    return p;
  }
  con = Math.PI * state.R;
  xx = p.x / con;
  yy = p.y / con;
  xys = xx * xx + yy * yy;
  c1 = -Math.abs(yy) * (1 + xys);
  c2 = c1 - 2 * yy * yy + xx * xx;
  c3 = -2 * c1 + 1 + 2 * yy * yy + xys * xys;
  d = (yy * yy) / c3 + ((2 * c2 * c2 * c2) / c3 / c3 / c3 - (9 * c1 * c2) / c3 / c3) / 27;
  a1 = (c1 - (c2 * c2) / 3 / c3) / c3;
  m1 = 2 * Math.sqrt(-a1 / 3);
  con = (3 * d) / a1 / m1;
  if (Math.abs(con) > 1) {
    if (con >= 0) {
      con = 1;
    } else {
      con = -1;
    }
  }
  th1 = Math.acos(con) / 3;
  if (p.y >= 0) {
    lat = (-m1 * Math.cos(th1 + Math.PI / 3) - c2 / 3 / c3) * Math.PI;
  } else {
    lat = -(-m1 * Math.cos(th1 + Math.PI / 3) - c2 / 3 / c3) * Math.PI;
  }

  if (Math.abs(xx) < EPSLN) {
    lon = state.long0;
  } else {
    lon = adjust_lon(
      state.long0 +
        (Math.PI * (xys - 1 + Math.sqrt(1 + 2 * (xx * xx - yy * yy) + xys * xys))) / 2 / xx,
      state.over
    );
  }

  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, R: 0, ...options};
  initialize(state);
  return state;
}
