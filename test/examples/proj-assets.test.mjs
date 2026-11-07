// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createServer} from 'vite';

for (const name of ['proj-wasm-crs', 'projection-domains']) {
  test(`${name} stages runtime assets independently for concurrent Vite servers`, async () => {
    const root = fileURLToPath(new URL(`../../examples/geospatial/${name}/`, import.meta.url));
    const options = {
      root,
      configLoader: 'runner',
      server: {middlewareMode: true, hmr: false},
      optimizeDeps: {noDiscovery: true, include: []}
    };
    const servers = [];
    try {
      // Start together: a shared writable tree used to race while copying proj.db and notices.
      const results = await Promise.allSettled([createServer(options), createServer(options)]);
      for (const result of results) if (result.status === 'fulfilled') servers.push(result.value);
      for (const result of results) if (result.status === 'rejected') throw result.reason;
      await servers[0].close();
      const database = await readFile(join(servers[1].config.publicDir, 'vendor/proj-wasm/dist/proj.db'));
      assert.equal(database.subarray(0, 16).toString(), 'SQLite format 3\0');
      const wasm = await readFile(join(servers[1].config.publicDir, 'vendor/proj-wasm/dist/proj-emscripten.wasm'));
      assert.deepEqual([...wasm.subarray(0, 4)], [0, 97, 115, 109]);
    } finally {
      await Promise.all(servers.map(server => server.close()));
    }
    for (const server of servers) await assert.rejects(access(server.config.publicDir), {code: 'ENOENT'});
  });
}
