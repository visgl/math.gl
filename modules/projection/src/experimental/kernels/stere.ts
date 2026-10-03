// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Direct TypeScript port of proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  coslat0: number;
  sinlat0: number;
  con: number;
  cons: number;
  ms1: number;
  X0: number;
  cosX0: number;
  sinX0: number;
};
import {EPSLN, HALF_PI} from '../common/constants';

import sign from '../common/sign';
import msfnz from '../common/msfnz';
import tsfnz from '../common/tsfnz';
import phi2z from '../common/phi2z';
import adjust_lon from '../common/adjust_lon';

function ssfn_(phit: number, sinphi: number, eccen: number): number {
  sinphi *= eccen;
  return Math.tan(0.5 * (HALF_PI + phit)) * Math.pow((1 - sinphi) / (1 + sinphi), 0.5 * eccen);
}

function initialize(state: State): void {
  // setting default parameters
  state.x0 = state.x0 || 0;
  state.y0 = state.y0 || 0;
  state.lat0 = state.lat0 || 0;
  state.long0 = state.long0 || 0;

  state.coslat0 = Math.cos(state.lat0);
  state.sinlat0 = Math.sin(state.lat0);
  if (state.sphere) {
    if (!Number.isNaN(state.lat_ts) && Math.abs(state.coslat0) <= EPSLN) {
      state.k0 = 0.5 * (1 + sign(state.lat0) * Math.sin(state.lat_ts));
    }
  } else {
    if (Math.abs(state.coslat0) <= EPSLN) {
      if (state.lat0 > 0) {
        // North pole
        // trace('stere:north pole');
        state.con = 1;
      } else {
        // South pole
        // trace('stere:south pole');
        state.con = -1;
      }
    }
    state.cons = Math.sqrt(Math.pow(1 + state.e, 1 + state.e) * Math.pow(1 - state.e, 1 - state.e));
    if (
      !Number.isNaN(state.lat_ts) &&
      Math.abs(state.coslat0) <= EPSLN &&
      Math.abs(Math.cos(state.lat_ts)) > EPSLN
    ) {
      // Polar Stereographic variant B: k0 is derived from lat_ts (EPSG guidance note 7-2, method 9829)
      // https://epsg.org/coord-operation-method_9829/Polar-Stereographic-variant-B.html
      state.k0 =
        (0.5 * state.cons * msfnz(state.e, Math.sin(state.lat_ts), Math.cos(state.lat_ts))) /
        tsfnz(state.e, state.con * state.lat_ts, state.con * Math.sin(state.lat_ts));
    }
    state.ms1 = msfnz(state.e, state.sinlat0, state.coslat0);
    state.X0 = 2 * Math.atan(ssfn_(state.lat0, state.sinlat0, state.e)) - HALF_PI;
    state.cosX0 = Math.cos(state.X0);
    state.sinX0 = Math.sin(state.X0);
  }
}

// Stereographic forward equations--mapping lat,long to x,y
export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;
  var sinlat = Math.sin(lat);
  var coslat = Math.cos(lat);
  var A, X, sinX, cosX, ts, rh;
  var dlon = adjust_lon(lon - state.long0, state.over);

  if (
    Math.abs(Math.abs(lon - state.long0) - Math.PI) <= EPSLN &&
    Math.abs(lat + state.lat0) <= EPSLN
  ) {
    // case of the origine point
    // trace('stere:this is the origin point');
    p.x = NaN;
    p.y = NaN;
    return p;
  }
  if (state.sphere) {
    // trace('stere:sphere case');
    A = (2 * state.k0) / (1 + state.sinlat0 * sinlat + state.coslat0 * coslat * Math.cos(dlon));
    p.x = state.a * A * coslat * Math.sin(dlon) + state.x0;
    p.y =
      state.a * A * (state.coslat0 * sinlat - state.sinlat0 * coslat * Math.cos(dlon)) + state.y0;
    return p;
  } else {
    X = 2 * Math.atan(ssfn_(lat, sinlat, state.e)) - HALF_PI;
    cosX = Math.cos(X);
    sinX = Math.sin(X);
    if (Math.abs(state.coslat0) <= EPSLN) {
      ts = tsfnz(state.e, lat * state.con, state.con * sinlat);
      rh = (2 * state.a * state.k0 * ts) / state.cons;
      p.x = state.x0 + rh * Math.sin(lon - state.long0);
      p.y = state.y0 - state.con * rh * Math.cos(lon - state.long0);
      // trace(p.toString());
      return p;
    } else if (Math.abs(state.sinlat0) < EPSLN) {
      // Eq
      // trace('stere:equateur');
      A = (2 * state.a * state.k0) / (1 + cosX * Math.cos(dlon));
      // Correct the missing false northing in proj4js 2.22.0 equatorial stereographic.
      p.y = A * sinX + state.y0;
    } else {
      // other case
      // trace('stere:normal case');
      A =
        (2 * state.a * state.k0 * state.ms1) /
        (state.cosX0 * (1 + state.sinX0 * sinX + state.cosX0 * cosX * Math.cos(dlon)));
      p.y = A * (state.cosX0 * sinX - state.sinX0 * cosX * Math.cos(dlon)) + state.y0;
    }
    p.x = A * cosX * Math.sin(dlon) + state.x0;
  }
  // trace(p.toString());
  return p;
}

//* Stereographic inverse equations--mapping x,y to lat/long
export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.x0;
  p.y -= state.y0;
  var lon, lat, ts, ce, Chi;
  var rh = Math.sqrt(p.x * p.x + p.y * p.y);
  if (state.sphere) {
    var c = 2 * Math.atan(rh / (2 * state.a * state.k0));
    lon = state.long0;
    lat = state.lat0;
    if (rh <= EPSLN) {
      p.x = lon;
      p.y = lat;
      return p;
    }
    lat = Math.asin(Math.cos(c) * state.sinlat0 + (p.y * Math.sin(c) * state.coslat0) / rh);
    if (Math.abs(state.coslat0) < EPSLN) {
      if (state.lat0 > 0) {
        lon = adjust_lon(state.long0 + Math.atan2(p.x, -1 * p.y), state.over);
      } else {
        lon = adjust_lon(state.long0 + Math.atan2(p.x, p.y), state.over);
      }
    } else {
      lon = adjust_lon(
        state.long0 +
          Math.atan2(
            p.x * Math.sin(c),
            rh * state.coslat0 * Math.cos(c) - p.y * state.sinlat0 * Math.sin(c)
          ),
        state.over
      );
    }
    p.x = lon;
    p.y = lat;
    return p;
  } else {
    if (Math.abs(state.coslat0) <= EPSLN) {
      if (rh <= EPSLN) {
        lat = state.lat0;
        lon = state.long0;
        p.x = lon;
        p.y = lat;
        // trace(p.toString());
        return p;
      }
      p.x *= state.con;
      p.y *= state.con;
      ts = (rh * state.cons) / (2 * state.a * state.k0);
      lat = state.con * phi2z(state.e, ts);
      lon = state.con * adjust_lon(state.con * state.long0 + Math.atan2(p.x, -1 * p.y), state.over);
    } else {
      ce = 2 * Math.atan((rh * state.cosX0) / (2 * state.a * state.k0 * state.ms1));
      lon = state.long0;
      if (rh <= EPSLN) {
        Chi = state.X0;
      } else {
        Chi = Math.asin(Math.cos(ce) * state.sinX0 + (p.y * Math.sin(ce) * state.cosX0) / rh);
        lon = adjust_lon(
          state.long0 +
            Math.atan2(
              p.x * Math.sin(ce),
              rh * state.cosX0 * Math.cos(ce) - p.y * state.sinX0 * Math.sin(ce)
            ),
          state.over
        );
      }
      lat = -1 * phi2z(state.e, Math.tan(0.5 * (HALF_PI + Chi)));
    }
  }
  p.x = lon;
  p.y = lat;

  // trace(p.toString());
  return p;
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    coslat0: 0,
    sinlat0: 0,
    con: 0,
    cons: 0,
    ms1: 0,
    X0: 0,
    cosX0: 0,
    sinX0: 0
  };
  initialize(state);
  return state;
}
