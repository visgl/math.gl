// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) PROJ contributors
// SPDX-FileComment: Initialization adapted from proj4js 2.22.0; forward branch and inverse Newton equations adapted from PROJ 9.5.1 src/projections/somerc.cpp. See ../../../../projection/PROJ-LICENSE.txt. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  lambda0: number;
  rf: number;
  R: number;
  alpha: number;
  b0: number;
  K: number;
};
/*
  references:
    Formules et constantes pour le Calcul pour la
    projection cylindrique conforme à axe oblique et pour la transformation entre
    des systèmes de référence.
    http://www.swisstopo.admin.ch/internet/swisstopo/fr/home/topics/survey/sys/refsys/switzerland.parsysrelated1.31216.downloadList.77004.DownloadFile.tmp/swissprojectionfr.pdf
  */

function initialize(state: State): void {
  if (!state.k0) {
    state.k0 = 1;
  }
  var phy0 = state.lat0;
  state.lambda0 = state.long0;
  var sinPhy0 = Math.sin(phy0);
  var semiMajorAxis = state.a;
  var invF = state.rf;
  var flattening = 1 / invF;
  var e2 = 2 * flattening - Math.pow(flattening, 2);
  state.e = Math.sqrt(e2);
  var e = state.e;
  state.R = (state.k0 * semiMajorAxis * Math.sqrt(1 - e2)) / (1 - e2 * Math.pow(sinPhy0, 2));
  state.alpha = Math.sqrt(1 + (e2 / (1 - e2)) * Math.pow(Math.cos(phy0), 4));
  state.b0 = Math.asin(sinPhy0 / state.alpha);
  var k1 = Math.log(Math.tan(Math.PI / 4 + state.b0 / 2));
  var k2 = Math.log(Math.tan(Math.PI / 4 + phy0 / 2));
  var k3 = Math.log((1 + e * sinPhy0) / (1 - e * sinPhy0));
  state.K = k1 - state.alpha * k2 + ((state.alpha * e) / 2) * k3;
}

export function forward(state: State, p: Point): Point | null {
  const sp = state.e * Math.sin(p.y);
  const latitude =
    2 *
      Math.atan(
        Math.exp(
          state.alpha *
            (Math.log(Math.tan(Math.PI / 4 + p.y / 2)) -
              (state.e / 2) * Math.log((1 + sp) / (1 - sp))) +
            state.K
        )
      ) -
    Math.PI / 2;
  const longitude = state.alpha * (p.x - state.lambda0);
  const cos = Math.cos(latitude);
  const rotatedLatitude = Math.asin(
    Math.cos(state.b0) * Math.sin(latitude) - Math.sin(state.b0) * cos * Math.cos(longitude)
  );
  const rotatedLongitude = Math.asin((cos * Math.sin(longitude)) / Math.cos(rotatedLatitude));
  p.x = state.x0 + state.R * rotatedLongitude;
  p.y = state.y0 + state.R * Math.log(Math.tan(Math.PI / 4 + rotatedLatitude / 2));
  return p;
}

export function inverse(state: State, p: Point): Point | null {
  const longitude = (p.x - state.x0) / state.R;
  const latitude = 2 * (Math.atan(Math.exp((p.y - state.y0) / state.R)) - Math.PI / 4);
  let phi = Math.asin(
    Math.cos(state.b0) * Math.sin(latitude) +
      Math.sin(state.b0) * Math.cos(latitude) * Math.cos(longitude)
  );
  const lambda = Math.asin((Math.cos(latitude) * Math.sin(longitude)) / Math.cos(phi));
  const con = (state.K - Math.log(Math.tan(Math.PI / 4 + phi / 2))) / state.alpha;
  for (let iteration = 0; iteration < 6; iteration++) {
    const esp = state.e * Math.sin(phi);
    const step =
      ((con +
        Math.log(Math.tan(Math.PI / 4 + phi / 2)) -
        (state.e / 2) * Math.log((1 + esp) / (1 - esp))) *
        (1 - esp * esp) *
        Math.cos(phi)) /
      (1 - state.es);
    phi -= step;
    if (Math.abs(step) < 1e-10) {
      p.x = state.lambda0 + lambda / state.alpha;
      p.y = phi;
      return p;
    }
  }
  return null;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, lambda0: 0, rf: 0, R: 0, alpha: 0, b0: 0, K: 0, ...options};
  initialize(state);
  return state;
}
