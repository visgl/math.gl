// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {earcut} from '@math.gl/geometry';

/** Triangulate clipped source geometry; a cap fragment need not have a visible fan center. */
function projectSourcePolygon(part) {
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
  return {positions, sources, plane, holes};
}

/** A visible average does not prove that a fan preserves a clipped notch. */
export function isConvexSourcePolygon(part) {
  if (part.sourceCoordinates.length !== 1) return false;
  const {plane} = projectSourcePolygon(part);
  const points = Array.from({length: plane.length / 2}, (_, i) => plane.slice(i * 2, i * 2 + 2));
  const origin = points[0];
  let extent = 0;
  for (const p of points)
    extent = Math.max(extent, Math.abs(p[0] - origin[0]), Math.abs(p[1] - origin[1]));
  if (!(extent > 0)) return false;
  const normalized = [];
  for (const p of points) {
    const q = [(p[0] - origin[0]) / extent, (p[1] - origin[1]) / extent];
    const previous = normalized.at(-1);
    if (!previous || Math.hypot(q[0] - previous[0], q[1] - previous[1]) > 1e-12) normalized.push(q);
  }
  if (
    normalized.length > 1 &&
    Math.hypot(normalized[0][0] - normalized.at(-1)[0], normalized[0][1] - normalized.at(-1)[1]) <=
      1e-12
  )
    normalized.pop();
  if (normalized.length < 3) return false;
  let orientation = 0,
    totalTurn = 0;
  for (let i = 0; i < normalized.length; i++) {
    const a = normalized[i],
      b = normalized[(i + 1) % normalized.length],
      c = normalized[(i + 2) % normalized.length];
    const ax = b[0] - a[0],
      ay = b[1] - a[1],
      bx = c[0] - b[0],
      by = c[1] - b[1];
    const turn = Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
    if (Math.abs(turn) > 1e-10) {
      const sign = Math.sign(turn);
      if (orientation && sign !== orientation) return false;
      orientation = sign;
    }
    totalTurn += turn;
  }
  return Math.abs(Math.abs(totalTurn) - 2 * Math.PI) < 1e-7;
}

/** Triangulate concave pieces and holes in a chart's great-circle source plane. */
export function triangulateSourcePolygon(part) {
  const {positions, sources, plane, holes} = projectSourcePolygon(part);
  return {positions, sources, indices: earcut(plane, holes)};
}
