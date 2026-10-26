// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {bundleRuntime} from '../modules/geospatial/projection/scripts/benchmark-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'mathgl-tree-shaking-'));
const probes = [
  {
    symbol: 'createSpatialReference',
    packages: ['@math.gl/geospatial/crs', '@math.gl/geospatial/crs/spatial-reference'],
    forbidden: [/\/resolver\./, /\/projection\//, /\/wkt-crs\./],
    budget: 6000
  },
  {
    symbol: 'createCRSResolver',
    packages: ['@math.gl/geospatial/crs/resolver'],
    forbidden: [/\/projection\//, /\/wkt-crs\./, /proj-wasm/, /\/core\//],
    budget: 8000
  },
  {
    symbol: 'HeightField',
    packages: ['@math.gl/geospatial/terrain'],
    forbidden: [/\/geometry\//, /\/core\//, /\/projection\//, /\/ellipsoid/],
    budget: 16000
  },
  {
    symbol: 'packTerrainHeightField',
    packages: ['@math.gl/geospatial/terrain/packed'],
    forbidden: [/\/geometry\//, /\/core\//, /\/projection\//, /\/ellipsoid/],
    budget: 12000
  },
  {
    symbol: 'HeightFieldMinMax',
    packages: ['@math.gl/geospatial/terrain/bounds'],
    forbidden: [/\/geometry\//, /\/core\//, /\/projection\//, /\/ellipsoid/],
    budget: 8000
  },
  ...[
    ['createTerrainMesh', 'mesh', 5000],
    ['measureTerrainMeshError', 'mesh-error', 6000],
    ['getTerrainMeshEdge', 'mesh-edges', 3500]
  ].map(([symbol, entry, budget]) => ({
    symbol, packages: [`@math.gl/geospatial/terrain/${entry}`], budget,
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /\/martini\./, /martini/, /delatin/,
      ...['mesh', 'mesh-error', 'mesh-edges'].filter(name => name !== entry).map(name => new RegExp(`/terrain/${name}\\.`))]
  })),
  {
    symbol: 'createMartiniTerrainMesh',
    packages: ['@math.gl/geospatial/terrain/martini'],
    forbidden: [/delatin/, /\/geometry\//, /\/core\//, /\/surface\./, /\/terrain\/mesh\./, /\/terrain\/mesh-edges\./],
    budget: 16000
  },
  {
    symbol: 'createDelatinTerrainMesh',
    packages: ['@math.gl/geospatial/terrain/delatin'],
    forbidden: [/martini/, /\/geometry\//, /\/core\//, /\/surface\./, /\/terrain\/mesh-edges\./],
    budget: 24000
  },
  {
    symbol: 'Ellipsoid',
    packages: ['@math.gl/geospatial', '@math.gl/geospatial/ellipsoid'],
    forbidden: [/\/geometry\//, /\/classes\/matrix[34]\./, /\/local-frame\./,
      /\/ellipsoid-transform/, /\/vendor\//, /\/src\/projection\//, /\/dist\/projection\//],
    budget: 24000
  },
  {
    symbol: 'OrientedBoundingBox',
    packages: ['@math.gl/geometry/culling'],
    forbidden: [/\/classes\/quaternion\./, /oriented-bounding-box-quaternion\./,
      /\/compute-eigen-decomposition\./, /\/perspective.*frustum\./],
    budget: 19000
  }
];

try {
  for (const mode of ['source', 'published']) {
    for (const {symbol, packages, forbidden, budget} of probes) {
      let firstGraph;
      for (const specifier of packages) {
        const contents = `export {${symbol}} from '${specifier}';`;
        const entry = join(directory, 'consumer.ts');
        const outfile = join(directory, 'consumer.mjs');
        writeFileSync(entry, contents);
        const result = mode === 'source'
          ? await bundleRuntime(root, relative(root, entry), outfile)
          : await build({
            stdin: {contents, resolveDir: root},
            outfile, bundle: true, metafile: true, format: 'esm', platform: 'browser',
            target: 'es2020', minify: true, legalComments: 'none', logLevel: 'silent'
          });
        const graph = Object.entries(Object.values(result.metafile.outputs)[0].inputs)
          .filter(([, value]) => value.bytesInOutput > 0)
          .map(([path]) => path.replaceAll('\\', '/')).sort();
        for (const pattern of forbidden) {
          assert(graph.every(path => !pattern.test(path)), `${mode} ${specifier}: retained ${pattern}`);
        }
        if (firstGraph) assert.deepEqual(graph, firstGraph, `${symbol}: root and subpath differ`);
        firstGraph = graph;
        // Source builds preserve readable names; enforce byte budgets on the published consumer.
        if (mode === 'published') {
          const bytes = Buffer.byteLength(readFileSync(outfile));
          assert(bytes <= budget, `${symbol}: ${bytes} bytes exceeds ${budget}`);
          console.log(`${specifier}: ${symbol} ${bytes} minified bytes; optional dependencies absent`);
        }
      }
    }
  }
} finally {
  rmSync(directory, {recursive: true, force: true});
}
