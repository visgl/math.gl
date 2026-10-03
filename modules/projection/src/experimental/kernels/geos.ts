// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Direct TypeScript port of proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  flip_axis: number;
  sweep: string;
  h: number;
  radius_g_1: number;
  radius_g: number;
  C: number;
  radius_p: number;
  radius_p2: number;
  radius_p_inv2: number;
  shape: string;
};
import hypot from '../common/hypot';

function initialize(state: State): void {
  state.flip_axis = state.sweep === 'x' ? 1 : 0;
  state.h = Number(state.h);
  state.radius_g_1 = state.h / state.a;

  if (state.radius_g_1 <= 0 || state.radius_g_1 > 1e10) {
    throw new Error();
  }

  state.radius_g = 1.0 + state.radius_g_1;
  state.C = state.radius_g * state.radius_g - 1.0;

  if (state.es !== 0.0) {
    var one_es = 1.0 - state.es;
    var rone_es = 1 / one_es;

    state.radius_p = Math.sqrt(one_es);
    state.radius_p2 = one_es;
    state.radius_p_inv2 = rone_es;

    state.shape = 'ellipse'; // Use as a condition in the forward and inverse functions.
  } else {
    state.radius_p = 1.0;
    state.radius_p2 = 1.0;
    state.radius_p_inv2 = 1.0;

    state.shape = 'sphere'; // Use as a condition in the forward and inverse functions.
  }
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;
  var tmp, v_x, v_y, v_z;
  lon = lon - state.long0;

  if (state.shape === 'ellipse') {
    lat = Math.atan(state.radius_p2 * Math.tan(lat));
    var r = state.radius_p / hypot(state.radius_p * Math.cos(lat), Math.sin(lat));

    v_x = r * Math.cos(lon) * Math.cos(lat);
    v_y = r * Math.sin(lon) * Math.cos(lat);
    v_z = r * Math.sin(lat);

    if ((state.radius_g - v_x) * v_x - v_y * v_y - v_z * v_z * state.radius_p_inv2 < 0.0) {
      p.x = Number.NaN;
      p.y = Number.NaN;
      return p;
    }

    tmp = state.radius_g - v_x;
    if (state.flip_axis) {
      p.x = state.radius_g_1 * Math.atan(v_y / hypot(v_z, tmp));
      p.y = state.radius_g_1 * Math.atan(v_z / tmp);
    } else {
      p.x = state.radius_g_1 * Math.atan(v_y / tmp);
      p.y = state.radius_g_1 * Math.atan(v_z / hypot(v_y, tmp));
    }
  } else if (state.shape === 'sphere') {
    tmp = Math.cos(lat);
    v_x = Math.cos(lon) * tmp;
    v_y = Math.sin(lon) * tmp;
    v_z = Math.sin(lat);
    tmp = state.radius_g - v_x;

    if (state.flip_axis) {
      p.x = state.radius_g_1 * Math.atan(v_y / hypot(v_z, tmp));
      p.y = state.radius_g_1 * Math.atan(v_z / tmp);
    } else {
      p.x = state.radius_g_1 * Math.atan(v_y / tmp);
      p.y = state.radius_g_1 * Math.atan(v_z / hypot(v_y, tmp));
    }
  }
  p.x = p.x * state.a;
  p.y = p.y * state.a;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var v_x = -1.0;
  var v_y = 0.0;
  var v_z = 0.0;
  var a, b, det, k;

  p.x = p.x / state.a;
  p.y = p.y / state.a;

  if (state.shape === 'ellipse') {
    if (state.flip_axis) {
      v_z = Math.tan(p.y / state.radius_g_1);
      v_y = Math.tan(p.x / state.radius_g_1) * hypot(1.0, v_z);
    } else {
      v_y = Math.tan(p.x / state.radius_g_1);
      v_z = Math.tan(p.y / state.radius_g_1) * hypot(1.0, v_y);
    }

    var v_zp = v_z / state.radius_p;
    a = v_y * v_y + v_zp * v_zp + v_x * v_x;
    b = 2 * state.radius_g * v_x;
    det = b * b - 4 * a * state.C;

    if (det < 0.0) {
      p.x = Number.NaN;
      p.y = Number.NaN;
      return p;
    }

    k = (-b - Math.sqrt(det)) / (2.0 * a);
    v_x = state.radius_g + k * v_x;
    v_y *= k;
    v_z *= k;

    p.x = Math.atan2(v_y, v_x);
    p.y = Math.atan((v_z * Math.cos(p.x)) / v_x);
    p.y = Math.atan(state.radius_p_inv2 * Math.tan(p.y));
  } else if (state.shape === 'sphere') {
    if (state.flip_axis) {
      v_z = Math.tan(p.y / state.radius_g_1);
      v_y = Math.tan(p.x / state.radius_g_1) * Math.sqrt(1.0 + v_z * v_z);
    } else {
      v_y = Math.tan(p.x / state.radius_g_1);
      v_z = Math.tan(p.y / state.radius_g_1) * Math.sqrt(1.0 + v_y * v_y);
    }

    a = v_y * v_y + v_z * v_z + v_x * v_x;
    b = 2 * state.radius_g * v_x;
    det = b * b - 4 * a * state.C;
    if (det < 0.0) {
      p.x = Number.NaN;
      p.y = Number.NaN;
      return p;
    }

    k = (-b - Math.sqrt(det)) / (2.0 * a);
    v_x = state.radius_g + k * v_x;
    v_y *= k;
    v_z *= k;

    p.x = Math.atan2(v_y, v_x);
    p.y = Math.atan((v_z * Math.cos(p.x)) / v_x);
  }
  p.x = p.x + state.long0;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,
    flip_axis: 0,
    sweep: '',
    h: 0,
    radius_g_1: 0,
    radius_g: 0,
    C: 0,
    radius_p: 0,
    radius_p2: 0,
    radius_p_inv2: 0,
    shape: '',
    ...options
  };
  initialize(state);
  return state;
}
