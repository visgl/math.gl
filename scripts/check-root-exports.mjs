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
  "@math.gl/core/mat3",
  "@math.gl/core/mat4",
  "@math.gl/core/quat",
  "@math.gl/core/vec2",
  "@math.gl/core/vec3",
  "@math.gl/core/vec4",
  "@math.gl/core/local-frame",
  "@math.gl/core/spheroid",
  "@math.gl/core/types",
  "@math.gl/core/expressions",
  "@math.gl/dggs/a5",
  "@math.gl/dggs/geohash",
  "@math.gl/dggs/h3",
  "@math.gl/dggs/plus-code",
  "@math.gl/dggs/quadkey",
  "@math.gl/dggs/s2",
  "@math.gl/dggs/expressions",
  "@math.gl/earth/geoid",
  "@math.gl/earth/sun/planets",
  "@math.gl/earth/sun/astronomy",
  "@math.gl/earth/timezone/lookup",
  "@math.gl/earth/timezone/temporal",
  "@math.gl/geometry/parametric",
  "@math.gl/geometry/utils",
  "@math.gl/geometry/curves",
  "@math.gl/geometry/polygon",
  "@math.gl/geometry/spatial-index",
  "@math.gl/geometry/utils/interpolate-packed-attributes",
  "@math.gl/geometry/culling/oriented-box-2d",
  "@math.gl/geometry/culling/queries",
  "@math.gl/geometry/spatial-index/boxes",
  "@math.gl/geospatial/tile-matrix",
  "@math.gl/geospatial/web-mercator",
  "@math.gl/geospatial/wkb",
  "@math.gl/geospatial/expressions",
  "@math.gl/geospatial/ellipsoid",
  "@math.gl/geospatial/globe",
  "@math.gl/geospatial/geographic-atlas",
  "@math.gl/geospatial/tiles",
  "@math.gl/geospatial/crs/wkt",
  "@math.gl/geospatial/crs/proj-string",
  "@math.gl/geospatial/crs/spatial-reference",
  "@math.gl/geospatial/crs/resolver",
  "@math.gl/geospatial/crs/metadata",
  "@math.gl/geospatial/geoarrow/worker",
  "@math.gl/geospatial/geoarrow/builder",
  "@math.gl/geospatial/geoarrow/wkb",
  "@math.gl/geospatial/geoarrow/tessellation",
  "@math.gl/geospatial/geodesic-exact",
  "@math.gl/geospatial/triaxial",
  "@math.gl/geospatial/coordinates",
  "@math.gl/geospatial/geodesic-buffer",
  "@math.gl/geospatial/terrain/geometry",
  "@math.gl/geospatial/terrain/geographic",
  "@math.gl/geospatial/terrain/tiled",
  "@math.gl/geospatial/terrain/packed",
  "@math.gl/geospatial/terrain/surface",
  "@math.gl/geospatial/terrain/bounds",
  "@math.gl/geospatial/geographic-cuts",
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
  assert.throws(() => require.resolve(path), error => error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED', path);
}

const roots = {
  '@math.gl/core': ['spheroidToCartesian','createLocalFrameBasis','mat4GetScaling','vec3Normalize','mat4'],
  '@math.gl/dggs': ['getGeohashBounds','DGGS_FUNCTION_LIBRARY'],
  '@math.gl/geometry': ['ParametricGeometry','Curve','clipPolygon','TriangleBVH','getClosestPointsSegmentTriangle'],
  '@math.gl/geometry/culling': ['getClosestPointsOnSegments','getClosestPointsSegmentTriangle'],
  '@math.gl/earth': ['Geoid','getPlanetSkyInfo','getSkySnapshot','getStartOfDay'],
  '@math.gl/earth/sun': ['getPlanetSkyInfo','getSkySnapshot','getStarPosition'],
  '@math.gl/earth/timezone': ['lookupTimezone','getStartOfDay'],
  '@math.gl/geospatial': ['HeightField','createTerrainSkirt','createTerrainMesh','createCRSResolver','parseWKB','prepareGeoArrowTransfer','parseAngle'],
  '@math.gl/geospatial/terrain': ['HeightField','createTerrainSkirt','createTerrainMesh','createMartiniTerrainMesh','stitchTerrainMeshEdges','simplifyTerrainContourPaths'],
  '@math.gl/geospatial/crs': ['createSpatialReference','createCRSResolver'],
  '@math.gl/geospatial/geoarrow': ['GeoArrowBuilder','prepareGeoArrowTransfer']
};
for (const [path, symbols] of Object.entries(roots)) {
  const esm = await import(path), cjs = require(path);
  for (const name of symbols) { assert.notEqual(esm[name], undefined, path + ' ESM missing ' + name); assert.notEqual(cjs[name], undefined, path + ' CJS missing ' + name); }
}
assert.equal(typeof (await import('@math.gl/earth/sun/stars')).STAR_CATALOG, 'object');
const repository = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, [join(repository,'node_modules/typescript/bin/tsc'), '--project', join(repository,'test/types/root-exports/tsconfig.json')], {stdio:'inherit'});
console.log('Root ESM/CJS/TypeScript exports present and superseded API subpaths rejected.');
