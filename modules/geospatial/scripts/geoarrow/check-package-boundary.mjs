// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';

const packageRoot = new URL('../../', import.meta.url);
const forbiddenPackage = ['apache', 'arrow'].join('-');
const manifest = JSON.parse(await readFile(new URL('package.json', packageRoot), 'utf8'));
if (manifest.dependencies?.[forbiddenPackage] || manifest.optionalDependencies?.[forbiddenPackage]) {
  throw new Error('Arrow must remain an optional peer, never an installed runtime dependency.');
}
if (manifest.peerDependencies?.[forbiddenPackage] !== '>=17.0.0' || !manifest.peerDependenciesMeta?.[forbiddenPackage]?.optional) {
  throw new Error('The Arrow-aware GeoArrow subpath requires an optional Arrow >=17 peer.');
}

for (const directory of ['src/geoarrow-utils', 'dist/geoarrow-utils']) {
  const root = new URL(`${directory}/`, packageRoot);
  let files = [];
  try {
    files = await collectFiles(root.pathname);
  } catch (error) {
    if (error?.code === 'ENOENT' && directory === 'dist/geoarrow-utils') continue;
    throw error;
  }
  for (const file of files) {
    if (!/\.(?:[cm]?js|ts)$/.test(file)) continue;
    const source = await readFile(file, 'utf8');
    if (source.toLowerCase().includes(forbiddenPackage)) {
      throw new Error(`${file} references forbidden package ${forbiddenPackage}`);
    }
  }
}

async function collectFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else files.push(path);
  }
  return files;
}
