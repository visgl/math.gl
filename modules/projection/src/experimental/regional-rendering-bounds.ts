// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {KernelParameters} from './kernel';
import type {ProjectionImplementation} from './types';
import type {GeographicRenderingBounds} from './rendering-profile';
import type {State as BonneState} from './kernels/bonne';
import type {State as SwissState} from './kernels/somerc';
import type {State as HotineState} from './kernels/omerc';
import type {State as KrovakState} from './kernels/krovak';
import type {State as NZMGState} from './kernels/nzmg';
import {sphericalRange} from './spherical-rendering-domain';
import {
  add,
  scale,
  multiply,
  ordered,
  sine,
  cosine,
  maxAbs,
  envelope,
  longitudeRange
} from './rendering-bounds';
import type {Range} from './rendering-bounds';
import tsfnz from './common/tsfnz';
import {SEC_TO_RAD} from './common/constants';

/** |sin(t)| <= |t| and |1-cos(t)| <= min(2, |t|) bound Bonne's polar terms,
 * including the removable rho=0 limit, without searching its curved meridians.
 */
export function bonneBounds(
  state: BonneState,
  project: ProjectionImplementation['forward'],
  region: GeographicRenderingBounds
) {
  const d = maxAbs(longitudeRange(region, state.long0, state.over));
  const n = state.a / Math.sqrt(1 - state.es);
  const meridian = ordered(project(state.long0, region[1])[1], project(state.long0, region[3])[1]);
  const radius = Math.max(
    Math.abs(state.a * (state.es ? state.am1 : state.cphi1) + state.y0 - meridian[0]),
    Math.abs(state.a * (state.es ? state.am1 : state.cphi1) + state.y0 - meridian[1])
  );
  const width = Math.min(radius, n * d);
  const correction = Math.min(2 * radius, n * d);
  return envelope(
    [state.x0 - width, state.x0 + width],
    [meridian[0] - correction, meridian[1] + correction]
  );
}

/** Cancel the apparent polar cotangent singularity before bounding the polynomial terms. */
export function polyconicBounds(
  base: KernelParameters,
  project: ProjectionImplementation['forward'],
  region: GeographicRenderingBounds
) {
  const d = maxAbs(longitudeRange(region, base.long0, base.over));
  const n = base.a / Math.sqrt(1 - base.es);
  const correction = (n * d * d) / 4; // |sin(phi) cos(phi)| <= 1/2
  let meridian = ordered(project(base.long0, region[1])[1], project(base.long0, region[3])[1]);
  if (base.sphere && (region[1] - base.lat0 < -Math.PI / 2 || region[3] - base.lat0 > Math.PI / 2))
    meridian = [(-base.a * Math.PI) / 2, (base.a * Math.PI) / 2];
  return envelope(
    [base.x0 - n * d, base.x0 + n * d],
    [meridian[0] - correction, meridian[1] + correction]
  );
}

/** Bounds of the explicit Cassini series, regrouped into bounded sin/cos factors. */
export function cassiniBounds(
  base: KernelParameters,
  project: ProjectionImplementation['forward'],
  region: GeographicRenderingBounds
) {
  const d = maxAbs(longitudeRange(region, base.long0, base.over));
  const n = base.a / Math.sqrt(1 - base.es),
    c = base.es / (1 - base.es);
  const width = base.sphere
    ? base.a * Math.asin(Math.min(1, Math.sin(Math.min(d, Math.PI / 2))))
    : n * (d + d ** 3 / 6 + ((9 + 8 * c) * d ** 5) / 120);
  const correction = base.sphere ? base.a * d : n * ((d * d) / 4 + ((6 + 6 * c) * d ** 4) / 24);
  const meridian = ordered(project(base.long0, region[1])[1], project(base.long0, region[3])[1]);
  return envelope(
    [base.x0 - width, base.x0 + width],
    [meridian[0] - correction, meridian[1] + correction]
  );
}

function ratioRange(numerator: Range, denominator: Range): [number, number] {
  if (denominator[0] <= 0 && denominator[1] >= 0) return [-Infinity, Infinity];
  return multiply(numerator, ordered(1 / denominator[0], 1 / denominator[1]));
}

/** Swiss rotation on its conformal sphere, followed by monotone atan/atanh. */
export function swissBounds(state: SwissState, region: GeographicRenderingBounds) {
  const latitude = (phi: number) => {
    const s =
      state.alpha * (Math.asinh(Math.tan(phi)) - state.e * Math.atanh(state.e * Math.sin(phi))) +
      state.K;
    return Math.asin(Math.tanh(s));
  };
  const rotated: GeographicRenderingBounds = [
    (region[0] - state.long0) * state.alpha,
    latitude(region[1]),
    (region[2] - state.long0) * state.alpha,
    latitude(region[3])
  ];
  const north = sphericalRange([-Math.sin(state.b0), 0, Math.cos(state.b0)], rotated);
  if (maxAbs(north) >= 1 - 1e-14)
    throw new Error('Swiss oblique Mercator coverage reaches a rotated pole');
  const east = sphericalRange([0, 1, 0], rotated);
  const forward = sphericalRange([Math.cos(state.b0), 0, Math.sin(state.b0)], rotated);
  const x = ratioRange(east, forward).map(Math.atan) as [number, number];
  const y = north.map(value =>
    Math.atanh(Math.max(-1 + Number.EPSILON, Math.min(1 - Number.EPSILON, value)))
  ) as [number, number];
  return envelope(
    add([state.x0, state.x0], scale(x, state.R)),
    add([state.y0, state.y0], scale(y, state.R))
  );
}

/** Hotine's U is a linear form on the conformal sphere. Rotating its bounded
 * longitude/isometric-latitude ranges gives a guaranteed regional envelope.
 */
export function hotineBounds(state: HotineState, region: GeographicRenderingBounds) {
  const logW = (phi: number) =>
    Math.log(state.E) - state.B * Math.log(tsfnz(state.e, phi, Math.sin(phi)));
  const w = ordered(logW(region[1]), logW(region[3]));
  const longitude = scale([region[0] - state.lam0, region[2] - state.lam0], state.B);
  const sphere: GeographicRenderingBounds = [
    longitude[0],
    Math.asin(Math.tanh(w[0])),
    longitude[1],
    Math.asin(Math.tanh(w[1]))
  ];
  const U = sphericalRange([0, -state.cosgam, state.singam], sphere);
  const v = scale(ordered(-Math.atanh(U[0]), -Math.atanh(U[1])), state.ArB);
  const numerator = add(
    scale([Math.sinh(w[0]), Math.sinh(w[1])], state.cosgam),
    scale(sine(longitude), state.singam)
  );
  const denominator = cosine(longitude);
  const angle =
    denominator[0] > 0
      ? (ratioRange(numerator, denominator).map(Math.atan) as [number, number])
      : ([-Math.PI, Math.PI] as const);
  let u: Range = scale(angle, state.ArB);
  let x: Range, y: Range;
  if (state.no_rot) {
    x = u;
    y = v;
  } else {
    u = add(u, [-state.u_0, -state.u_0]);
    x = add(scale(v, state.cosrot), scale(u, state.sinrot));
    y = add(scale(u, state.cosrot), scale(v, -state.sinrot));
  }
  return envelope(
    add([state.x0, state.x0], scale(x, state.a)),
    add([state.y0, state.y0], scale(y, state.a))
  );
}

/** Krovak's auxiliary-sphere rotation followed by its monotone cone radius. */
export function krovakBounds(state: KrovakState, region: GeographicRenderingBounds) {
  const latitude = (phi: number) =>
    2 *
    (Math.atan(
      (state.k * Math.pow(Math.tan(phi / 2 + state.s45), state.alfa)) /
        Math.pow(
          (1 + state.e * Math.sin(phi)) / (1 - state.e * Math.sin(phi)),
          (state.alfa * state.e) / 2
        )
    ) -
      state.s45);
  const longitude = scale(longitudeRange(region, state.long0, state.over), -state.alfa);
  const sphere: GeographicRenderingBounds = [
    longitude[0],
    latitude(region[1]),
    longitude[1],
    latitude(region[3])
  ];
  const s = sphericalRange([Math.sin(state.ad), 0, Math.cos(state.ad)], sphere);
  const cosS = Math.sqrt(Math.max(Number.EPSILON, 1 - maxAbs(s) ** 2));
  const numerator = sphericalRange([0, 1, 0], sphere);
  const d = scale(
    [Math.asin(Math.max(-1, numerator[0] / cosS)), Math.asin(Math.min(1, numerator[1] / cosS))],
    state.n
  );
  const radius = (sin: number) =>
    state.ro0 *
    Math.pow(
      Math.tan(state.s0 / 2 + state.s45) / Math.tan(Math.asin(sin) / 2 + state.s45),
      state.n
    );
  const radii = ordered(radius(s[0]), radius(s[1]));
  const sign = state.czech ? 1 : -1;
  return envelope(
    add([state.x0, state.x0], scale(multiply(radii, sine(d)), sign)),
    add([state.y0, state.y0], scale(multiply(radii, cosine(d)), sign))
  );
}

/** Interval Horner evaluation of NZMG's published real/complex polynomials.
 * The coefficient envelope is rigorous over the entire declared rectangle.
 */
export function nzmgBounds(state: NZMGState, region: GeographicRenderingBounds) {
  const phi = scale([region[1] - state.lat0, region[3] - state.lat0], 1e-5 / SEC_TO_RAD);
  const lambda: Range = [region[0] - state.long0, region[2] - state.long0];
  let psi: Range = [0, 0];
  for (let index = 10; index >= 1; index--)
    psi = add([state.A[index], state.A[index]], multiply(psi, phi));
  psi = multiply(psi, phi);
  let real: Range = [0, 0],
    imaginary: Range = [0, 0];
  for (let index = 6; index >= 1; index--) {
    const nextReal = add(multiply(real, psi), scale(multiply(imaginary, lambda), -1));
    const nextImaginary = add(multiply(real, lambda), multiply(imaginary, psi));
    real = add(nextReal, [state.B_re[index], state.B_re[index]]);
    imaginary = add(nextImaginary, [state.B_im[index], state.B_im[index]]);
  }
  const finalReal = add(multiply(real, psi), scale(multiply(imaginary, lambda), -1));
  const finalImaginary = add(multiply(real, lambda), multiply(imaginary, psi));
  return envelope(
    add([state.x0, state.x0], scale(finalImaginary, state.a)),
    add([state.y0, state.y0], scale(finalReal, state.a))
  );
}
