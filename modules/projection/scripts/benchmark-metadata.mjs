// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
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
  for (const name of ['core', 'crs', 'projection', 'types']) visit(name + '/src');
  return hash.digest('hex');
}

/** Fingerprint the shared workload separately from the engine under test. */
export function benchmarkFingerprint() {
  const root = fileURLToPath(new URL('../test/', import.meta.url));
  const hash = createHash('sha256');
  for (const name of [
    ...readdirSync(root).filter(name =>
      /^(benchmark|live-bench|pipeline-benchmark|pipeline-workload|kinematic-workload).*\.ts$/.test(
        name
      )
    ),
    'fixtures/datum-grids.ts',
    'fixtures/operation-pipeline-cases.json',
    'fixtures/operation-pipeline-reference.json',
    'fixtures/kinematic-pipeline-cases.json',
    'fixtures/kinematic-pipeline-reference.json',
    'fixtures/vertical-grid-reference.json'
  ].sort())
    hash.update(name + '\0').update(readFileSync(join(root, name)));
  return hash.digest('hex');
}

/** Actual installed comparator identity; the pin alone does not identify measured bytes. */
export function benchmarkDependencies() {
  const require = createRequire(import.meta.url);
  const metadata = JSON.parse(readFileSync(require.resolve('proj4/package.json'), 'utf8'));
  const projection = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  if (metadata.version !== projection.devDependencies.proj4)
    throw new Error('Measured proj4 dependency differs from the reviewed exact pin');
  return {
    projectionVersion: projection.version,
    proj4: {
      version: metadata.version,
      entrySHA256: createHash('sha256')
        .update(readFileSync(require.resolve('proj4')))
        .digest('hex')
    }
  };
}
