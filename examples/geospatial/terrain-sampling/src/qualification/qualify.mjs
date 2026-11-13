// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  indexMesh,
  measureProbes,
  measureBoundaries,
  measureCoverage,
  gridDomain
} from './diagnostics.mjs';

export function cliff(x, y) {
  const d = -(x - 128) * 0.5 + (y - 128) * Math.cos(Math.PI / 6);
  return (
    20 * Math.sin(x / 37) * Math.cos(y / 41) + 0.05 * x + 40 * Math.min(1, Math.max(0, (d + 2) / 4))
  );
}

export function bilinear(f, x, y) {
  const i = Math.min(Math.floor(x), f.width - 2),
    j = Math.min(Math.floor(y), f.height - 2);
  const ids = [
    j * f.width + i,
    j * f.width + i + 1,
    (j + 1) * f.width + i,
    (j + 1) * f.width + i + 1
  ];
  if (!ids.every(k => Number.isFinite(f.heights[k]))) return undefined;
  const u = x - i,
    v = y - j;
  return (
    f.heights[ids[0]] * (1 - u) * (1 - v) +
    f.heights[ids[1]] * u * (1 - v) +
    f.heights[ids[2]] * (1 - u) * v +
    f.heights[ids[3]] * u * v
  );
}

function* nodes(f, mask) {
  for (let i = 0; i < f.heights.length; i++) {
    if (Number.isFinite(f.heights[i]) && (!mask || mask[i]))
      yield [i % f.width, Math.floor(i / f.width), f.heights[i]];
  }
}
function* dense(f, contains, triangulated = false) {
  for (let y = 0; y <= f.height - 1; y += 0.25)
    for (let x = 0; x <= f.width - 1; x += 0.25) {
      if (!contains(x, y)) continue;
      const z = triangulated
        ? triangleHeight(f, x, y)
        : f.name === 'step'
          ? cliff(x, y)
          : bilinear(f, x, y);
      if (Number.isFinite(z)) yield [x, y, z];
    }
}

export function buildCandidate(api, fixture, algorithm) {
  if (algorithm === 'constrained') return {positions: fixture.positions, indices: fixture.indices};
  const {width, height, heights} = fixture;
  // Unit sample-lattice XY shared with cdtr. Source metric metadata remains in the manifest.
  const field = new api.HeightField({
    width,
    height,
    heights: Float64Array.from(heights, h => h ?? NaN)
  });
  if (algorithm === 'breakline') {
    const mesh = api.createBreaklineTerrainMesh(field, {
      maxError: fixture.tolerance,
      breaklines: fixture.segments,
      breaklinesOverrideSamples: true
    });
    return {positions: mesh.positions, indices: mesh.indices};
  }
  const create = {
    'valid-domain': api.createValidDomainTerrainMesh,
    regular: api.createTerrainMesh,
    martini: api.createMartiniTerrainMesh,
    delatin: api.createDelatinTerrainMesh
  }[algorithm];
  if (!create) throw new Error('Unknown algorithm');
  const mesh = create(field, {maxError: fixture.tolerance, maxSampleTests: 100_000_000});
  const positions = Float64Array.from({length: mesh.positions.length}, (_, i) =>
    i % 3 === 2
      ? mesh.positions[i] + mesh.origin[2]
      : mesh.gridCoordinates[Math.floor(i / 3) * 2 + (i % 3)]
  );
  return {positions, indices: mesh.indices, tessellator: mesh.tessellator || 'regular'};
}

export function qualify(fixture, mesh, {denseSurface = true} = {}) {
  const index = indexMesh(mesh);
  const coastContains = indexOutline(fixture.domainSegments);
  const domain =
    fixture.name === 'pacific'
      ? coastContains
      : fixture.name === 'sierra'
        ? gridDomain(fixture, 'four-corners')
        : () => true;
  const boundary = measureBoundaries(index, fixture.segments);
  const coverage = {};
  const domains =
    fixture.name === 'sierra'
      ? ['four-corners', 'triangles']
      : [fixture.name === 'pacific' ? 'derived-coast' : 'square'];
  for (const name of domains)
    coverage[name] = measureCoverage(index, {
      width: fixture.width,
      height: fixture.height,
      contains: fixture.name === 'sierra' ? gridDomain(fixture, name) : domain
    });
  const nodal = measureProbes(index, nodes(fixture, fixture.mask));
  return {
    nodalToleranceSatisfied:
      nodal.uncovered === 0 &&
      nodal.maxError !== null &&
      nodal.maxError <= fixture.tolerance + 1e-7,
    triangles: mesh.indices.length / 3,
    tessellator: mesh.tessellator || 'precomputed-cdtr',
    nodal,
    allValidNodes: measureProbes(index, nodes(fixture)),
    surface: denseSurface
      ? {
          reference: fixture.name === 'step' ? 'analytical cliff' : 'bilinear (four valid corners)',
          latticeSubdivisions: 4,
          ...measureProbes(index, dense(fixture, domain))
        }
      : null,
    triangulatedSurface: denseSurface
      ? {
          reference: 'regular 00-11 triangles',
          latticeSubdivisions: 4,
          ...measureProbes(index, dense(fixture, domain, true))
        }
      : null,
    boundary,
    coverage
  };
}

/** Even-odd rule on independently supplied domain segments; handles holes and islands. */
export function containsOutline(segments, x, y) {
  let inside = false;
  for (const [a, b] of segments) {
    const det = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (
      Math.abs(det) <= 1e-10 &&
      x >= Math.min(a[0], b[0]) &&
      x <= Math.max(a[0], b[0]) &&
      y >= Math.min(a[1], b[1]) &&
      y <= Math.max(a[1], b[1])
    )
      return true;
    if (a[1] > y !== b[1] > y && x < a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]))
      inside = !inside;
  }
  return inside;
}

export function triangleHeight(f, x, y) {
  const i = Math.min(Math.floor(x), f.width - 2),
    j = Math.min(Math.floor(y), f.height - 2);
  const u = x - i,
    v = y - j,
    a = j * f.width + i,
    d = a + f.width + 1;
  const ids = v <= u ? [a, a + 1, d] : [a, d, a + f.width];
  if (!ids.every(k => Number.isFinite(f.heights[k]))) return undefined;
  const w = v <= u ? [1 - u, u - v, v] : [1 - v, u, v - u];
  return ids.reduce((z, id, k) => z + f.heights[id] * w[k], 0);
}

export function indexOutline(segments) {
  const rows = new Map();
  for (const segment of segments) {
    const [a, b] = segment;
    for (let y = Math.floor(Math.min(a[1], b[1])); y <= Math.floor(Math.max(a[1], b[1])); y++) {
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push(segment);
    }
  }
  return (x, y) => containsOutline(rows.get(Math.floor(y)) || [], x, y);
}
