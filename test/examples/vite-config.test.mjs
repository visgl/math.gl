// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createServer} from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const example = join(root, 'examples/geospatial/geographic-tiles');

test('local Vite config resolves workspace source without replacing dependency versions', async () => {
  const previousDirectory = process.cwd();
  const cacheDir = await mkdtemp(join(tmpdir(), 'math-gl-vite-config-'));
  // start-local loads the project-owned config from the example's working directory.
  process.chdir(example);
  try {
    for (const local of [false, true]) {
      const server = await createServer({
        root: example,
        configFile: local ? join(root, 'examples/vite.config.local.mjs') : join(example, 'vite.config.js'),
        configLoader: 'runner',
        cacheDir,
        server: {middlewareMode: true},
        optimizeDeps: {noDiscovery: true, include: []}
      });
      try {
        const resolve = (name, importer = join(example, 'src/app.jsx')) =>
          server.environments.client.pluginContainer.resolveId(name, importer);
        for (const name of ['@math.gl/core', '@math.gl/geospatial/terrain', '@math.gl/geometry/culling']) {
          const result = await resolve(name);
          assert.ok(result?.id.includes(local ? '/src/' : '/dist/'), `${name}: ${result?.id}`);
        }
        if (local) {
          const asset = await resolve('@math.gl/earth/timezone/timezone-geometry-low.json?url');
          assert.ok(asset?.id.includes('/modules/earth/data/timezone/'));
          const dependency = await resolve('@math.gl/core', join(root, 'node_modules/@deck.gl/core/dist/index.js'));
          assert.ok(dependency?.id.includes('/dist/'), dependency?.id);
          assert.ok(!dependency.id.includes('/modules/core/src/'), dependency.id);
        }
      } finally {
        await server.close();
      }
    }
  } finally {
    process.chdir(previousDirectory);
    await rm(cacheDir, {recursive: true, force: true});
  }
});
