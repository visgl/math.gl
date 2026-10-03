// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  mode: number;
  sinph0: number;
  cosph0: number;
  pn1: number;
  h: number;
  p: number;
  rp: number;
  h1: number;
  pfact: number;
  tilt: number;
  azi: number;
  cg: number;
  sg: number;
  cw: number;
  sw: number;
};
import {HALF_PI, EPSLN} from '../common/constants';
import hypot from '../common/hypot';

var mode = {
  N_POLE: 0,
  S_POLE: 1,
  EQUIT: 2,
  OBLIQ: 3
};

function initialize(state: State): void {
  if (Math.abs(Math.abs(state.lat0) - HALF_PI) < EPSLN) {
    state.mode = state.lat0 < 0 ? mode.S_POLE : mode.N_POLE;
  } else if (Math.abs(state.lat0) < EPSLN) {
    state.mode = mode.EQUIT;
  } else {
    state.mode = mode.OBLIQ;
    state.sinph0 = Math.sin(state.lat0);
    state.cosph0 = Math.cos(state.lat0);
  }

  state.pn1 = state.h / state.a; // Normalize relative to the Earth's radius

  if (state.pn1 <= 0 || state.pn1 > 1e10) {
    throw new Error('Invalid height');
  }

  state.p = 1 + state.pn1;
  state.rp = 1 / state.p;
  state.h1 = 1 / state.pn1;
  state.pfact = (state.p + 1) * state.h1;
  state.es = 0;

  var omega = state.tilt;
  var gamma = state.azi;
  state.cg = Math.cos(gamma);
  state.sg = Math.sin(gamma);
  state.cw = Math.cos(omega);
  state.sw = Math.sin(omega);
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.long0;
  var sinphi = Math.sin(p.y);
  var cosphi = Math.cos(p.y);
  var coslam = Math.cos(p.x);
  var x, y;
  switch (state.mode) {
    case mode.OBLIQ:
      y = state.sinph0 * sinphi + state.cosph0 * cosphi * coslam;
      break;
    case mode.EQUIT:
      y = cosphi * coslam;
      break;
    case mode.S_POLE:
      y = -sinphi;
      break;
    case mode.N_POLE:
      y = sinphi;
      break;
  }
  y = state.pn1 / (state.p - y);
  x = y * cosphi * Math.sin(p.x);

  switch (state.mode) {
    case mode.OBLIQ:
      y *= state.cosph0 * sinphi - state.sinph0 * cosphi * coslam;
      break;
    case mode.EQUIT:
      y *= sinphi;
      break;
    case mode.N_POLE:
      y *= -(cosphi * coslam);
      break;
    case mode.S_POLE:
      y *= cosphi * coslam;
      break;
  }

  // Tilt
  var yt, ba;
  yt = y * state.cg + x * state.sg;
  ba = 1 / (yt * state.sw * state.h1 + state.cw);
  x = (x * state.cg - y * state.sg) * state.cw * ba;
  y = yt * ba;

  p.x = x * state.a;
  p.y = y * state.a;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x /= state.a;
  p.y /= state.a;
  var r = {x: p.x, y: p.y};

  // Un-Tilt
  var bm, bq, yt;
  yt = 1 / (state.pn1 - p.y * state.sw);
  bm = state.pn1 * p.x * yt;
  bq = state.pn1 * p.y * state.cw * yt;
  p.x = bm * state.cg + bq * state.sg;
  p.y = bq * state.cg - bm * state.sg;

  var rh = hypot(p.x, p.y);
  if (Math.abs(rh) < EPSLN) {
    r.x = 0;
    r.y = state.lat0;
  } else {
    var cosz, sinz;
    sinz = 1 - rh * rh * state.pfact;
    sinz = (state.p - Math.sqrt(sinz)) / (state.pn1 / rh + rh / state.pn1);
    cosz = Math.sqrt(1 - sinz * sinz);
    switch (state.mode) {
      case mode.OBLIQ:
        r.y = Math.asin(cosz * state.sinph0 + (p.y * sinz * state.cosph0) / rh);
        p.y = (cosz - state.sinph0 * Math.sin(r.y)) * rh;
        p.x *= sinz * state.cosph0;
        break;
      case mode.EQUIT:
        r.y = Math.asin((p.y * sinz) / rh);
        p.y = cosz * rh;
        p.x *= sinz;
        break;
      case mode.N_POLE:
        r.y = Math.asin(cosz);
        p.y = -p.y;
        break;
      case mode.S_POLE:
        r.y = -Math.asin(cosz);
        break;
    }
    r.x = Math.atan2(p.x, p.y);
  }

  p.x = r.x + state.long0;
  p.y = r.y;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,
    mode: 0,
    sinph0: 0,
    cosph0: 0,
    pn1: 0,
    h: 0,
    p: 0,
    rp: 0,
    h1: 0,
    pfact: 0,
    tilt: 0,
    azi: 0,
    cg: 0,
    sg: 0,
    cw: 0,
    sw: 0,
    ...options
  };
  initialize(state);
  return state;
}
