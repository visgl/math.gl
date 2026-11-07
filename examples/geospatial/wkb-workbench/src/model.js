// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  parseWKTWithMetadata,
  formatWKT,
  writeWKB,
  parseWKB,
  scanWKB,
  visitWKB
} from '@math.gl/geospatial';
export const FIXTURES = {
  'Polygon with hole': {
    mode: 'wkt',
    text: 'POLYGON ((0 0, 12 0, 12 10, 0 10, 0 0), (3 3, 3 7, 8 7, 8 3, 3 3))'
  },
  '3D line': {mode: 'wkt', text: 'LINESTRING Z (0 0 5, 4 8 12, 12 3 9)'},
  'Measured point': {mode: 'wkt', text: 'POINT M (3 4 42)'},
  'ZM multipoint': {mode: 'wkt', text: 'MULTIPOINT ZM ((0 0 1 10), (4 3 2 20), (8 0 3 30))'},
  Collection: {
    mode: 'wkt',
    text: 'GEOMETRYCOLLECTION (POINT (2 2), LINESTRING (0 0, 8 4), POLYGON ((4 0, 8 0, 6 3, 4 0)))'
  },
  'Empty point': {mode: 'wkt', text: 'POINT Z EMPTY'},
  'EWKB SRID 4326': {mode: 'hex', text: '0101000020e6100000000000000000f03f0000000000000040'},
  'Big endian point': {mode: 'hex', text: '00000000013ff00000000000004000000000000000'},
  'Truncated WKB': {mode: 'hex', text: '01010000000000'}
};
export const toHex = bytes =>
  Array.from(bytes, value => value.toString(16).padStart(2, '0')).join(' ');
export function fromHex(text) {
  const compact = text.replace(/\s/g, '');
  if (!compact || compact.length % 2 || !/^[0-9a-f]+$/i.test(compact))
    throw new Error(
      'Hex input must contain complete byte pairs (00–ff), separated only by whitespace.'
    );
  return Uint8Array.from(compact.match(/../g), value => Number.parseInt(value, 16));
}
function assertHomogeneous(result, dimension = result.dimension) {
  if (result.dimension !== dimension)
    throw new Error(
      'This workbench writes one dimension per collection. Use the same Z/M/ZM declaration for every child.'
    );
  result.children?.forEach(child => assertHomogeneous(child, dimension));
}
export function inspectGeometry(mode, text) {
  if (text.length > 100000)
    throw new Error('Use at most 100,000 input characters in this interactive example.');
  let bytes;
  if (mode === 'wkt') {
    const parsed = parseWKTWithMetadata(text);
    assertHomogeneous(parsed);
    bytes = writeWKB(parsed.geometry, parsed.dimension);
  } else bytes = fromHex(text);
  const statistics = scanWKB(bytes, {maximumDepth: 32, maximumElements: 10000});
  const parsed = parseWKB(bytes, {maximumDepth: 32, maximumElements: 10000});
  const coordinates = [];
  const dimensions = new Set();
  visitWKB(bytes, {
    coordinate: (x, y, z, m, dimension, byteOffset) => {
      coordinates.push({x, y, z, m, dimension, byteOffset});
    },
    geometry: header => dimensions.add(header.dimension)
  });
  // The row parser exposes the root dimension. Avoid claiming a lossless WKT conversion for mixed children.
  const wkt =
    dimensions.size > 1
      ? 'Mixed child dimensions: inspect the original WKB and coordinate table below.'
      : formatWKT(parsed.geometry, parsed.dimension);
  return {bytes, geometry: parsed.geometry, statistics, coordinates, wkt, hex: toHex(bytes)};
}
export function geometryParts(geometry) {
  switch (geometry.type) {
    case 'Point':
      return [{kind: 'point', coordinates: [geometry.coordinates]}];
    case 'MultiPoint':
      return [{kind: 'point', coordinates: geometry.coordinates}];
    case 'LineString':
      return [{kind: 'line', coordinates: geometry.coordinates}];
    case 'MultiLineString':
      return geometry.coordinates.map(coordinates => ({kind: 'line', coordinates}));
    case 'Polygon':
      return [{kind: 'polygon', coordinates: geometry.coordinates}];
    case 'MultiPolygon':
      return geometry.coordinates.map(coordinates => ({kind: 'polygon', coordinates}));
    case 'GeometryCollection':
      return geometry.geometries.flatMap(geometryParts);
    default:
      return [];
  }
}
