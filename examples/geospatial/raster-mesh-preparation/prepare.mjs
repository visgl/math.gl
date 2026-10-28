// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {subdivideTriangleMesh, clipTriangleMesh, interpolatePackedAttributes, earcut} from '@math.gl/geometry';
import {createCRSProjectionDomain} from '@math.gl/geospatial/crs';

// Example policy, not a universal raster reprojection API. Each input patch must
// already be continuous in source space and finite under its selected transform.
export function preparePatch(patch, {pixelsPerUnit = 100, pixelTolerance = 0.5} = {}) {
  if (![pixelsPerUnit, pixelTolerance].every(x => Number.isFinite(x) && x > 0))
    throw new RangeError('Invalid display sampling policy');
  const domain = createCRSProjectionDomain(patch.domain);
  const refined = subdivideTriangleMesh(patch.mesh, {
    transform: patch.transform, tolerance: pixelTolerance / pixelsPerUnit,
    maxDepth: 12, maxVertices: 65536, maxTriangles: 131072
  });
  const clipped = clipTriangleMesh(refined, {
    regions: domainRegions(domain), periodic: domain.periodic,
    maxVertices: 262144, maxTriangles: 131072, maxIntersections: 2000000
  });
  // Keep floating attributes floating across both stages; quantize only at upload.
  const layout = {byteStride: 40, attributes: [
    {type: 'float64', size: 4, byteOffset: 0, interpolation: 'linear'},
    {type: 'float64', size: 1, byteOffset: 32, interpolation: 'flat'}
  ]};
  const records = new Float64Array(patch.mesh.positions.length / 2 * 5);
  for (let i = 0; i < records.length / 5; i++) records.set([
    patch.mesh.positions[i * 2], patch.mesh.positions[i * 2 + 1],
    patch.uv[i * 2], patch.uv[i * 2 + 1], patch.row
  ], i * 5);
  const intermediate = interpolatePackedAttributes(new Uint8Array(records.buffer), refined, layout);
  const attributes = interpolatePackedAttributes(intermediate, clipped, layout);
  return {...clipped, attributes: new Float64Array(attributes.buffer),
    originalTriangleIndices: Uint32Array.from(clipped.sourceTriangleIndices, i => refined.sourceTriangleIndices[i]),
    refinedTriangles: refined.indices.length / 3, tolerance: pixelTolerance / pixelsPerUnit};
}

export function domainRegions(domain) {
  const regions = [];
  for (const polygon of domain.polygons) {
    const flat = [], holes = [];
    for (const [i, ring] of [polygon.outer, ...(polygon.holes || [])].entries()) {
      if (i) holes.push(flat.length / 2);
      for (const p of ring.slice(0, -1)) flat.push(...p);
    }
    const indices = earcut(flat, holes, 2);
    for (let i = 0; i < indices.length; i += 3)
      regions.push(Array.from(indices.slice(i, i + 3), j => [flat[j * 2], flat[j * 2 + 1]]));
  }
  return regions;
}

export function rectangle(west, south, east, north) {
  return [[west, south], [east, south], [east, north], [west, north], [west, south]];
}
export function grid(bounds, uvBounds = bounds, angle = 0) {
  const [w, s, e, n] = bounds, points = rectangle(w, s, e, n).slice(0, -1);
  const c = Math.cos(angle), sin = Math.sin(angle);
  return {mesh: {positions: points.flatMap(([x, y]) => [x * c - y * sin, x * sin + y * c]),
    indices: [0, 1, 2, 0, 2, 3]},
    uv: points.flatMap(([x, y]) => [(x - uvBounds[0]) / (uvBounds[2] - uvBounds[0]),
      (y - uvBounds[1]) / (uvBounds[3] - uvBounds[1])])};
}
