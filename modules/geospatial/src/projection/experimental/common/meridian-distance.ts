// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original math.gl Gauss-Legendre integration of the meridional radius.

function radius(es: number, latitude: number): number {
  const d = 1 - es * Math.sin(latitude) ** 2;
  return (1 - es) / (d * Math.sqrt(d));
}
function pair(es: number, midpoint: number, half: number, node: number): number {
  return radius(es, midpoint - half * node) + radius(es, midpoint + half * node);
}
/** Signed meridian distance. Four eight-point panels avoid the legacy e^6 truncation. */
export function meridianDistance(a: number, es: number, start: number, end: number): number {
  const half = (end - start) / 8;
  let distance = 0;
  for (let i = 0; i < 4; i++) {
    const midpoint = start + (2 * i + 1) * half;
    distance +=
      half *
      (0.362683783378362 * pair(es, midpoint, half, 0.1834346424956498) +
        0.3137066458778873 * pair(es, midpoint, half, 0.525532409916329) +
        0.2223810344533745 * pair(es, midpoint, half, 0.7966664774136267) +
        0.1012285362903763 * pair(es, midpoint, half, 0.9602898564975363));
  }
  return a * distance;
}
/** Bounded inverse of the same integral; NaN marks an invalid radius or failed solve. */
export function inverseMeridianDistance(a: number, es: number, distance: number): number {
  const pole = Math.PI / 2;
  const limit = meridianDistance(a, es, 0, pole);
  if (!Number.isFinite(distance) || Math.abs(distance) > limit) return NaN;
  let lower = -pole,
    upper = pole,
    latitude = (distance / limit) * pole;
  for (let i = 0; i < 48; i++) {
    const residual = meridianDistance(a, es, 0, latitude) - distance;
    if (Math.abs(residual) <= 8 * Number.EPSILON * a) return latitude;
    if (residual > 0) upper = latitude;
    else lower = latitude;
    const next = latitude - residual / (a * radius(es, latitude));
    latitude = next > lower && next < upper ? next : (lower + upper) / 2;
  }
  return NaN;
}
