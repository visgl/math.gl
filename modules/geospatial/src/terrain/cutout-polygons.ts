// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  createTerrainCutoutPlan,
  type CutoutPoint,
  type TerrainCutoutPolygon,
  type TerrainCutoutPolygonSet
} from './cutout-region';

/** Limits for validating and preparing a reusable polygon arrangement. */
export type TerrainCutoutPolygonOptions = {
  /** Maximum total ring edges. Default 2048. */
  maxEdges?: number;
  /** Maximum validation, containment and line-comparison operations. Default 4000000. */
  maxWork?: number;
};
/** Prepare concave polygons, holes and disjoint regions for all terrain cut APIs.
 * Copies inputs. Ring winding is unrestricted. Rings must be simple and finite,
 * with no repeated closing point. Holes are strictly contained and disjoint;
 * separate polygon domains must not overlap or touch. Islands inside another
 * polygon's hole are allowed. Polygon IDs are zero-based input array indices.
 *
 * The immutable descriptor contains CPU functions: reuse it for cache hits,
 * and prepare a new descriptor inside each worker instead of transferring it.
 * Supporting-line arrangements can grow quadratically; split-time budgets
 * remain necessary in addition to these preparation limits.
 */
export function prepareTerrainCutoutPolygons(
  polygons: readonly TerrainCutoutPolygon[],
  {maxEdges = 2048, maxWork = 4000000}: TerrainCutoutPolygonOptions = {}
): TerrainCutoutPolygonSet {
  if (![maxEdges, maxWork].every(n => Number.isSafeInteger(n) && n >= 0) || !polygons.length)
    throw new RangeError('Invalid terrain cutout polygon limits or empty set');
  let work = 0,
    edgeCount = 0;
  /** Bound preprocessing before expensive pair comparisons. */
  const charge = (amount: number) => {
    work += amount;
    if (work > maxWork) throw new RangeError('Terrain cutout polygon work budget exceeded');
  };
  if (polygons.length > Math.floor(maxEdges / 3))
    throw new RangeError('Terrain cutout polygon edge budget exceeded');
  const regions = polygons.map(p => {
    if (1 + (p.holes?.length ?? 0) > Math.floor((maxEdges - edgeCount) / 3))
      throw new RangeError('Terrain cutout polygon edge budget exceeded');
    return [p.outer, ...(p.holes ?? [])].map(ring => {
      edgeCount += ring.length;
      if (edgeCount > maxEdges) throw new RangeError('Terrain cutout polygon edge budget exceeded');
      charge(ring.length);
      if (ring.length < 3 || ring.some(p => p.length !== 2 || !p.every(Number.isFinite)))
        throw new RangeError('Invalid terrain cutout polygon ring');
      return ring.map(p => Object.freeze([p[0], p[1]] as const));
    });
  });
  const rings = regions.flat();
  for (const ring of rings) {
    let area = 0;
    for (let i = 0; i < ring.length; i++) {
      charge(1);
      const a = ring[i],
        b = ring[(i + 1) % ring.length],
        c = ring[(i + 2) % ring.length];
      if (equal(a, b)) throw new RangeError('Duplicate terrain cutout ring vertex');
      area += orient(ring[0], a, b);
      if (
        orient(a, b, c) === 0 &&
        (a[0] - b[0]) * (c[0] - b[0]) + (a[1] - b[1]) * (c[1] - b[1]) >= 0
      )
        throw new RangeError('Backtracking terrain cutout ring edge');
      for (let j = i + 1; j < ring.length; j++) {
        if (j === i + 1 || (i === 0 && j === ring.length - 1)) continue;
        charge(1);
        if (intersects(a, b, ring[j], ring[(j + 1) % ring.length]))
          throw new RangeError('Self-intersecting terrain cutout ring');
      }
    }
    if (!Number.isFinite(area) || area === 0)
      throw new RangeError('Degenerate terrain cutout ring');
  }
  for (let i = 0; i < rings.length; i++)
    for (let j = i + 1; j < rings.length; j++) {
      const a = rings[i],
        b = rings[j];
      for (let x = 0; x < a.length; x++)
        for (let y = 0; y < b.length; y++) {
          charge(1);
          if (intersects(a[x], a[(x + 1) % a.length], b[y], b[(y + 1) % b.length]))
            throw new RangeError('Terrain cutout rings must not touch or intersect');
        }
    }
  for (const region of regions)
    for (let i = 1; i < region.length; i++) {
      if (contains(region[0], region[i][0], charge) !== 1)
        throw new RangeError('Terrain cutout hole must be strictly inside its outer ring');
      for (let j = 1; j < i; j++)
        if (
          contains(region[j], region[i][0], charge) === 1 ||
          contains(region[i], region[j][0], charge) === 1
        )
          throw new RangeError('Nested terrain cutout holes are not supported');
    }
  /** Test the interior of a polygon, excluding every hole. */
  function inRegion(
    region: readonly (readonly CutoutPoint[])[],
    point: CutoutPoint,
    budget: (n: number) => void
  ) {
    const outer = contains(region[0], point, budget);
    if (outer !== 1) return outer;
    for (let i = 1; i < region.length; i++) {
      const hole = contains(region[i], point, budget);
      if (hole === 0) return 0;
      if (hole === 1) return -1;
    }
    return 1;
  }
  for (let i = 0; i < regions.length; i++)
    for (let j = i + 1; j < regions.length; j++) {
      if (
        inRegion(regions[i], regions[j][0][0], charge) === 1 ||
        inRegion(regions[j], regions[i][0][0], charge) === 1
      )
        throw new RangeError('Overlapping terrain cutout polygon domains');
    }
  const lines: (readonly [CutoutPoint, CutoutPoint])[] = [];
  for (const ring of rings)
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      // Avoid splitting twice by the same supporting line (including collinear vertices).
      if (
        lines.some(([u, v]) => {
          charge(1);
          return orient(u, v, a) === 0 && orient(u, v, b) === 0;
        })
      )
        continue;
      lines.push(a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? [a, b] : [b, a]);
    }
  return createTerrainCutoutPlan({
    lines: Object.freeze(lines.map(line => Object.freeze(line))),
    classify(point, budget) {
      for (let i = 0; i < regions.length; i++) {
        const result = inRegion(regions[i], point, budget);
        if (result === 0) throw new RangeError('Unrepresentable terrain cutout fragment interior');
        if (result === 1) return i;
      }
      return -1;
    }
  });
}

/** Exact coordinate equality for duplicate endpoints. */
function equal(a: CutoutPoint, b: CutoutPoint) {
  return a[0] === b[0] && a[1] === b[1];
}
/** Signed twice-area with explicit overflow rejection. */
function orient(a: CutoutPoint, b: CutoutPoint, c: CutoutPoint) {
  const value = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (!Number.isFinite(value)) throw new RangeError('Terrain cutout polygon coordinate overflow');
  return value;
}
/** Inclusive segment membership after collinearity has been established. */
function onSegment(a: CutoutPoint, b: CutoutPoint, p: CutoutPoint) {
  return (
    p[0] >= Math.min(a[0], b[0]) &&
    p[0] <= Math.max(a[0], b[0]) &&
    p[1] >= Math.min(a[1], b[1]) &&
    p[1] <= Math.max(a[1], b[1])
  );
}
/** Detect crossings, overlapping edges and mere touches during ring validation. */
function intersects(a: CutoutPoint, b: CutoutPoint, c: CutoutPoint, d: CutoutPoint) {
  const abC = orient(a, b, c),
    abD = orient(a, b, d),
    cdA = orient(c, d, a),
    cdB = orient(c, d, b);
  return (
    (abC === 0 && onSegment(a, b, c)) ||
    (abD === 0 && onSegment(a, b, d)) ||
    (cdA === 0 && onSegment(c, d, a)) ||
    (cdB === 0 && onSegment(c, d, b)) ||
    (((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) &&
      ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0)))
  );
}
/** Winding classification: interior 1, exterior -1, boundary 0. */
function contains(ring: readonly CutoutPoint[], p: CutoutPoint, charge: (n: number) => void) {
  let winding = 0;
  for (let i = 0; i < ring.length; i++) {
    charge(1);
    const a = ring[i],
      b = ring[(i + 1) % ring.length],
      cross = orient(a, b, p);
    if (cross === 0 && onSegment(a, b, p)) return 0;
    if (a[1] <= p[1] && b[1] > p[1] && cross > 0) winding++;
    if (a[1] > p[1] && b[1] <= p[1] && cross < 0) winding--;
  }
  return winding === 0 ? -1 : 1;
}
