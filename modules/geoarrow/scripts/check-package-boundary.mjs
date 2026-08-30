// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';

const packageRoot = new URL('..', import.meta.url);
const forbiddenPackage = ['apache', 'arrow'].join('-');
const manifest = JSON.parse(await readFile(new URL('package.json', packageRoot), 'utf8'));
const dependencySections = ['dependencies', 'peerDependencies', 'optionalDependencies'];

for (const section of dependencySections) {
  if (manifest[section]?.[forbiddenPackage]) {
    throw new Error(`${section} must not reference ${forbiddenPackage}`);
  }
}

for (const directory of ['src', 'dist']) {
  const root = new URL(`${directory}/`, packageRoot);
  let files = [];
  try {
    files = await collectFiles(root.pathname);
  } catch (error) {
    if (error?.code === 'ENOENT' && directory === 'dist') continue;
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
