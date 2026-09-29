// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {};
// Robinson projection
// Based on https://github.com/OSGeo/proj.4/blob/master/src/PJ_robin.c
// Polynomial coeficients from http://article.gmane.org/gmane.comp.gis.proj-4.devel/6039

import {HALF_PI, D2R, R2D, EPSLN} from '../common/constants';
import adjust_lon from '../common/adjust_lon';

var COEFS_X = [
  [1.0, 2.2199e-17, -7.15515e-5, 3.1103e-6],
  [0.9986, -0.000482243, -2.4897e-5, -1.3309e-6],
  [0.9954, -0.00083103, -4.48605e-5, -9.86701e-7],
  [0.99, -0.00135364, -5.9661e-5, 3.6777e-6],
  [0.9822, -0.00167442, -4.49547e-6, -5.72411e-6],
  [0.973, -0.00214868, -9.03571e-5, 1.8736e-8],
  [0.96, -0.00305085, -9.00761e-5, 1.64917e-6],
  [0.9427, -0.00382792, -6.53386e-5, -2.6154e-6],
  [0.9216, -0.00467746, -0.00010457, 4.81243e-6],
  [0.8962, -0.00536223, -3.23831e-5, -5.43432e-6],
  [0.8679, -0.00609363, -0.000113898, 3.32484e-6],
  [0.835, -0.00698325, -6.40253e-5, 9.34959e-7],
  [0.7986, -0.00755338, -5.00009e-5, 9.35324e-7],
  [0.7597, -0.00798324, -3.5971e-5, -2.27626e-6],
  [0.7186, -0.00851367, -7.01149e-5, -8.6303e-6],
  [0.6732, -0.00986209, -0.000199569, 1.91974e-5],
  [0.6213, -0.010418, 8.83923e-5, 6.24051e-6],
  [0.5722, -0.00906601, 0.000182, 6.24051e-6],
  [0.5322, -0.00677797, 0.000275608, 6.24051e-6]
];

var COEFS_Y = [
  [-5.20417e-18, 0.0124, 1.21431e-18, -8.45284e-11],
  [0.062, 0.0124, -1.26793e-9, 4.22642e-10],
  [0.124, 0.0124, 5.07171e-9, -1.60604e-9],
  [0.186, 0.0123999, -1.90189e-8, 6.00152e-9],
  [0.248, 0.0124002, 7.10039e-8, -2.24e-8],
  [0.31, 0.0123992, -2.64997e-7, 8.35986e-8],
  [0.372, 0.0124029, 9.88983e-7, -3.11994e-7],
  [0.434, 0.0123893, -3.69093e-6, -4.35621e-7],
  [0.4958, 0.0123198, -1.02252e-5, -3.45523e-7],
  [0.5571, 0.0121916, -1.54081e-5, -5.82288e-7],
  [0.6176, 0.0119938, -2.41424e-5, -5.25327e-7],
  [0.6769, 0.011713, -3.20223e-5, -5.16405e-7],
  [0.7346, 0.0113541, -3.97684e-5, -6.09052e-7],
  [0.7903, 0.0109107, -4.89042e-5, -1.04739e-6],
  [0.8435, 0.0103431, -6.4615e-5, -1.40374e-9],
  [0.8936, 0.00969686, -6.4636e-5, -8.547e-6],
  [0.9394, 0.00840947, -0.000192841, -4.2106e-6],
  [0.9761, 0.00616527, -0.000256, -4.2106e-6],
  [1.0, 0.00328947, -0.000319159, -4.2106e-6]
];

var FXC = 0.8487;
var FYC = 1.3523;
var C1 = R2D / 5; // rad to 5-degree interval
var RC1 = 1 / C1;
var NODES = 18;

var poly3_val = function (coefs: readonly number[], x: number) {
  return coefs[0] + x * (coefs[1] + x * (coefs[2] + x * coefs[3]));
};

var poly3_der = function (coefs: readonly number[], x: number) {
  return coefs[1] + x * (2 * coefs[2] + x * 3 * coefs[3]);
};

function newton_rapshon(
  f_df: (x: number) => number,
  start: number,
  max_err: number,
  iters: number
) {
  var x = start;
  for (; iters; --iters) {
    var upd = f_df(x);
    x -= upd;
    if (Math.abs(upd) < max_err) {
      break;
    }
  }
  return x;
}

function initialize(state: State): void {
  state.x0 = state.x0 || 0;
  state.y0 = state.y0 || 0;
  state.long0 = state.long0 || 0;
  state.es = 0;
}

export function forward(state: State, ll: Point): Point | null | undefined | number {
  var lon = adjust_lon(ll.x - state.long0, state.over);

  var dphi = Math.abs(ll.y);
  var i = Math.floor(dphi * C1);
  if (i < 0) {
    i = 0;
  } else if (i >= NODES) {
    i = NODES - 1;
  }
  dphi = R2D * (dphi - RC1 * i);
  var xy = {
    x: poly3_val(COEFS_X[i], dphi) * lon,
    y: poly3_val(COEFS_Y[i], dphi)
  };
  if (ll.y < 0) {
    xy.y = -xy.y;
  }

  xy.x = xy.x * state.a * FXC + state.x0;
  xy.y = xy.y * state.a * FYC + state.y0;

  return xy;
}

export function inverse(state: State, xy: Point): Point | null | undefined | number {
  var ll = {
    x: (xy.x - state.x0) / (state.a * FXC),
    y: Math.abs(xy.y - state.y0) / (state.a * FYC)
  };

  if (ll.y >= 1) {
    // pathologic case
    ll.x /= COEFS_X[NODES][0];
    ll.y = xy.y < 0 ? -HALF_PI : HALF_PI;
  } else {
    // find table interval
    var i = Math.floor(ll.y * NODES);
    if (i < 0) {
      i = 0;
    } else if (i >= NODES) {
      i = NODES - 1;
    }
    for (;;) {
      if (COEFS_Y[i][0] > ll.y) {
        --i;
      } else if (COEFS_Y[i + 1][0] <= ll.y) {
        ++i;
      } else {
        break;
      }
    }
    // linear interpolation in 5 degree interval
    var coefs = COEFS_Y[i];
    var t = (5 * (ll.y - coefs[0])) / (COEFS_Y[i + 1][0] - coefs[0]);
    // find t so that poly3_val(coefs, t) = ll.y
    t = newton_rapshon(
      function (x: number) {
        return (poly3_val(coefs, x) - ll.y) / poly3_der(coefs, x);
      },
      t,
      EPSLN,
      100
    );

    ll.x /= poly3_val(COEFS_X[i], t);
    ll.y = (5 * i + t) * D2R;
    if (xy.y < 0) {
      ll.y = -ll.y;
    }
  }

  ll.x = adjust_lon(ll.x + state.long0, state.over);

  return ll;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,

    ...options
  };
  initialize(state);
  return state;
}
