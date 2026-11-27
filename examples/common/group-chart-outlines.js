// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

function signedArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return area / 2;
}

function containsPoint(ring, [x, y]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j];
    const [bx, by] = ring[i];
    if (
      x >= Math.min(ax, bx) &&
      x <= Math.max(ax, bx) &&
      y >= Math.min(ay, by) &&
      y <= Math.max(ay, by) &&
      (x - ax) * (by - ay) === (y - ay) * (bx - ax)
    ) {
      return null;
    }
    if (ay > y !== by > y && x < ax + ((bx - ax) * (y - ay)) / (by - ay)) {
      inside = !inside;
    }
  }
  return inside;
}

function containsRing(outer, inner) {
  // Shared vertices cannot distinguish a nested ring from a neighboring ring.
  for (const point of inner) {
    const inside = containsPoint(outer, point);
    if (inside !== null) return inside;
  }
  return false;
}

/** Convert non-crossing chart outlines from a nonzero-winding path to polygons with holes. */
export function groupChartOutlines(outlines) {
  const rings = outlines
    .map(ring => ({ring, area: signedArea(ring), winding: 0, polygon: null}))
    .filter(({area}) => area !== 0)
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
  const polygons = [];
  for (let i = 0; i < rings.length; i++) {
    const current = rings[i];
    let parent;
    for (let j = i - 1; j >= 0; j--) {
      if (containsRing(rings[j].ring, current.ring)) {
        parent = rings[j];
        break;
      }
    }
    const outside = parent?.winding ?? 0;
    current.winding = outside + Math.sign(current.area);
    current.polygon = parent?.polygon ?? null;
    if (outside === 0 && current.winding !== 0) {
      current.polygon = [current.ring];
      polygons.push(current.polygon);
    } else if (outside !== 0 && current.winding === 0) {
      current.polygon.push(current.ring);
    }
  }
  return polygons;
}
