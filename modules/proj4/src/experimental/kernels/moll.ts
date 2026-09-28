// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {};
import adjust_lon from '../common/adjust_lon';
import {EPSLN} from '../common/constants';

function initialize(state: State): void {
  state.x0 = state.x0 !== undefined ? state.x0 : 0;
  state.y0 = state.y0 !== undefined ? state.y0 : 0;
  state.long0 = state.long0 !== undefined ? state.long0 : 0;
}

/* Mollweide forward equations--mapping lat,long to x,y
    ---------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  /* Forward equations
      ----------------- */
  var lon = p.x;
  var lat = p.y;

  var delta_lon = adjust_lon(lon - state.long0, state.over);
  var theta = lat;
  var con = Math.PI * Math.sin(lat);

  /* Iterate using the Newton-Raphson method to find theta
      ----------------------------------------------------- */
  for (let iteration = 0; iteration < 50; iteration++) {
    if (Math.abs(Math.abs(lat) - Math.PI / 2) < EPSLN) {
      theta = Math.sign(lat) * Math.PI;
      break;
    }
    var delta_theta = -(theta + Math.sin(theta) - con) / (1 + Math.cos(theta));
    theta += delta_theta;
    if (iteration === 49) throw new Error('Mollweide forward did not converge');
    if (Math.abs(delta_theta) < EPSLN) {
      break;
    }
  }
  theta /= 2;

  /* If the latitude is 90 deg, force the x coordinate to be "0 + false easting"
       this is done here because of precision problems with "cos(theta)"
       -------------------------------------------------------------------------- */
  if (Math.PI / 2 - Math.abs(lat) < EPSLN) {
    delta_lon = 0;
  }
  var x = 0.900316316158 * state.a * delta_lon * Math.cos(theta) + state.x0;
  var y = 1.4142135623731 * state.a * Math.sin(theta) + state.y0;

  p.x = x;
  p.y = y;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var theta;
  var arg;

  /* Inverse equations
      ----------------- */
  p.x -= state.x0;
  p.y -= state.y0;
  arg = p.y / (1.4142135623731 * state.a);

  /* Because of division by zero problems, 'arg' can not be 1.  Therefore
       a number very close to one is used instead.
       ------------------------------------------------------------------- */
  if (Math.abs(arg) > 0.999999999999) {
    arg = Math.sign(arg) * 0.999999999999;
  }
  theta = Math.asin(arg);
  var lon = adjust_lon(
    state.long0 + p.x / (0.900316316158 * state.a * Math.cos(theta)),
    state.over
  );
  if (lon < -Math.PI) {
    lon = -Math.PI;
  }
  if (lon > Math.PI) {
    lon = Math.PI;
  }
  arg = (2 * theta + Math.sin(2 * theta)) / Math.PI;
  if (Math.abs(arg) > 1) {
    arg = Math.sign(arg);
  }
  var lat = Math.asin(arg);

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
