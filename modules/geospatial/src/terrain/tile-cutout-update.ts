// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  copyTerrainCutoutRegion,
  sameTerrainCutoutRegion,
  type TerrainCutoutRegion
} from './cutout-region';

import {
  splitTerrainMesh,
  validateTerrainCutoutTopology,
  type TerrainCutout,
  type TerrainCutoutInput,
  type TerrainCutoutOptions,
  type TerrainCutoutPiece
} from './mesh-cutout';
import {assembleTerrainCutoutTiles} from './tile-cutout';

/** Stable resident identity and an explicit revision for in-place buffer edits. */
export type TerrainCutoutResident = {
  /** Unique resident tile ID. */
  id: string;
  /** Nonnegative safe integer; increment after changing any mesh buffer. */
  revision: number;
  /** Conforming terrain in one shared Cartesian frame. Treat as immutable within a revision. */
  mesh: TerrainCutoutInput;
};
/** Per-tile clipping limits plus bounds on resident-set reconciliation. */
export type TerrainTileCutoutUpdateOptions = TerrainCutoutOptions & {
  /** Maximum residents. Default 512. */
  maxTiles?: number;
  /** Maximum tile-pair broad-phase checks per update. Default 131072. */
  maxPairChecks?: number;
  /** Maximum exposed piece edges across all residents. Default 1000000. */
  maxBoundaryEdges?: number;
};
/** Directed boundary edge with exact coordinate keys and local vertex IDs. */
type Boundary = {
  /** Incident face polygon index; remainder faces use the Uint32 sentinel 0xffffffff. */
  polygon: number;
  key: string;
  start: string;
  end: string;
  a: number;
  b: number;
  side: 0 | 1;
};
/** Cached clipping and boundary summaries for one immutable tile revision. */
type Entry = {
  resident: TerrainCutoutResident;
  split: TerrainCutout;
  displayed: TerrainCutout;
  bounds: readonly [number, number, number, number];
  edges: Boundary[];
};
/** Private cache brand; the cache is local to this module instance. */
const CACHE = Symbol('terrain-cutout-cache');
/** Opaque reusable cache. Do not mutate cached results or resident buffers without a new revision. */
export type TerrainTileCutoutCache = {
  readonly [CACHE]: {
    polygon: TerrainCutoutRegion;
    options: Required<TerrainTileCutoutUpdateOptions>;
    entries: ReadonlyMap<string, Entry>;
  };
};
/** Detached update result, with unchanged surface buffers retained by identity. */
export type TerrainTileCutoutUpdate = {
  /** Pass to the next update; no state is committed if an update throws. */
  cache: TerrainTileCutoutCache;
  /** Resident cuts. Source triangle references are local to the corresponding input tile. */
  tiles: ReadonlyMap<string, TerrainCutout>;
  /** Tiles whose surfaces or exposed cut edges changed. */
  changed: string[];
  /** Tiles removed from the previous resident set. */
  removed: string[];
  /** Tiles actually clipped in this update; unchanged tiles are not reclipped. */
  rebuilt: string[];
};

/** Clip changed tiles independently and pair their exposed boundaries.
 * Mixed-level inputs must already be reconciled. Cached source buffers and
 * returned arrays are read-only by contract. Change revision after in-place
 * edits; replacing the mesh object also invalidates its cache. Polygon or
 * option changes invalidate all clips. Limits maxWork/maxVertices/maxTriangles
 * apply per clip and per adjacent-pair validation, not to the entire update.
 * Arrival/eviction can change a neighbor's cutEdges without rebuilding its mesh.
 */
export function updateTerrainTileCutouts(
  residents: readonly TerrainCutoutResident[],
  polygon: TerrainCutoutRegion,
  previous?: TerrainTileCutoutCache,
  options: TerrainTileCutoutUpdateOptions = {}
): TerrainTileCutoutUpdate {
  const limits: Required<TerrainTileCutoutUpdateOptions> = {
    maxTiles: options.maxTiles ?? 512,
    maxPairChecks: options.maxPairChecks ?? 131072,
    maxBoundaryEdges: options.maxBoundaryEdges ?? 1000000,
    maxWork: options.maxWork ?? 4000000,
    maxVertices: options.maxVertices ?? 500000,
    maxTriangles: options.maxTriangles ?? 500000
  };
  if (
    Object.values(limits).some(n => !Number.isSafeInteger(n) || n < 0) ||
    limits.maxVertices > 0xffffffff ||
    limits.maxTriangles > 0xffffffff ||
    residents.length > limits.maxTiles
  )
    throw new RangeError('Invalid terrain cutout update limits');
  const prior = previous?.[CACHE];
  const compatible =
    prior &&
    sameTerrainCutoutRegion(prior.polygon, polygon) &&
    (Object.keys(limits) as (keyof typeof limits)[]).every(
      key => prior.options[key] === limits[key]
    );
  // Validate the ring even for an empty resident set.
  if (!compatible)
    splitTerrainMesh({positions: new Float64Array(), indices: new Uint32Array()}, polygon, limits);
  const entries = new Map<string, Entry>();
  const rebuilt: string[] = [];
  /** Rebuilt entries keyed to their position in resident order. */
  const dirty = new Map<Entry, number>();
  let boundaryCount = 0;
  for (const resident of residents) {
    if (
      !resident.id ||
      typeof resident.id !== 'string' ||
      entries.has(resident.id) ||
      !Number.isSafeInteger(resident.revision) ||
      resident.revision < 0
    )
      throw new RangeError('Invalid or duplicate terrain cutout resident');
    const old = compatible ? prior.entries.get(resident.id) : undefined;
    let entry: Entry;
    if (old && old.resident.mesh === resident.mesh && old.resident.revision === resident.revision)
      entry = old;
    else {
      const split = splitTerrainMesh(resident.mesh, polygon, limits);
      const edges = [...boundaryEdges(split.patch, 0), ...boundaryEdges(split.remainder, 1)];
      const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const id of resident.mesh.indices) {
        const x = resident.mesh.positions[id * 3],
          y = resident.mesh.positions[id * 3 + 1];
        bounds[0] = Math.min(bounds[0], x);
        bounds[1] = Math.min(bounds[1], y);
        bounds[2] = Math.max(bounds[2], x);
        bounds[3] = Math.max(bounds[3], y);
      }
      entry = {resident: {...resident}, split, displayed: split, bounds, edges};
      rebuilt.push(resident.id);
      dirty.set(entry, entries.size);
    }
    boundaryCount += entry.edges.length;
    if (boundaryCount > limits.maxBoundaryEdges)
      throw new RangeError('Terrain cutout boundary budget exceeded');
    entries.set(resident.id, entry);
  }
  const values = [...entries.values()];
  /** Total possible pairs, including pairs already validated by the cache. */
  const pairCount = (values.length * (values.length - 1)) / 2;
  if (pairCount > limits.maxPairChecks) throw new RangeError('Terrain cutout pair budget exceeded');
  // Cached pairs were checked when their current revisions first coexisted.
  for (const [a, index] of dirty)
    for (const b of values) {
      if (a === b || (dirty.get(b) ?? Infinity) < index) continue;
      if (
        a.bounds[2] < b.bounds[0] ||
        b.bounds[2] < a.bounds[0] ||
        a.bounds[3] < b.bounds[1] ||
        b.bounds[3] < a.bounds[1]
      )
        continue;
      const combined = assembleTerrainCutoutTiles([a.resident.mesh, b.resident.mesh], limits);
      validateTerrainCutoutTopology(combined.mesh, combined.remainingWork);
    }
  /** Unpaired edge, polygon ID for a cut pair, or null for a same-side pair. */
  const boundaries = new Map<string, Boundary | number | null>();
  for (let tile = 0; tile < values.length; tile++)
    for (const edge of values[tile].edges) {
      const other = boundaries.get(edge.key);
      if (other === undefined) {
        boundaries.set(edge.key, edge);
        continue;
      }
      if (
        typeof other !== 'object' ||
        other === null ||
        other.start !== edge.end ||
        other.end !== edge.start
      )
        throw new RangeError('Nonconforming terrain cutout tile boundary');
      boundaries.set(
        edge.key,
        other.side === edge.side ? null : edge.side === 0 ? edge.polygon : other.polygon
      );
    }
  const tiles = new Map<string, TerrainCutout>();
  const changed: string[] = [];
  /** Scratch endpoints, copied only when a displayed boundary changes. */
  const cuts: [number[], number[]] = [[], []];
  /** Scratch polygon IDs aligned with the scratch endpoints. */
  const polygons: [number[], number[]] = [[], []];
  for (let i = 0; i < values.length; i++) {
    const entry = values[i];
    const old = prior?.entries.get(entry.resident.id);
    // Emit in cached tile-local order, independent of resident visitation order.
    cuts[0].length = cuts[1].length = 0;
    polygons[0].length = polygons[1].length = 0;
    for (const edge of entry.edges) {
      const polygonIndex = boundaries.get(edge.key);
      if (typeof polygonIndex === 'number') {
        cuts[edge.side].push(edge.a, edge.b);
        polygons[edge.side].push(polygonIndex);
      }
    }
    const patch = withEdges(entry.split.patch, cuts[0], polygons[0], old?.displayed.patch);
    const remainder = withEdges(
      entry.split.remainder,
      cuts[1],
      polygons[1],
      old?.displayed.remainder
    );
    const displayed =
      old && patch === old.displayed.patch && remainder === old.displayed.remainder
        ? old.displayed
        : {patch, remainder};
    if (displayed !== old?.displayed) changed.push(entry.resident.id);
    entries.set(entry.resident.id, displayed === entry.displayed ? entry : {...entry, displayed});
    tiles.set(entry.resident.id, displayed);
  }
  return {
    cache: {[CACHE]: {polygon: copyTerrainCutoutRegion(polygon), options: limits, entries}},
    tiles,
    changed,
    rebuilt,
    removed: prior ? [...prior.entries.keys()].filter(id => !entries.has(id)) : []
  };
}

/** Reuse surface buffers and unchanged boundary descriptors. */
function withEdges(
  piece: TerrainCutoutPiece,
  edges: number[],
  polygons: number[],
  old?: TerrainCutoutPiece
) {
  const same =
    old &&
    old.positions === piece.positions &&
    old.cutEdges.length === edges.length &&
    old.cutEdges.every((id, i) => id === edges[i]) &&
    old.cutPolygonIndices.every((id, i) => id === polygons[i]);
  return same
    ? old
    : {...piece, cutEdges: Uint32Array.from(edges), cutPolygonIndices: Uint32Array.from(polygons)};
}
/** Cache only exposed edges; interior triangulation edges never become walls. */
function boundaryEdges(piece: TerrainCutoutPiece, side: 0 | 1): Boundary[] {
  const edges = new Map<
    string,
    {
      a: number;
      b: number;
      count: number;
      /** Incident face polygon index, including the remainder sentinel 0xffffffff. */
      polygon: number;
    }
  >();
  for (let i = 0; i < piece.indices.length; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = piece.indices[i + j],
        b = piece.indices[i + ((j + 1) % 3)];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      const old = edges.get(key);
      if (old) old.count++;
      else edges.set(key, {a, b, count: 1, polygon: piece.polygonIndices[i / 3]});
    }
  const result: Boundary[] = [];
  /** Encode exact XYZ; no snapping or tolerance-based topology decisions. */
  const point = (id: number) =>
    `${piece.positions[id * 3]},${piece.positions[id * 3 + 1]},${piece.positions[id * 3 + 2]}`;
  for (const {a, b, count, polygon} of edges.values())
    if (count === 1) {
      const start = point(a),
        end = point(b);
      result.push({
        polygon,
        a,
        b,
        side,
        start,
        end,
        key: start < end ? `${start}/${end}` : `${end}/${start}`
      });
    }
  return result;
}
