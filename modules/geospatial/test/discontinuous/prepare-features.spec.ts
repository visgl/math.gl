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

test('opt-in path lineage preserves geometry and distinguishes repeated source segments', () => {
  const map = maps[1];
  const features: MapFeature[] = [
    {
      geometry: {
        type: 'LineString',
        coordinates: [
          [-80, 30],
          [20, 30],
          [-80, 30],
          [20, 30]
        ]
      }
    }
  ];
  const ordinary = map.prepareFeatures(features);
  const rich = map.prepareFeatures(features, {
    provenance: {
      sourceSegments: true,
      boundaries: true,
      distances: {metric: 'spherical', radius: 6371000}
    }
  });
  expect(rich.paths.positions).toEqual(ordinary.paths.positions);
  expect(rich.paths.sourcePositions).toEqual(ordinary.paths.sourcePositions);
  expect(rich.paths.pathStarts).toEqual(ordinary.paths.pathStarts);
  expect(ordinary.paths.provenance).toBeUndefined();
  const p = rich.paths.provenance!;
  expect(p.sourceSegmentIndices!.length).toBe(rich.paths.positions.length / 2);
  expect(new Set(p.sourceSegmentIndices)).toEqual(new Set([0, 1, 2]));
  expect(p.startReasons!.length).toBe(rich.paths.parts.length);
  for (let part = 0; part < rich.paths.parts.length; part++) {
    const a = rich.paths.pathStarts[part],
      b = rich.paths.pathStarts[part + 1];
    for (let i = a; i < b; i++) {
      expect(p.sourceSegmentParameters![i]).toBeGreaterThanOrEqual(0);
      expect(p.sourceSegmentParameters![i]).toBeLessThanOrEqual(1);
      if (i > a)
        expect(p.sourceDistances![i]).toBeGreaterThanOrEqual(p.sourceDistances![i - 1] - 1e-7);
    }
  }
  expect(structuredClone(rich)).toEqual(rich);
  const distances = map.prepareFeatures(features, {
    provenance: {distances: {metric: 'spherical', radius: 1}}
  }).paths.provenance!;
  expect(distances.sourceSegmentIndices).toBeUndefined();
  expect(distances.sourceDistances!.at(-1)).toBeLessThan(p.sourceDistances!.at(-1)!);
  expect(() =>
    map.prepareFeatures(features, {provenance: {distances: {metric: 'spherical', radius: 0}}})
  ).toThrow();
});

test('retracing endpoint coordinates does not manufacture source endpoints', () => {
  for (const line of [
    [
      [-40, 30],
      [-60, 30],
      [-40, 30],
      [-20, 30]
    ],
    [
      [-60, 30],
      [-40, 30],
      [-20, 30],
      [-40, 30]
    ]
  ]) {
    const r = maps[1].prepareFeatures([{geometry: {type: 'LineString', coordinates: line}}], {
      provenance: {sourceSegments: true, boundaries: true}
    });
    const p = r.paths.provenance!;
    for (let part = 0; part < r.paths.parts.length; part++) {
      const start = r.paths.pathStarts[part],
        end = r.paths.pathStarts[part + 1] - 1;
      if (p.startReasons![part] === 'source-endpoint')
        expect(p.sourceSegmentIndices![start]).toBe(0);
      if (p.endReasons![part] === 'source-endpoint')
        expect(p.sourceSegmentIndices![end]).toBe(line.length - 2);
    }
  }
});
test('cap wrappers reject provenance against intermediate sampled fragments', () => {
  const map = new MapEngine({
    version: 1,
    id: 'satellite',
    definition: {type: 'regional', projection: 'satellite'}
  });
  const features: MapFeature[] = [
    {
      geometry: {
        type: 'LineString',
        coordinates: [
          [-10, 0],
          [10, 0]
        ]
      }
    }
  ];
  expect(map.prepareFeatures(features).paths.parts.length).toBeGreaterThan(0);
  for (const provenance of [
    {sourceSegments: true},
    {boundaries: true},
    {distances: {metric: 'spherical' as const, radius: 1}}
  ])
    expect(() => map.prepareFeatures(features, {provenance})).toThrow(/Cap-clipped paths/);
});

test('reconstructing wrappers reject direct path lineage requests explicitly', () => {
  const line: readonly [number, number][] = [
    [-10, 0],
    [10, 0]
  ];
  for (const map of [maps[0], maps[3]]) {
    expect(map.projectLine(line).length).toBeGreaterThan(0);
    expect(() => map.projectLine(line, {pathProvenance: true})).toThrow(
      /do not support source provenance/
    );
    expect(() =>
      map.prepareFeatures([{geometry: {type: 'LineString', coordinates: line}}], {
        provenance: {sourceSegments: true}
      })
    ).toThrow(/do not support source provenance/);
  }
});

test('optional polygon edges preserve holes, source constraints and geometry', () => {
  for (const map of maps.slice(1, 3)) {
    const features: MapFeature[] = [{geometry: polygon}];
    const a = map.prepareFeatures(features),
      b = map.prepareFeatures(features, {provenance: {polygonEdges: true}});
    expect(b.polygons.positions).toEqual(a.polygons.positions);
    expect(b.polygons.sourcePositions).toEqual(a.polygons.sourcePositions);
    expect(b.polygons.ringStarts).toEqual(a.polygons.ringStarts);
    expect(a.polygons.edgeProvenance).toBeUndefined();
    const e = b.polygons.edgeProvenance!;
    expect(e.kinds.length).toBe(b.polygons.positions.length / 2);
    expect(e.sourceParameterRanges.length).toBe(e.kinds.length * 2);
    expect(e.kinds.some(k => k === 1)).toBe(true);
    for (let ring = 0; ring < b.polygons.ringStarts.length - 1; ring++) {
      const end = b.polygons.ringStarts[ring + 1];
      expect(e.kinds[end - 1]).toBe(0);
      for (let i = b.polygons.ringStarts[ring]; i < end - 1; i++) {
        if (e.kinds[i] === 1) {
          expect(e.sourceRingIndices[i]).toBeLessThan(2);
          expect(e.sourceParameterRanges[i * 2]).toBeGreaterThanOrEqual(0);
          expect(e.sourceParameterRanges[i * 2 + 1]).toBeLessThanOrEqual(1);
        } else expect(e.sourceSegmentIndices[i]).toBe(0xffffffff);
      }
    }
    expect(structuredClone(b)).toEqual(b);
  }
});

test('polygon source edge ranges reconstruct source endpoints after winding reversal', () => {
  const geometry = polygon as Extract<MapFeatureGeometry, {type: 'MultiLineString' | 'Polygon'}>;
  for (const reverse of [false, true]) {
    const rings = geometry.coordinates.map(r => (reverse ? [...r].reverse() : r));
    const prepared = maps[1].prepareFeatures([{geometry: {type: 'Polygon', coordinates: rings}}], {
      provenance: {polygonEdges: true}
    });
    const {polygons} = prepared,
      e = polygons.edgeProvenance!;
    const vector = (p: readonly number[]) => {
      const lon = (p[0] * Math.PI) / 180,
        lat = (p[1] * Math.PI) / 180;
      return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
    };
    for (let i = 0; i < e.kinds.length; i++)
      if (e.kinds[i] === 1) {
        const ring = rings[e.sourceRingIndices[i]],
          segment = e.sourceSegmentIndices[i],
          a = vector(ring[segment]),
          b = vector(ring[(segment + 1) % ring.length]);
        const omega = Math.acos(
          Math.max(
            -1,
            Math.min(
              1,
              a.reduce((sum, v, k) => sum + v * b[k], 0)
            )
          )
        );
        for (const endpoint of [0, 1]) {
          const t = e.sourceParameterRanges[i * 2 + endpoint],
            actual = vector(
              Array.from(polygons.sourcePositions.slice((i + endpoint) * 2, (i + endpoint) * 2 + 2))
            );
          const expected = a.map(
            (v, k) => (v * Math.sin((1 - t) * omega) + b[k] * Math.sin(t * omega)) / Math.sin(omega)
          );
          expect(Math.hypot(...expected.map((v, k) => v - actual[k]))).toBeLessThan(1e-9);
        }
      }
  }
  expect(() =>
    maps[0].prepareFeatures([{geometry: polygon}], {provenance: {polygonEdges: true}})
  ).toThrow(/does not support/);
});

test('real polygon boundaries on chart cuts keep source identity', () => {
  const features: MapFeature[] = [
    {
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-40, 20],
            [-20, 20],
            [-20, 50],
            [-40, 50],
            [-40, 20]
          ]
        ]
      }
    }
  ];
  const a = maps[1].prepareFeatures(features),
    b = maps[1].prepareFeatures(features, {provenance: {polygonEdges: true}});
  expect(b.polygons.positions).toEqual(a.polygons.positions);
  expect(b.polygons.edgeProvenance!.kinds.every(k => k === 0 || k === 1)).toBe(true);
  expect(() =>
    maps[1].prepareFeatures(features, {
      provenance: {polygonEdges: true},
      sphericalCuts: {interior: 'left'}
    })
  ).toThrow(/Global spherical cuts/);
});
