// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A finite local XY coordinate. */
export type CutoutPoint = readonly [number, number];
/** One simple outer ring with strictly contained, disjoint hole rings. */
export type TerrainCutoutPolygon = {
  /** Either winding; omit the repeated closing point. */
  outer: readonly CutoutPoint[];
  /** Either winding; holes must not touch or intersect any other ring. */
  holes?: readonly (readonly CutoutPoint[])[];
};
/** Internal prepared partition contract, shared without importing polygon algorithms. */
export type TerrainCutoutPlan = {
  /** Supporting lines shared by every independently clipped tile. */
  lines: readonly (readonly [CutoutPoint, CutoutPoint])[];
  /** Return polygon index or -1 for the remainder; charge classification work. */
  classify: (point: CutoutPoint, charge: (amount: number) => void) => number;
};
/** Versioned brand shared by ESM/CJS and both public entry-point bundles. */
const PLAN = Symbol.for('@math.gl/geospatial/terrain-cutout-polygons/v1');
/** Immutable prepared polygon set; create with prepareTerrainCutoutPolygons. */
export type TerrainCutoutPolygonSet = {readonly [PLAN]: TerrainCutoutPlan};
/** A strictly convex ring or an opt-in prepared concave/multi-polygon cut. */
export type TerrainCutoutRegion = readonly CutoutPoint[] | TerrainCutoutPolygonSet;

/** @internal Brand a validated plan without exposing its mutable preparation state. */
export function createTerrainCutoutPlan(plan: TerrainCutoutPlan): TerrainCutoutPolygonSet {
  return Object.freeze({[PLAN]: Object.freeze(plan)});
}
/** @internal Read only genuine prepared inputs; arrays use the convex fast path. */
export function getTerrainCutoutPlan(region: TerrainCutoutRegion): TerrainCutoutPlan | undefined {
  if (Array.isArray(region)) return undefined;
  const plan = (region as TerrainCutoutPolygonSet | undefined)?.[PLAN];
  if (!plan) throw new RangeError('Invalid prepared terrain cutout polygons');
  return plan;
}
/** @internal Snapshot raw rings; immutable descriptors retain their identity. */
export function copyTerrainCutoutRegion(region: TerrainCutoutRegion): TerrainCutoutRegion {
  return getTerrainCutoutPlan(region)
    ? region
    : (region as readonly CutoutPoint[]).map(p => [p[0], p[1]] as const);
}
/** @internal Prepared shapes compare by identity; raw rings compare by value. */
export function sameTerrainCutoutRegion(a: TerrainCutoutRegion, b: TerrainCutoutRegion): boolean {
  if (getTerrainCutoutPlan(a) || getTerrainCutoutPlan(b)) return a === b;
  const aa = a as readonly CutoutPoint[],
    bb = b as readonly CutoutPoint[];
  return (
    aa.length === bb.length &&
    aa.every((p, i) => bb[i].length === 2 && p[0] === bb[i][0] && p[1] === bb[i][1])
  );
}
