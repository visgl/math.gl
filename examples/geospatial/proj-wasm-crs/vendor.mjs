// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {PROJ_VENDOR_IMPORTS} from './vendor-imports.mjs';
import {cp,readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
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
