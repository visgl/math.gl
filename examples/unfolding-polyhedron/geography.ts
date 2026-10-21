// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import land from './data/land.json';
import {dot, normalize, type Vec3} from './polyhedra';

// Natural Earth 1:110m polygons are split at the antimeridian. Keep holes, and
// use their planar longitude/latitude convention (including the Antarctic cap).
const polygons = land.map(rings => ({
  rings,
  west: Math.min(...rings[0].map(p => p[0])),
  east: Math.max(...rings[0].map(p => p[0])),
  south: Math.min(...rings[0].map(p => p[1])),
  north: Math.max(...rings[0].map(p => p[1]))
}));
function insideRing(ring: number[][], lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (a[1] > lat !== b[1] > lat && lon < ((b[0] - a[0]) * (lat - a[1])) / (b[1] - a[1]) + a[0])
      inside = !inside;
  }
  return inside;
}
export function isLand(longitude: number, latitude: number): boolean {
  const lon = ((((longitude + 180) % 360) + 360) % 360) - 180;
  return polygons.some(
    p =>
      lon >= p.west &&
      lon <= p.east &&
      latitude >= p.south &&
      latitude <= p.north &&
      insideRing(p.rings[0], lon, latitude) &&
      !p.rings.slice(1).some(r => insideRing(r, lon, latitude))
  );
}

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
