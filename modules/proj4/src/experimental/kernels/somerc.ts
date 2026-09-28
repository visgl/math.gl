// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

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

export function forward(state: State, p: Point): Point | null | undefined | number {
  var Sa1 = Math.log(Math.tan(Math.PI / 4 - p.y / 2));
  var Sa2 = (state.e / 2) * Math.log((1 + state.e * Math.sin(p.y)) / (1 - state.e * Math.sin(p.y)));
  var S = -state.alpha * (Sa1 + Sa2) + state.K;

  // spheric latitude
  var b = 2 * (Math.atan(Math.exp(S)) - Math.PI / 4);

  // spheric longitude
  var I = state.alpha * (p.x - state.lambda0);

  // psoeudo equatorial rotation
  var rotI = Math.atan(
    Math.sin(I) / (Math.sin(state.b0) * Math.tan(b) + Math.cos(state.b0) * Math.cos(I))
  );

  var rotB = Math.asin(
    Math.cos(state.b0) * Math.sin(b) - Math.sin(state.b0) * Math.cos(b) * Math.cos(I)
  );

  p.y = (state.R / 2) * Math.log((1 + Math.sin(rotB)) / (1 - Math.sin(rotB))) + state.y0;
  p.x = state.R * rotI + state.x0;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var Y = p.x - state.x0;
  var X = p.y - state.y0;

  var rotI = Y / state.R;
  var rotB = 2 * (Math.atan(Math.exp(X / state.R)) - Math.PI / 4);

  var b = Math.asin(
    Math.cos(state.b0) * Math.sin(rotB) + Math.sin(state.b0) * Math.cos(rotB) * Math.cos(rotI)
  );
  var I = Math.atan(
    Math.sin(rotI) / (Math.cos(state.b0) * Math.cos(rotI) - Math.sin(state.b0) * Math.tan(rotB))
  );

  var lambda = state.lambda0 + I / state.alpha;

  var S = 0;
  var phy = b;
  var prevPhy = -1000;
  var iteration = 0;
  while (Math.abs(phy - prevPhy) > 0.0000001) {
    if (++iteration > 20) {
      // ...reportError("omercFwdInfinity");
      return undefined;
    }
    // S = Math.log(Math.tan(Math.PI / 4 + phy / 2));
    S =
      (1 / state.alpha) * (Math.log(Math.tan(Math.PI / 4 + b / 2)) - state.K) +
      state.e * Math.log(Math.tan(Math.PI / 4 + Math.asin(state.e * Math.sin(phy)) / 2));
    prevPhy = phy;
    phy = 2 * Math.atan(Math.exp(S)) - Math.PI / 2;
  }

  p.x = lambda;
  p.y = phy;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, lambda0: 0, rf: 0, R: 0, alpha: 0, b0: 0, K: 0, ...options};
  initialize(state);
  return state;
}
