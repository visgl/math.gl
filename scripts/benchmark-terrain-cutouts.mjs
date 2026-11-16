// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {
  HeightField,
  createTerrainMesh,
  splitTerrainMeshTiles,
  updateTerrainTileCutouts
} from '../modules/geospatial/dist/terrain/index.js';

// Interleave incremental and monolithic cuts on the same deterministic edit prefix.
const results = [];
const polygon = [
  [1.3, 2.7],
  [61.3, 3.1],
  [60.7, 29.3],
  [2.3, 30.1]
];
const quantile = (values, q) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * q) - 1];
const boundary = piece =>
  Array.from({length: piece.cutEdges.length / 2}, (_, i) => {
    const a = piece.cutEdges[i * 2] * 3,
      b = piece.cutEdges[i * 2 + 1] * 3;
    return `${piece.positions.slice(a, a + 3)}/${piece.positions.slice(b, b + 3)}`;
  });
const triangles = piece =>
  Array.from({length: piece.indices.length / 3}, (_, i) =>
    Array.from(piece.indices.subarray(i * 3, i * 3 + 3), id =>
      String(piece.positions.slice(id * 3, id * 3 + 3))
    )
      .sort()
      .join('/')
  );
const area = piece => {
  let sum = 0;
  const p = piece.positions;
  for (let i = 0; i < piece.indices.length; i += 3) {
    const [a, b, c] = Array.from(piece.indices.subarray(i, i + 3), id => id * 3);
    sum += ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])) / 2;
  }
  return sum;
};
for (const name of ['pacific', 'sierra-nodata']) {
  const fixtures = new URL('../modules/geospatial/test/terrain/fixtures/', import.meta.url);
  const dem = JSON.parse(readFileSync(new URL(name + '-streaming.json', fixtures)));
  assert.equal(
    createHash('sha256')
      .update(readFileSync(new URL(name.split('-')[0] + '.tif', fixtures)))
      .digest('hex'),
    dem.sha256
  );
  const sourceOrigin = name === 'pacific' ? [96, 96] : [48, 80];
  const residents = Array.from({length: 32}, (_, i) => {
    const column = (i % 8) * 8,
      row = Math.floor(i / 8) * 8;
    const heights = Float64Array.from({length: 81}, (_, j) => {
      const value =
        dem.heights[
          (sourceOrigin[1] + row + Math.floor(j / 9)) * dem.width +
            sourceOrigin[0] +
            column +
            (j % 9)
        ];
      return typeof value === 'number' ? value : NaN;
    });
    const mesh = createTerrainMesh(
      new HeightField({width: 9, height: 9, origin: [column, row], heights}),
      {origin: [0, 0, 0]}
    );
    return {id: String(i), revision: 0, mesh};
  });
  const inputTriangles = residents.reduce((sum, t) => sum + t.mesh.indices.length / 3, 0);
  assert(inputTriangles > 1000, 'Qualification must contain a substantial valid terrain domain');
  const editable = residents.filter(t => t.id !== '31' && t.mesh.indices.includes(40));
  assert(editable.length > 0);
  let cache = updateTerrainTileCutouts(residents, polygon).cache;
  const incremental = [],
    full = [];
  let rebuilt = 0;
  for (let step = 0; step < 25; step++) {
    const edited = editable[(step * 7) % editable.length];
    edited.revision++;
    // Interior vertex edit cannot invalidate neighboring seam profiles.
    edited.mesh.positions[(4 * 9 + 4) * 3 + 2] += 0.125;
    const active = step % 5 === 0 ? residents.filter(t => t.id !== '31') : residents;
    let update, reference;
    for (const mode of step % 2 ? ['full', 'incremental'] : ['incremental', 'full']) {
      const start = performance.now();
      if (mode === 'incremental') update = updateTerrainTileCutouts(active, polygon, cache);
      else
        reference = splitTerrainMeshTiles(
          active.map(t => t.mesh),
          polygon
        );
      if (step >= 5) (mode === 'incremental' ? incremental : full).push(performance.now() - start);
    }
    for (const side of ['patch', 'remainder']) {
      const pieces = [...update.tiles.values()].map(t => t[side]);
      assert.deepEqual(pieces.flatMap(boundary).sort(), boundary(reference[side]).sort());
      assert.deepEqual(pieces.flatMap(triangles).sort(), triangles(reference[side]).sort());
      assert(Math.abs(pieces.reduce((sum, p) => sum + area(p), 0) - area(reference[side])) < 1e-9);
    }
    if (step >= 5) rebuilt += update.rebuilt.length;
    cache = update.cache;
  }
  results.push({
    dataset: name,
    sourceSha256: dem.sha256,
    sourceOrigin,
    inputTriangles,
    residents: 32,
    measuredUpdates: 20,
    rebuiltTiles: rebuilt,
    fullRebuildParity: true,
    incrementalMedianMs: quantile(incremental, 0.5),
    incrementalP95Ms: quantile(incremental, 0.95),
    fullMedianMs: quantile(full, 0.5),
    fullP95Ms: quantile(full, 0.95)
  });
}
console.log(
  JSON.stringify(
    {node: process.version, platform: process.platform, architecture: process.arch, results},
    null,
    2
  )
);
