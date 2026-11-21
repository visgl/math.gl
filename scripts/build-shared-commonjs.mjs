// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {dirname, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

/** Modules whose constructors are shared across independently bundled entry points. */
const packages = {
  geospatial: [
    'geographic-seams/types.js',
    'maps/map-transition.js',
    'projection/experimental/crs/types.js',
    'projection/experimental/projection-engine.js',
    'projection/experimental/typescript-projection.js'
  ],
  sql: ['expressions/evaluation-error.js']
};

/** Rebundle CommonJS entry points with shared constructors external to the public bundles. */
async function buildPackage(name, files) {
  const root = fileURLToPath(new URL(`../modules/${name}/`, import.meta.url));
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const shared = new Map(files.map(file => {
    const source = resolve(root, 'dist', file);
    return [source, source.replace(/\.js$/, '.shared.cjs')];
  }));
  const publicEntries = Object.values(manifest.exports)
    .filter(entry => entry.require?.endsWith('.cjs'))
    .map(entry => [resolve(root, entry.import), resolve(root, entry.require)]);

  await Promise.all([...shared, ...publicEntries].map(([input, output]) => build({
    absWorkingDir: root,
    entryPoints: [input],
    outfile: output,
    bundle: true,
    format: 'cjs',
    target: 'node16',
    packages: 'external',
    tsconfigRaw: {compilerOptions: {paths: {}}},
    sourcemap: true,
    sourcesContent: false,
    plugins: [{
      name: 'shared-commonjs-constructors',
      setup(builder) {
        builder.onResolve({filter: /^\.\.?\//}, ({path, resolveDir}) => {
          const target = shared.get(resolve(resolveDir, path));
          if (!target) return;
          return {
            path: './' + relative(dirname(output), target).replaceAll('\\', '/'),
            external: true
          };
        });
      }
    }]
  })));
}

await Promise.all(Object.entries(packages).map(([name, files]) => buildPackage(name, files)));
