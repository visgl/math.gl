// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
import {createServer, preview} from 'vite';

/** Exercise identical example URLs against Vite development or production servers. */
export async function serveExample(example) {
  const root = fileURLToPath(new URL(`../../examples/${example}/`, import.meta.url));
  const development = process.env.EXAMPLE_SERVER_MODE === 'development';
  const options = {root, configLoader: 'runner'};
  const server = development
    ? await createServer({...options, server: {host: '127.0.0.1', port: 0}})
    : await preview({...options, preview: {host: '127.0.0.1', port: 0}});
  if (development) await server.listen();
  return {
    url: server.resolvedUrls.local[0],
    close: () => server.close()
  };
}
