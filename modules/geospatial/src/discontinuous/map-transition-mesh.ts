// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Geographic sample projected into a common screen space at one endpoint. */
export type MapTransitionMeshPoint = {
  position: readonly [number, number, number];
  inside: boolean;
  front?: boolean;
  part?: string | number;
  seam?: string | number;
  cutPosition?: readonly number[];
};
/** A renderer adapts its camera here; this module has no renderer dependency. */
export type MapTransitionEndpoint = {
  (longitude: number, latitude: number, sector?: number): MapTransitionMeshPoint | null;
  width?: number;
  height?: number;
  worldWidth?: number;
  wrapCopies?: readonly number[];
  /** Optional discontinuity guard in cutPosition units (or screen units). */
  maxEdgeLength?: number;
};
export type MapTransitionMeshOptions = {
  /** Maximum subdivision depth per two-degree geographic cell, from 0 to 12. Default 7. */
  maxDepth?: number;
  /** Maximum screen-space curvature and cut-bank diameter in pixels. Default 0.6. */
  error?: number;
  /** Maximum prepared vertices across all world copies. Default 1000000. */
  maxVertices?: number;
  /** Maximum prepared triangles across all world copies. Default 2000000. */
  maxTriangles?: number;
};
export type MapTransitionMeshAsyncOptions = MapTransitionMeshOptions & {signal?: AbortSignal};
/** Static GPU-ready buffers. Animation changes only a renderer's progress uniform. */
export type MapTransitionMesh = {
  positions: Float64Array;
  destination: Float32Array;
  texCoords: Float32Array;
  lifetime: Float32Array;
  pieceCenters: Float32Array;
  pieceAngles: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
};

/**
 * Refine visible curvature in screen space. Vertices on cut banks are independent;
 * patches outside either endpoint keep their shape and retire instead of stretching.
 */
function* createSurfaceMesh(
  source: MapTransitionEndpoint,
  target: MapTransitionEndpoint,
  options: MapTransitionMeshOptions = {}
): Generator<void, MapTransitionMesh> {
  const from: number[] = [],
    to: number[] = [],
    uv: number[] = [],
    lifetime: number[] = [],
    groupIndices: number[] = [];
  const groups = new Map<
    string,
    {index: number; pairs: [readonly number[], readonly number[]][]}
  >();
  const vertices = new Map<string, number>(),
    indices: number[] = [];
  const width = source.width || 1000,
    height = source.height || 800;
  const maxDepth = options.maxDepth ?? 7;
  const errorLimit = options.error ?? 0.6;
  const usable = (points: (MapTransitionMeshPoint | null)[], endpoint: MapTransitionEndpoint) =>
    points.every(p => p?.inside) &&
    points.every((p, i) => {
      const q = points[(i + 1) % 3];
      if ((p.part ?? 0) !== (q.part ?? 0)) return false;
      const a = p.cutPosition || p.position,
        b = q.cutPosition || q.position;
      return Math.hypot(a[0] - b[0], a[1] - b[1]) < (endpoint.maxEdgeLength ?? Infinity);
    });
  const emit = (triangle: number[][], sector: number) => {
    const a = triangle.map(([x, y]) => source(x, y, sector));
    const b = triangle.map(([x, y]) => target(x, y, sector));
    const va = usable(a, source),
      vb = usable(b, target);
    if (!va && !vb) return;
    if (indices.length / 3 >= (options.maxTriangles ?? 2000000))
      throw new RangeError('Transition triangle budget exceeded');
    const key = `${va ? (a[0].part ?? 0) : 'none'}:${vb ? (b[0].part ?? 0) : 'none'}`;
    if (!groups.has(key)) groups.set(key, {index: groups.size, pairs: []});
    const group = groups.get(key);
    triangle.forEach(([x, y], i) => {
      const vertexKey = `${x},${y},${group.index},${va ? (a[i].seam ?? 0) : 0}:${vb ? (b[i].seam ?? 0) : 0}`;
      if (vertices.has(vertexKey)) {
        indices.push(vertices.get(vertexKey));
        return;
      }
      const index = from.length / 3;
      if (index >= (options.maxVertices ?? 1000000))
        throw new RangeError('Transition vertex budget exceeded');
      vertices.set(vertexKey, index);
      indices.push(index);
      const p = va ? a[i].position : b[i].position;
      const q = vb ? b[i].position : a[i].position;
      from.push(...p);
      to.push(...q);
      uv.push((x + 180) / 360, (90 - y) / 180);
      lifetime.push(va ? 1 : 0, vb ? 1 : 0);
      groupIndices.push(group.index);
      if (va && vb && a[i].front !== false && b[i].front !== false) group.pairs.push([p, q]);
    });
  };
  const refine = (lon: number, lat: number, size: number, depth: number) => {
    const sector = lon + size / 2;
    const coordinates = [
      [lon, lat],
      [lon + size, lat],
      [lon, lat + size],
      [lon + size, lat + size],
      [lon + size / 2, lat],
      [lon + size, lat + size / 2],
      [lon + size / 2, lat + size],
      [lon, lat + size / 2],
      [lon + size / 2, lat + size / 2]
    ];
    let split = false;
    for (const endpoint of [source, target]) {
      const p = coordinates.map(([x, y]) => endpoint(x, y, sector));
      const visible = p.some(
        v =>
          v?.inside &&
          v.front !== false &&
          Math.abs(v.position[0]) < width * 0.7 &&
          Math.abs(v.position[1]) < height * 0.7
      );
      if (!visible) continue;
      if (p.some(v => !v?.inside) || p.some(v => v?.part !== p[0]?.part)) {
        // A cut has no continuous midpoint, so curvature error cannot converge.
        // Stop once each bank fits within a pixel instead of always exhausting
        // maxDepth along every inset border and projection coverage edge.
        const banks = new Map<string | number, number[]>();
        for (const point of p) {
          if (!point) continue;
          const key = point.part ?? 0;
          const [x, y] = point.position;
          const bounds = banks.get(key) || [x, y, x, y, 0];
          bounds[0] = Math.min(bounds[0], x);
          bounds[1] = Math.min(bounds[1], y);
          bounds[2] = Math.max(bounds[2], x);
          bounds[3] = Math.max(bounds[3], y);
          bounds[4]++;
          banks.set(key, bounds);
        }
        if (
          [...banks.values()].some(
            ([left, bottom, right, top, count]) =>
              count === 1 || Math.hypot(right - left, top - bottom) > errorLimit
          )
        )
          split = true;
        continue;
      }
      for (const [a, b, mid] of [
        [0, 1, 4],
        [1, 3, 5],
        [2, 3, 6],
        [0, 2, 7],
        [0, 3, 8]
      ]) {
        const error = Math.hypot(
          p[mid].position[0] - (p[a].position[0] + p[b].position[0]) / 2,
          p[mid].position[1] - (p[a].position[1] + p[b].position[1]) / 2
        );
        const length = Math.hypot(
          p[a].position[0] - p[b].position[0],
          p[a].position[1] - p[b].position[1]
        );
        if (error > errorLimit || length > 48) split = true;
      }
    }
    if (split && depth < maxDepth) {
      const half = size / 2;
      refine(lon, lat, half, depth + 1);
      refine(lon + half, lat, half, depth + 1);
      refine(lon, lat + half, half, depth + 1);
      refine(lon + half, lat + half, half, depth + 1);
    } else {
      emit([coordinates[0], coordinates[1], coordinates[2]], sector);
      emit([coordinates[1], coordinates[3], coordinates[2]], sector);
    }
  };
  for (let lat = -90; lat < 90; lat += 2)
    for (let lon = -180; lon < 180; lon += 2) {
      refine(lon, lat, 2, 0);
      yield;
    }

  // Separate rigid motion of each cut piece from its remaining deformation.
  const motions = Array.from(groups.values()).map(group => {
    const pairs = group.pairs,
      n = pairs.length;
    if (!n) return [0, 0, 0, 0, 0];
    const centers = [0, 0, 0, 0];
    for (const [a, b] of pairs) {
      centers[0] += a[0] / n;
      centers[1] += a[1] / n;
      centers[2] += b[0] / n;
      centers[3] += b[1] / n;
    }
    let dot = 0,
      cross = 0;
    for (const [a, b] of pairs) {
      const x = a[0] - centers[0],
        y = a[1] - centers[1];
      const u = b[0] - centers[2],
        v = b[1] - centers[3];
      dot += x * u + y * v;
      cross += x * v - y * u;
    }
    return [...centers, Math.atan2(cross, dot)];
  });
  // Keep the viewed location fixed while the surrounding piece rotates.
  let focusGroup = -1,
    focusDistance = Infinity;
  for (const group of groups.values())
    for (const [a, b] of group.pairs) {
      const distance = Math.hypot(a[0], a[1]) + Math.hypot(b[0], b[1]);
      if (distance < focusDistance) {
        focusDistance = distance;
        focusGroup = group.index;
      }
    }
  if (focusGroup >= 0 && focusDistance < 100) motions[focusGroup].fill(0, 0, 4);
  const pieceCenters = new Float32Array(groupIndices.length * 4),
    pieceAngles = new Float32Array(groupIndices.length);
  groupIndices.forEach((group, i) => {
    pieceCenters.set(motions[group].slice(0, 4), i * 4);
    pieceAngles[i] = motions[group][4];
  });
  return {
    positions: new Float64Array(from),
    destination: new Float32Array(to),
    texCoords: new Float32Array(uv),
    lifetime: new Float32Array(lifetime),
    pieceCenters,
    pieceAngles,
    indices: new Uint32Array(indices),
    vertexCount: indices.length
  };
}

/** Include repeated Web Mercator worlds while keeping each cut copy independent. */
function* buildMorphMesh(
  source: MapTransitionEndpoint,
  target: MapTransitionEndpoint,
  options: MapTransitionMeshOptions = {}
): Generator<void, MapTransitionMesh> {
  const vertices = options.maxVertices ?? 1000000;
  const triangles = options.maxTriangles ?? 2000000;
  if (
    !Number.isInteger(vertices) ||
    vertices < 3 ||
    vertices > 0xffffffff ||
    !Number.isInteger(triangles) ||
    triangles < 1 ||
    triangles > 0xffffffff
  )
    throw new RangeError('Invalid transition mesh budget');
  const depth = options.maxDepth ?? 7;
  const error = options.error ?? 0.6;
  if (
    !Number.isInteger(depth) ||
    depth < 0 ||
    depth > 12 ||
    !Number.isFinite(error) ||
    error <= 0
  ) {
    throw new RangeError('Invalid transition mesh refinement budget');
  }
  const copies = [...new Set([...(source.wrapCopies || [0]), ...(target.wrapCopies || [0])])];
  const endpointForCopy = (
    endpoint: MapTransitionEndpoint,
    copy: number
  ): MapTransitionEndpoint => {
    const wrapped: MapTransitionEndpoint = (longitude, latitude, sector) => {
      const point = endpoint(longitude, latitude, sector);
      if (!point) return null;
      const supported = copy === 0 || endpoint.wrapCopies?.includes(copy);
      return {
        ...point,
        inside: point.inside && supported,
        position: [
          point.position[0] + copy * (endpoint.worldWidth || 0),
          point.position[1],
          point.position[2]
        ],
        cutPosition: point.cutPosition && [
          point.cutPosition[0] + copy * 360,
          ...point.cutPosition.slice(1)
        ]
      };
    };
    wrapped.width = endpoint.width;
    wrapped.height = endpoint.height;
    wrapped.maxEdgeLength = endpoint.maxEdgeLength;
    return wrapped;
  };
  if (copies.length === 1) return yield* createSurfaceMesh(source, target, options);
  const meshes: MapTransitionMesh[] = [];
  let remainingVertices = vertices,
    remainingTriangles = triangles;
  for (const copy of copies) {
    const mesh = yield* createSurfaceMesh(
      endpointForCopy(source, copy),
      endpointForCopy(target, copy),
      {...options, maxVertices: remainingVertices, maxTriangles: remainingTriangles}
    );
    meshes.push(mesh);
    remainingVertices -= mesh.positions.length / 3;
    remainingTriangles -= mesh.vertexCount / 3;
  }
  const merge = <K extends Exclude<keyof MapTransitionMesh, 'vertexCount'>>(
    key: K
  ): MapTransitionMesh[K] => {
    const TypedArray = meshes[0][key].constructor as {new (length: number): MapTransitionMesh[K]};
    const result = new TypedArray(meshes.reduce((sum, mesh) => sum + mesh[key].length, 0));
    let offset = 0,
      vertexOffset = 0;
    for (const mesh of meshes) {
      if (key === 'indices') {
        for (let i = 0; i < mesh.indices.length; i++)
          result[offset + i] = mesh.indices[i] + vertexOffset;
      } else result.set(mesh[key], offset);
      offset += mesh[key].length;
      vertexOffset += mesh.positions.length / 3;
    }
    return result;
  };
  return {
    positions: merge('positions'),
    destination: merge('destination'),
    texCoords: merge('texCoords'),
    lifetime: merge('lifetime'),
    pieceCenters: merge('pieceCenters'),
    pieceAngles: merge('pieceAngles'),
    indices: merge('indices'),
    vertexCount: meshes.reduce((sum, mesh) => sum + mesh.vertexCount, 0)
  };
}

/** Synchronous mesh construction for geometry checks and offline callers. */
export function prepareMapTransitionMesh(
  source: MapTransitionEndpoint,
  target: MapTransitionEndpoint,
  options: MapTransitionMeshOptions = {}
): MapTransitionMesh {
  const builder = buildMorphMesh(source, target, options);
  let step;
  do {
    step = builder.next();
  } while (!step.done);
  return step.value;
}

/** Let input and paint run while preparing a cut mesh; animate only after it is ready. */
export async function prepareMapTransitionMeshAsync(
  source: MapTransitionEndpoint,
  target: MapTransitionEndpoint,
  options: MapTransitionMeshAsyncOptions = {}
): Promise<MapTransitionMesh> {
  const builder = buildMorphMesh(source, target, options);
  let deadline = performance.now() + 8;
  while (true) {
    options.signal?.throwIfAborted();
    const step = builder.next();
    if (step.done) return step.value;
    if (performance.now() >= deadline) {
      await new Promise(resolve => setTimeout(resolve, 0));
      deadline = performance.now() + 8;
    }
  }
}
