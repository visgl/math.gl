// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  lc: number;
  rs: number;
  cp: number;
  n2: number;
  xs: number;
  ys: number;
};
import latiso from '../common/latiso';
import sinh from '../common/sinh';
import cosh from '../common/cosh';
import invlatiso from '../common/invlatiso';

function initialize(state: State): void {
  // array of:  a, b, lon0, lat0, k0, x0, y0
  if (!state.k0) {
    state.k0 = 1;
  }
  var temp = state.b / state.a;
  state.e = Math.sqrt(1 - temp * temp);
  state.lc = state.long0;
  state.rs = Math.sqrt(
    1 + (state.e * state.e * Math.pow(Math.cos(state.lat0), 4)) / (1 - state.e * state.e)
  );
  var sinz = Math.sin(state.lat0);
  var pc = Math.asin(sinz / state.rs);
  var sinzpc = Math.sin(pc);
  state.cp = latiso(0, pc, sinzpc) - state.rs * latiso(state.e, state.lat0, sinz);
  state.n2 =
    (state.k0 * state.a * Math.sqrt(1 - state.e * state.e)) / (1 - state.e * state.e * sinz * sinz);
  state.xs = state.x0;
  state.ys = state.y0 - state.n2 * pc;
}

// forward equations--mapping lat,long to x,y
// -----------------------------------------------------------------
export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;

  var L = state.rs * (lon - state.lc);
  var Ls = state.cp + state.rs * latiso(state.e, lat, Math.sin(lat));
  var lat1 = Math.asin(Math.sin(L) / cosh(Ls));
  var Ls1 = latiso(0, lat1, Math.sin(lat1));
  p.x = state.xs + state.n2 * Ls1;
  p.y = state.ys + state.n2 * Math.atan(sinh(Ls) / Math.cos(L));
  return p;
}

// inverse equations--mapping x,y to lat/long
// -----------------------------------------------------------------
export function inverse(state: State, p: Point): Point | null | undefined | number {
  var x = p.x;
  var y = p.y;

  var L = Math.atan(sinh((x - state.xs) / state.n2) / Math.cos((y - state.ys) / state.n2));
  var lat1 = Math.asin(Math.sin((y - state.ys) / state.n2) / cosh((x - state.xs) / state.n2));
  var LC = latiso(0, lat1, Math.sin(lat1));
  p.x = state.lc + L / state.rs;
  p.y = invlatiso(state.e, (LC - state.cp) / state.rs);
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, lc: 0, rs: 0, cp: 0, n2: 0, xs: 0, ys: 0, ...options};
  initialize(state);
  return state;
}
