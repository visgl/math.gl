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
