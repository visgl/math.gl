// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  sin_p14: number;
  cos_p14: number;
  infinity_dist: number;
  rc: number;
  phic0: number;
};
import adjust_lon from '../common/adjust_lon';
import asinz from '../common/asinz';
import {EPSLN} from '../common/constants';

function initialize(state: State): void {
  /* Place parameters in static storage for common use
      ------------------------------------------------- */
  state.sin_p14 = Math.sin(state.lat0);
  state.cos_p14 = Math.cos(state.lat0);
  // Approximation for projecting points to the horizon (infinity)
  state.infinity_dist = 1000 * state.a;
  state.rc = 1;
}

/* Gnomonic forward equations--mapping lat,long to x,y
    --------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var sinphi, cosphi; /* sin and cos value        */
  var dlon; /* delta longitude value      */
  var coslon; /* cos of longitude        */
  var ksp; /* scale factor          */
  var g;
  var x, y;
  var lon = p.x;
  var lat = p.y;
  /* Forward equations
      ----------------- */
  dlon = adjust_lon(lon - state.long0, state.over);

  sinphi = Math.sin(lat);
  cosphi = Math.cos(lat);

  coslon = Math.cos(dlon);
  g = state.sin_p14 * sinphi + state.cos_p14 * cosphi * coslon;
  ksp = 1;
  if (g > 0 || Math.abs(g) <= EPSLN) {
    x = state.x0 + (state.a * ksp * cosphi * Math.sin(dlon)) / g;
    y = state.y0 + (state.a * ksp * (state.cos_p14 * sinphi - state.sin_p14 * cosphi * coslon)) / g;
  } else {
    // Point is in the opposing hemisphere and is unprojectable
    // We still need to return a reasonable point, so we project
    // to infinity, on a bearing
    // equivalent to the northern hemisphere equivalent
    // This is a reasonable approximation for short shapes and lines that
    // straddle the horizon.

    x = state.x0 + state.infinity_dist * cosphi * Math.sin(dlon);
    y = state.y0 + state.infinity_dist * (state.cos_p14 * sinphi - state.sin_p14 * cosphi * coslon);
  }
  p.x = x;
  p.y = y;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var rh; /* Rho */
  var sinc, cosc;
  var c;
  var lon, lat;

  /* Inverse equations
      ----------------- */
  p.x = (p.x - state.x0) / state.a;
  p.y = (p.y - state.y0) / state.a;

  p.x /= state.k0;
  p.y /= state.k0;

  rh = Math.sqrt(p.x * p.x + p.y * p.y);
  if (rh) {
    c = Math.atan2(rh, state.rc);
    sinc = Math.sin(c);
    cosc = Math.cos(c);

    lat = asinz(cosc * state.sin_p14 + (p.y * sinc * state.cos_p14) / rh);
    lon = Math.atan2(p.x * sinc, rh * state.cos_p14 * cosc - p.y * state.sin_p14 * sinc);
    lon = adjust_lon(state.long0 + lon, state.over);
  } else {
    lat = state.lat0;
    lon = state.long0;
  }

  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,
    sin_p14: 0,
    cos_p14: 0,
    infinity_dist: 0,
    rc: 0,
    phic0: 0,
    ...options
  };
  initialize(state);
  return state;
}
