// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {build, preview} from 'vite';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const root = fileURLToPath(new URL('../../../../examples/earth/sun-terminator', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const fixtureRoot = fileURLToPath(new URL('.', import.meta.url));
const configFile = join(root, 'vite.config.js');
const outDir = await mkdtemp(join(tmpdir(), 'sun-terminator-browser-'));
let server;
try {
  const options = {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: join(root, 'index.html'),
        navigation: join(fixtureRoot, 'navigation.html'),
        render: join(fixtureRoot, 'render.html')
      }
    }
  };
  // A common root keeps the app and external test fixtures inside Vite's output tree.
  await build({root: repositoryRoot, configFile, build: options});
  server = await preview({root: repositoryRoot, configFile, build: options, preview: {host: '127.0.0.1', port: 0}});
  const url = 'http://127.0.0.1:' + server.httpServer.address().port;
  for (const script of [
    'browser.mjs',
    'camera-browser.mjs',
    'projections-browser.mjs',
    'cut-morph-browser.mjs',
    'state-detail-browser.mjs'
  ]) {
    const {stdout, stderr} = await promisify(execFile)(
      process.execPath,
      [join(fixtureRoot, script)],
      {
        cwd: root,
        timeout: 240000,
        maxBuffer: 4 * 1024 * 1024,
        env: {
          ...process.env,
          SUN_TERMINATOR_URL: script === 'browser.mjs'
            ? url + '/examples/earth/sun-terminator/'
            : url + '/test/examples/earth/sun-terminator/navigation.html',
          SUN_TERMINATOR_TEST_URL: url + '/test/examples/earth/sun-terminator'
        }
      }
    );
    process.stdout.write(stdout);
    process.stderr.write(stderr);
  }
} finally {
  if (server)
    await new Promise((resolve) => {
      server.httpServer.close(resolve);
      server.httpServer.closeAllConnections?.();
    });
  await rm(outDir, {recursive: true, force: true});
}
