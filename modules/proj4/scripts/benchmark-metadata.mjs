// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
/** Fingerprint source inputs without embedding machine-specific checkout paths. */
export function codeFingerprint() {
  const hash = createHash('sha256');
  const root = fileURLToPath(new URL('../../../modules/', import.meta.url));
  function visit(relative) {
    for (const entry of readdirSync(join(root, relative), {withFileTypes: true}).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) hash.update(path + '\0').update(readFileSync(join(root, path)));
    }
  }
  for (const name of ['core', 'crs', 'proj4', 'types']) visit(name + '/src');
  return hash.digest('hex');
}

/** Fingerprint the shared workload separately from the engine under test. */
export function benchmarkFingerprint() {
  const root = fileURLToPath(new URL('../test/', import.meta.url));
  const hash = createHash('sha256');
  for (const name of [
    ...readdirSync(root).filter(name => /^(benchmark|live-bench).*\.ts$/.test(name)),
    'fixtures/datum-grids.ts'
  ].sort())
    hash.update(name + '\0').update(readFileSync(join(root, name)));
  return hash.digest('hex');
}
