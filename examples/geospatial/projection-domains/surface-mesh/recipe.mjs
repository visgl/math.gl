// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  subdivideTriangleMesh,
  composeAttributeProvenance,
  interpolatePackedAttributes,
  qualifySurfaceTransition
} from '@math.gl/geometry';

const source = {
  positions: new Float64Array([-1, -1, 1, -1, 1, 1, -1, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3])
};
// Patch extent semantics are authoritative metadata, separate from triangulation.
const sourceBoundary = [
  [0, 1, 'source'],
  [1, 2, 'coverage'],
  [2, 3, 'source'],
  [3, 0, 'join']
];
const transform = ([u, v]) => {
  const lon = (u * Math.PI) / 9,
    lat = (v * Math.PI) / 9;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon) - 1];
};

/** A pre-triangulated, unwrapped patch. Source interpolation is affine in this
 * explicit lon/lat chart, not geodesic or a universal interpolation for GeoJSON. */
export function prepareSurfacePatch() {
  const first = subdivideTriangleMesh(source, {
    refinement: 'source-edge',
    maxEdgeLength: 0.6,
    transform: p => p
  });
  const refined = subdivideTriangleMesh(
    {positions: first.sourcePositions, indices: first.indices},
    {transform, targetSize: 3, tolerance: 0.001, maxDepth: 8}
  );
  const provenance = composeAttributeProvenance(first, refined);
  const flat = new Float64Array((refined.sourcePositions.length / 2) * 3);
  for (let i = 0; i < flat.length / 3; i++) {
    flat[3 * i] = (refined.sourcePositions[2 * i] * Math.PI) / 9;
    flat[3 * i + 1] = (refined.sourcePositions[2 * i + 1] * Math.PI) / 9;
  }
  const qualification = qualifySurfaceTransition(
    {positions: flat, indices: refined.indices},
    refined.positions
  );
  // Numeric values interpolate; the category is flat and must agree within each
  // contributing source triangle. Integer colors are quantized only once here.
  const records = new Uint8Array(4 * 16),
    view = new DataView(records.buffer);
  for (let i = 0; i < 4; i++) {
    view.setFloat64(
      i * 16,
      10 + source.positions[2 * i] * 5 + source.positions[2 * i + 1] * 2,
      true
    );
    view.setUint32(i * 16 + 8, 7, true);
    records[i * 16 + 12] = i % 2 ? 250 : 20;
  }
  const attributes = interpolatePackedAttributes(records, provenance, {
    byteStride: 16,
    attributes: [
      {type: 'float64', size: 1, byteOffset: 0, interpolation: 'linear'},
      {type: 'uint32', size: 1, byteOffset: 8, interpolation: 'flat'},
      {type: 'uint8', size: 1, byteOffset: 12, interpolation: 'linear'}
    ]
  });
  return {
    source,
    flat,
    globe: refined.positions,
    indices: refined.indices,
    sourcePositions: refined.sourcePositions,
    provenance,
    attributes,
    sourceTriangles: Uint32Array.from(
      refined.sourceTriangleIndices,
      i => first.sourceTriangleIndices[i]
    ),
    qualification
  };
}

export function evaluateSurfacePatch(mesh, amount, height = 0) {
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 1 ||
    !Number.isFinite(height) ||
    height < 0
  )
    throw new RangeError('Invalid surface pose');
  const positions = Float64Array.from(
      mesh.flat,
      (v, i) => v * (1 - amount) + mesh.globe[i] * amount
    ),
    normals = new Float64Array(positions.length);
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const ids = Array.from(mesh.indices.slice(i, i + 3)),
      p = ids.map(id => Array.from(positions.slice(3 * id, 3 * id + 3))),
      n = cross(subtract(p[1], p[0]), subtract(p[2], p[0]));
    for (const id of ids) for (let k = 0; k < 3; k++) normals[3 * id + k] += n[k];
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(...normals.slice(i, i + 3));
    if (!length) throw new RangeError('Degenerate posed normal');
    for (let k = 0; k < 3; k++) normals[i + k] /= length;
  }
  const top = Float64Array.from(positions, (v, i) => v + normals[i] * height),
    boundary = [],
    walls = [];
  const ids = mesh.qualification.boundary;
  for (let i = 0; i < ids.length; i++) {
    const a = ids[i],
      b = ids[(i + 1) % ids.length];
    const belongs = (vertex, edge) =>
      [0, 1, 2].every(
        slot =>
          !mesh.provenance.sourceVertexWeights[3 * vertex + slot] ||
          edge.includes(mesh.provenance.sourceVertexIndices[3 * vertex + slot])
      );
    const owner = sourceBoundary.find(([x, y]) => belongs(a, [x, y]) && belongs(b, [x, y]));
    if (!owner) throw new RangeError('Boundary lost original source-edge ancestry');
    const kind = owner[2];
    boundary.push({a, b, kind});
    if (kind === 'source' && height)
      walls.push([point(positions, a), point(positions, b), point(top, b), point(top, a)]);
  }
  const topNormals = height ? calculateNormals(top, mesh.indices) : normals;
  return {
    positions: top,
    basePositions: positions,
    normals: topNormals,
    indices: mesh.indices,
    boundary,
    walls
  };
}

/** Intersect the actual posed triangles, then compose hit barycentrics with the
 * original source-vertex weights. Ray is in mesh coordinates; nearest t>=0 wins. */
export function pickSurfacePatch(mesh, frame, origin, direction) {
  if (
    origin.length !== 3 ||
    direction.length !== 3 ||
    ![...origin, ...direction].every(Number.isFinite) ||
    !Math.hypot(...direction)
  )
    throw new RangeError('Invalid surface ray');
  let hit = null;
  for (let i = 0; i < frame.indices.length; i += 3) {
    const ids = Array.from(frame.indices.slice(i, i + 3)),
      [a, b, c] = ids.map(id => point(frame.positions, id)),
      ab = subtract(b, a),
      ac = subtract(c, a),
      p = cross(direction, ac),
      det = dot(ab, p);
    if (Math.abs(det) < 1e-14) continue;
    const o = subtract(origin, a),
      u = dot(o, p) / det,
      q = cross(o, ab),
      v = dot(direction, q) / det,
      t = dot(ac, q) / det;
    if (u < 0 || v < 0 || u + v > 1 || t < 0 || (hit && t >= hit.rayParameter)) continue;
    const bary = [1 - u - v, u, v],
      original = new Map();
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) {
        const index = mesh.provenance.sourceVertexIndices[ids[j] * 3 + k],
          w = bary[j] * mesh.provenance.sourceVertexWeights[ids[j] * 3 + k];
        if (w) original.set(index, (original.get(index) ?? 0) + w);
      }
    const sourcePosition = [0, 0];
    for (const [index, w] of original)
      for (let k = 0; k < 2; k++) sourcePosition[k] += mesh.source.positions[2 * index + k] * w;
    hit = {
      triangle: i / 3,
      sourceTriangle: mesh.sourceTriangles[i / 3],
      rayParameter: t,
      sourcePosition,
      contributors: Array.from(original),
      position: origin.map((x, k) => x + t * direction[k])
    };
  }
  return hit;
}
const point = (array, i) => Array.from(array.slice(3 * i, 3 * i + 3));
const subtract = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);

function calculateNormals(positions, indices) {
  const normals = new Float64Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const ids = Array.from(indices.slice(i, i + 3)),
      [a, b, c] = ids.map(id => point(positions, id)),
      n = cross(subtract(b, a), subtract(c, a));
    for (const id of ids) for (let k = 0; k < 3; k++) normals[3 * id + k] += n[k];
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(...normals.slice(i, i + 3));
    if (!length) throw new RangeError('Degenerate offset surface');
    for (let k = 0; k < 3; k++) normals[i + k] /= length;
  }
  return normals;
}
