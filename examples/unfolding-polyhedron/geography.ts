// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {dot, normalize, type Vec3} from './polyhedra';
import {isLand} from '../common/land-mask.js';
export {isLand};

/** Approximate radians of land crossed by the minor great-circle arc.
 * Equal-angular midpoint samples at <= 0.25 degree intervals. Not a coastline clip.
 */
export function landArc(a: Vec3, b: Vec3): number {
  const u = normalize(a),
    v = normalize(b);
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(u, v))));
  if (angle < 1e-12) return 0;
  const count = Math.max(1, Math.ceil(angle / (Math.PI / 720)));
  let hits = 0;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const p = u.map((x, k) => x * Math.sin((1 - t) * angle) + v[k] * Math.sin(t * angle)) as Vec3;
    const lon = (Math.atan2(p[1], p[0]) * 180) / Math.PI;
    const lat = (Math.atan2(p[2], Math.hypot(p[0], p[1])) * 180) / Math.PI;
    if (isLand(lon, lat)) hits++;
  }
  return (angle * hits) / count;
}

/** Scores retained joins, so HIGH land exposure means less likely to be cut.
 * Round to metre bins; a bounded secondary score preserves the legacy preference
 * without outweighing even one metre of total retained land across the tree.
 */
export function oceanWeight(landRadians: number, legacyWeight: number, faceCount: number): number {
  return Math.round(landRadians * 6371000) + (legacyWeight + 2) / (4 * faceCount);
}
