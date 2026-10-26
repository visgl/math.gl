// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original math.gl polar inverse tangent-plane limit and shared meridional quadrature remove cancellation, truncation and inverse residuals.  Adapted from proj4js 2.22.0 with corrected spherical meridian distance across pole-relative latitudes. See ../../../../projection/PROJ4-LICENSE.md for upstream attribution. Independent corrections acknowledge PROJ 9.5.1 src/projections/poly.cpp; see ../../../../projection/PROJ-LICENSE.txt.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  ml0: number;
  meridianPole: number;
  poleRadius: number;
};
import adjust_lon from '../common/adjust_lon';
import {EPSLN} from '../common/constants';

import gN from '../common/gN';
import {meridianDistance} from '../common/meridian-distance';

var MAX_ITER = 20;

function initialize(state: State): void {
  /* Place parameters in static storage for common use
      ------------------------------------------------- */
  state.meridianPole = meridianDistance(state.a, state.es, 0, Math.PI / 2);
  state.poleRadius = state.a / Math.sqrt(1 - state.es);
  state.ml0 = meridianDistance(state.a, state.es, 0, state.lat0);
}

/* Polyconic forward equations--mapping lat,long to x,y
    --------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;
  var x, y, el;
  var dlon = adjust_lon(lon - state.long0, state.over);
  el = dlon * Math.sin(lat);
  if (state.sphere) {
    if (lat === 0) {
      x = state.a * dlon;
      y = -1 * state.a * state.lat0;
    } else {
      x = (state.a * Math.sin(el)) / Math.tan(lat);
      // This is a meridian distance, not a latitude to wrap at either pole.
      y = state.a * (lat - state.lat0 + (2 * Math.sin(el / 2) ** 2) / Math.tan(lat));
    }
  } else {
    if (lat === 0) {
      x = state.a * dlon;
      y = -1 * state.ml0;
    } else {
      var nl = gN(state.a, state.e, Math.sin(lat)) / Math.tan(lat);
      x = nl * Math.sin(el);
      y = meridianDistance(state.a, state.es, state.lat0, lat) + nl * (2 * Math.sin(el / 2) ** 2);
    }
  }
  p.x = x + state.x0;
  p.y = y + state.y0;
  return p;
}

/* Inverse equations
  ----------------- */
export function inverse(state: State, p: Point): Point | null | undefined | number {
  var lon, lat, x, y, i;
  var al, bl;
  var phi, dphi;
  x = p.x - state.x0;
  y = p.y - state.y0;

  const meridian = y + (state.sphere ? state.a * state.lat0 : state.ml0);
  const sign = meridian < 0 ? -1 : 1;
  const pole = state.sphere ? (state.a * Math.PI) / 2 : state.meridianPole;
  const poleOffset = pole - sign * meridian;
  const radius = Math.hypot(x, poleOffset);
  // The polar limit is a tangent plane: x=N*u*sin(lambda),
  // y_pole-y=sign*N*u*cos(lambda). Neglected terms are O(a*u^3),
  // below a nanometre for this branch, before binary64 rounding.
  if (radius / state.a < 1e-6) {
    p.x = adjust_lon(state.long0 + Math.atan2(x, poleOffset), state.over);
    p.y = sign * (Math.PI / 2 - radius / state.poleRadius);
    return p;
  }

  if (state.sphere) {
    if (Math.abs(y + state.a * state.lat0) <= EPSLN) {
      lon = adjust_lon(x / state.a + state.long0, state.over);
      lat = 0;
    } else {
      al = state.lat0 + y / state.a;
      bl = (x * x) / state.a / state.a + al * al;
      phi = al;
      var tanphi;
      for (i = MAX_ITER; i; --i) {
        tanphi = Math.tan(phi);
        dphi =
          (-1 * (al * (phi * tanphi + 1) - phi - 0.5 * (phi * phi + bl) * tanphi)) /
          ((phi - al) / tanphi - 1);
        phi += dphi;
        if (Math.abs(dphi) <= 1e-14) {
          lat = phi;
          break;
        }
      }
      lat = refineInverseLatitude(state, lat === undefined ? phi : lat, x, y);
      if (lat === undefined) return null;
      phi = lat;
      lon = adjust_lon(
        state.long0 + Math.asin((x * Math.tan(phi)) / state.a) / Math.sin(lat),
        state.over
      );
    }
  } else {
    if (Math.abs(y + state.ml0) <= EPSLN) {
      lat = 0;
      lon = adjust_lon(state.long0 + x / state.a, state.over);
    } else {
      al = (state.ml0 + y) / state.a;
      bl = (x * x) / state.a / state.a + al * al;
      phi = al;
      var cl, mln, mlnp, ma;
      var con;
      for (i = MAX_ITER; i; --i) {
        con = state.e * Math.sin(phi);
        cl = Math.sqrt(1 - con * con) * Math.tan(phi);
        mln = meridianDistance(state.a, state.es, 0, phi);
        mlnp = (1 - state.es) / Math.pow(1 - con * con, 1.5);
        ma = mln / state.a;
        dphi =
          (al * (cl * ma + 1) - ma - 0.5 * cl * (ma * ma + bl)) /
          ((state.es * Math.sin(2 * phi) * (ma * ma + bl - 2 * al * ma)) / (4 * cl) +
            (al - ma) * (cl * mlnp - 2 / Math.sin(2 * phi)) -
            mlnp);
        phi -= dphi;
        if (Math.abs(dphi) <= 1e-14) {
          lat = phi;
          break;
        }
      }

      lat = refineInverseLatitude(state, lat === undefined ? phi : lat, x, y);
      if (lat === undefined) return null;
      phi = lat;
      // lat=phi4z(state.e,state.e0,state.e1,state.e2,state.e3,al,bl,0,0);
      cl = Math.sqrt(1 - state.es * Math.pow(Math.sin(lat), 2)) * Math.tan(lat);
      lon = adjust_lon(state.long0 + Math.asin((x * cl) / state.a) / Math.sin(lat), state.over);
    }
  }

  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,
    ml0: 0,
    meridianPole: 0,
    poleRadius: 0,
    ...options
  };
  initialize(state);
  return state;
}

/** Refine a stalled iterate using the original northing at fixed easting.
 * Acceptance is measured in planar axis units, not an angular step threshold.
 */
function refineInverseLatitude(
  state: State,
  latitude: number,
  x: number,
  y: number
): number | undefined {
  for (let i = 0; i < 8; i++) {
    if (!Number.isFinite(latitude) || Math.abs(latitude) >= Math.PI / 2) return undefined;
    const sin = Math.sin(latitude),
      cos = Math.cos(latitude);
    const denominator = 1 - state.es * sin * sin;
    const normal = state.sphere ? state.a : gN(state.a, state.e, sin);
    const radius = normal / Math.tan(latitude);
    const arc = Math.asin(x / radius);
    const easting = radius * Math.sin(arc);
    const oneMinusCos = 2 * Math.sin(arc / 2) ** 2;
    const meridian = state.sphere
      ? state.a * (latitude - state.lat0)
      : meridianDistance(state.a, state.es, state.lat0, latitude);
    const correction = radius * oneMinusCos;
    const northing = meridian + correction;
    const error = northing - y;
    // Scale each ordinate by the terms forming it. A full-axis tolerance on
    // tiny equatorial northings would accept a large relative latitude error.
    if (
      Math.abs(easting - x) <= 64 * Number.EPSILON * Math.max(state.a, Math.abs(x)) &&
      Math.abs(error) <=
        64 *
          Number.EPSILON *
          Math.max(
            Math.abs(y),
            Math.abs(meridian),
            Math.abs(correction),
            state.a * Math.max(Math.abs(latitude), Math.abs(state.lat0))
          )
    )
      return latitude;
    const meridianDerivative = state.sphere
      ? state.a
      : (state.a * (1 - state.es)) / Math.pow(denominator, 1.5);
    const radiusDerivative =
      normal * ((state.sphere ? 0 : (state.es * cos * cos) / denominator) - 1 / (sin * sin));
    const derivative = meridianDerivative + radiusDerivative * (-oneMinusCos / Math.cos(arc));
    const step = error / derivative;
    if (!Number.isFinite(step) || Math.abs(step) > 1e-6) return undefined;
    latitude -= step;
  }
  return undefined;
}
