// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {PROJ_VENDOR_IMPORTS} from '../src/vendor-imports.mjs';
import {cp, readFile, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {dirname, join, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
export async function copyProjVendor(output) {
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
  return PROJ_VENDOR_IMPORTS;
}

/** Stage immutable upstream files for Vite's native public-directory handling. */
export async function prepareProjAssets() {
  await mkdir(new URL('../node_modules', import.meta.url), {recursive: true});
  // Each Vite instance owns its files, so starting dev and build together cannot truncate a database.
  const publicDir = await mkdtemp(
    fileURLToPath(new URL('../node_modules/.vite-public-', import.meta.url))
  );
  let cleanupPromise;
  const cleanup = () => (cleanupPromise ??= rm(publicDir, {recursive: true, force: true}));
  try {
    await copyProjVendor(pathToFileURL(publicDir + sep));
  } catch (error) {
    await cleanup();
    throw error;
  }
  return {
    publicDir,
    plugins: [
      {
        name: 'proj-runtime-assets',
        closeBundle: cleanup,
        closeServer: cleanup,
        closePreviewServer: cleanup
      }
    ]
  };
}
