// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const alias = createRequire(import.meta.url)('./math-gl-source-aliases.cjs')();

/** Measures minified bytes contributed by each workspace math.gl module. */
async function measure(mode) {
  const {metafile} = await build({
    absWorkingDir: root,
    entryPoints: ['examples/sql/geoarrow-dataframe/main.mjs'],
    bundle: true,
    minify: true,
    write: false,
    metafile: true,
    target: 'es2022',
    format: 'esm',
    plugins: [
      {
        name: 'workspace-math-gl',
        setup(build) {
          if (mode !== 'both') {
            build.onResolve({filter: /^\.\/processors\.mjs$/}, ({resolveDir}) => ({
              path: resolve(resolveDir, `processors-${mode.toLowerCase()}.mjs`)
            }));
          }
          build.onResolve({filter: /^@math\.gl\//}, ({path}) =>
            Object.hasOwn(alias, path) ? {path: alias[path]} : undefined
          );
        }
      }
    ]
  });
  const [output] = Object.values(metafile.outputs);
  const inputs = new Map(
    Object.entries(output.inputs)
      .filter(([path, input]) => path.startsWith('modules/') && input.bytesInOutput > 0)
      .map(([path, input]) => [path, input.bytesInOutput])
  );
  return {
    inputs,
    mathBytes: [...inputs.values()].reduce((sum, bytes) => sum + bytes, 0),
    bundleBytes: output.bytes
  };
}

const [sql, frame, combined] = await Promise.all(['SQL', 'DataFrame', 'both'].map(measure));
const shared = [...frame.inputs].reduce(
  (sum, [path, bytes]) => sum + Math.min(bytes, sql.inputs.get(path) ?? 0),
  0
);
const union = sql.mathBytes + frame.mathBytes - shared;
for (const [name, {mathBytes, bundleBytes}] of Object.entries({sql, frame, combined})) {
  process.stdout.write(
    `${name}: ${mathBytes} workspace math.gl bytes, ${bundleBytes} total bytes\n`
  );
}
process.stdout.write(
  `Shared workspace math.gl bytes: ${shared} / ${union} (${((100 * shared) / union).toFixed(1)}%, target ≥90%)\n`
);
process.stdout.write(
  `Frame bytes shared with SQL: ${((100 * shared) / frame.mathBytes).toFixed(1)}%\n`
);
process.stdout.write(
  `Incremental workspace math.gl bytes over SQL-only: ${combined.mathBytes - sql.mathBytes}\n`
);
