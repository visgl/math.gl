// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original stable evaluation and inversion of the standard authalic integral. No upstream implementation copied.

/** qp - |q(phi)|, evaluated without subtracting almost equal pole integrals. */
export function authalicPoleDifference(e: number, latitude: number): number {
  const sin = Math.abs(Math.sin(latitude));
  const cos = Math.cos(latitude);
  const delta = (cos * cos) / (1 + sin);
  if (e === 0) return 2 * delta;
  const es = e * e;
  return (
    (delta * (1 + es * sin)) / (1 - es * sin * sin) +
    ((1 - es) / e) * Math.atanh((e * delta) / (1 - es * sin))
  );
}

/** Stable authalic latitude, including the cosine retained close to a pole. */
export function authalicLatitude(e: number, qp: number, latitude: number): number {
  if (latitude === 0 || e === 0) return latitude;
  const fraction = authalicPoleDifference(e, latitude) / qp;
  return Math.atan2(Math.sign(latitude) * (1 - fraction), Math.sqrt(fraction * (2 - fraction)));
}

/** Recover geodetic latitude from authalic latitude, preserving pole complements. */
export function inverseAuthalicLatitude(e: number, qp: number, beta: number): number {
  if (e === 0 || beta === 0 || Math.abs(beta) === Math.PI / 2) return beta;
  const sinBeta = Math.abs(Math.sin(beta));
  const cosBeta = Math.cos(beta);
  const target = (qp * cosBeta * cosBeta) / (1 + sinBeta);
  let latitude = Math.abs(beta);
  const es = e * e;
  let lower = 0;
  let upper = Math.PI / 2;
  for (let i = 0; i < 48; i++) {
    const sin = Math.sin(latitude);
    const denominator = 1 - es * sin * sin;
    const derivative = (2 * (1 - es) * Math.cos(latitude)) / (denominator * denominator);
    const residual = authalicPoleDifference(e, latitude) - target;
    const step = residual / derivative;
    if (Math.abs(step) < 2e-15) return Math.sign(beta) * latitude;
    if (residual > 0) lower = latitude;
    else upper = latitude;
    const candidate = latitude + step;
    latitude = candidate > lower && candidate < upper ? candidate : (lower + upper) / 2;
  }
  throw new Error('Authalic latitude inverse did not converge');
}
