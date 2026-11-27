// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original monotone-curve latitude clipping over the attributed geodesic/rhumb adapters.
import {Context, root, slice, type Edge} from './edge';
import {GeographicSeamError} from './types';
export type LatitudeRange = readonly [number, number];
export function readLatitudeRange(value: LatitudeRange): LatitudeRange {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every(Number.isFinite) ||
    value[0] < -90 ||
    value[1] > 90 ||
    value[0] >= value[1]
  )
    throw new GeographicSeamError('input', 'Expected -90 <= south < north <= 90');
  return [value[0], value[1]];
}
/** Input edges must already be split at latitude extrema and pole passages. */
export function clipLatitudeEdge(edge: Edge, range: LatitudeRange, context: Context): Edge[] {
  const fractions = [0, 1],
    events = new Map<number, number>();
  for (const latitude of range)
    if (latitude > Math.min(edge.a[1], edge.b[1]) && latitude < Math.max(edge.a[1], edge.b[1])) {
      const t = root(edge, 1, latitude, context);
      if (events.has(t) && events.get(t) !== latitude)
        throw new GeographicSeamError('precision', 'Unresolvable latitude events');
      fractions.push(t);
      events.set(t, latitude);
    }
  fractions.sort((a, b) => a - b);
  const result: Edge[] = [];
  for (let i = 1; i < fractions.length; i++) {
    context.tick();
    const part = slice(edge, fractions[i - 1], fractions[i]);
    const middle = (part.a[1] + part.b[1]) / 2;
    if (middle < range[0] || middle > range[1]) continue;
    if (events.has(fractions[i - 1])) part.a[1] = events.get(fractions[i - 1]);
    if (events.has(fractions[i])) part.b[1] = events.get(fractions[i]);
    const sample = part.sample;
    part.sample = t => (t === 0 ? part.a.slice() : t === 1 ? part.b.slice() : sample(t));
    context.addVertices(2);
    result.push(part);
  }
  return result;
}
