// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  t2: number;
  t1: number;
};
import adjust_lon from '../common/adjust_lon';

function initialize(state: State): void {
  state.x0 = state.x0 || 0;
  state.y0 = state.y0 || 0;
  state.lat0 = state.lat0 || 0;
  state.long0 = state.long0 || 0;
  /// state.t2;
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;

  var dlon = adjust_lon(lon - state.long0, state.over);
  var x = state.x0 + state.a * dlon * Math.cos(state.lat0);
  var y = state.y0 + state.a * lat;

  state.t1 = x;
  state.t2 = Math.cos(state.lat0);
  p.x = x;
  p.y = y;
  return p;
}

/* Equirectangular inverse equations--mapping x,y to lat/long
  --------------------------------------------------------- */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.x0;
  p.y -= state.y0;
  var lat = p.y / state.a;

  var lon = adjust_lon(state.long0 + p.x / (state.a * Math.cos(state.lat0)), state.over);
  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, t2: 0, t1: 0, ...options};
  initialize(state);
  return state;
}
