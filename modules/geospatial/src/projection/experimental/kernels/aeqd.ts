// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Adapted from proj4js 2.22.0; polar meridian integration/inversion is original math.gl code. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  sin_p12: number;
  cos_p12: number;
  f: number;
};
import adjust_lon from '../common/adjust_lon';
import {HALF_PI, EPSLN} from '../common/constants';
import asinz from '../common/asinz';
import {meridianDistance, inverseMeridianDistance} from '../common/meridian-distance';
import {vincentyDirect, vincentyInverse} from '../common/vincenty';

function initialize(state: State): void {
  state.sin_p12 = Math.sin(state.lat0);
  state.cos_p12 = Math.cos(state.lat0);
  state.x0 = state.x0 || 0;
  state.y0 = state.y0 || 0;
  state.long0 = state.long0 || 0;
  // flattening for ellipsoid
  state.f = state.es / (1 + Math.sqrt(1 - state.es));
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var lon = p.x;
  var lat = p.y;
  var sinphi = Math.sin(p.y);
  var cosphi = Math.cos(p.y);
  var dlon = adjust_lon(lon - state.long0, state.over);
  var distance, c, kp, cos_c, azi1;
  if (state.sphere) {
    if (Math.abs(state.sin_p12 - 1) <= EPSLN) {
      // North Pole case
      p.x = state.x0 + state.a * (HALF_PI - lat) * Math.sin(dlon);
      p.y = state.y0 - state.a * (HALF_PI - lat) * Math.cos(dlon);
      return p;
    } else if (Math.abs(state.sin_p12 + 1) <= EPSLN) {
      // South Pole case
      p.x = state.x0 + state.a * (HALF_PI + lat) * Math.sin(dlon);
      p.y = state.y0 + state.a * (HALF_PI + lat) * Math.cos(dlon);
      return p;
    } else {
      // default case
      cos_c = state.sin_p12 * sinphi + state.cos_p12 * cosphi * Math.cos(dlon);
      c = Math.acos(cos_c);
      kp = c ? c / Math.sin(c) : 1;
      p.x = state.x0 + state.a * kp * cosphi * Math.sin(dlon);
      p.y =
        state.y0 +
        state.a * kp * (state.cos_p12 * sinphi - state.sin_p12 * cosphi * Math.cos(dlon));
      return p;
    }
  } else {
    if (Math.abs(state.sin_p12 - 1) <= EPSLN) {
      // North Pole case
      distance = meridianDistance(state.a, state.es, lat, HALF_PI);
      p.x = state.x0 + distance * Math.sin(dlon);
      p.y = state.y0 - distance * Math.cos(dlon);
      return p;
    } else if (Math.abs(state.sin_p12 + 1) <= EPSLN) {
      // South Pole case
      distance = meridianDistance(state.a, state.es, -HALF_PI, lat);
      p.x = state.x0 + distance * Math.sin(dlon);
      p.y = state.y0 + distance * Math.cos(dlon);
      return p;
    } else {
      // Default case
      // Correct the upstream origin shortcut to use longitude relative to lon_0.
      if (Math.abs(dlon) < EPSLN && Math.abs(lat - state.lat0) < EPSLN) {
        p.x = state.x0;
        p.y = state.y0;
        return p;
      }
      vincentyInverse(state.lat0, state.long0, lat, lon, state.a, state.f, p);
      azi1 = p.x;
      const distance = p.y;
      p.x = state.x0 + distance * Math.sin(azi1);
      p.y = state.y0 + distance * Math.cos(azi1);
      return p;
    }
  }
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x -= state.x0;
  p.y -= state.y0;
  var rh, z, sinz, cosz, lon, lat, con, Mlp, M, azi1, s12;
  if (state.sphere) {
    rh = Math.sqrt(p.x * p.x + p.y * p.y);
    if (rh > 2 * HALF_PI * state.a) {
      return null;
    }
    z = rh / state.a;

    sinz = Math.sin(z);
    cosz = Math.cos(z);

    lon = state.long0;
    if (Math.abs(rh) <= EPSLN) {
      lat = state.lat0;
    } else {
      lat = asinz(cosz * state.sin_p12 + (p.y * sinz * state.cos_p12) / rh);
      con = Math.abs(state.lat0) - HALF_PI;
      if (Math.abs(con) <= EPSLN) {
        if (state.lat0 >= 0) {
          if (!Number.isFinite(lat)) return null;
          lon = adjust_lon(state.long0 + Math.atan2(p.x, -p.y), state.over);
        } else {
          lon = adjust_lon(state.long0 - Math.atan2(-p.x, p.y), state.over);
        }
      } else {
        lon = adjust_lon(
          state.long0 +
            Math.atan2(p.x * sinz, rh * state.cos_p12 * cosz - p.y * state.sin_p12 * sinz),
          state.over
        );
      }
    }

    p.x = lon;
    p.y = lat;
    return p;
  } else {
    if (Math.abs(state.sin_p12 - 1) <= EPSLN) {
      // North pole case
      Mlp = meridianDistance(state.a, state.es, 0, HALF_PI);
      rh = Math.sqrt(p.x * p.x + p.y * p.y);
      M = Mlp - rh;
      lat = inverseMeridianDistance(state.a, state.es, M);
      if (!Number.isFinite(lat)) return null;
      lon = adjust_lon(state.long0 + Math.atan2(p.x, -1 * p.y), state.over);
      p.x = lon;
      p.y = lat;
      return p;
    } else if (Math.abs(state.sin_p12 + 1) <= EPSLN) {
      // South pole case
      Mlp = meridianDistance(state.a, state.es, 0, HALF_PI);
      rh = Math.sqrt(p.x * p.x + p.y * p.y);
      M = rh - Mlp;

      lat = inverseMeridianDistance(state.a, state.es, M);
      if (!Number.isFinite(lat)) return null;
      lon = adjust_lon(state.long0 + Math.atan2(p.x, p.y), state.over);
      p.x = lon;
      p.y = lat;
      return p;
    } else {
      // default case
      azi1 = Math.atan2(p.x, p.y);
      s12 = Math.sqrt(p.x * p.x + p.y * p.y);
      vincentyDirect(state.lat0, state.long0, azi1, s12, state.a, state.f, p);
      return p;
    }
  }
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    sin_p12: 0,
    cos_p12: 0,
    f: 0
  };
  initialize(state);
  return state;
}
