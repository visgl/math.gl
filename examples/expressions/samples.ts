export type LibraryId = 'math' | 'geospatial' | 'geohash' | 'quadkey' | 's2';

export type ExpressionSample = {
  id: string;
  group: string;
  label: string;
  expression: string;
  context: Record<string, unknown>;
  libraries: LibraryId[];
};

export const EXPRESSION_SAMPLES: ExpressionSample[] = [
  {
    id: 'basic-angle',
    group: 'Basic math',
    label: 'Angle conversion',
    expression: 'round(toDegrees(atan(ratio)))',
    context: {ratio: 1},
    libraries: ['math']
  },
  {
    id: 'wgs84-cartesian',
    group: 'WGS84',
    label: 'Cartographic to Cartesian',
    expression: 'cartographicToCartesian([toRadians(longitude), toRadians(latitude), height])',
    context: {longitude: -122.4, latitude: 37.8, height: 30},
    libraries: ['math', 'geospatial']
  },
  {
    id: 'geohash-center',
    group: 'GeoHash',
    label: 'Cell center',
    expression: 'getGeohashLngLat(hash)',
    context: {hash: '9q8yyk8y'},
    libraries: ['geohash']
  },
  {
    id: 'geohash-boundary',
    group: 'GeoHash',
    label: 'Cell boundary',
    expression: 'getGeohashBoundary(hash)',
    context: {hash: '9q8yy'},
    libraries: ['geohash']
  },
  {
    id: 'quadkey-boundary',
    group: 'Quadkey',
    label: 'Tile boundary',
    expression: 'getQuadkeyBoundary(quadkey)',
    context: {quadkey: '0230102033'},
    libraries: ['quadkey']
  },
  {
    id: 's2-boundary',
    group: 'S2',
    label: 'Cell boundary',
    expression: 'getS2BoundaryFlat(token)',
    context: {token: '89c25'},
    libraries: ['s2']
  },
  {
    id: 's2-child',
    group: 'S2',
    label: 'Child token',
    expression: 'getS2TokenFromIndex(getS2ChildIndex(getS2IndexFromToken(token), child))',
    context: {token: '89c25', child: 0},
    libraries: ['s2']
  }
];
