// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {cp, mkdir, readFile, writeFile} from 'node:fs/promises';

const output = new URL('./dist/', import.meta.url);
await mkdir(output, {recursive: true});
await build({
  entryPoints: [fileURLToPath(new URL('./browser.mjs', import.meta.url))],
  outfile: fileURLToPath(new URL('browser.mjs', output)),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  external: ['proj-wasm', 'node:*']
});

await build({entryPoints: [fileURLToPath(new URL('./consume-worker.mjs', import.meta.url))],
  outfile: fileURLToPath(new URL('consume-worker.mjs', output)), bundle: true, format: 'esm',
  platform: 'browser', external: ['node:*']});

await build({entryPoints: [fileURLToPath(new URL('./raster-worker.mjs', import.meta.url))],
  outfile: fileURLToPath(new URL('raster-worker.mjs', output)), bundle: true, format: 'esm',
  platform: 'browser', external: ['node:*']});

// Keep upstream module/worker URLs and adjacent WASM/database assets intact.
// Copy installed, lockfile-pinned packages including their notices; no CDN is needed.
// Resolve package roots through this repository's node_modules installation.
// This also works for import-only exports and avoids copying nested package roots.
async function packageRoot(name, start) {
  for (let directory = start; ; directory = dirname(directory)) {
    const candidate = join(directory, 'node_modules', name);
    try {
      await readFile(join(candidate, 'package.json'));
      return candidate;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (dirname(directory) === directory) throw new Error(`No installed package for ${name}`);
  }
}
const projRoot = await packageRoot('proj-wasm', dirname(fileURLToPath(import.meta.url)));
const ffiRoot = await packageRoot('ffi-wasm', projRoot);
const workerRoot = await packageRoot('worker-router', ffiRoot);
const packages = {
  'proj-wasm': projRoot,
  'ffi-wasm': ffiRoot,
  'resource-tracker': await packageRoot('resource-tracker', projRoot),
  'squint-cljs': await packageRoot('squint-cljs', projRoot),
  'worker-router': workerRoot,
  comlink: await packageRoot('comlink', workerRoot)
};
for (const [name, directory] of Object.entries(packages)) {
  await cp(directory, new URL(`vendor/${name}/`, output), {recursive: true});
}
const imports = {
  'proj-wasm': './vendor/proj-wasm/dist/proj.mjs',
  'ffi-wasm': './vendor/ffi-wasm/dist/ffi-wasm.mjs',
  'resource-tracker': './vendor/resource-tracker/resource.mjs',
  'squint-cljs/core.js': './vendor/squint-cljs/core.js',
  'squint-cljs/src/squint/string.js': './vendor/squint-cljs/src/squint/string.js',
  'worker-router': './vendor/worker-router/dist/index.mjs',
  'worker-router/worker-bootstrap': './vendor/worker-router/dist/worker-bootstrap.mjs',
  comlink: './vendor/comlink/dist/esm/comlink.mjs'
};
await writeFile(
  new URL('index.html', output),
  `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>math.gl + proj-wasm CRS resolution</title>
<h1>Resolve with proj-wasm, transform with math.gl</h1>
<p>EPSG:8857 (Equal Earth), with an asynchronous packed-batch PROJ comparison and transferred worker buffers.</p>
<pre id="result">Preparing local WASM and CRS database…</pre>
<script type="importmap">${JSON.stringify({imports})}</script>
<script type="module" src="./browser.mjs"></script></html>`
);
