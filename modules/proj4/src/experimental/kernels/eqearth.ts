// math.gl
// SPDX-License-Identifier: Apache-2.0
// Direct TypeScript port of proj4js 2.22.0 lib/projections/eqearth.js.
// Modified to use explicit TypeScript state. Original Apache-2.0 notice retained below.
// See ../../../APACHE-2.0-LICENSE.txt and ../../../THIRD-PARTY-NOTICES.md.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  apa: number[];
  qp: number;
  rqda: number;
};
/**
 * Copyright 2018 Bernie Jenny, Monash University, Melbourne, Australia.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Equal Earth is a projection inspired by the Robinson projection, but unlike
 * the Robinson projection retains the relative size of areas. The projection
 * was designed in 2018 by Bojan Savric, Tom Patterson and Bernhard Jenny.
 *
 * Publication:
 * Bojan Savric, Tom Patterson & Bernhard Jenny (2018). The Equal Earth map
 * projection, International Journal of Geographical Information Science,
 * DOI: 10.1080/13658816.2018.1504949
 *
 * Code released August 2018
 * Ported to JavaScript and adapted for mapshaper-proj by Matthew Bloch August 2018
 * Modified for proj4js by Andreas Hocevar by Andreas Hocevar March 2024
 */

import adjust_lon from '../common/adjust_lon';
import qsfnz from '../common/qsfnz';
import authset from '../common/authset';
import authlat from '../common/authlat';

var A1 = 1.340264,
  A2 = -0.081106,
  A3 = 0.000893,
  A4 = 0.003796,
  M = Math.sqrt(3) / 2.0;

function initialize(state: State): void {
  state.long0 = state.long0 !== undefined ? state.long0 : 0;
  state.x0 = state.x0 !== undefined ? state.x0 : 0;
  state.y0 = state.y0 !== undefined ? state.y0 : 0;
  if (state.es !== 0) {
    state.apa = authset(state.es);
    state.qp = qsfnz(state.e, 1);
    state.rqda = Math.sqrt(0.5 * state.qp);
  }
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var lam = adjust_lon(p.x - state.long0, state.over);
  var phi = p.y;
  var sinphi = Math.sin(phi);
  if (state.es !== 0) {
    sinphi = qsfnz(state.e, sinphi) / state.qp;
  }
  var paramLat = Math.asin(M * sinphi),
    paramLatSq = paramLat * paramLat,
    paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
  p.x =
    (lam * Math.cos(paramLat)) /
    (M * (A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq)));
  p.y = paramLat * (A1 + A2 * paramLatSq + paramLatPow6 * (A3 + A4 * paramLatSq));

  if (state.es !== 0) {
    p.x *= state.rqda;
    p.y *= state.rqda;
  }

  p.x = state.a * p.x + state.x0;
  p.y = state.a * p.y + state.y0;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  p.x = (p.x - state.x0) / state.a;
  p.y = (p.y - state.y0) / state.a;

  if (state.es !== 0) {
    p.x /= state.rqda;
    p.y /= state.rqda;
  }

  var EPS = 1e-9,
    NITER = 12,
    paramLat = p.y,
    paramLatSq,
    paramLatPow6,
    fy,
    fpy,
    dlat,
    i;

  for (i = 0; i < NITER; ++i) {
    paramLatSq = paramLat * paramLat;
    paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
    fy = paramLat * (A1 + A2 * paramLatSq + paramLatPow6 * (A3 + A4 * paramLatSq)) - p.y;
    fpy = A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq);
    paramLat -= dlat = fy / fpy;
    if (Math.abs(dlat) < EPS) {
      break;
    }
  }
  paramLatSq = paramLat * paramLat;
  paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
  p.x =
    (M * p.x * (A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq))) /
    Math.cos(paramLat);
  p.y = Math.asin(Math.sin(paramLat) / M);

  if (state.es !== 0) {
    p.y = authlat(p.y, state.apa);
  }

  p.x = adjust_lon(p.x + state.long0, state.over);
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, apa: [], qp: 0, rqda: 0, ...options};
  initialize(state);
  return state;
}
