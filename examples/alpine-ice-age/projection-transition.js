// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export function projectionWeights(from, target, fraction) {
  const t = Math.max(0, Math.min(1, fraction));
  const ease = t * t * (3 - 2 * t);
  const result = {};
  for (const id of new Set([...Object.keys(from), target])) {
    const weight = (from[id] || 0) * (1 - ease) + (id === target ? ease : 0);
    if (weight > 0) result[id] = weight;
  }
  return result;
}

import { DISCONTINUOUS_VIEWS } from "./map-options.js";

export const isMyriahedral = (view) => view?.startsWith("myriahedral:");

/** Route incompatible panel nets through their common spherical endpoint. */
export function projectionRoute(fromView, toView, amount = 1) {
  const stages = [];
  if (DISCONTINUOUS_VIEWS[fromView])
    stages.push({
      kind: isMyriahedral(fromView) ? "hinge" : "segmented",
      view: fromView,
      from: amount,
      to: 0,
    });
  else if (fromView !== "globe") stages.push({ kind: "map", view: "globe" });
  if (DISCONTINUOUS_VIEWS[toView])
    stages.push({
      kind: isMyriahedral(toView) ? "hinge" : "segmented",
      view: toView,
      from: 0,
      to: 1,
    });
  else if (toView !== "globe") stages.push({ kind: "map", view: toView });
  return stages;
}

/** Same geographic endpoint for every chart copy, including both sides of a cut. */
export function globePosition(
  [lon, lat],
  { width, height, longitude, latitude },
  lift = 0,
) {
  const rad = Math.PI / 180;
  const a = (lon - longitude) * rad,
    b = lat * rad,
    tilt = latitude * rad;
  const y = Math.sin(b),
    z = Math.cos(b) * Math.cos(a);
  const scale = Math.min(width, height) * 0.42 + lift;
  return [
    Math.cos(b) * Math.sin(a) * scale,
    (y * Math.cos(tilt) - z * Math.sin(tilt)) * scale,
    (y * Math.sin(tilt) + z * Math.cos(tilt)) * scale,
  ];
}

export function segmentedPosition(flat, source, amount, viewport, lift = 0) {
  if (amount === 1) return flat;
  const globe = globePosition(source, viewport, lift);
  return flat.map(
    (value, axis) => globe[axis] + (value - globe[axis]) * amount,
  );
}
