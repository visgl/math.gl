// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PROJECTIONS, getProjectionMesh} from '../projections.js';

test('every cartographic preset produces a finite textured surface without seam-spanning triangles', () => {
  assert.equal(new Set(PROJECTIONS.map(p => p.id)).size, 41);
  for (const preset of PROJECTIONS.slice(2)) {
    const mesh = getProjectionMesh(preset.id);
    assert.ok(mesh.vertexCount > 1000, preset.id);
    assert.ok(mesh.bounds.every(Number.isFinite), preset.id);
    assert.ok(mesh.positions.every(Number.isFinite), preset.id);
    assert.ok(
      mesh.texCoords.every(
        (v, i) => v >= 0 && v <= (['albers-usa', 'h3'].includes(preset.id) && i % 2 === 0 ? 2 : 1)
      ),
      preset.id
    );
    for (let i = 0; i < mesh.indices.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const a = mesh.indices[i + j] * 3;
        const b = mesh.indices[i + ((j + 1) % 3)] * 3;
        assert.ok(
          Math.hypot(
            mesh.positions[a] - mesh.positions[b],
            mesh.positions[a + 1] - mesh.positions[b + 1]
          ) <= 20,
          preset.id
        );
      }
    }
  }
});
