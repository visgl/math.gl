// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {};
import adjust_lon from '../common/adjust_lon';

/*
  reference
    "New Equal-Area Map Projections for Noncircular Regions", John P. Snyder,
    The American Cartographer, Vol 15, No. 4, October 1988, pp. 341-355.
  */

/* Initialize the Miller Cylindrical projection
  ------------------------------------------- */
function initialize(state: State): void {
  // no-op
}

/* Miller Cylindrical forward equations--mapping lat,long to x,y
    ------------------------------------------------------------ */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;
  /* Forward equations
      ----------------- */
  var dlon = adjust_lon(lon - state.long0, state.over);
  var x = state.x0 + state.a * dlon;
  var y = state.y0 + state.a * Math.log(Math.tan(Math.PI / 4 + lat / 2.5)) * 1.25;

  p.x = x;
  p.y = y;
  return p;
}

/* Miller Cylindrical inverse equations--mapping x,y to lat/long
    ------------------------------------------------------------ */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.x0;
  p.y -= state.y0;

  var lon = adjust_lon(state.long0 + p.x / state.a, state.over);
  var lat = 2.5 * (Math.atan(Math.exp((0.8 * p.y) / state.a)) - Math.PI / 4);

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
