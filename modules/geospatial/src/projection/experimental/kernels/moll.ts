// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original math.gl pole-complement solve, exact constants and bounded inverse replace cancellation-prone iteration.  Direct TypeScript port of proj4js 2.22.0. See ../../../../projection/PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {};
import adjust_lon from '../common/adjust_lon';

function initialize(state: State): void {
  state.x0 = state.x0 !== undefined ? state.x0 : 0;
  state.y0 = state.y0 !== undefined ? state.y0 : 0;
  state.long0 = state.long0 !== undefined ? state.long0 : 0;
}

/* Mollweide forward equations--mapping lat,long to x,y
    ---------------------------------------------------- */
export function forward(state: State, p: Point): Point | null | undefined | number {
  /* Forward equations
      ----------------- */
  var lon = p.x;
  var lat = p.y;

  var delta_lon = adjust_lon(lon - state.long0, state.over);
  // Solve v - sin(v) = pi*(1 - sin(|latitude|)), v=pi-2*theta.
  // Retain the pole complement even when sin(latitude) rounds to one.
  const sin = Math.sin(Math.abs(lat));
  const cos = Math.cos(lat);
  const target = Math.abs(lat) === Math.PI / 2 ? 0 : (Math.PI * cos * cos) / (1 + sin);
  let v = Math.cbrt(6 * target);
  let lower = 0;
  let upper = Math.PI;
  v = Math.min(v, upper);
  for (let i = 0; i < 32 && v > 0; i++) {
    const residual = sineComplement(v) - target;
    const step = residual / (2 * Math.sin(v / 2) ** 2);
    if (Math.abs(step) <= 16 * Number.EPSILON * v) break;
    if (residual > 0) upper = v;
    else lower = v;
    const next = v - step;
    if (next === v || upper - lower <= 8 * Number.EPSILON * Math.max(1, v)) break;
    v = next >= lower && next <= upper ? next : (lower + upper) / 2;
    if (i === 31) throw new Error('Mollweide forward did not converge');
  }
  var x = ((2 * Math.SQRT2) / Math.PI) * state.a * delta_lon * Math.sin(v / 2) + state.x0;
  var y = Math.sign(lat) * Math.SQRT2 * state.a * Math.cos(v / 2) + state.y0;

  p.x = x;
  p.y = y;
  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  const x = p.x - state.x0;
  const y = (p.y - state.y0) / (Math.SQRT2 * state.a);
  if (Math.abs(y) > 1 + 8 * Number.EPSILON) return null;
  const normalizedX = x / (2 * Math.SQRT2 * state.a);
  // Test the ellipse in projected space: a rounded polar northing cannot
  // support a fixed longitude tolerance after division by its tiny cosine.
  const ellipse = normalizedX * normalizedX + y * y;
  if (!state.over && ellipse > 1 + 8 * Number.EPSILON) return null;
  let v = 2 * Math.acos(Math.min(1, Math.abs(y)));
  let sinHalf = Math.sin(v / 2);
  if (!state.over && Math.abs(ellipse - 1) <= 8 * Number.EPSILON) {
    // Within the roundoff envelope, recover the seam from easting. This also
    // handles a near-pole northing that rounds to the exact polar ordinate.
    sinHalf = Math.min(1, Math.abs(normalizedX));
    v = 2 * Math.asin(sinHalf);
  }
  if (sinHalf === 0 && Math.abs(x) > 8 * Number.EPSILON * state.a) return null;
  const longitude = sinHalf === 0 ? 0 : (Math.PI * normalizedX) / sinHalf;
  var lon = adjust_lon(state.long0 + longitude, state.over);
  var lat =
    Math.sign(y) * (Math.PI / 2 - 2 * Math.asin(Math.sqrt(sineComplement(v) / (2 * Math.PI))));

  p.x = lon;
  p.y = lat;
  return p;
}

export function createState(base: KernelParameters, options: Partial<State> = {}): State {
  const state: State = {
    ...base,

    ...options
  };
  initialize(state);
  return state;
}

/** v-sin(v), retaining the cubic leading term at a pole. */
function sineComplement(v: number): number {
  if (v > 0.5) return v - Math.sin(v);
  const squared = v * v;
  return (
    v *
    squared *
    (1 / 6 +
      squared *
        (-1 / 120 +
          squared *
            (1 / 5040 +
              squared *
                (-1 / 362880 +
                  squared *
                    (1 / 39916800 + squared * (-1 / 6227020800 + squared / 1307674368000))))))
  );
}
