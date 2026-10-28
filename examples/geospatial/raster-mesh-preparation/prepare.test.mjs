// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtures} from './fixtures.mjs';
import {preparePatch} from './prepare.mjs';
const cases = fixtures();
for (const fixture of cases) test(fixture.label, () => {
  let triangles = 0, totalArea = 0;
  const copies = new Set();
  for (const patch of fixture.patches) {
    const result = preparePatch(patch, fixture);
    assert.ok(result.indices.length > 0);
    assert.ok(result.positions.every(Number.isFinite));
    triangles += result.indices.length / 3;
    result.periodicCopies.forEach(v => copies.add(v));
    for (let i = 0; i < result.positions.length / 2; i++) {
      const a = result.attributes.slice(i * 5, i * 5 + 5);
      assert.equal(a[4], patch.row);
      // Recover affine source-grid barycentrics independently of both provenance stages.
      const p = patch.mesh.positions;
      const dx = a[0] - p[0], dy = a[1] - p[1];
      const bx = p[2] - p[0], by = p[3] - p[1], cx = p[6] - p[0], cy = p[7] - p[1];
      const det = bx * cy - by * cx;
      const u = (dx * cy - dy * cx) / det, v = (bx * dy - by * dx) / det;
      for (let axis = 0; axis < 2; axis++) {
        const expectedUV = patch.uv[axis] + u * (patch.uv[2 + axis] - patch.uv[axis]) + v * (patch.uv[6 + axis] - patch.uv[axis]);
        assert.ok(Math.abs(a[2 + axis] - expectedUV) < 1e-10, 'UV provenance changed');
      }
      assert.ok(a[2] >= -1e-10 && a[2] <= 1 + 1e-10 && a[3] >= -1e-10 && a[3] <= 1 + 1e-10);
    }
    for (let i = 0; i < result.indices.length; i += 3) {
      const ids = Array.from(result.indices.slice(i, i + 3));
      const source = [0, 0], target = [0, 0];
      for (const id of ids) for (let axis = 0; axis < 2; axis++) {
        source[axis] += result.attributes[id * 5 + axis] / 3;
        target[axis] += result.positions[id * 2 + axis] / 3;
      }
      const expected = patch.transform(source);
      if (patch.domain.periodic) expected[0] += result.periodicCopies[i / 3] * 360;
      assert.ok(Math.hypot(expected[0] - target[0], expected[1] - target[1]) <= result.tolerance * 1.5,
        `${fixture.id}: sampled target error exceeded tolerance`);
      assert.ok(result.originalTriangleIndices[i / 3] < 2);
      const [a, b, c] = ids.map(id => result.positions.slice(id * 2, id * 2 + 2));
      totalArea += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
      if (fixture.id === 'hole') assert.ok(Math.abs(target[0]) >= 0.5 - 1e-10 || Math.abs(target[1]) >= 0.5 - 1e-10);
    }
  }
  assert.ok(triangles > 0);
  if (fixture.id === 'world') assert.ok(Math.abs(totalArea - 360 * 180) < 1e-6);
  if (fixture.id === 'hole') assert.ok(Math.abs(totalArea - 15) < 1e-10);
  if (fixture.id === 'utm60') assert.deepEqual([...copies].sort(), [-1, 0]);
});
test('refinement and resource failures never return partial meshes', () => {
  const patch = cases[0].patches[0];
  assert.throws(() => preparePatch(patch, {pixelsPerUnit: 0}));
  assert.throws(() => preparePatch({...patch, transform: () => null}));
});
