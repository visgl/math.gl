// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {extname, resolve, sep} from 'node:path';

export async function serve(port = 0) {
  const root = fileURLToPath(new URL('./dist/', import.meta.url));
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
      if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error('Invalid path');
      const body = await readFile(file);
      const mime = {
        '.html': 'text/html',
        '.mjs': 'text/javascript',
        '.js': 'text/javascript',
        '.wasm': 'application/wasm'
      };
      response.writeHead(200, {
        'Content-Type': mime[extname(file)] ?? 'application/octet-stream'
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', done);
  });
  return {server, url: `http://127.0.0.1:${server.address().port}`};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log((await serve(8080)).url);
}
