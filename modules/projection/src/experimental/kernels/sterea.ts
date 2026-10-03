// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = GaussState & {
  sinc0: number;
  cosc0: number;
  R2: number;
};
import {
  createState as createGaussState,
  forward as gaussForward,
  inverse as gaussInverse
} from './gauss';
import type {State as GaussState} from './gauss';
import adjust_lon from '../common/adjust_lon';
import hypot from '../common/hypot';

function initialize(state: State): void {
  if (!state.rc) {
    return;
  }
  state.sinc0 = Math.sin(state.phic0);
  state.cosc0 = Math.cos(state.phic0);
  state.R2 = 2 * state.rc;
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var sinc, cosc, cosl, k;
  p.x = adjust_lon(p.x - state.long0, state.over);
  gaussForward(state, p);
  sinc = Math.sin(p.y);
  cosc = Math.cos(p.y);
  cosl = Math.cos(p.x);
  k = (state.k0 * state.R2) / (1 + state.sinc0 * sinc + state.cosc0 * cosc * cosl);
  p.x = k * cosc * Math.sin(p.x);
  p.y = k * (state.cosc0 * sinc - state.sinc0 * cosc * cosl);
  p.x = state.a * p.x + state.x0;
  p.y = state.a * p.y + state.y0;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var sinc, cosc, lon, lat, rho;
  p.x = (p.x - state.x0) / state.a;
  p.y = (p.y - state.y0) / state.a;

  p.x /= state.k0;
  p.y /= state.k0;
  rho = hypot(p.x, p.y);
  if (rho) {
    var c = 2 * Math.atan2(rho, state.R2);
    sinc = Math.sin(c);
    cosc = Math.cos(c);
    lat = Math.asin(cosc * state.sinc0 + (p.y * sinc * state.cosc0) / rho);
    lon = Math.atan2(p.x * sinc, rho * state.cosc0 * cosc - p.y * state.sinc0 * sinc);
  } else {
    lat = state.phic0;
    lon = 0;
  }

  p.x = lon;
  p.y = lat;
  if (!gaussInverse(state, p)) throw new Error('Oblique stereographic inverse did not converge');
  p.x = adjust_lon(p.x + state.long0, state.over);
  return p;
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...createGaussState(base),
    sinc0: 0,
    cosc0: 0,
    R2: 0
  };
  initialize(state);
  return state;
}
