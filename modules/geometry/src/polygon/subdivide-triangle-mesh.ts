// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A flat, indexed triangle mesh. Vertices at attribute seams must have distinct indices. */
export type TriangleMesh = {
  /** Flat source positions. */
  positions: ArrayLike<number>;
  /** Three vertex indices per triangle, with consistent winding. */
  indices: ArrayLike<number>;
};

/** Controls adaptive subdivision through an application-supplied coordinate transform. */
type SubdivisionOptions = {
  /** Deterministic source-to-target conversion. Each invocation receives a fresh source array.
   * Null and nonfinite output reject the mesh; callback exceptions propagate unchanged.
   */
  transform: (position: readonly number[]) => ArrayLike<number> | null;
  /** Source dimension: 2 or 3. Default 2. */
  size?: 2 | 3;
  /** Target dimension: 2 or 3. Defaults to size. */
  targetSize?: 2 | 3;
  /** Maximum global refinement passes, from 0 through 30. Default 10. */
  maxDepth?: number;
  /** Maximum output vertex count, including unused input vertices. Default 65536. */
  maxVertices?: number;
  /** Maximum output triangle count. Default 131072. */
  maxTriangles?: number;
};

/** Select sampled transform error (default), or exclusively limit source-edge length. */
export type SubdivideTriangleMeshOptions = SubdivisionOptions &
  (
    | {
        /** Sample target-space error, including triangle interiors. This is the default. */
        refinement?: 'transform-error';
        /** Positive, finite sampled error tolerance across target components, in target units. */
        tolerance: number;
        /** Positive maximum Euclidean source-edge length. Default Infinity. */
        maxEdgeLength?: number;
      }
    | {
        /** Split only long indexed edges, without evaluating transform-error probes. */
        refinement: 'source-edge';
        /** No target-space tolerance is evaluated in source-edge mode. */
        tolerance?: never;
        /** Positive, finite maximum Euclidean edge length across all source components. */
        maxEdgeLength: number;
      }
  );

/** Refined geometry with provenance for interpolating UVs and other source vertex attributes. */
export type SubdividedTriangleMesh = {
  /** Flat source coordinates, including inserted vertices. */
  sourcePositions: Float64Array;
  /** Flat transformed coordinates, suitable for rendering. */
  positions: Float64Array;
  /** Refined triangle indices; input winding is preserved in source space. */
  indices: Uint32Array;
  /** Three original input vertex indices per output vertex. Unused slots use index 0. */
  sourceVertexIndices: Uint32Array;
  /** Three corresponding weights per output vertex, summing to one. */
  sourceVertexWeights: Float64Array;
  /** Original input triangle index for each output triangle. */
  sourceTriangleIndices: Uint32Array;
};

type Vertex = {source: number[]; target: number[]; weights: Map<number, number>};
type Face = {vertices: [number, number, number]; sourceTriangle: number};

const EDGE_FRACTIONS = [0.25, 0.5, 0.75];
const FACE_WEIGHTS = [
  [1 / 3, 1 / 3, 1 / 3],
  [0.5, 0.25, 0.25],
  [0.25, 0.5, 0.25],
  [0.25, 0.25, 0.5]
];

/** Refines a conforming triangle mesh to approximate a nonlinear coordinate transform.
 * Checks edge quarter/midpoint samples and four interior barycentric samples. Failing faces
 * split all three edges; neighbors split matching edges so no new T-junctions are introduced.
 * The tolerance is sampled, not a universal error bound. Source interpolation is linear.
 * Clip invalid domains and split projection seams before calling. Attribute seams must use
 * duplicated input vertices; equal coordinates are never welded.
 * Opt-in source-edge refinement skips error probes and transforms each output vertex once.
 * It provides no target-space error bound or interior-domain validation.
 * @throws RangeError For invalid input/options, rejected transform samples, or exhausted limits.
 */
export function subdivideTriangleMesh(
  mesh: TriangleMesh,
  options: SubdivideTriangleMeshOptions
): SubdividedTriangleMesh {
  const {
    transform,
    tolerance,
    refinement = 'transform-error',
    size = 2,
    targetSize = size,
    maxEdgeLength = Infinity,
    maxDepth = 10,
    maxVertices = 65536,
    maxTriangles = 131072
  } = options;
  validateOptions();
  const vertices: Vertex[] = [];
  let faces: Face[] = [];
  for (let i = 0; i < mesh.positions.length; i += size) {
    const source = Array.from({length: size}, (_, j) => mesh.positions[i + j]);
    if (!source.every(Number.isFinite)) throw new RangeError('Source positions must be finite');
    vertices.push({source, target: project(source), weights: new Map([[i / size, 1]])});
  }
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const indices = Array.from({length: 3}, (_, j) => mesh.indices[i + j]);
    if (!indices.every(index => Number.isInteger(index) && index >= 0 && index < vertices.length)) {
      throw new RangeError('Triangle indices must reference input vertices');
    }
    faces.push({vertices: indices as [number, number, number], sourceTriangle: i / 3});
  }

  for (let depth = 0; ; depth++) {
    const splitEdges = new Set<string>();
    for (const face of faces) {
      if (refinement === 'source-edge') {
        for (let edge = 0; edge < 3; edge++) {
          const a = face.vertices[edge];
          const b = face.vertices[(edge + 1) % 3];
          if (sourceEdgeLength(vertices[a], vertices[b]) > maxEdgeLength) {
            splitEdges.add(edgeKey(a, b));
          }
        }
      } else if (needsRefinement(face)) {
        const [a, b, c] = face.vertices;
        splitEdges.add(edgeKey(a, b));
        splitEdges.add(edgeKey(b, c));
        splitEdges.add(edgeKey(c, a));
      }
    }
    if (!splitEdges.size) return buildResult();
    if (depth >= maxDepth) throw new RangeError('Triangle mesh subdivision exceeded maxDepth');
    const midpoints = new Map<string, number>();
    const refined: Face[] = [];
    for (const face of faces) {
      splitFace(face, refined, splitEdges, midpoints);
    }
    faces = refined;
  }

  function validateOptions(): void {
    if (
      typeof transform !== 'function' ||
      (refinement !== 'transform-error' && refinement !== 'source-edge') ||
      (refinement === 'transform-error' &&
        (tolerance === undefined || !Number.isFinite(tolerance) || tolerance <= 0)) ||
      (refinement === 'source-edge' &&
        (tolerance !== undefined || !Number.isFinite(maxEdgeLength))) ||
      (size !== 2 && size !== 3) ||
      (targetSize !== 2 && targetSize !== 3) ||
      !(maxEdgeLength > 0) ||
      (!Number.isFinite(maxEdgeLength) && maxEdgeLength !== Infinity) ||
      !Number.isInteger(maxDepth) ||
      maxDepth < 0 ||
      maxDepth > 30 ||
      !validLimit(maxVertices) ||
      !validLimit(maxTriangles) ||
      !Number.isSafeInteger(mesh.positions.length) ||
      mesh.positions.length < 0 ||
      mesh.positions.length % size !== 0 ||
      !Number.isSafeInteger(mesh.indices.length) ||
      mesh.indices.length < 0 ||
      mesh.indices.length % 3 !== 0
    )
      throw new RangeError('Invalid triangle mesh subdivision options or input lengths');
    if (mesh.positions.length / size > maxVertices || mesh.indices.length / 3 > maxTriangles) {
      throw new RangeError('Input mesh exceeds subdivision limits');
    }
  }

  function project(source: number[]): number[] {
    const result = transform(source.slice());
    if (!result || result.length !== targetSize) {
      throw new RangeError('Transform must return targetSize components');
    }
    const target = Array.from(result);
    if (!target.every(Number.isFinite))
      throw new RangeError('Transform returned nonfinite coordinates');
    return target;
  }

  function error(points: Vertex[], weights: number[]): number {
    const source = blend(
      points.map(p => p.source),
      weights
    );
    const linearTarget = blend(
      points.map(p => p.target),
      weights
    );
    return Math.hypot(...project(source).map((value, i) => value - linearTarget[i]));
  }

  function needsRefinement(face: Face): boolean {
    const points = face.vertices.map(index => vertices[index]);
    let exceedsTolerance = false;
    for (let i = 0; i < 3; i++) {
      const a = points[i];
      const b = points[(i + 1) % 3];
      const length = sourceEdgeLength(a, b);
      if (length > maxEdgeLength) exceedsTolerance = true;
      for (const fraction of EDGE_FRACTIONS) {
        if (error([a, b], [1 - fraction, fraction]) > (tolerance ?? Infinity))
          exceedsTolerance = true;
      }
    }
    for (const weights of FACE_WEIGHTS) {
      if (error(points, weights) > (tolerance ?? Infinity)) exceedsTolerance = true;
    }
    return exceedsTolerance;
  }

  function midpoint(a: number, b: number, midpoints: Map<string, number>): number {
    const key = edgeKey(a, b);
    const existing = midpoints.get(key);
    if (existing !== undefined) return existing;
    if (vertices.length >= maxVertices)
      throw new RangeError('Triangle mesh subdivision exceeded maxVertices');
    const source = blend([vertices[a].source, vertices[b].source], [0.5, 0.5]);
    const weights = new Map<number, number>();
    for (const vertex of [vertices[a], vertices[b]]) {
      for (const [index, weight] of vertex.weights) {
        weights.set(index, (weights.get(index) || 0) + weight * 0.5);
      }
    }
    // Every leaf lies inside one original face. Shared boundary vertices use only
    // the original edge endpoints, so at most three source vertices contribute.
    if (weights.size > 3) throw new Error('Inconsistent mesh provenance');
    const index = vertices.length;
    vertices.push({source, target: project(source), weights});
    midpoints.set(key, index);
    return index;
  }

  function splitFace(
    face: Face,
    output: Face[],
    splitEdges: Set<string>,
    midpoints: Map<string, number>
  ): void {
    const [a, b, c] = face.vertices;
    const ab = splitEdges.has(edgeKey(a, b)) ? midpoint(a, b, midpoints) : -1;
    const bc = splitEdges.has(edgeKey(b, c)) ? midpoint(b, c, midpoints) : -1;
    const ca = splitEdges.has(edgeKey(c, a)) ? midpoint(c, a, midpoints) : -1;
    const count = Number(ab >= 0) + Number(bc >= 0) + Number(ca >= 0);
    if (count === 0) emit(a, b, c);
    else if (count === 3) {
      emit(a, ab, ca);
      emit(ab, b, bc);
      emit(ca, bc, c);
      emit(ab, bc, ca);
    } else {
      // Rotate to a canonical one-edge or two-edge template, preserving winding.
      const corners = [a, b, c];
      const edges = [ab, bc, ca];
      const start = count === 1 ? edges.findIndex(v => v >= 0) : edges.findIndex(v => v < 0);
      const rotation = count === 1 ? start : (start + 1) % 3;
      const x = corners[rotation];
      const y = corners[(rotation + 1) % 3];
      const z = corners[(rotation + 2) % 3];
      const xy = edges[rotation];
      if (count === 1) {
        emit(x, xy, z);
        emit(xy, y, z);
      } else {
        const yz = edges[(rotation + 1) % 3];
        emit(y, yz, xy);
        emit(x, xy, z);
        emit(xy, yz, z);
      }
    }
    function emit(x: number, y: number, z: number): void {
      if (output.length >= maxTriangles)
        throw new RangeError('Triangle mesh subdivision exceeded maxTriangles');
      output.push({vertices: [x, y, z], sourceTriangle: face.sourceTriangle});
    }
  }

  function buildResult(): SubdividedTriangleMesh {
    const sourceVertexIndices = new Uint32Array(vertices.length * 3);
    const sourceVertexWeights = new Float64Array(vertices.length * 3);
    for (let i = 0; i < vertices.length; i++) {
      let slot = 0;
      for (const [index, weight] of vertices[i].weights) {
        sourceVertexIndices[i * 3 + slot] = index;
        sourceVertexWeights[i * 3 + slot++] = weight;
      }
    }
    return {
      sourcePositions: new Float64Array(vertices.flatMap(v => v.source)),
      positions: new Float64Array(vertices.flatMap(v => v.target)),
      indices: new Uint32Array(faces.flatMap(f => f.vertices)),
      sourceVertexIndices,
      sourceVertexWeights,
      sourceTriangleIndices: new Uint32Array(faces.map(f => f.sourceTriangle))
    };
  }
}

/** Measures an indexed edge in source-coordinate units. */
function sourceEdgeLength(a: Vertex, b: Vertex): number {
  return Math.hypot(...a.source.map((value, component) => value - b.source[component]));
}

function edgeKey(a: number, b: number): string {
  return a <= b ? `${a}:${b}` : `${b}:${a}`;
}

function validLimit(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff;
}

function blend(positions: number[][], weights: number[]): number[] {
  return positions[0].map((_, i) => positions.reduce((sum, p, j) => sum + p[i] * weights[j], 0));
}
