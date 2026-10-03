// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  rc: number;
  C: number;
  phic0: number;
  ratexp: number;
  K: number;
};
import srat from '../common/srat';
var MAX_ITER = 20;
import {HALF_PI, FORTPI} from '../common/constants';

function initialize(state: State): void {
  var sphi = Math.sin(state.lat0);
  var cphi = Math.cos(state.lat0);
  cphi *= cphi;
  state.rc = Math.sqrt(1 - state.es) / (1 - state.es * sphi * sphi);
  state.C = Math.sqrt(1 + (state.es * cphi * cphi) / (1 - state.es));
  state.phic0 = Math.asin(sphi / state.C);
  state.ratexp = 0.5 * state.C * state.e;
  state.K =
    Math.tan(0.5 * state.phic0 + FORTPI) /
    (Math.pow(Math.tan(0.5 * state.lat0 + FORTPI), state.C) * srat(state.e * sphi, state.ratexp));
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;

  p.y =
    2 *
      Math.atan(
        state.K *
          Math.pow(Math.tan(0.5 * lat + FORTPI), state.C) *
          srat(state.e * Math.sin(lat), state.ratexp)
      ) -
    HALF_PI;
  p.x = state.C * lon;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var DEL_TOL = 1e-14;
  var lon = p.x / state.C;
  var lat = p.y;
  var num = Math.pow(Math.tan(0.5 * lat + FORTPI) / state.K, 1 / state.C);
  for (var i = MAX_ITER; i > 0; --i) {
    lat = 2 * Math.atan(num * srat(state.e * Math.sin(p.y), -0.5 * state.e)) - HALF_PI;
    if (Math.abs(lat - p.y) < DEL_TOL) {
      break;
    }
    p.y = lat;
  }
  /* convergence failed */
  if (!i) {
    return null;
  }
  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    rc: 0,
    C: 0,
    phic0: 0,
    ratexp: 0,
    K: 0
  };
  initialize(state);
  return state;
}
