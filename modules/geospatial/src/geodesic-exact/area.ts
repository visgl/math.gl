// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2012-2025)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Area decomposition and I4 integrand adapted from GeographicLib 2.7 GeodesicExact/GeodesicLineExact (MIT). Original derivative-integral divided difference avoids cancellation. See ../../GEOGRAPHICLIB-LICENSE.txt.
import {integrate} from './quadrature';
/** Derivative of t(x) = x + sqrt(1+x) asinh(sqrt(x))/sqrt(x) - 1,
 * analytically continued to negative x. Taylor evaluation avoids subtraction at 0.
 */
function derivative(x: number): number {
  if (Math.abs(x) < 0.125) {
    let coefficient = 1 / 3,
      power = 1,
      sum = 1;
    for (let n = 1; n <= 24; n++) {
      sum += n * coefficient * power;
      coefficient *= (-2 * n) / (2 * n + 3);
      power *= x;
    }
    return sum;
  }
  const root = Math.sqrt(Math.abs(x));
  const ratio = (x > 0 ? Math.asinh(root) : Math.asin(root)) / root;
  return 1 + (1 - ratio / Math.sqrt(1 + x)) / (2 * x);
}
/** Stable t value for a well-separated divided difference. */
function value(x: number): number {
  if (Math.abs(x) < 0.125) {
    let term = x / 3,
      sum = x;
    for (let n = 1; n <= 24; n++) {
      const next = sum + term;
      if (next === sum) break;
      sum = next;
      term *= (-2 * n * x) / (2 * n + 3);
    }
    return sum;
  }
  const root = Math.sqrt(Math.abs(x));
  return x + ((Math.sqrt(1 + x) * (x > 0 ? Math.asinh(root) : Math.asin(root))) / root - 1);
}
/** Integrate the smooth correction, evaluating t's divided difference as an
 * integral of its derivative rather than subtracting nearly equal t values.
 */
export function areaCorrection(
  ep2: number,
  k2: number,
  s1: number,
  c1: number,
  delta: number
): number {
  // I4 is anti-periodic after pi and has zero integral over a full circuit.
  const remainder = delta % (2 * Math.PI),
    tX = value(ep2);
  return integrate(
    theta => {
      const s = s1 * Math.cos(theta) + c1 * Math.sin(theta),
        y = k2 * s * s;
      const divided =
        ep2 === y
          ? derivative(y)
          : Math.abs(y) <= 1e-8 * Math.abs(ep2)
            ? (tX - value(y)) / (ep2 - y)
            : integrate(u => derivative(y + (ep2 - y) * u), 0, 1);
      return (-s * divided) / 2;
    },
    0,
    remainder
  );
}
