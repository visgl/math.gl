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

export const isMyriahedral = view => view?.startsWith('myriahedral:');

/** Route incompatible panel nets through their common spherical endpoint. */
export function myriahedralRoute(fromView, toView, amount = 1) {
  const stages = [];
  if (isMyriahedral(fromView)) stages.push({kind: 'hinge', view: fromView, from: amount, to: 0});
  else if (fromView !== 'globe') stages.push({kind: 'map', view: 'globe'});
  if (isMyriahedral(toView)) stages.push({kind: 'hinge', view: toView, from: 0, to: 1});
  else if (toView !== 'globe') stages.push({kind: 'map', view: toView});
  return stages;
}
