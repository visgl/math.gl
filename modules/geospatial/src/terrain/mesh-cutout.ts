// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getTerrainCutoutPlan, type TerrainCutoutRegion} from './cutout-region';

type XY = readonly [number, number];
type XYZ = readonly [number, number, number];
type Face = [number, number, number];
type Edge = [number, number];

/** Indexed upward-facing terrain in a shared local Cartesian frame. */
export type TerrainCutoutInput = {
  positions: Float32Array | Float64Array;
  indices: Uint16Array | Uint32Array;
};

/** A detached surface with interpolation provenance in the original mesh. */
export type TerrainCutoutPiece = {
  positions: Float64Array;
  indices: Uint32Array;
  /** Input triangle index for each output vertex. */
  sourceTriangles: Uint32Array;
  /** Three barycentric weights per output vertex in input triangle order. */
  sourceWeights: Float64Array;
  /** Input triangle index for each output triangle. */
  sourceFaces: Uint32Array;
  /** Directed boundary edges paired with the other piece in reverse order. */
  cutEdges: Uint32Array;
  /** Input polygon index per output face; 0 for raw convex rings, 0xffffffff for remainder. */
  polygonIndices: Uint32Array;
  /** Patch polygon index per directed cut edge, also present on the paired remainder edge. */
  cutPolygonIndices: Uint32Array;
};

/** Bounds for the splitter's working storage and pair/fragment checks. */
export type TerrainCutoutOptions = {
  /** Maximum candidate topology checks and clipping vertex visits. */
  maxWork?: number;
  /** Maximum working vertices and, independently, total output vertices. */
  maxVertices?: number;
  /** Maximum intermediate fragments and, independently, total output triangles. */
  maxTriangles?: number;
};

/** Both sides of a terrain cut, with matching directed edges along the opening. */
export type TerrainCutout = {patch: TerrainCutoutPiece; remainder: TerrainCutoutPiece};

type Fragment = {ids: number[]; inside: boolean};
/** Edge incidence and owning polygon while assembling one output piece. */
type Boundary = {
  /** Directed output vertex IDs. */
  edge: Edge;
  /** Number of incident output faces. */
  count: number;
  /** Input polygon index of the incident face, or -1 for the remainder. */
  polygon: number;
};
type PieceBuilder = {
  ids: Map<number, number>;
  positions: number[];
  indices: number[];
  sourceTriangles: number[];
  sourceWeights: number[];
  sourceFaces: number[];
  boundary: Map<string, Boundary>;
  cutEdges: number[];
  /** One input polygon index per face; remainder -1 converts to Uint32 0xffffffff. */
  polygonIndices: number[];
  /** One owning patch polygon index per directed cut edge, on both sides. */
  cutPolygonIndices: number[];
};

/** Split conforming 2.5D terrain by a convex ring or prepared polygon set in local XY.
 * Either ring winding is accepted. Ring vertices must omit a closing duplicate.
 * Rejects overlapping sheets, nonconforming edges and unrepresentable slivers.
 */
export function splitTerrainMesh(
  mesh: TerrainCutoutInput,
  polygon: TerrainCutoutRegion,
  {maxWork = 4_000_000, maxVertices = 500_000, maxTriangles = 500_000}: TerrainCutoutOptions = {}
): TerrainCutout {
  if (
    ![maxWork, maxVertices, maxTriangles].every(n => Number.isSafeInteger(n) && n >= 0) ||
    maxVertices > 0xffffffff ||
    maxTriangles > 0xffffffff ||
    !(mesh.positions instanceof Float32Array || mesh.positions instanceof Float64Array) ||
    !(mesh.indices instanceof Uint16Array || mesh.indices instanceof Uint32Array) ||
    mesh.positions.length % 3 ||
    mesh.indices.length % 3 ||
    mesh.positions.length / 3 > maxVertices ||
    mesh.indices.length / 3 > maxTriangles ||
    !mesh.positions.every(Number.isFinite)
  )
    throw new RangeError('Invalid terrain cutout mesh or capacity');

  let work = 0;
  /** Charge bounded work before performing a topology or clipping operation. */
  function charge(amount: number) {
    work += amount;
    if (work > maxWork) throw new RangeError('Terrain cutout work budget exceeded');
  }

  const prepared = getTerrainCutoutPlan(polygon);
  const ring = prepared ? undefined : validatePolygon(polygon as readonly XY[], charge);
  const lines = prepared?.lines ?? ring!.map((p, i) => [p, ring![(i + 1) % ring!.length]] as const);
  const vertices: XYZ[] = [];
  for (let i = 0; i < mesh.positions.length; i += 3)
    vertices.push([mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]]);
  const faces: Face[] = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const face: Face = [mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]];
    if (face.some(id => id >= vertices.length))
      throw new RangeError('Invalid terrain cutout index');
    checkTriangle(vertices[face[0]], vertices[face[1]], vertices[face[2]]);
    faces.push(face);
  }
  validateTopology(vertices, faces, charge);

  const patch = createPiece();
  const remainder = createPiece();
  const intersections = lines.map(() => new Map<string, number>());
  let fragmentCount = 0;

  /** Allocate a vertex once for both pieces and every incident fragment. */
  function addVertex(vertex: XYZ) {
    if (vertices.length >= maxVertices || !vertex.every(Number.isFinite))
      throw new RangeError('Terrain cutout vertex budget or coordinate range exceeded');
    return vertices.push(vertex) - 1;
  }

  /** Get the same intersection even when a shared edge is traversed backwards. */
  function intersection(a: number, b: number, da: number, db: number, line: number) {
    const key = edgeKey(a, b);
    const cache = intersections[line];
    const saved = cache.get(key);
    if (saved !== undefined) return saved;
    // Canonical coordinate order also makes independently clipped tile edges
    // bit-identical, regardless of their local vertex IDs or face traversal.
    const pa = vertices[a],
      pb = vertices[b];
    if (
      pa[0] > pb[0] ||
      (pa[0] === pb[0] && (pa[1] > pb[1] || (pa[1] === pb[1] && pa[2] > pb[2])))
    ) {
      [a, b] = [b, a];
      [da, db] = [db, da];
    }
    const t = Math.abs(da) / (Math.abs(da) + Math.abs(db));
    if (!(t > 0 && t < 1)) throw new RangeError('Unrepresentable terrain cut intersection');
    const u = vertices[a];
    const v = vertices[b];
    const id = addVertex([
      u[0] + t * (v[0] - u[0]),
      u[1] + t * (v[1] - u[1]),
      u[2] + t * (v[2] - u[2])
    ]);
    cache.set(key, id);
    return id;
  }

  for (let source = 0; source < faces.length; source++) {
    let fragments: Fragment[] = [{ids: faces[source], inside: true}];
    // Split both sides by every supporting line. This preserves matching
    // subdivisions on remainder edges beyond the finite polygon segments.
    for (let line = 0; line < lines.length; line++) {
      const next: Fragment[] = [];
      const [a, b] = lines[line];
      for (const fragment of fragments) {
        const {ids} = fragment;
        charge(ids.length);
        const distances = ids.map(id => cross(a, b, vertices[id]));
        if (distances.some(d => !Number.isFinite(d)))
          throw new RangeError('Invalid terrain cut coordinates');
        if (!distances.some(d => d < 0)) next.push(fragment);
        else if (!distances.some(d => d > 0)) next.push({...fragment, inside: false});
        else {
          const positive: number[] = [];
          const negative: number[] = [];
          for (let i = 0; i < ids.length; i++) {
            const j = (i + 1) % ids.length;
            const d = distances[i];
            const e = distances[j];
            if (d >= 0) positive.push(ids[i]);
            if (d <= 0) negative.push(ids[i]);
            if ((d < 0 && e > 0) || (d > 0 && e < 0)) {
              const id = intersection(ids[i], ids[j], d, e, line);
              positive.push(id);
              negative.push(id);
            }
          }
          next.push({ids: positive, inside: fragment.inside}, {ids: negative, inside: false});
        }
        if (fragmentCount + next.length > maxTriangles)
          throw new RangeError('Terrain cutout fragment budget exceeded');
      }
      fragments = next;
    }
    fragmentCount += fragments.length;
    for (const {ids, inside} of fragments) {
      // A strict interior point classifies each arrangement cell. Its artificial
      // subdivision edges disappear when same-piece boundary incidences cancel.
      let center: [number, number, number] | undefined;
      if (prepared || ids.length > 3) {
        center = [...vertices[ids[0]]] as [number, number, number];
        for (const id of ids) {
          for (let k = 0; k < 3; k++)
            center[k] += (vertices[id][k] - vertices[ids[0]][k]) / ids.length;
        }
      }
      const polygonIndex = prepared
        ? prepared.classify([center![0], center![1]], charge)
        : inside
          ? 0
          : -1;
      const piece = polygonIndex >= 0 ? patch : remainder;
      if (ids.length === 3) emit(piece, ids as Face, source, polygonIndex);
      else {
        // A center fan retains collinear boundary vertices and therefore pairs
        // every constrained boundary segment with its neighbor.
        const hub = addVertex(center!);
        for (let i = 0; i < ids.length; i++)
          emit(piece, [ids[i], ids[(i + 1) % ids.length], hub], source, polygonIndex);
      }
    }
  }

  /** Emit a triangle and weld all of its edges by their shared topology IDs. */
  function emit(piece: PieceBuilder, face: Face, source: number, polygonIndex: number) {
    if (patch.sourceFaces.length + remainder.sourceFaces.length >= maxTriangles)
      throw new RangeError('Terrain cutout triangle budget exceeded');
    checkTriangle(vertices[face[0]], vertices[face[1]], vertices[face[2]]);
    const [a, b, c] = faces[source].map(id => vertices[id]);
    const area = cross(a, b, c);
    for (let i = 0; i < 3; i++) {
      const id = face[i];
      if (!piece.ids.has(id)) {
        if (patch.ids.size + remainder.ids.size >= maxVertices)
          throw new RangeError('Terrain cutout output vertex budget exceeded');
        piece.ids.set(id, piece.ids.size);
        const p = vertices[id];
        piece.positions.push(...p);
        piece.sourceTriangles.push(source);
        piece.sourceWeights.push(
          cross(b, c, p) / area,
          cross(c, a, p) / area,
          cross(a, b, p) / area
        );
      }
      piece.indices.push(piece.ids.get(id)!);
      addEdge(piece.boundary, id, face[(i + 1) % 3], polygonIndex);
    }
    piece.sourceFaces.push(source);
    piece.polygonIndices.push(polygonIndex);
  }

  for (const [key, inside] of patch.boundary) {
    const outside = remainder.boundary.get(key);
    if (!outside) continue;
    const [a, b] = inside.edge;
    if (inside.count !== 1 || outside.count !== 1 || outside.edge[0] !== b)
      throw new Error('Nonconforming terrain cut boundary');
    patch.cutEdges.push(patch.ids.get(a)!, patch.ids.get(b)!);
    remainder.cutEdges.push(remainder.ids.get(b)!, remainder.ids.get(a)!);
    patch.cutPolygonIndices.push(inside.polygon);
    remainder.cutPolygonIndices.push(inside.polygon);
  }
  return {patch: finish(patch), remainder: finish(remainder)};
}

/** Validate a simple strictly convex ring and normalize it to CCW. */
function validatePolygon(polygon: readonly XY[], charge: (amount: number) => void): XY[] {
  if (polygon.length < 3 || polygon.some(p => p.length !== 2 || !p.every(Number.isFinite)))
    throw new RangeError('Invalid terrain cut polygon');
  const ring = [...polygon];
  const orientation = cross(ring[0], ring[1], ring[2]);
  if (orientation < 0) ring.reverse();
  for (let i = 0; i < ring.length; i++) {
    charge(ring.length);
    const j = (i + 1) % ring.length;
    for (let k = 0; k < ring.length; k++) {
      if (k === i || k === j) continue;
      const area = cross(ring[i], ring[j], ring[k]);
      if (!(area > 0 && Number.isFinite(area)))
        throw new RangeError('Terrain cut polygon must be strictly convex');
    }
  }
  return ring;
}

/** Match TerrainSurface's relative degeneracy threshold without constructing an index. */
function checkTriangle(a: XYZ, b: XYZ, c: XYZ) {
  const area = cross(a, b, c);
  const scale = Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - a[0], c[1] - a[1]);
  if (!(area > Number.EPSILON * scale && Number.isFinite(area)))
    throw new RangeError('Terrain cut requires upward nondegenerate XY triangles');
}

/** Reject nonmanifold edges, overlaps and hanging vertices using an XY sweep. */
function validateTopology(vertices: XYZ[], faces: Face[], charge: (amount: number) => void) {
  const edges = new Map<string, Boundary>();
  const boxes = faces
    .map(face => {
      for (let i = 0; i < 3; i++) addEdge(edges, face[i], face[(i + 1) % 3]);
      const points = face.map(id => vertices[id]);
      return {
        face,
        points,
        low: Math.min(...points.map(p => p[0])),
        high: Math.max(...points.map(p => p[0])),
        minY: Math.min(...points.map(p => p[1])),
        maxY: Math.max(...points.map(p => p[1]))
      };
    })
    .sort((a, b) => a.low - b.low);
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    for (let j = i + 1; j < boxes.length && boxes[j].low <= a.high; j++) {
      charge(1);
      const b = boxes[j];
      if (a.maxY < b.minY || b.maxY < a.minY) continue;
      if (!separates(a.points, b.points) && !separates(b.points, a.points))
        throw new RangeError('Terrain cut input has overlapping XY triangles');
      checkJunctions(a.face, b.face, vertices);
      checkJunctions(b.face, a.face, vertices);
    }
  }
}

/** Find a triangle edge whose exterior closed half-plane contains the other triangle. */
function separates(a: XYZ[], b: XYZ[]) {
  return a.some((p, i) => b.every(q => cross(p, a[(i + 1) % 3], q) <= 0));
}

/** Reject a hanging vertex or coincident edge with distinct topology IDs. */
function checkJunctions(a: Face, b: Face, vertices: XYZ[]) {
  for (let i = 0; i < 3; i++) {
    const u = vertices[a[i]];
    const v = vertices[a[(i + 1) % 3]];
    const overlaps = b.filter(id => {
      const p = vertices[id];
      if (cross(u, v, p) !== 0) return false;
      const axis = Math.abs(v[0] - u[0]) >= Math.abs(v[1] - u[1]) ? 0 : 1;
      const low = Math.min(u[axis], v[axis]);
      const high = Math.max(u[axis], v[axis]);
      if (p[axis] > low && p[axis] < high)
        throw new RangeError('Terrain cut input has a T-junction');
      return p[axis] >= low && p[axis] <= high;
    });
    if (overlaps.length >= 2 && (!overlaps.includes(a[i]) || !overlaps.includes(a[(i + 1) % 3])))
      throw new RangeError('Terrain cut input has an unwelded shared edge');
  }
}

/** Track the first direction and incidence count of an indexed edge. */
function addEdge(edges: Map<string, Boundary>, a: number, b: number, polygon = -1) {
  const key = edgeKey(a, b);
  const entry = edges.get(key);
  if (!entry) edges.set(key, {edge: [a, b], count: 1, polygon});
  else {
    if (entry.count !== 1 || entry.edge[0] !== b)
      throw new RangeError('Terrain cut mesh has inconsistent or nonmanifold edges');
    entry.count++;
  }
}

/** Shared key independent of the edge direction. */
function edgeKey(a: number, b: number) {
  return a < b ? a + ',' + b : b + ',' + a;
}

/** Signed doubled triangle area in local XY. */
function cross(a: XY | XYZ, b: XY | XYZ, c: XY | XYZ) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

/** Allocate detached output staging buffers. */
function createPiece(): PieceBuilder {
  return {
    ids: new Map(),
    positions: [],
    indices: [],
    sourceTriangles: [],
    sourceWeights: [],
    sourceFaces: [],
    boundary: new Map(),
    cutEdges: [],
    polygonIndices: [],
    cutPolygonIndices: []
  };
}

/** Materialize the public typed arrays. */
function finish(piece: PieceBuilder): TerrainCutoutPiece {
  return {
    positions: Float64Array.from(piece.positions),
    indices: Uint32Array.from(piece.indices),
    sourceTriangles: Uint32Array.from(piece.sourceTriangles),
    sourceWeights: Float64Array.from(piece.sourceWeights),
    sourceFaces: Uint32Array.from(piece.sourceFaces),
    cutEdges: Uint32Array.from(piece.cutEdges),
    polygonIndices: Uint32Array.from(piece.polygonIndices),
    cutPolygonIndices: Uint32Array.from(piece.cutPolygonIndices)
  };
}

/** @internal Check topology of already range-validated assembled tile inputs. */
export function validateTerrainCutoutTopology(mesh: TerrainCutoutInput, maxWork: number) {
  const vertices: XYZ[] = [];
  const faces: Face[] = [];
  for (let i = 0; i < mesh.positions.length; i += 3)
    vertices.push([mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]]);
  for (let i = 0; i < mesh.indices.length; i += 3)
    faces.push([mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]]);
  let work = 0;
  validateTopology(vertices, faces, amount => {
    work += amount;
    if (work > maxWork) throw new RangeError('Terrain cutout topology work budget exceeded');
  });
}
