// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  A: number[];
  B_re: number[];
  B_im: number[];
  C_re: number[];
  C_im: number[];
  D: number[];
  iterations: number;
};
import {SEC_TO_RAD} from '../common/constants';

/*
  reference
    Department of Land and Survey Technical Circular 1973/32
      http://www.linz.govt.nz/docs/miscellaneous/nz-map-definition.pdf
    OSG Technical Report 4.1
      http://www.linz.govt.nz/docs/miscellaneous/nzmg.pdf
  */

/**
 * iterations: Number of iterations to refine inverse transform.
 *     0 -> km accuracy
 *     1 -> m accuracy -- suitable for most mapping applications
 *     2 -> mm accuracy
 */
export var iterations = 1;

function initialize(state: State): void {
  state.A = [];
  state.A[1] = 0.6399175073;
  state.A[2] = -0.1358797613;
  state.A[3] = 0.063294409;
  state.A[4] = -0.02526853;
  state.A[5] = 0.0117879;
  state.A[6] = -0.0055161;
  state.A[7] = 0.0026906;
  state.A[8] = -0.001333;
  state.A[9] = 0.00067;
  state.A[10] = -0.00034;

  state.B_re = [];
  state.B_im = [];
  state.B_re[1] = 0.7557853228;
  state.B_im[1] = 0;
  state.B_re[2] = 0.249204646;
  state.B_im[2] = 0.003371507;
  state.B_re[3] = -0.001541739;
  state.B_im[3] = 0.04105856;
  state.B_re[4] = -0.10162907;
  state.B_im[4] = 0.01727609;
  state.B_re[5] = -0.26623489;
  state.B_im[5] = -0.36249218;
  state.B_re[6] = -0.6870983;
  state.B_im[6] = -1.1651967;

  state.C_re = [];
  state.C_im = [];
  state.C_re[1] = 1.3231270439;
  state.C_im[1] = 0;
  state.C_re[2] = -0.577245789;
  state.C_im[2] = -0.007809598;
  state.C_re[3] = 0.508307513;
  state.C_im[3] = -0.112208952;
  state.C_re[4] = -0.15094762;
  state.C_im[4] = 0.18200602;
  state.C_re[5] = 1.01418179;
  state.C_im[5] = 1.64497696;
  state.C_re[6] = 1.9660549;
  state.C_im[6] = 2.5127645;

  state.D = [];
  state.D[1] = 1.5627014243;
  state.D[2] = 0.5185406398;
  state.D[3] = -0.03333098;
  state.D[4] = -0.1052906;
  state.D[5] = -0.0368594;
  state.D[6] = 0.007317;
  state.D[7] = 0.0122;
  state.D[8] = 0.00394;
  state.D[9] = -0.0013;
}

/**
    New Zealand Map Grid Forward  - long/lat to x/y
    long/lat in radians
  */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var n;
  var lon = p.x;
  var lat = p.y;

  var delta_lat = lat - state.lat0;
  var delta_lon = lon - state.long0;

  // 1. Calculate d_phi and d_psi    ...                          // and d_lambda
  // For this algorithm, delta_latitude is in seconds of arc x 10-5, so we need to scale to those units. Longitude is radians.
  var d_phi = (delta_lat / SEC_TO_RAD) * 1e-5;
  var d_lambda = delta_lon;
  var d_phi_n = 1; // d_phi^0

  var d_psi = 0;
  for (n = 1; n <= 10; n++) {
    d_phi_n = d_phi_n * d_phi;
    d_psi = d_psi + state.A[n] * d_phi_n;
  }

  // 2. Calculate theta
  var th_re = d_psi;
  var th_im = d_lambda;

  // 3. Calculate z
  var th_n_re = 1;
  var th_n_im = 0; // theta^0
  var th_n_re1;
  var th_n_im1;

  var z_re = 0;
  var z_im = 0;
  for (n = 1; n <= 6; n++) {
    th_n_re1 = th_n_re * th_re - th_n_im * th_im;
    th_n_im1 = th_n_im * th_re + th_n_re * th_im;
    th_n_re = th_n_re1;
    th_n_im = th_n_im1;
    z_re = z_re + state.B_re[n] * th_n_re - state.B_im[n] * th_n_im;
    z_im = z_im + state.B_im[n] * th_n_re + state.B_re[n] * th_n_im;
  }

  // 4. Calculate easting and northing
  p.x = z_im * state.a + state.x0;
  p.y = z_re * state.a + state.y0;

  return p;
}

/**
    New Zealand Map Grid Inverse  -  x/y to long/lat
  */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  var n;
  var x = p.x;
  var y = p.y;

  var delta_x = x - state.x0;
  var delta_y = y - state.y0;

  // 1. Calculate z
  var z_re = delta_y / state.a;
  var z_im = delta_x / state.a;

  // 2a. Calculate theta - first approximation gives km accuracy
  var z_n_re = 1;
  var z_n_im = 0; // z^0
  var z_n_re1;
  var z_n_im1;

  var th_re = 0;
  var th_im = 0;
  for (n = 1; n <= 6; n++) {
    z_n_re1 = z_n_re * z_re - z_n_im * z_im;
    z_n_im1 = z_n_im * z_re + z_n_re * z_im;
    z_n_re = z_n_re1;
    z_n_im = z_n_im1;
    th_re = th_re + state.C_re[n] * z_n_re - state.C_im[n] * z_n_im;
    th_im = th_im + state.C_im[n] * z_n_re + state.C_re[n] * z_n_im;
  }

  // 2b. Iterate to refine the accuracy of the calculation
  //        0 iterations gives km accuracy
  //        1 iteration gives m accuracy -- good enough for most mapping applications
  //        2 iterations bives mm accuracy
  for (var i = 0; i < state.iterations; i++) {
    var th_n_re = th_re;
    var th_n_im = th_im;
    var th_n_re1;
    var th_n_im1;

    var num_re = z_re;
    var num_im = z_im;
    for (n = 2; n <= 6; n++) {
      th_n_re1 = th_n_re * th_re - th_n_im * th_im;
      th_n_im1 = th_n_im * th_re + th_n_re * th_im;
      th_n_re = th_n_re1;
      th_n_im = th_n_im1;
      num_re = num_re + (n - 1) * (state.B_re[n] * th_n_re - state.B_im[n] * th_n_im);
      num_im = num_im + (n - 1) * (state.B_im[n] * th_n_re + state.B_re[n] * th_n_im);
    }

    th_n_re = 1;
    th_n_im = 0;
    var den_re = state.B_re[1];
    var den_im = state.B_im[1];
    for (n = 2; n <= 6; n++) {
      th_n_re1 = th_n_re * th_re - th_n_im * th_im;
      th_n_im1 = th_n_im * th_re + th_n_re * th_im;
      th_n_re = th_n_re1;
      th_n_im = th_n_im1;
      den_re = den_re + n * (state.B_re[n] * th_n_re - state.B_im[n] * th_n_im);
      den_im = den_im + n * (state.B_im[n] * th_n_re + state.B_re[n] * th_n_im);
    }

    // Complex division
    var den2 = den_re * den_re + den_im * den_im;
    th_re = (num_re * den_re + num_im * den_im) / den2;
    th_im = (num_im * den_re - num_re * den_im) / den2;
  }

  // 3. Calculate d_phi              ...                                    // and d_lambda
  var d_psi = th_re;
  var d_lambda = th_im;
  var d_psi_n = 1; // d_psi^0

  var d_phi = 0;
  for (n = 1; n <= 9; n++) {
    d_psi_n = d_psi_n * d_psi;
    d_phi = d_phi + state.D[n] * d_psi_n;
  }

  // 4. Calculate latitude and longitude
  // d_phi is calcuated in second of arc * 10^-5, so we need to scale back to radians. d_lambda is in radians.
  var lat = state.lat0 + d_phi * SEC_TO_RAD * 1e5;
  var lon = state.long0 + d_lambda;

  p.x = lon;
  p.y = lat;

  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,
    A: [],
    B_re: [],
    B_im: [],
    C_re: [],
    C_im: [],
    D: [],
    iterations: 1,
    ...options
  };
  initialize(state);
  return state;
}
