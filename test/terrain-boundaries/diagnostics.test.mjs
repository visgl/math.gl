// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexMesh, measureProbes, measureBoundaries, measureCoverage, gridDomain} from '../../examples/geospatial/terrain-sampling/src/qualification/diagnostics.mjs';
const mesh = (positions, indices = [0, 1, 2]) => indexMesh({positions, indices});
const square = mesh([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], [0, 1, 2, 0, 2, 3]);
test('coincident boundary and vertex touches do not count as interior crossings', () => {
  const r = measureBoundaries(square, [[[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [1, 1, 0]]]);
  assert.equal(r.maxHeightError, 0);
  assert.equal(r.uncoveredLength, 0);
  assert.deepEqual(r.crossingTriangles, []);
  assert.deepEqual(measureBoundaries(square, [[[-1, -1, 0], [0, 0, 0]]]).crossingTriangles, []);
});
test('nodal tolerance does not imply boundary fidelity', () => {
  const probes = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]];
  assert.equal(measureProbes(square, probes).maxError, 0);
  const r = measureBoundaries(square, [[[0, 0.5, 20], [1, 0.5, 20]]]);
  assert.equal(r.maxHeightError, 20);
  assert.equal(r.crossingTriangles.length, 2);
});
test('coverage union reports uncovered intervals, never an invented zero error', () => {
  const r = measureBoundaries(square, [[[-1, 0.5, 0], [2, 0.5, 0]]]);
  assert.equal(r.uncoveredLength, 2);
  assert.equal(r.uncoveredIntervals.length, 2);
  const empty = measureProbes(square, [[2, 2, 0]]);
  assert.equal(empty.maxError, null);
  assert.equal(empty.uncovered, 1);
});
test('overlapping faces contribute worst error and are diagnosed', () => {
  const r = mesh([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 5, 1, 0, 5, 0, 1, 5], [0, 1, 2, 3, 4, 5]);
  assert.equal(measureProbes(r, [[0.2, 0.2, 0]]).maxError, 5);
  assert.equal(measureProbes(r, [[0.2, 0.2, 0]]).overlappingProbes, 1);
  assert.equal(measureBoundaries(r, [[[0.1, 0.1, 0], [0.4, 0.1, 0]]]).maxHeightError, 5);
});
test('holes and disconnected domains are measured separately', () => {
  const r = measureCoverage(square, {width: 2, height: 2, contains: (x, y) => x < 0.25 || x > 0.75});
  assert.equal(r.expectedArea, 0.5);
  assert.equal(r.excessArea, 0.5);
  const absent = measureCoverage(indexMesh({positions: [], indices: []}), {width: 2, height: 2, contains: () => true});
  assert.equal(absent.missingArea, 1);
});
test('four-corner and individual triangle domains differ at a missing corner', () => {
  const f = {width: 2, height: 2, heights: [0, 0, null, 0]};
  assert.equal(gridDomain(f, 'four-corners')(0.75, 0.25), false);
  assert.equal(gridDomain(f, 'triangles')(0.75, 0.25), true);
  assert.equal(gridDomain(f, 'triangles')(0.25, 0.75), false);
});
test('invalid meshes and zero-length boundaries fail explicitly', () => {
  assert.throws(() => mesh([0, 0, 0, 1, 0, 0, 2, 0, 0]));
  assert.throws(() => mesh([0, 0, NaN]));
  assert.throws(() => measureBoundaries(square, [[[0, 0, 0], [0, 0, 1]]]));
});

test('disconnected mesh intervals preserve the hole between components', () => {
  const index = mesh([0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 3, 1, 0], [0, 1, 2, 3, 4, 5]);
  const r = measureBoundaries(index, [[[0, 0.25, 0], [3, 0.25, 0]]]);
  assert.equal(r.uncoveredIntervals.length, 1);
  assert.ok(Math.abs(r.uncoveredLength - 1.5) < 1e-12);
});

import {bilinear, triangleHeight, containsOutline} from '../../examples/geospatial/terrain-sampling/src/qualification/qualify.mjs';
test('bilinear and triangulated references remain distinct', () => {
  const f = {width: 2, height: 2, heights: [0, 0, 0, 4]};
  assert.equal(bilinear(f, 0.5, 0.5), 1);
  assert.equal(triangleHeight(f, 0.5, 0.5), 2);
  f.heights[2] = null;
  assert.equal(bilinear(f, 0.75, 0.25), undefined);
  assert.equal(triangleHeight(f, 0.75, 0.25), 1);
});
test('independent outline classifies holes and disconnected islands', () => {
  const ring = (x, y, size) => [[x,y],[x+size,y],[x+size,y+size],[x,y+size]].map((p,i,a) => [p,a[(i+1)%4]]);
  const edges = [...ring(0,0,4), ...ring(1,1,1), ...ring(5,0,1)];
  assert.equal(containsOutline(edges, 0.5, 0.5), true);
  assert.equal(containsOutline(edges, 1.5, 1.5), false);
  assert.equal(containsOutline(edges, 4.5, 0.5), false);
  assert.equal(containsOutline(edges, 5.5, 0.5), true);
});

test('edge probes must participate in tolerance qualification', () => {
  const r = measureProbes(square, [[0.5, 0, 100], [0.8, 0.2, 0]]);
  assert.equal(r.maxError, 100);
  assert.equal(r.maxEdgeOnlyError, 100);
  assert.equal(r.maxInteriorError, 0);
  assert.equal(r.worstProbe.edgeOnly, true);
});

test('closed outline includes sloping boundary points consistently with mesh probes', () => {
  const edges = [[[0,0],[3,1]], [[3,1],[0,2]], [[0,2],[0,0]]];
  assert.equal(containsOutline(edges, 1.5, 0.5), true);
});
