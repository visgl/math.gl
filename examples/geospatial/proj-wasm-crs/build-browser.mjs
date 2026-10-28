// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {mkdir, writeFile} from 'node:fs/promises';
import {copyProjVendor} from './vendor.mjs';

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
const imports = await copyProjVendor(output);
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
