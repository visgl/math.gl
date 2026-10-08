// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'math-gl-tile-matrix-package-'));
try {
  const consumerScope = join(temporaryDirectory, 'node_modules/@math.gl');
  await mkdir(consumerScope, {recursive: true});
  // Install only this package: the tile-matrix entry must not load core, culling or types.
  await symlink(join(repositoryRoot, 'modules/geospatial'), join(consumerScope, 'geospatial'));
  await writeFile(join(temporaryDirectory, 'package.json'), '{"type":"module"}');
  const assertions = `
const matrix = {id: 'coarse', resolution: 2, origin: [100, 200],
  cornerOfOrigin: 'topLeft', tileSize: [10, 5], matrixSize: [3, 2]};
assert.deepEqual(tiles.getTileIndex(matrix, [120, 190]), [1, 1]);
assert.deepEqual(tiles.getTileRange(matrix, [120, 190, 140, 200]),
  {minTileColumn: 1, maxTileColumn: 1, minTileRow: 0, maxTileRow: 0});
assert.equal(tiles.selectTileMatrix({crs: 'local', matrices: [matrix]}, 1), matrix);
`;
  await writeFile(
    join(temporaryDirectory, 'consumer.mjs'),
    `import assert from 'node:assert/strict';
import * as tiles from '@math.gl/geospatial/tile-matrix';
${assertions}`
  );
  await writeFile(
    join(temporaryDirectory, 'consumer.cjs'),
    `const assert = require('node:assert/strict');
const tiles = require('@math.gl/geospatial/tile-matrix');
${assertions}`
  );
  for (const filename of ['consumer.mjs', 'consumer.cjs']) {
    execFileSync(process.execPath, [join(temporaryDirectory, filename)], {stdio: 'inherit'});
  }
  await writeFile(
    join(temporaryDirectory, 'consumer.ts'),
    `
import {getTileBounds, getTileIndex, getTileRange, selectTileMatrix}
  from '@math.gl/geospatial/tile-matrix';
import type {TileMatrix, TileMatrixSet, TileMatrixBounds, TileMatrixLimits}
  from '@math.gl/geospatial/tile-matrix';
const matrix: TileMatrix = {id: '0', resolution: 1, origin: [0, 0],
  cornerOfOrigin: 'topLeft', tileSize: [256, 256], matrixSize: [2, 2]};
const matrixSet: TileMatrixSet = {crs: 'local', matrices: [matrix]};
const bounds: TileMatrixBounds = getTileBounds(matrix, 0, 0);
const range: TileMatrixLimits | null = getTileRange(matrix, bounds);
const selected: TileMatrix | null = selectTileMatrix(matrixSet, 1);
void [range, selected, getTileIndex(matrix, [0, 0])];
// @ts-expect-error resolution targets are numeric
selectTileMatrix(matrixSet, '1');
// @ts-expect-error matrix geometry is readonly
matrix.resolution = 2;
`
  );
  await writeFile(
    join(temporaryDirectory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'es2020',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        types: []
      },
      include: ['consumer.ts']
    })
  );
  execFileSync(
    process.execPath,
    [
      join(repositoryRoot, 'node_modules/typescript/bin/tsc'),
      '--project',
      join(temporaryDirectory, 'tsconfig.json')
    ],
    {stdio: 'inherit'}
  );
  const bundle = await build({
    stdin: {
      contents: "export * from '@math.gl/geospatial/tile-matrix';",
      resolveDir: temporaryDirectory
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    metafile: true
  });
  const inputs = Object.keys(bundle.metafile.inputs).filter(input => input !== '<stdin>');
  assert.equal(inputs.length, 1, 'The tile-matrix subpath must have no runtime dependencies');
  assert.ok(inputs[0].endsWith('/dist/tile-matrix.js'));
  console.log('Tile-matrix ESM, CommonJS, public types and dependency boundary passed.');
} finally {
  await rm(temporaryDirectory, {recursive: true, force: true});
}
