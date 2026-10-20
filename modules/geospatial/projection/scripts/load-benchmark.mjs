// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {build} from 'esbuild';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

/** Bundle the shared TypeScript harness against built public package entry points. */
export async function loadBenchmark() {
  const directory = mkdtempSync(join(tmpdir(), 'math-gl-benchmark-'));
  try {
    const outfile = join(directory, 'workload.mjs');
    await build({
      entryPoints: [fileURLToPath(new URL('../test/benchmark-entry.ts', import.meta.url))],
      outfile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'es2020',
      tsconfigRaw: {}
    });
    return await import(pathToFileURL(outfile).href);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
}
