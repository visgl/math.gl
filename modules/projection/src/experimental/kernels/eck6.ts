// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters} from '../kernel';
export type State = KernelParameters & {
  m: number;
  n: number;
  C_y: number;
  C_x: number;
  en: number[];
};
import {forward as sinuForward, inverse as sinuInverse} from './sinu';

function initialize(state: State): void {
  /* Force spherical handling */
  state.sphere = true;
  state.b = state.a;

  state.m = 1.0;
  state.n = 2.570796326794896619231321691; /* 1 + π/2 */
  state.es = 0;

  state.C_y = Math.sqrt((state.m + 1.0) / state.n);
  state.C_x = state.C_y / (state.m + 1.0);
}

export var forward = sinuForward;
export var inverse = sinuInverse;

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {...base, m: 0, n: 0, C_y: 0, C_x: 0, en: [], ...options};
  initialize(state);
  return state;
}
