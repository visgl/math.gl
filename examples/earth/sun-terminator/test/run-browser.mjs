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
const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = await mkdtemp(join(tmpdir(), 'sun-terminator-browser-'));
let server;
try {
  const options = {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: join(root, 'index.html'),
        navigation: join(root, 'test/navigation.html'),
        render: join(root, 'test/render.html')
      }
    }
  };
  await build({root, build: options});
  server = await preview({root, build: options, preview: {host: '127.0.0.1', port: 0}});
  const url = 'http://127.0.0.1:' + server.httpServer.address().port;
  for (const script of [
    'browser.mjs',
    'camera-browser.mjs',
    'cut-morph-browser.mjs',
    'state-detail-browser.mjs'
  ]) {
    const {stdout, stderr} = await promisify(execFile)(
      process.execPath,
      [join(root, 'test', script)],
      {
        cwd: root,
        timeout: 240000,
        maxBuffer: 4 * 1024 * 1024,
        env: {
          ...process.env,
          SUN_TERMINATOR_URL: script === 'browser.mjs' ? url : url + '/test/navigation.html'
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
