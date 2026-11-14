// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';

const repetitions = Number(process.argv[2] ?? 20);
assert.ok(Number.isSafeInteger(repetitions) && repetitions >= 5);
const directory = mkdtempSync(join(tmpdir(), 'terrain-coverage-benchmark-'));
try {
  const output = join(directory, 'api.mjs');
  await bundleRuntime(fileURLToPath(new URL('../', import.meta.url)), './modules/geospatial/src/terrain/index.ts', output);
  const {HeightField, createTerrainMesh, certifyTerrainMeshCoverage} = await import(pathToFileURL(output));
  const results = [];
  for (const size of [33, 129, 257, 513]) {
    for (const nodata of [false, true]) {
      const heights = Float32Array.from({length: size * size}, (_, i) =>
        nodata && i % 17 === 0 ? NaN : Math.sin(i / size));
      const field = new HeightField({width: size, height: size, heights});
      const mesh = createTerrainMesh(field);
      const tasks = {
        mesh: () => createTerrainMesh(field),
        certify: () => certifyTerrainMeshCoverage(field, mesh)
      };
      const certificate = tasks.certify();
      assert.equal(certificate.status, 'certified');
      for (const [operation, run] of Object.entries(tasks)) {
        for (let i = 0; i < 3; i++) run();
        const times = Array.from({length: repetitions}, () => {
          const start = performance.now();
          run();
          return performance.now() - start;
        }).sort((a, b) => a - b);
        results.push({
          size, nodata, operation,
          p50Ms: times[Math.ceil(times.length * 0.5) - 1],
          p95Ms: times[Math.ceil(times.length * 0.95) - 1],
          triangles: mesh.indices.length / 3,
          trianglesVisited: certificate.trianglesVisited,
          residualEdges: certificate.residualEdges,
          inputMeshBytes: mesh.gridCoordinates.byteLength + mesh.indices.byteLength
        });
      }
    }
  }
  console.log(JSON.stringify({node: process.version, platform: process.platform, arch: process.arch,
    repetitions, processPeakRssKiB: process.resourceUsage().maxRSS, results}, null, 2));
} finally {
  rmSync(directory, {recursive: true, force: true});
}
