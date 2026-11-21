// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const require = createRequire(import.meta.url);

const removed = [
  "@math.gl/core",
  "@math.gl/geometry",
  "@math.gl/geospatial",
  "@math.gl/dggs",
  "@math.gl/earth",
  "@math.gl/sql",
  "@math.gl/earth/geoid/geoid-egm96-low.pgm",
  "@math.gl/earth/geoid/geoid-egm96-hi.pgm",
  "@math.gl/earth/timezone/timezone-geometry-low.json",
  "@math.gl/earth/timezone/timezone-geometry-low.parquet",
  "@math.gl/earth/timezone/timezone-geometry-hi.json",
  "@math.gl/earth/timezone/timezone-geometry-hi.parquet",
  "@math.gl/earth/sun/stars",
  "@math.gl/geospatial/crs/projjson.schema.json",
  "@math.gl/geospatial/projection/datums",
  "@math.gl/geospatial/projection/core",
  "@math.gl/geospatial/projection/projections/merc",
  "@math.gl/geospatial/projection/projections/eqc",
  "@math.gl/geospatial/projection/projections/lcc",
  "@math.gl/geospatial/projection/projections/aea",
  "@math.gl/geospatial/projection/projections/eqdc",
  "@math.gl/geospatial/projection/projections/laea",
  "@math.gl/geospatial/projection/projections/stere",
  "@math.gl/geospatial/projection/projections/sterea",
  "@math.gl/geospatial/projection/projections/aeqd",
  "@math.gl/geospatial/projection/projections/tmerc",
  "@math.gl/geospatial/projection/projections/etmerc",
  "@math.gl/geospatial/projection/projections/utm",
  "@math.gl/geospatial/projection/projections/geocent",
  "@math.gl/geospatial/projection/projections/bonne",
  "@math.gl/geospatial/projection/projections/cass",
  "@math.gl/geospatial/projection/projections/cea",
  "@math.gl/geospatial/projection/projections/eck6",
  "@math.gl/geospatial/projection/projections/eqearth",
  "@math.gl/geospatial/projection/projections/equi",
  "@math.gl/geospatial/projection/projections/geos",
  "@math.gl/geospatial/projection/projections/gnom",
  "@math.gl/geospatial/projection/projections/gstmerc",
  "@math.gl/geospatial/projection/projections/krovak",
  "@math.gl/geospatial/projection/projections/mill",
  "@math.gl/geospatial/projection/projections/moll",
  "@math.gl/geospatial/projection/projections/nzmg",
  "@math.gl/geospatial/projection/projections/omerc",
  "@math.gl/geospatial/projection/projections/ortho",
  "@math.gl/geospatial/projection/projections/poly",
  "@math.gl/geospatial/projection/projections/qsc",
  "@math.gl/geospatial/projection/projections/robin",
  "@math.gl/geospatial/projection/projections/sinu",
  "@math.gl/geospatial/projection/projections/somerc",
  "@math.gl/geospatial/projection/projections/tpers",
  "@math.gl/geospatial/projection/projections/vandg",
  "@math.gl/geospatial/projection/projections/ob_tran",
  "@math.gl/geospatial/projection/parsers/wkt",
  "@math.gl/geospatial/projection/parsers/projjson",
  "@math.gl/geospatial/projection/grids/ntv2",
  "@math.gl/geospatial/projection/grids/geotiff",
  "@math.gl/geospatial/projection/projections/lazy/merc",
  "@math.gl/geospatial/projection/projections/lazy/eqc",
  "@math.gl/geospatial/projection/projections/lazy/lcc",
  "@math.gl/geospatial/projection/projections/lazy/aea",
  "@math.gl/geospatial/projection/projections/lazy/eqdc",
  "@math.gl/geospatial/projection/projections/lazy/laea",
  "@math.gl/geospatial/projection/projections/lazy/stere",
  "@math.gl/geospatial/projection/projections/lazy/sterea",
  "@math.gl/geospatial/projection/projections/lazy/aeqd",
  "@math.gl/geospatial/projection/projections/lazy/tmerc",
  "@math.gl/geospatial/projection/projections/lazy/etmerc",
  "@math.gl/geospatial/projection/projections/lazy/utm",
  "@math.gl/geospatial/projection/projections/lazy/geocent",
  "@math.gl/geospatial/projection/projections/lazy/bonne",
  "@math.gl/geospatial/projection/projections/lazy/cass",
  "@math.gl/geospatial/projection/projections/lazy/cea",
  "@math.gl/geospatial/projection/projections/lazy/eck6",
  "@math.gl/geospatial/projection/projections/lazy/eqearth",
  "@math.gl/geospatial/projection/projections/lazy/equi",
  "@math.gl/geospatial/projection/projections/lazy/geos",
  "@math.gl/geospatial/projection/projections/lazy/gnom",
  "@math.gl/geospatial/projection/projections/lazy/gstmerc",
  "@math.gl/geospatial/projection/projections/lazy/krovak",
  "@math.gl/geospatial/projection/projections/lazy/mill",
  "@math.gl/geospatial/projection/projections/lazy/moll",
  "@math.gl/geospatial/projection/projections/lazy/nzmg",
  "@math.gl/geospatial/projection/projections/lazy/omerc",
  "@math.gl/geospatial/projection/projections/lazy/ortho",
  "@math.gl/geospatial/projection/projections/lazy/poly",
  "@math.gl/geospatial/projection/projections/lazy/qsc",
  "@math.gl/geospatial/projection/projections/lazy/robin",
  "@math.gl/geospatial/projection/projections/lazy/sinu",
  "@math.gl/geospatial/projection/projections/lazy/somerc",
  "@math.gl/geospatial/projection/projections/lazy/tpers",
  "@math.gl/geospatial/projection/projections/lazy/vandg",
  "@math.gl/geospatial/projection/projections/lazy",
  "@math.gl/geospatial/projection/projections/lazy/ob_tran",
  "@math.gl/geospatial/projection/grids/vertical",
  "@math.gl/geospatial/projection/grids/gtx",
  "@math.gl/geospatial/projection/grids/vertical-geotiff",
  "@math.gl/geospatial/projection/pipeline",
  "@math.gl/geospatial/projection/deformation",
  "@math.gl/geospatial/projection/grids/velocity",
  "@math.gl/geospatial/projection/grids/velocity-geotiff",
  "@math.gl/geospatial/projection/operations",
  "@math.gl/geospatial/projection/analysis",
  "@math.gl/geospatial/projection/bulk",
  "@math.gl/geospatial/projection/temporal",
  "@math.gl/geospatial/projection/types",
  "@math.gl/geospatial/projection/web-mercator",
  "@math.gl/geospatial/projection/analysis/transform",
  "@math.gl/geospatial/turf/expressions",
  "@math.gl/geospatial/maps/presets",
  "@math.gl/geospatial/maps/geometry",
  "@math.gl/geospatial/maps/transitions",
  "@math.gl/geospatial/maps/surfaces",
  "@math.gl/sql/scales/conformance",

  "@math.gl/core/mat3",
  "@math.gl/core/mat4",
  "@math.gl/core/quat",
  "@math.gl/core/vec2",
  "@math.gl/core/vec3",
  "@math.gl/core/vec4",
  "@math.gl/core/local-frame",
  "@math.gl/core/spheroid",
  "@math.gl/dggs/expressions",
  "@math.gl/earth/sun/planets",
  "@math.gl/earth/sun/astronomy",
  "@math.gl/earth/timezone/lookup",
  "@math.gl/earth/timezone/temporal",
  "@math.gl/geometry/parametric",
  "@math.gl/geometry/utils",
  "@math.gl/geometry/utils/interpolate-packed-attributes",
  "@math.gl/geometry/culling/oriented-box-2d",
  "@math.gl/geometry/culling/queries",
  "@math.gl/geometry/spatial-index/boxes",
  "@math.gl/geospatial/tile-matrix",
  "@math.gl/geospatial/wkb",
  "@math.gl/core/tasks",
  "@math.gl/geospatial/geoarrow",
  "@math.gl/geospatial/geoarrow-utils",
  "@math.gl/geospatial/geographic-atlas",
  "@math.gl/geospatial/crs/wkt",
  "@math.gl/geospatial/crs/proj-string",
  "@math.gl/geospatial/crs/spatial-reference",
  "@math.gl/geospatial/crs/resolver",
  "@math.gl/geospatial/crs/metadata",
  "@math.gl/arrow/geoarrow-utils/worker",
  "@math.gl/arrow/geoarrow-utils/builder",
  "@math.gl/arrow/geoarrow-utils/wkb",
  "@math.gl/arrow/geoarrow-utils/tessellation",
  "@math.gl/geospatial/geodesic-exact",
  "@math.gl/geospatial/triaxial",
  "@math.gl/geospatial/geodesic-buffer",
  "@math.gl/geospatial/terrain/geometry",
  "@math.gl/geospatial/terrain/geographic",
  "@math.gl/geospatial/terrain/tiled",
  "@math.gl/geospatial/terrain/packed",
  "@math.gl/geospatial/terrain/surface",
  "@math.gl/geospatial/terrain/bounds",
  "@math.gl/geospatial/terrain/mesh",
  "@math.gl/geospatial/terrain/mesh-error",
  "@math.gl/geospatial/terrain/mesh-edges",
  "@math.gl/geospatial/terrain/martini",
  "@math.gl/geospatial/terrain/delatin",
  "@math.gl/geospatial/terrain/derivatives",
  "@math.gl/geospatial/terrain/slope-aspect",
  "@math.gl/geospatial/terrain/profile",
  "@math.gl/geospatial/terrain/contours",
  "@math.gl/geospatial/terrain/contour-paths",
  "@math.gl/geospatial/terrain/contour-simplify",
  "@math.gl/geospatial/terrain/profile-measure",
  "@math.gl/geospatial/terrain/vertex-tiles",
  "@math.gl/geospatial/terrain/mesh-stitch"
];
for (const path of removed) {
  assert.throws(() => require.resolve(path), error =>
    error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' ||
    (path.startsWith('@math.gl/arrow/') && error.code === 'MODULE_NOT_FOUND'), path);
}

for (const path of ['@math.gl/geometry/color', '@math.gl/geospatial/turf-expressions']) {
  assert.throws(() => require.resolve(path), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
  await assert.rejects(import(path), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
}

for (const subpath of ['sql', 'math', 'color', 'arrow/worker', 'arrow/worker-entry.js', 'arrow/query-worker-entry.js']) {
  assert.throws(() => require.resolve('@math.gl/sql/' + subpath), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
}
const entryPoints = {
  "@math.gl/core/types": [
    "isFloat16Array",
    "isTypedArray"
  ],
  "@math.gl/earth/geoid": [
    "Geoid",
    "createGeoidFromGrid",
    "parsePGM"
  ],
  "@math.gl/geometry/spatial-index": [
    "BoxIndex",
    "PointIndex",
    "TriangleBVH"
  ],
  "@math.gl/geometry/processing": [
    "computeVertexNormals",
    "octDecode"
  ],
  "@math.gl/core/matrix": [
    "Matrix4",
    "Vector3",
    "createLocalFrameBasis",
    "mat4",
    "mat4GetScaling",
    "spheroidToCartesian",
    "vec3Normalize"
  ],
  "@math.gl/core/color": [
    "compileResolvedScale",
    "createColorLUTSampler"
  ],
  "@math.gl/core/arrow": [
    "GeoArrowBuilder",
    "IndexedArrowTable",
    "hydrateArrowTable",
    "makeGeoArrowColumnFromArrowVector",
    "parseWKB",
    "parseWKT",
    "prepareGeoArrowTransfer"
  ],
  "@math.gl/geometry/arrow": [
    "tessellateGeoArrowPolygons",
    "tessellateGeoArrowStream"
  ],
  "@math.gl/geospatial/st-functions": [
    "POSTGIS_SPATIAL_FUNCTIONS",
    "ST_AREA",
    "ST_EXTENT"
  ],
  "@math.gl/geospatial/turf-functions": [
    "TURF_DISTANCE",
    "TURF_FUNCTIONS",
    "createTurfArrowFunction"
  ],
  "@math.gl/geospatial/web-mercator": [
    "WebMercatorViewport"
  ],
  "@math.gl/sql/query": [
    "compileArrowAggregates",
    "queryArrowAggregateSnapshots",
    "queryArrowSQL",
    "queryArrowTable",
    "queryArrowTableInBatches",
    "replaceArrowColumns"
  ],
  "@math.gl/sql/expressions": [
    "ExpressionFunctionRegistry",
    "compile",
    "evaluate",
    "parse",
    "parseExpressionString"
  ],
  "@math.gl/dggs/geohash": [
    "GeohashDecoder",
    "getGeohashBounds"
  ],
  "@math.gl/dggs/decoders": [
    "DGGS_FUNCTION_LIBRARY"
  ],
  "@math.gl/dggs/a5": [
    "A5Decoder"
  ],
  "@math.gl/dggs/h3": [
    "H3Decoder"
  ],
  "@math.gl/dggs/plus-code": [
    "PlusCodeDecoder"
  ],
  "@math.gl/dggs/quadkey": [
    "QuadkeyDecoder"
  ],
  "@math.gl/dggs/s2": [
    "S2Decoder"
  ],
  "@math.gl/geometry/primitives": [
    "ParametricGeometry"
  ],
  "@math.gl/geometry/curves": [
    "Curve"
  ],
  "@math.gl/geometry/polygon": [
    "clipPolygon"
  ],
  "@math.gl/geometry/culling": [
    "getClosestPointsOnSegments",
    "getClosestPointsSegmentTriangle"
  ],
  "@math.gl/earth/sun": [
    "getPlanetSkyInfo",
    "getSkySnapshot"
  ],
  "@math.gl/earth/timezone": [
    "getStartOfDay",
    "lookupTimezone"
  ],
  "@math.gl/geospatial/terrain": [
    "HeightField",
    "TerrainContourBoundaryAxis",
    "TerrainMorphStatus",
    "TerrainProfileViewStatus",
    "TerrainVertexHaloStatus",
    "coordinateTerrainLodMorphs",
    "createMartiniTerrainMesh",
    "createTerrainFilteredPyramid",
    "createTerrainGradientPyramid",
    "createTerrainIsobands",
    "createTerrainLodMorph",
    "createTerrainMesh",
    "createTerrainMixedIsobands",
    "createTerrainMixedVertexTileHalos",
    "createTerrainSkirt",
    "createTerrainVertexTileHalos",
    "diagnoseTerrainContourBoundaries",
    "evaluateTerrainLodMorph",
    "getTerrainHierarchyNode",
    "getTerrainProfileHorizon",
    "getTerrainProfileViewshed",
    "getTerrainProfileVisibility",
    "getTerrainVertexHaloAffectedTiles",
    "simplifyTerrainContourPaths",
    "simplifyTerrainContourPathsTopology",
    "stitchTerrainContourTiles",
    "stitchTerrainMeshEdges",
    "updateTerrainBounds",
    "updateTerrainBoundsRegions",
    "updateTerrainDelatinMeshRegions",
    "updateTerrainGradientPyramidRegions",
    "updateTerrainGradientPyramids",
    "updateTerrainMartiniMeshRegions",
    "updateTerrainMeshRegions",
    "updateTerrainMeshes",
    "updateTerrainMixedGradientGrids",
    "updateTerrainMixedVertexTileHalos",
    "updateTerrainPersistentBounds",
    "updateTerrainPersistentGradients",
    "updateTerrainVertexTileHalos",
    "weldTerrainContourTiles",
    "weldTerrainMixedContourTiles"
  ],
  "@math.gl/geospatial/crs": [
    "createCRSResolver",
    "createSpatialReference"
  ],
  "@math.gl/geospatial/coordinates": [
    "parseAngle"
  ],
  "@math.gl/tasks": [
    "TaskRunner",
    "preloadTasks"
  ],
  "@math.gl/core/utf8": [
    "compareUTF8",
    "parseUTF8Number"
  ]
};
for (const [path, symbols] of Object.entries(entryPoints)) {
  const esm = await import(path), cjs = require(path);
  for (const name of symbols) { assert.notEqual(esm[name], undefined, path + ' ESM missing ' + name); assert.notEqual(cjs[name], undefined, path + ' CJS missing ' + name); }
}
for (const load of [specifier => import(specifier), specifier => require(specifier)]) {
  const {DGGS_DECODERS} = await load('@math.gl/dggs/decoders');
  const entries = [
    ['a5', 'A5Decoder'], ['geohash', 'GeohashDecoder'], ['h3', 'H3Decoder'],
    ['plus-code', 'PlusCodeDecoder'], ['quadkey', 'QuadkeyDecoder'], ['s2', 'S2Decoder']
  ];
  for (const [index, [path, symbol]] of entries.entries()) {
    assert.equal(DGGS_DECODERS[index], (await load('@math.gl/dggs/' + path))[symbol]);
  }
}
for (const load of [specifier => import(specifier), specifier => require(specifier)]) {
  const entries = [
    ['@math.gl/core/types', '@math.gl/core/matrix', 'isFloat16Array'],
    ['@math.gl/geometry/polygon', '@math.gl/geometry/processing', 'subdivideTriangleMesh'],
    ['@math.gl/earth/sun-stars', '@math.gl/earth/sun', 'getStarPosition']
  ];
  for (const [owner, previousPath, symbol] of entries) {
    assert.equal(typeof (await load(owner))[symbol], 'function');
    assert.equal(symbol in await load(previousPath), false);
  }
}
assert.equal(typeof (await import('@math.gl/earth/sun-stars')).STAR_CATALOG, 'object');
const repository = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, [join(repository,'node_modules/typescript/bin/tsc'), '--project', join(repository,'test/types/root-exports/tsconfig.json')], {stdio:'inherit'});
console.log('Focused ESM, CommonJS and TypeScript exports passed. Retired imports were rejected.');
