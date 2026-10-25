// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  MapEngine,
  type MapFeature,
  type MapFeatureGeometry,
  type PreparedMapGeometry
} from '../../src/discontinuous';
import {elasticI} from '../../src/elastic';

const maps = [
  new MapEngine({version: 1, id: 'mercator', definition: {type: 'mercator'}}),
  new MapEngine({version: 1, id: 'goode', definition: {type: 'goode'}}),
  new MapEngine({
    version: 1,
    id: 'usa',
    definition: {type: 'albers-usa', includeTerritories: true}
  }),
  new MapEngine({version: 1, id: 'elastic', definition: {type: 'elastic', data: elasticI}}),
  new MapEngine({
    version: 1,
    id: 'myriahedral',
    definition: {type: 'myriahedral', preset: 'polyconic', columns: 12}
  })
];
const polygon: MapFeatureGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-120, 25],
      [-60, 25],
      [-60, 60],
      [-120, 60]
    ],
    [
      [-105, 35],
      [-105, 40],
      [-100, 40],
      [-100, 35]
    ]
  ]
};
function unpack(buffer: Float64Array, start = 0, end = buffer.length / 2): [number, number][] {
  return Array.from({length: end - start}, (_, i) => [
    buffer[2 * (start + i)],
    buffer[2 * (start + i) + 1]
  ]);
}
function validateOffsets(starts: Uint32Array, end: number) {
  expect(starts[0]).toBe(0);
  expect(starts.at(-1)).toBe(end);
  for (let i = 1; i < starts.length; i++) expect(starts[i]).toBeGreaterThan(starts[i - 1]);
}
for (const map of maps)
  test(`${map.description.id}: packed batches preserve identity and projection`, () => {
    const features: MapFeature[] = [
      {id: 'empty', geometry: null},
      {id: 'same', geometry: polygon},
      {
        id: 'same',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-160, 45],
            [-80, 45]
          ]
        }
      },
      {
        geometry: {
          type: 'MultiPoint',
          coordinates: [
            [-100, 40],
            [-157.8, 21.3]
          ]
        }
      }
    ];
    const prepared = map.prepareFeatures(features);
    expect(prepared.featureIds).toEqual(['empty', 'same', 'same', null]);
    expect(prepared.regionIds).toEqual(map.regions.map(r => r.id));
    for (const batch of [prepared.points, prepared.paths, prepared.polygons]) {
      expect(batch.positions.length).toBe(batch.sourcePositions.length);
      expect([...batch.positions, ...batch.sourcePositions].every(Number.isFinite)).toBe(true);
      for (const p of batch.parts) {
        expect(p.featureIndex).toBeGreaterThan(0);
        expect(prepared.regionIds[p.regionIndex]).toBeTruthy();
      }
    }
    validateOffsets(prepared.paths.pathStarts, prepared.paths.positions.length / 2);
    validateOffsets(prepared.polygons.ringStarts, prepared.polygons.positions.length / 2);
    validateOffsets(prepared.polygons.polygonStarts, prepared.polygons.ringStarts.length - 1);
    const original = map.projectPolygon(
      polygon.type === 'Polygon' ? (polygon.coordinates as [number, number][][]) : []
    );
    expect(prepared.polygons.parts.length).toBe(original.length);
    original.forEach((p, i) => {
      const firstRing = prepared.polygons.polygonStarts[i];
      expect(prepared.polygons.parts[i].featureIndex).toBe(1);
      p.coordinates.forEach((ring, j) =>
        expect(
          unpack(
            prepared.polygons.positions,
            prepared.polygons.ringStarts[firstRing + j],
            prepared.polygons.ringStarts[firstRing + j + 1]
          )
        ).toEqual(ring)
      );
    });
    const expectedOutline =
      polygon.type === 'Polygon'
        ? polygon.coordinates.flatMap((r, ringIndex) => {
            const closed = [...r, r[0]] as [number, number][];
            return map.projectLine(closed).map(p => ({...p, ringIndex}));
          })
        : [];
    const outlines = prepared.paths.parts
      .map((p, i) => ({p, i}))
      .filter(({p}) => p.role === 'polygon-outline');
    expect(outlines.length).toBe(expectedOutline.length);
    outlines.forEach(({p, i}, j) => {
      expect(p.ringIndex).toBe(expectedOutline[j].ringIndex);
      expect(
        unpack(
          prepared.paths.positions,
          prepared.paths.pathStarts[i],
          prepared.paths.pathStarts[i + 1]
        )
      ).toEqual(expectedOutline[j].coordinates);
    });
  });

test('a cut-crossing polygon closes its fills without inventing outline edges', () => {
  const map = maps[0];
  const prepared = map.prepareFeatures([
    {
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [170, 10],
            [-170, 10],
            [-170, 30],
            [170, 30]
          ]
        ]
      }
    }
  ]);
  expect(prepared.polygons.parts.length).toBeGreaterThan(1);
  const rings = prepared.polygons.ringStarts;
  let hasCutEdge = false;
  for (let r = 1; r < rings.length; r++) {
    const points = unpack(prepared.polygons.sourcePositions, rings[r - 1], rings[r]);
    for (let i = 1; i < points.length; i++)
      if (
        Math.abs(points[i][0]) === 180 &&
        Math.abs(points[i - 1][0]) === 180 &&
        Math.abs(points[i][1] - points[i - 1][1]) > 1
      )
        hasCutEdge = true;
  }
  expect(hasCutEdge).toBe(true);
  for (let p = 0; p < prepared.paths.parts.length; p++) {
    expect(prepared.paths.parts[p].closed).toBe(false);
    const points = unpack(
      prepared.paths.sourcePositions,
      prepared.paths.pathStarts[p],
      prepared.paths.pathStarts[p + 1]
    );
    for (let i = 1; i < points.length; i++)
      expect(
        Math.abs(points[i][0]) === 180 &&
          Math.abs(points[i - 1][0]) === 180 &&
          Math.abs(points[i][1] - points[i - 1][1]) > 1
      ).toBe(false);
  }
});

test('geometry paths preserve nested and multipart component identity', () => {
  const prepared = maps[0].prepareFeatures([
    {
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'MultiPoint',
            coordinates: [
              [10, 10],
              [20, 10]
            ]
          },
          {
            type: 'MultiLineString',
            coordinates: [
              [
                [10, 10],
                [20, 10]
              ],
              [
                [20, 10],
                [25, 10]
              ]
            ]
          },
          {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [10, 10],
                  [15, 10],
                  [10, 15]
                ]
              ]
            ]
          }
        ]
      }
    }
  ]);
  expect(prepared.points.parts.map(p => p.geometryPath)).toEqual([
    [0, 0],
    [0, 1]
  ]);
  expect(prepared.paths.parts.filter(p => p.role === 'line').map(p => p.geometryPath)).toEqual([
    [1, 0],
    [1, 1]
  ]);
  expect(prepared.polygons.parts.map(p => p.geometryPath)).toEqual([[2, 0]]);
});

test('packed output transfers without feature properties or engine state', () => {
  const prepared = maps[0].prepareFeatures([
    {id: 7, properties: {callback: () => {}}, geometry: {type: 'Point', coordinates: [10, 20]}}
  ]);
  const buffers = [
    prepared.points.positions,
    prepared.points.sourcePositions,
    prepared.paths.positions,
    prepared.paths.sourcePositions,
    prepared.paths.pathStarts,
    prepared.polygons.positions,
    prepared.polygons.sourcePositions,
    prepared.polygons.ringStarts,
    prepared.polygons.polygonStarts
  ].map(a => a.buffer);
  const copy = structuredClone(prepared, {transfer: buffers}) as PreparedMapGeometry;
  expect(prepared.points.positions.byteLength).toBe(0);
  expect(copy.points.positions.length).toBe(2);
  expect(copy.featureIds).toEqual([7]);
  expect(copy.points.parts[0].featureIndex).toBe(0);
});

test('empty output, optional outlines and input snapshots', () => {
  const empty = maps[0].prepareFeatures([{geometry: null}]);
  expect([...empty.paths.pathStarts]).toEqual([0]);
  expect([...empty.polygons.ringStarts]).toEqual([0]);
  const feature: MapFeature = {
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [10, 10],
          [15, 10],
          [10, 15]
        ]
      ]
    }
  };
  const frozen = JSON.stringify(feature),
    result = maps[0].prepareFeatures([feature], {polygonOutlines: false});
  expect(result.paths.parts).toHaveLength(0);
  expect(result.polygons.parts).toHaveLength(1);
  expect(JSON.stringify(feature)).toBe(frozen);
  const again = maps[0].prepareFeatures([feature]);
  result.polygons.positions[0] = 999;
  expect(again.polygons.positions[0]).not.toBe(999);
});

test.each([
  {type: 'Point', coordinates: [0, 0, 5]},
  {type: 'Point', coordinates: [NaN, 0]},
  {type: 'Point', coordinates: [0, 91]},
  {type: 'LineString', coordinates: [[0, 0]]},
  {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0]
      ]
    ]
  },
  {type: 'Unknown', coordinates: []}
])('rejects invalid or unsupported input %j', geometry => {
  expect(() => maps[0].prepareFeatures([{geometry: geometry as MapFeatureGeometry}])).toThrow();
});
test('cyclic collections and invalid IDs fail explicitly', () => {
  const collection: {type: 'GeometryCollection'; geometries: MapFeatureGeometry[]} = {
    type: 'GeometryCollection',
    geometries: []
  };
  collection.geometries.push(collection);
  expect(() => maps[0].prepareFeatures([{geometry: collection}])).toThrow(/deeply/);
  expect(() => maps[0].prepareFeatures([{id: Infinity, geometry: null}])).toThrow(/ID/);
});

test('packed rings preserve holes within a chart and complete original outlines', () => {
  const result = maps[0].prepareFeatures([
    {
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [10, 10],
            [30, 10],
            [30, 30],
            [10, 30],
            [10, 10]
          ],
          [
            [15, 15],
            [15, 20],
            [20, 20],
            [20, 15],
            [15, 15]
          ]
        ]
      }
    }
  ]);
  expect([...result.polygons.polygonStarts]).toEqual([0, 2]);
  expect(result.paths.parts.map(p => p.ringIndex)).toEqual([0, 1]);
  expect(result.paths.parts.every(p => p.closed)).toBe(true);
});
test('invalid feature entries cannot silently change the feature index table', () => {
  expect(() => maps[0].prepareFeatures(Array(1))).toThrow(/features/);
  expect(() =>
    maps[0].prepareFeatures([{geometry: null}], {polygonOutlines: 1 as unknown as boolean})
  ).toThrow(/boolean/);
  expect(() =>
    maps[0].prepareFeatures([{type: 'Other', geometry: null} as unknown as MapFeature])
  ).toThrow(/features/);
});

test('collection depth counts collections rather than multipart expansion', () => {
  const nest = (leaf: MapFeatureGeometry, levels: number) => {
    let geometry = leaf;
    for (let i = 0; i < levels; i++)
      geometry = {type: 'GeometryCollection', geometries: [geometry]};
    return geometry;
  };
  for (const geometry of [
    {type: 'Point', coordinates: [10, 10]},
    {
      type: 'MultiPoint',
      coordinates: [
        [10, 10],
        [20, 20]
      ]
    },
    {
      type: 'MultiLineString',
      coordinates: [
        [
          [10, 10],
          [20, 20]
        ]
      ]
    },
    {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [10, 10],
            [20, 10],
            [10, 20]
          ]
        ]
      ]
    }
  ] as MapFeatureGeometry[]) {
    const result = maps[0].prepareFeatures([{geometry: nest(geometry, 64)}]);
    expect(
      result.points.parts.length + result.paths.parts.length + result.polygons.parts.length
    ).toBeGreaterThan(0);
    expect(() => maps[0].prepareFeatures([{geometry: nest(geometry, 65)}])).toThrow(/deeply/);
  }
  expect(() =>
    maps[0].prepareFeatures([{geometry: nest({type: 'GeometryCollection', geometries: []}, 64)}])
  ).toThrow(/deeply/);
});
