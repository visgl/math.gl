// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {indexMesh, measureBoundaries, measureProbes, measureCoverage, gridDomain} from '../../examples/geospatial/terrain-sampling/src/qualification/diagnostics.mjs';
import {indexOutline} from '../../examples/geospatial/terrain-sampling/src/qualification/qualify.mjs';
const folder = new URL('../../examples/geospatial/terrain-sampling/src/qualification/artifacts/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', folder)));
test('all ten planned references are pinned', () => {
  assert.deepEqual(manifest.cases.map(c => `${c.name}-${c.tolerance}`).sort(), ['step-0.25','step-0.5','step-1','step-2','pacific-10','pacific-20','pacific-40','sierra-10','sierra-20','sierra-40'].sort());
});
for (const c of manifest.cases) test(`pinned ${c.name} ${c.tolerance}: topology, boundary, nodal error and domain`, () => {
  const bytes = readFileSync(new URL(c.file, folder));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), c.sha256);
  const f = JSON.parse(gunzipSync(bytes));
  const index = indexMesh(f);
  const edges = new Map();
  let area = 0;
  for (const t of index.triangles) {
    area += Math.abs(t.det) / 2;
    for (let k = 0; k < 3; k++) {
      const a = f.indices[t.id * 3 + k], b = f.indices[t.id * 3 + (k + 1) % 3];
      const key = `${Math.min(a, b)},${Math.max(a, b)}`;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  assert.ok([...edges.values()].every(n => n <= 2), 'no nonmanifold edges');
  const boundary = measureBoundaries(index, f.segments);
  if (f.name !== 'sierra') assert.ok(boundary.maxHeightError < 1e-7, 'supplied boundary heights preserved');
  assert.ok(boundary.uncoveredLength < 1e-7, 'supplied boundaries covered');
  assert.equal(boundary.crossingTriangles.length, 0, 'constraints do not cross face interiors');
  const points = f.heights.flatMap((z, i) => f.mask[i] && Number.isFinite(z) ? [[i % f.width, Math.floor(i / f.width), z]] : []);
  const nodal = measureProbes(index, points);
  assert.equal(nodal.uncovered, 0);
  if (f.name === 'sierra') {
    // Preserve the independently discovered counterexample; do not certify this reference.
    assert.ok(nodal.maxEdgeOnlyError > 700, 'reference exposes large edge-sample errors');
    assert.ok(nodal.maxInteriorError <= c.tolerance + 1e-7, 'interior-only probes hide the discrepancy');
    assert.equal(nodal.worstProbe.edgeOnly, true);
  } else assert.ok(nodal.maxError <= c.tolerance + 1e-7, `independent nodal error ${nodal.maxError}`);
  assert.equal(nodal.overlappingProbes, 0);
  if (f.name === 'sierra') {
    const contains = gridDomain(f, 'four-corners');
    let expected = 0;
    for (let y = 0; y < f.height - 1; y++) for (let x = 0; x < f.width - 1; x++) if (contains(x + 0.5, y + 0.5)) expected++;
    assert.ok(Math.abs(area - expected) < 1e-7, 'triangle area equals independently derived four-corner domain');
  }
  const coverage = measureCoverage(index, {width: f.width, height: f.height, subdivisions: 2,
    contains: f.name === 'sierra' ? gridDomain(f, 'four-corners') : f.name === 'pacific' ? indexOutline(f.domainSegments) : () => true});
  assert.equal(coverage.missingArea, 0, 'sampled domain coverage');
  assert.equal(coverage.excessArea, 0, 'sampled domain exclusion');
  assert.equal(coverage.overlapArea, 0, 'no sampled overlapping interiors');
});
