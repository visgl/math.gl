// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {earcut} from '@math.gl/geometry/polygon';

/** Triangulate clipped source geometry; a cap fragment need not have a visible fan center. */
export function triangulateSourcePolygon(part) {
  const sphere = ([lon, lat]) => {
    const a = (lon * Math.PI) / 180,
      b = (lat * Math.PI) / 180;
    return [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
  };
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const unit = a => {
    const n = Math.hypot(...a);
    return a.map(v => v / n);
  };
  const center = unit(
    part.sourceCoordinates[0].map(sphere).reduce((a, b) => a.map((v, i) => v + b[i]), [0, 0, 0])
  );
  const x = unit(cross(Math.abs(center[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0], center)),
    y = cross(center, x);
  const positions = [],
    sources = [],
    plane = [],
    holes = [];
  for (let k = 0; k < part.sourceCoordinates.length; k++) {
    if (k) holes.push(sources.length);
    const ring = part.sourceCoordinates[k];
    for (let i = 0; i < ring.length - 1; i++) {
      const p = sphere(ring[i]),
        d = dot(p, center);
      plane.push(dot(p, x) / d, dot(p, y) / d);
      sources.push(ring[i]);
      positions.push(part.coordinates[k][i]);
    }
  }
  return {positions, sources, indices: earcut(plane, holes)};
}
