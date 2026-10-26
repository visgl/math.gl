// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import land from '../unfolding-polyhedron/data/land.json' with {type: 'json'};

// Natural Earth 1:110m polygons are split at the antimeridian. Keep holes, and
// use their planar longitude/latitude convention (including the Antarctic cap).
const polygons = land.map(rings => ({
  rings,
  west: Math.min(...rings[0].map(p => p[0])),
  east: Math.max(...rings[0].map(p => p[0])),
  south: Math.min(...rings[0].map(p => p[1])),
  north: Math.max(...rings[0].map(p => p[1]))
}));
function insideRing(ring, lon, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (a[1] > lat !== b[1] > lat && lon < ((b[0] - a[0]) * (lat - a[1])) / (b[1] - a[1]) + a[0])
      inside = !inside;
  }
  return inside;
}
export function isLand(longitude, latitude) {
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
