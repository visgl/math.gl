// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {};
import adjust_lon from '../common/adjust_lon';
import qsfnz from '../common/qsfnz';
import msfnz from '../common/msfnz';
import iqsfnz from '../common/iqsfnz';

function initialize(state: State): void {
  // no-op
  if (!state.sphere) {
    state.k0 = msfnz(state.e, Math.sin(state.lat_ts), Math.cos(state.lat_ts));
  }
}

/* Cylindrical Equal Area forward equations--mapping lat,long to x,y
    ------------------------------------------------------------ */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;
  var x, y;
  /* Forward equations
      ----------------- */
  var dlon = adjust_lon(lon - state.long0, state.over);
  if (state.sphere) {
    x = state.x0 + state.a * dlon * Math.cos(state.lat_ts);
    y = state.y0 + (state.a * Math.sin(lat)) / Math.cos(state.lat_ts);
  } else {
    var qs = qsfnz(state.e, Math.sin(lat));
    x = state.x0 + state.a * state.k0 * dlon;
    y = state.y0 + (state.a * qs * 0.5) / state.k0;
  }

  p.x = x;
  p.y = y;
  return p;
}

/* Cylindrical Equal Area inverse equations--mapping x,y to lat/long
    ------------------------------------------------------------ */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.x0;
  p.y -= state.y0;
  var lon, lat;

  if (state.sphere) {
    lon = adjust_lon(state.long0 + p.x / state.a / Math.cos(state.lat_ts), state.over);
    lat = Math.asin((p.y / state.a) * Math.cos(state.lat_ts));
  } else {
    lat = iqsfnz(state.e, (2 * p.y * state.k0) / state.a);
    lon = adjust_lon(state.long0 + p.x / (state.a * state.k0), state.over);
  }

  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,

    ...options
  };
  initialize(state);
  return state;
}
