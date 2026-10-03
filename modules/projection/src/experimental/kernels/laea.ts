// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  mode: number;
  qp: number;
  mmf: number;
  apa: number[];
  dd: number;
  rq: number;
  xmf: number;
  ymf: number;
  sinb1: number;
  cosb1: number;
  sinph0: number;
  cosph0: number;
};
import {HALF_PI, EPSLN, FORTPI} from '../common/constants';

import qsfnz from '../common/qsfnz';
import adjust_lon from '../common/adjust_lon';
import authset from '../common/authset';
import authlat from '../common/authlat';

/*
  reference
    "New Equal-Area Map Projections for Noncircular Regions", John P. Snyder,
    The American Cartographer, Vol 15, No. 4, October 1988, pp. 341-355.
  */

export var S_POLE = 1;
export var N_POLE = 2;
export var EQUIT = 3;
export var OBLIQ = 4;

function initialize(state: State): void {
  var t = Math.abs(state.lat0);
  if (Math.abs(t - HALF_PI) < EPSLN) {
    state.mode = state.lat0 < 0 ? S_POLE : N_POLE;
  } else if (Math.abs(t) < EPSLN) {
    state.mode = EQUIT;
  } else {
    state.mode = OBLIQ;
  }
  if (state.es > 0) {
    var sinphi;

    state.qp = qsfnz(state.e, 1);
    state.mmf = 0.5 / (1 - state.es);
    state.apa = authset(state.es);
    switch (state.mode) {
      case N_POLE:
        state.dd = 1;
        break;
      case S_POLE:
        state.dd = 1;
        break;
      case EQUIT:
        state.rq = Math.sqrt(0.5 * state.qp);
        state.dd = 1 / state.rq;
        state.xmf = 1;
        state.ymf = 0.5 * state.qp;
        break;
      case OBLIQ:
        state.rq = Math.sqrt(0.5 * state.qp);
        sinphi = Math.sin(state.lat0);
        state.sinb1 = qsfnz(state.e, sinphi) / state.qp;
        state.cosb1 = Math.sqrt(1 - state.sinb1 * state.sinb1);
        state.dd =
          Math.cos(state.lat0) /
          (Math.sqrt(1 - state.es * sinphi * sinphi) * state.rq * state.cosb1);
        state.xmf = state.rq;
        state.ymf = state.xmf / state.dd;
        state.xmf *= state.dd;
        break;
    }
  } else {
    if (state.mode === OBLIQ) {
      state.sinph0 = Math.sin(state.lat0);
      state.cosph0 = Math.cos(state.lat0);
    }
  }
}

/* Lambert Azimuthal Equal Area forward equations--mapping lat,long to x,y
  ----------------------------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  /* Forward equations
      ----------------- */
  var x, y, coslam, sinlam, sinphi, q, sinb, cosb, b, cosphi;
  var lam = p.x;
  var phi = p.y;

  lam = adjust_lon(lam - state.long0, state.over);
  if (state.sphere) {
    sinphi = Math.sin(phi);
    cosphi = Math.cos(phi);
    coslam = Math.cos(lam);
    if (state.mode === OBLIQ || state.mode === EQUIT) {
      y =
        state.mode === EQUIT
          ? 1 + cosphi * coslam
          : 1 + state.sinph0 * sinphi + state.cosph0 * cosphi * coslam;
      if (y <= EPSLN) {
        return null;
      }
      y = Math.sqrt(2 / y);
      x = y * cosphi * Math.sin(lam);
      y *= state.mode === EQUIT ? sinphi : state.cosph0 * sinphi - state.sinph0 * cosphi * coslam;
    } else if (state.mode === N_POLE || state.mode === S_POLE) {
      if (state.mode === N_POLE) {
        coslam = -coslam;
      }
      if (Math.abs(phi + state.lat0) < EPSLN) {
        return null;
      }
      y = FORTPI - phi * 0.5;
      y = 2 * (state.mode === S_POLE ? Math.cos(y) : Math.sin(y));
      x = y * Math.sin(lam);
      y *= coslam;
    }
  } else {
    sinb = 0;
    cosb = 0;
    b = 0;
    coslam = Math.cos(lam);
    sinlam = Math.sin(lam);
    sinphi = Math.sin(phi);
    q = qsfnz(state.e, sinphi);
    if (state.mode === OBLIQ || state.mode === EQUIT) {
      sinb = q / state.qp;
      cosb = Math.sqrt(1 - sinb * sinb);
    }
    switch (state.mode) {
      case OBLIQ:
        b = 1 + state.sinb1 * sinb + state.cosb1 * cosb * coslam;
        break;
      case EQUIT:
        b = 1 + cosb * coslam;
        break;
      case N_POLE:
        b = HALF_PI + phi;
        q = state.qp - q;
        break;
      case S_POLE:
        b = phi - HALF_PI;
        q = state.qp + q;
        break;
    }
    if (Math.abs(b) < EPSLN) {
      return null;
    }
    switch (state.mode) {
      case OBLIQ:
      case EQUIT:
        b = Math.sqrt(2 / b);
        if (state.mode === OBLIQ) {
          y = state.ymf * b * (state.cosb1 * sinb - state.sinb1 * cosb * coslam);
        } else {
          b = Math.sqrt(2 / (1 + cosb * coslam));
          y = b * sinb * state.ymf;
        }
        x = state.xmf * b * cosb * sinlam;
        break;
      case N_POLE:
      case S_POLE:
        if (q >= 0) {
          b = Math.sqrt(q);
          x = b * sinlam;
          y = coslam * (state.mode === S_POLE ? b : -b);
        } else {
          x = y = 0;
        }
        break;
    }
  }

  p.x = state.a * x + state.x0;
  p.y = state.a * y + state.y0;
  return p;
}

/* Inverse equations
  ----------------- */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.x0;
  p.y -= state.y0;
  var x = p.x / state.a;
  var y = p.y / state.a;
  var lam, phi, cCe, sCe, q, rho, ab;
  if (state.sphere) {
    var cosz = 0,
      rh,
      sinz = 0;

    rh = Math.sqrt(x * x + y * y);
    phi = rh * 0.5;
    if (phi > 1) {
      return null;
    }
    phi = 2 * Math.asin(phi);
    if (state.mode === OBLIQ || state.mode === EQUIT) {
      sinz = Math.sin(phi);
      cosz = Math.cos(phi);
    }
    switch (state.mode) {
      case EQUIT:
        phi = Math.abs(rh) <= EPSLN ? 0 : Math.asin((y * sinz) / rh);
        x *= sinz;
        y = cosz * rh;
        break;
      case OBLIQ:
        phi =
          Math.abs(rh) <= EPSLN
            ? state.lat0
            : Math.asin(cosz * state.sinph0 + (y * sinz * state.cosph0) / rh);
        x *= sinz * state.cosph0;
        y = (cosz - Math.sin(phi) * state.sinph0) * rh;
        break;
      case N_POLE:
        y = -y;
        phi = HALF_PI - phi;
        break;
      case S_POLE:
        phi -= HALF_PI;
        break;
    }
    lam = y === 0 && (state.mode === EQUIT || state.mode === OBLIQ) ? 0 : Math.atan2(x, y);
  } else {
    ab = 0;
    if (state.mode === OBLIQ || state.mode === EQUIT) {
      x /= state.dd;
      y *= state.dd;
      rho = Math.sqrt(x * x + y * y);
      if (rho < EPSLN) {
        p.x = state.long0;
        p.y = state.lat0;
        return p;
      }
      sCe = 2 * Math.asin((0.5 * rho) / state.rq);
      cCe = Math.cos(sCe);
      x *= sCe = Math.sin(sCe);
      if (state.mode === OBLIQ) {
        ab = cCe * state.sinb1 + (y * sCe * state.cosb1) / rho;
        q = state.qp * ab;
        y = rho * state.cosb1 * cCe - y * state.sinb1 * sCe;
      } else {
        ab = (y * sCe) / rho;
        q = state.qp * ab;
        y = rho * cCe;
      }
    } else if (state.mode === N_POLE || state.mode === S_POLE) {
      if (state.mode === N_POLE) {
        y = -y;
      }
      q = x * x + y * y;
      if (!q) {
        p.x = state.long0;
        p.y = state.lat0;
        return p;
      }
      ab = 1 - q / state.qp;
      if (state.mode === S_POLE) {
        ab = -ab;
      }
    }
    lam = Math.atan2(x, y);
    phi = authlat(Math.asin(ab), state.apa);
  }

  p.x = adjust_lon(state.long0 + lam, state.over);
  p.y = phi;
  return p;
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    mode: 0,
    qp: 0,
    mmf: 0,
    apa: [],
    dd: 0,
    rq: 0,
    xmf: 0,
    ymf: 0,
    sinb1: 0,
    cosb1: 0,
    sinph0: 0,
    cosph0: 0
  };
  initialize(state);
  return state;
}
