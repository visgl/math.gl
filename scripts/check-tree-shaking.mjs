// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'mathgl-tree-shaking-'));
const probes = [
  {symbol: 'certifyTerrainMeshCoverage', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/height-field\./, /mesh-data\./, /continuous-mesh-error/, /cdt2d/, /martini/, /delatin/], budget: 6500},
  {symbol: 'updateTerrainValidDomainMeshRegions', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/martini/, /delatin/, /breakline-mesh/, /continuous-mesh-error/], budget: 45000},

  {symbol: 'splitTerrainBreaklines', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/cdt2d/, /breakline-mesh/, /valid-domain-mesh/, /height-field\./], budget: 5000},

  {symbol: 'measureGeographicTerrainSeam', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/height-field\./, /geographic\./, /lod-select/, /mesh-stitch/], budget: 5000},
  {symbol: 'selectTerrainLod', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/height-field\./, /mesh-stitch/, /geographic-seam/], budget: 5000},
  {symbol: 'stitchTerrainLodCut', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/height-field\./, /lod-select/, /lod-coordinate/, /geographic-seam/], budget: 17000},

  {symbol: 'boundTerrainMeshError', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/cdt2d/, /martini/, /delatin/, /height-field\./, /mesh-data\./], budget: 9000},

  {symbol: 'createBreaklineTerrainMesh', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/martini/, /delatin/, /\/surface\./], budget: 45000},

  {symbol: 'createTerrainMesh', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/mesh-coverage/, /continuous-mesh-error/, /cdt2d/, /valid-domain-mesh/, /martini/, /delatin/], budget: 10000},
  {symbol: 'createValidDomainTerrainMesh', packages: ['@math.gl/geospatial', '@math.gl/geospatial/terrain'],
    forbidden: [/martini/, /delatin/, /\/surface\./, /breakline-mesh/], budget: 45000},

  {symbol:'getExpressionColumns', packages:['@math.gl/expressions'], forbidden:[/apache-arrow/,/arrow\//,/vendor\/jsep\/runtime/], budget:4000},
  {symbol:'columnarPredicateToExpression', packages:['@math.gl/expressions'], forbidden:[/apache-arrow/,/arrow\//,/vendor\/jsep\/runtime/], budget:10000},
  {symbol:'NUMERIC_FUNCTION_DEFINITIONS', packages:['@math.gl/expressions'], forbidden:[/apache-arrow/,/arrow\//,/vendor\/jsep\/runtime/], budget:5000},
  {symbol:'SIN',packages:['@math.gl/expressions/math'],forbidden:[/arrow\/(compiler|predicate)/,/loaders.gl/],budget:210000},
  {symbol:'COLOR_RGB',packages:['@math.gl/expressions/color'],forbidden:[/arrow\/(compiler|predicate)/,/loaders.gl/],budget:250000},
  {symbol: 'createTurfArrowFunction', packages: ['@math.gl/geospatial/turf/expressions'], forbidden: [/\/src\/turf\.ts$/, /\/dist\/turf\.js$/, /arrow\/(compiler|predicate)/], budget: 240000},

  {symbol: 'parseSQLSelect', packages: ['@math.gl/expressions/sql'], forbidden: [/parse-sql-predicate/, /sql-predicate-schema/, /bind-sql-predicate/, /apache-arrow/, /loaders.gl/, /zod/], budget: 12600},
  {symbol: 'parseSQLSelectStatement', packages: ['@math.gl/expressions/sql'], forbidden: [/parse-sql-predicate/, /sql-predicate-schema/, /bind-sql-predicate/, /apache-arrow/, /loaders.gl/, /zod/], budget: 15000},
  {symbol: 'parseSQLQuery', packages: ['@math.gl/expressions/sql'], forbidden: [/apache-arrow/, /loaders.gl/, /zod/], budget: 24000},
  {symbol: 'bindColumnarPredicateParameters', packages: ['@math.gl/expressions'], forbidden: [/apache-arrow/, /arrow\//], budget: 4000},
  {symbol:'spheroidToCartesian', packages:['@math.gl/core'], forbidden:[/mat4/, /vec[234]/, /expressions/, /\/sql\//], budget:1000},
  {symbol:'vec3Normalize', packages:['@math.gl/core'], forbidden:[/mat4/, /vec2/, /expressions/, /\/sql\//], budget:500},
  {symbol:'getGeohashBounds', packages:['@math.gl/dggs'], forbidden:[/h3-js/, /a5-js/, /open-location-code/, /s2-geometry/], budget:2500},
  {symbol:'getClosestPointsSegmentTriangle', packages:['@math.gl/geometry'], forbidden:[/parametric/, /spatial-index/, /terrain/, /earcut/], budget:5000},
  {symbol:'getStarColor', packages:['@math.gl/earth'], forbidden:[/astronomy-engine/, /bright-stars/], budget:700},
  {symbol:'getGalacticAcceleration', packages:['@math.gl/earth'], forbidden:[/astronomy-engine/, /bright-stars/], budget:1200},
  {symbol:'getTimezoneOffset', packages:['@math.gl/earth'], forbidden:[/astronomy-engine/, /tz-lookup/, /bright-stars/], budget:1500},
  {symbol:'parseWKB', packages:['@math.gl/arrow/wkb'], forbidden:[/martini/, /delatin/, /surface\./, /geometry\//, /geospatial\//, /tasks\//, /apache-arrow/], budget:4500},
  {
    symbol: 'createCRSDescriptor',
    packages: ['@math.gl/geospatial/crs', '@math.gl/geospatial'],
    forbidden: [/\/projection\//, /\/crs\/(wkt|proj-string|projjson|resolver)/, /proj-wasm/, /proj4/, /\/core\//],
    budget: 8000
  },
  {
    symbol: 'createSpatialReference',
    packages: ['@math.gl/geospatial/crs', '@math.gl/geospatial'],
    forbidden: [/\/resolver\./, /\/projection\//, /\/wkt-crs\./],
    budget: 6000
  },
  {
    symbol: 'createCRSResolver',
    packages: ['@math.gl/geospatial/crs', '@math.gl/geospatial'],
    forbidden: [/\/projection\//, /\/wkt-crs\./, /proj-wasm/, /\/core\//],
    budget: 8000
  },
  {
    symbol: 'HeightField',
    packages: ['@math.gl/geospatial/terrain'],
    forbidden: [/\/geometry\//, /\/core\//, /\/projection\//, /\/ellipsoid/, /\/mesh-skirts\./],
    budget: 16000
  },
  {
    symbol: 'createTerrainSkirt',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/projection\//, /\/height-field\./, /\/surface\./, /martini/, /delatin/],
    budget: 5000
  },
  {
    symbol: 'packTerrainHeightField',
    packages: ['@math.gl/geospatial/terrain'],
    forbidden: [/\/geometry\//, /\/core\//, /\/projection\//, /\/ellipsoid/],
    budget: 12000
  },
  {
    symbol: 'HeightFieldMinMax',
    packages: ['@math.gl/geospatial/terrain'],
    forbidden: [/\/geometry\//, /\/core\//, /\/projection\//, /\/ellipsoid/],
    budget: 8000
  },
  ...[
    ['createTerrainMesh', 'mesh', 5000],
    ['measureTerrainMeshError', 'mesh-error', 6000],
    ['getTerrainMeshEdge', 'mesh-edges', 3500]
  ].map(([symbol, entry, budget]) => ({
    symbol, packages: ['@math.gl/geospatial/terrain'], budget,
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /\/martini\./, /martini/, /delatin/,
      ...['mesh', 'mesh-error', 'mesh-edges'].filter(name => name !== entry).map(name => new RegExp(`/terrain/${name}\\.`))]
  })),
  ...[
    ['createTerrainGradientGrid', 'derivatives', 4500],
    ['getTerrainSlopeAspect', 'slope-aspect', 800],
    ['createTerrainSlopeAspectGrid', 'slope-aspect', 2500],
    ['sampleTerrainProfile', 'profile', 4500],
    ['createTerrainContours', 'contours', 6500]
  ].map(([symbol, entry, budget]) => ({
    symbol, packages: ['@math.gl/geospatial/terrain'], budget,
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./,
      ...['derivatives', 'slope-aspect', 'profile', 'contours'].filter(name => name !== entry).map(name => new RegExp(`/terrain/${name}\\.`))]
  })),
  ...[
    ['stitchTerrainContours', 'contour-paths', 6000],
    ['simplifyTerrainContourPaths', 'contour-simplify', 8500],
    ['measureTerrainProfile', 'profile-measure', 4500]
  ].map(([symbol, entry, budget]) => ({
    symbol, packages: ['@math.gl/geospatial/terrain'], budget,
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/contours\./, /\/profile\./,
      ...['contour-paths', 'contour-simplify', 'profile-measure'].filter(name => name !== entry).map(name => new RegExp(`/terrain/${name}\\.`))]
  })),
  {
    symbol: 'weldTerrainContourTiles',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/contours\./, /\/contour-paths\./],
    budget: 8000
  },
  {
    symbol: 'weldTerrainMixedContourTiles',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/contours\./, /\/contour-paths\./],
    budget: 8000
  },
  {
    symbol: 'diagnoseTerrainContourBoundaries',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/contours\./, /\/contour-tile-weld\./, /\/contour-paths\./],
    budget: 6000
  },
  {
    symbol: 'stitchTerrainContourTiles',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/contours\./],
    budget: 12000
  },
  {
    symbol: 'createTerrainGradientPyramid',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/derivatives\./, /\/filtered-pyramid\./],
    budget: 4000
  },
  {
    symbol: 'getTerrainProfileVisibility',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/profile\./, /\/profile-measure\./],
    budget: 3500
  },
  ...['getTerrainProfileHorizon', 'getTerrainProfileViewshed'].map(symbol => ({
    symbol, packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/profile\./, /\/profile-measure\./, /\/profile-visibility\./],
    budget: 4000
  })),
  ...[
    ['reconcileTerrainVertexTiles', 'vertex-tiles', 5500],
    ['stitchTerrainMeshEdges', 'mesh-stitch', 11000]
  ].map(([symbol, entry, budget]) => ({
    symbol, packages: ['@math.gl/geospatial/terrain'], budget,
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./,
      ...['vertex-tiles', 'mesh-stitch', 'tiled', 'mesh'].filter(name => name !== entry).map(name => new RegExp(`/terrain/${name}\\.`))]
  })),
  ...['updateTerrainMixedVertexTileHalos', 'updateTerrainMixedGradientGrids', 'simplifyTerrainContourPathsTopology'].map(symbol => ({
    symbol, packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/mesh\./],
    budget: 22000
  })),
  ...['createTerrainIsobands', 'updateTerrainMeshes', 'updateTerrainBounds', 'updateTerrainGradientPyramids'].map(symbol => ({
    symbol, packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/contour-topology\./],
    budget: 16000
  })),
  ...['updateTerrainMeshRegions','updateTerrainMartiniMeshRegions','updateTerrainDelatinMeshRegions','updateTerrainBoundsRegions','updateTerrainGradientPyramidRegions'].map(symbol => ({
    symbol, packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./,
      ...(symbol === 'updateTerrainMartiniMeshRegions' ? [] : [/martini/]),
      ...(symbol === 'updateTerrainDelatinMeshRegions' ? [] : [/delatin/])],
    budget: 32000
  })),
  ...['updateTerrainPersistentBounds','updateTerrainPersistentGradients','getTerrainHierarchyNode','createTerrainLodMorph','evaluateTerrainLodMorph'].map(symbol => ({
    symbol, packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/mesh\./,
      ...(symbol==='evaluateTerrainLodMorph'||symbol==='getTerrainHierarchyNode' ? [/\/height-field\./, /\/bounds\./, /\/gradient-pyramid\./] : [])],
    budget: symbol==='evaluateTerrainLodMorph'||symbol==='getTerrainHierarchyNode'?4000:16000
  })),
  ...['coordinateTerrainLodMorphs','createTerrainMixedIsobands'].map(symbol=>({
    symbol,packages:['@math.gl/geospatial/terrain','@math.gl/geospatial'],
    forbidden:[/\/geometry\//,/\/core\//,/\/surface\./,/martini/,/delatin/,/\/mesh-stitch\./],budget:24000
  })),
  {
    symbol: 'createTerrainMixedVertexTileHalos',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/derivatives\./, /\/vertex-halos\./],
    budget: 16000
  },
  {
    symbol: 'createTerrainVertexTileHalos',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/derivatives\./],
    budget: 8000
  },
  {
    symbol: 'getTerrainVertexHaloAffectedTiles',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/vertex-halos\./, /\/vertex-tiles\./],
    budget: 2500
  },
  {
    symbol: 'updateTerrainVertexTileHalos',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/derivatives\./],
    budget: 10000
  },
  {
    symbol: 'createTerrainFilteredPyramid',
    packages: ['@math.gl/geospatial/terrain', '@math.gl/geospatial'],
    forbidden: [/\/geometry\//, /\/core\//, /\/surface\./, /martini/, /delatin/, /\/height-field\./, /\/bounds\./],
    budget: 3500
  },
  {
    symbol: 'createMartiniTerrainMesh',
    packages: ['@math.gl/geospatial/terrain'],
    forbidden: [/delatin/, /\/geometry\//, /\/core\//, /\/surface\./, /\/terrain\/mesh\./, /\/terrain\/mesh-edges\./],
    budget: 16000
  },
  {
    symbol: 'createDelatinTerrainMesh',
    packages: ['@math.gl/geospatial/terrain'],
    forbidden: [/martini/, /\/geometry\//, /\/core\//, /\/surface\./, /\/terrain\/mesh-edges\./],
    budget: 24000
  },
  {
    symbol: 'Ellipsoid',
    packages: ['@math.gl/geospatial', '@math.gl/geospatial'],
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
