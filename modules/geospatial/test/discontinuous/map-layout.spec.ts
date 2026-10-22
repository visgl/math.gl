// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {describe, expect, test} from 'vitest';
import {
  DiscontinuousMap,
  createAirOceanMap,
  createInterruptedSinusoidalMap,
  type GeographicPosition,
  type MapRegion,
  type MapPolygon
} from '../../src/discontinuous';

type XY = [number, number];
const RAD = Math.PI / 180;
const sphere = ([x, y]: GeographicPosition): XY => [
  Math.atan(x) / RAD,
  Math.atan2(y, Math.hypot(1, x)) / RAD
];
const chart = ([lon, lat]: GeographicPosition): XY => [
  Math.tan(lon * RAD),
  Math.tan(lat * RAD) / Math.cos(lon * RAD)
];
const signedArea = (ring: readonly XY[]) =>
  ring.reduce((a, p, i) => {
    const q = ring[(i + 1) % ring.length];
    return a + p[0] * q[1] - p[1] * q[0];
  }, 0) / 2;
const area = (pieces: MapPolygon[]) =>
  pieces.reduce((a, p) => a + p.coordinates.reduce((s, r) => s + signedArea(r), 0), 0);
const rectangle = (west: number, east: number, south: number, north: number): XY[] => [
  [west, south],
  [east, south],
  [east, north],
  [west, north]
];
function region(id: string, west: number, east: number, offset = 0): MapRegion {
  return {
    id,
    boundary: rectangle(west, east, -4, 4).map(sphere),
    interior: sphere([(west + east) / 2, 0]),
    project: chart,
    unproject: sphere,
    placement: [1, 0, 0, 1, offset, 0]
  };
}
const splitMap = () => new DiscontinuousMap([region('west', -4, 0), region('east', 0, 4, 10)]);
const distance = (a: GeographicPosition, b: GeographicPosition) => {
  const [l1, p1] = a.map(v => v * RAD),
    [l2, p2] = b.map(v => v * RAD);
  return (
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2
        )
      )
    )
  );
};
function verifyParts(
  map: DiscontinuousMap,
  parts: {regionId: string; coordinates: XY[]; sourceCoordinates: XY[]}[]
) {
  for (const part of parts) {
    expect(part.coordinates.length).toBe(part.sourceCoordinates.length);
    part.sourceCoordinates.forEach((p, i) => {
      expect(map.findRegions(p)).toContain(part.regionId);
      const projected = map.projectPoint(p, part.regionId)!.position;
      expect(
        Math.hypot(projected[0] - part.coordinates[i][0], projected[1] - part.coordinates[i][1])
      ).toBeLessThan(1e-9);
    });
  }
}

describe('DiscontinuousMap geometry contract', () => {
  test('deterministic boundary ownership, explicit sides, gaps and inverse ambiguity', () => {
    const map = splitMap();
    expect(map.findRegions([0, 0])).toEqual(['west', 'east']);
    expect(map.projectPoint([0, 0])!.regionId).toBe('west');
    expect(map.projectPoint([0, 0], 'east')!.position).toEqual([10, 0]);
    expect(map.projectPoint([180, 0])).toBeNull();
    expect(map.unprojectPoint([5, 0])).toEqual([]);
    expect(map.unprojectPoint([10, 0])).toEqual([{regionId: 'east', position: [0, 0]}]);
    const overlap = new DiscontinuousMap([
      region('west', -4, 0),
      {...region('east', 0, 4), placement: [-1, 0, 0, 1, 0, 0]}
    ]);
    expect(overlap.unprojectPoint([-1, 0]).map(p => p.regionId)).toEqual(['west', 'east']);
  });
  test('seams distinguish joins from cuts', () => {
    expect(splitMap().seams.filter(s => s.kind === 'cut')).toHaveLength(1);
    expect(
      new DiscontinuousMap([region('west', -4, 0), region('east', 0, 4)]).seams.filter(
        s => s.kind === 'join'
      )
    ).toHaveLength(1);
  });
  test('splits crossings, duplicates exact seams, and preserves leave/reenter parts', () => {
    const map = splitMap(),
      line = [
        [-2, 0],
        [2, 0]
      ].map(sphere);
    const pieces = map.projectLine(line);
    expect(pieces.map(p => p.regionId)).toEqual(['west', 'east']);
    expect(pieces[0].coordinates.at(-1)![0]).toBeCloseTo(0, 10);
    expect(pieces[1].coordinates[0][0]).toBeCloseTo(10, 10);
    verifyParts(map, pieces);
    expect(
      map.projectLine([
        [0, -20],
        [0, 20]
      ])
    ).toHaveLength(2);
    const repeated = map.projectLine(
      [
        [-1, 0],
        [1, 0],
        [-1, 1]
      ].map(sphere)
    );
    expect(repeated.filter(p => p.regionId === 'west')).toHaveLength(2);
    expect(
      map.projectLine([
        [10, 10],
        [10, 10]
      ])
    ).toEqual([]);
    expect(map.projectLine([])).toEqual([]);
  });
  test('preserves a hole within a region and reconstructs holes crossing cuts', () => {
    const map = splitMap();
    const outer = rectangle(-3, 3, -3, 3),
      hole = rectangle(-1, 1, -1, 1);
    const pieces = map.projectPolygon([outer.map(sphere), hole.map(sphere)]);
    expect(pieces).toHaveLength(2);
    expect(pieces.every(p => p.coordinates.length === 1)).toBe(true);
    expect(area(pieces)).toBeCloseTo(32, 8);
    const contained = map.projectPolygon([
      outer.map(sphere),
      rectangle(-2.5, -1.5, -1, 1).map(sphere)
    ]);
    expect(contained.find(p => p.regionId === 'west')!.coordinates).toHaveLength(2);
    expect(area(contained)).toBeCloseTo(34, 8);
    for (const p of contained) {
      expect(signedArea(p.coordinates[0])).toBeGreaterThan(0);
      p.coordinates.slice(1).forEach(h => expect(signedArea(h)).toBeLessThan(0));
      p.coordinates.forEach(r => expect(r.at(-1)).toEqual(r[0]));
      verifyParts(
        map,
        p.coordinates.map((r, i) => ({
          regionId: p.regionId,
          coordinates: r,
          sourceCoordinates: p.sourceCoordinates[i]
        }))
      );
    }
    expect(
      area(map.projectPolygon([outer.reverse().map(sphere), hole.reverse().map(sphere)]))
    ).toBeCloseTo(32, 8);
  });
  test('one concave ring can produce multiple disconnected polygons in one region', () => {
    const ring: XY[] = [
      [-3, -3],
      [3, -3],
      [3, -1],
      [-1, -1],
      [-1, 1],
      [3, 1],
      [3, 3],
      [-3, 3]
    ];
    const pieces = splitMap().projectPolygon([ring.map(sphere)]);
    expect(pieces.filter(p => p.regionId === 'east')).toHaveLength(2);
    expect(area(pieces)).toBeCloseTo(28, 8);
  });
  test('self-crossing stars still use nonzero-winding polygon reconstruction', () => {
    const radius = 2;
    const vertices: XY[] = Array.from({length: 5}, (_, i) => [
      radius * Math.cos((i * 2 * Math.PI) / 5),
      radius * Math.sin((i * 2 * Math.PI) / 5)
    ]);
    const star = [0, 2, 4, 1, 3].map(i => sphere(vertices[i]));
    const pieces = new DiscontinuousMap([region('whole', -4, 4)]).projectPolygon([star]);
    const inner = (radius * Math.cos((2 * Math.PI) / 5)) / Math.cos(Math.PI / 5);
    expect(area(pieces)).toBeCloseTo(5 * radius * inner * Math.sin(Math.PI / 5), 8);
  });
  test('handles a seam-coincident ring without jitter or zero-area pieces', () => {
    const map = splitMap(),
      input = rectangle(0, 2, -1, 1).map(sphere);
    const pieces = map.projectPolygon([input]);
    expect(pieces).toHaveLength(1);
    expect(pieces[0].regionId).toBe('east');
    expect(area(pieces)).toBeCloseTo(4, 8);
    expect(map.projectPolygon([input])).toEqual(pieces);
  });
  test('rejects unsupported/ambiguous inputs instead of silently connecting across them', () => {
    const map = splitMap();
    expect(() =>
      map.projectLine([
        [0, 0],
        [180, 0]
      ])
    ).toThrow(/Antipodal/);
    expect(() => map.projectPoint([0, 91])).toThrow(/latitude/);
    expect(() => map.projectPoint([NaN, 0])).toThrow(/finite/);
    expect(() => map.projectPoint([0, 0], 'unknown')).toThrow(/Unknown/);
    expect(() =>
      map.projectLine(
        [
          [0, 0],
          [1, 0]
        ],
        {tolerance: 0}
      )
    ).toThrow(/sampling/);
    expect(() =>
      map.projectPolygon(
        [
          [
            [0, 0],
            [120, 0],
            [-120, 1]
          ]
        ],
        {chartCenter: [0, 0]}
      )
    ).toThrow(/hemisphere/);
    expect(() =>
      map.projectPolygon([
        [
          [0, 0],
          [1, 0]
        ]
      ])
    ).toThrow(/three/);
    expect(() => new DiscontinuousMap([])).toThrow();
    expect(() => new DiscontinuousMap([region('a', -1, 0), region('a', 0, 1)])).toThrow(/unique/);
    expect(
      () => new DiscontinuousMap([{...region('a', -1, 1), placement: [0, 0, 0, 0, 0, 0]}])
    ).toThrow(/invertible/);
  });
});

for (const [name, create] of [
  ['AirOcean', createAirOceanMap],
  ['interrupted sinusoidal', createInterruptedSinusoidalMap]
] as const) {
  describe(name, () => {
    test('global coverage and forward/inverse round trips', () => {
      const map = create();
      for (let lat = -85; lat < 90; lat += 10)
        for (let lon = -177; lon < 180; lon += 10) {
          const source: XY = [lon, lat],
            point = map.projectPoint(source);
          expect(point, `${lon},${lat}`).not.toBeNull();
          const inverse = map.unprojectPoint(point!.position, point!.regionId);
          expect(inverse).toHaveLength(1);
          expect(distance(source, inverse[0].position)).toBeLessThan(1e-7);
        }
      for (const lat of [-90, 90]) expect(map.projectPoint([0, lat])).not.toBeNull();
      expect(map.unprojectPoint([1e5, 1e5])).toEqual([]);
    });
    test('line fragments cover the source great circle without bridging cuts', () => {
      const map = create(),
        source: XY[] = [
          [-155, 30],
          [150, 45]
        ],
        parts = map.projectLine(source);
      expect(parts.length).toBeGreaterThan(1);
      verifyParts(map, parts);
      const length = parts.reduce(
        (sum, p) =>
          sum +
          p.sourceCoordinates
            .slice(1)
            .reduce((s, q, i) => s + distance(p.sourceCoordinates[i], q), 0),
        0
      );
      expect(length).toBeCloseTo(distance(source[0], source[1]), 8);
    });
    test('polygon clipping preserves source area across regions, including a hole', () => {
      const map = create();
      const rings: XY[][] = [
        [
          [135, 5],
          [-155, 5],
          [-155, 55],
          [135, 55]
        ],
        [
          [160, 20],
          [-175, 20],
          [-175, 35],
          [160, 35]
        ]
      ];
      const parts = map.projectPolygon(rings, {chartCenter: [170, 30]});
      expect(parts.length).toBeGreaterThan(1);
      // Independent spherical area oracle; all edges are great circles.
      const sphericalArea = (ring: readonly XY[]) => {
        const vector = ([lon, lat]: XY) => [
          Math.cos(lat * RAD) * Math.cos(lon * RAD),
          Math.cos(lat * RAD) * Math.sin(lon * RAD),
          Math.sin(lat * RAD)
        ];
        const vectors = ring.map(vector),
          a = vectors[0];
        let total = 0;
        for (let i = 1; i < vectors.length - 1; i++) {
          const b = vectors[i],
            c = vectors[i + 1];
          const det =
            a[0] * (b[1] * c[2] - b[2] * c[1]) +
            a[1] * (b[2] * c[0] - b[0] * c[2]) +
            a[2] * (b[0] * c[1] - b[1] * c[0]);
          const dot = (u: number[], v: number[]) => u.reduce((s, x, j) => s + x * v[j], 0);
          total += 2 * Math.atan2(det, 1 + dot(a, b) + dot(b, c) + dot(c, a));
        }
        return Math.abs(total);
      };
      const expected = sphericalArea(rings[0]) - sphericalArea(rings[1]);
      const actual = parts.reduce(
        (s, p) =>
          s + p.sourceCoordinates.reduce((a, r, i) => a + (i === 0 ? 1 : -1) * sphericalArea(r), 0),
        0
      );
      expect(actual).toBeCloseTo(expected, 8);
      for (const p of parts)
        verifyParts(
          map,
          p.coordinates.map((r, i) => ({
            regionId: p.regionId,
            coordinates: r,
            sourceCoordinates: p.sourceCoordinates[i]
          }))
        );
    });
    test('radius scales output, and invalid radii are rejected', () => {
      const a = create().projectPoint([12, 34])!.position,
        b = create({radius: 10}).projectPoint([12, 34])!.position;
      expect(b[0]).toBeCloseTo(10 * a[0], 10);
      expect(b[1]).toBeCloseTo(10 * a[1], 10);
      expect(() => create({radius: 0})).toThrow(/Radius/);
    });
  });
}

test('AirOcean has 24 panels, 23 continuous tree joins and no unpaired edges', () => {
  const map = createAirOceanMap();
  expect(map.regions).toHaveLength(24);
  expect(map.seams.filter(s => s.kind === 'join')).toHaveLength(23);
  expect(map.seams.filter(s => s.kind === 'cut')).toHaveLength(13);
  expect(map.seams.filter(s => s.kind === 'boundary')).toHaveLength(0);
});
test('sinusoidal uses the analytic formula and splits a lobe cut while retaining equatorial joins', () => {
  const map = createInterruptedSinusoidalMap(),
    p = map.projectPoint([-90, 30])!.position;
  expect(p[0]).toBeCloseTo((-120 + 30 * Math.cos(30 * RAD)) * RAD, 12);
  expect(p[1]).toBeCloseTo(30 * RAD, 12);
  const parts = map.projectLine([
    [-70, 30],
    [-50, 30]
  ]);
  expect(parts).toHaveLength(2);
  expect(Math.abs(parts[0].coordinates.at(-1)![0] - parts[1].coordinates[0][0])).toBeGreaterThan(
    0.1
  );
  expect(map.seams.filter(s => s.kind === 'join')).toHaveLength(5);
});

test('third architecture case: regional cylindrical map splits the antimeridian', () => {
  const regions: MapRegion[] = [
    {id: 'west', west: 120, east: 180},
    {id: 'east', west: -180, east: -120}
  ].map(({id, west, east}) => ({
    id,
    boundary: rectangle(west, east, -60, 60),
    interior: [(west + east) / 2, 0],
    project: ([lon, lat]) => [
      (id === 'west' && lon < 0 ? lon + 360 : id === 'east' && lon > 0 ? lon - 360 : lon) * RAD,
      lat * RAD
    ],
    unproject: ([x, y]) => [x / RAD, y / RAD]
  }));
  const map = new DiscontinuousMap(regions),
    parts = map.projectLine([
      [170, 20],
      [-170, 20]
    ]);
  expect(parts).toHaveLength(2);
  expect(parts[0].coordinates.at(-1)![0]).toBeCloseTo(Math.PI, 12);
  expect(parts[1].coordinates[0][0]).toBeCloseTo(-Math.PI, 12);
  expect(map.projectPoint([180, 20])!.regionId).toBe('west');
  expect(map.projectPoint([-180, 20])!.regionId).toBe('west');
  const polygons = map.projectPolygon([
    [
      [170, -10],
      [-170, -10],
      [-170, 10],
      [170, 10]
    ]
  ]);
  expect(polygons).toHaveLength(2);
  verifyParts(map, parts);
});

test('an excursion outside a region stays split even when it returns to the same seam point', () => {
  const parts = splitMap().projectLine(
    [
      [-1, 0],
      [1, 0],
      [-1, 0]
    ].map(sphere)
  );
  expect(parts.filter(p => p.regionId === 'west')).toHaveLength(2);
});

test('AirOcean static placements form a non-overlapping planar net', () => {
  const map = createAirOceanMap();
  const triangles = map.regions.map(region =>
    region.boundary.map(p => map.projectPoint(p, region.id)!.position)
  );
  for (let i = 0; i < triangles.length; i++)
    for (let j = i + 1; j < triangles.length; j++) {
      const a = triangles[i],
        b = triangles[j];
      const separated = [a, b].some(ring =>
        ring.some((p, k) => {
          const q = ring[(k + 1) % ring.length],
            x = q[1] - p[1],
            y = p[0] - q[0];
          const pa = a.map(v => v[0] * x + v[1] * y),
            pb = b.map(v => v[0] * x + v[1] * y);
          return (
            Math.max(...pa) <= Math.min(...pb) + 1e-9 || Math.max(...pb) <= Math.min(...pa) + 1e-9
          );
        })
      );
      expect(separated, `faces ${i} and ${j}`).toBe(true);
    }
});

test('interrupted map supports a polygon containing the north pole', () => {
  const map = createInterruptedSinusoidalMap();
  const parts = map.projectPolygon(
    [
      [
        [-120, 80],
        [0, 80],
        [120, 80]
      ]
    ],
    {chartCenter: [0, 90]}
  );
  expect(parts).toHaveLength(3);
  for (const part of parts) {
    expect(part.coordinates.every(r => r.every(p => p.every(Number.isFinite)))).toBe(true);
    expect(part.sourceCoordinates[0].some(p => Math.abs(p[1] - 90) < 1e-8)).toBe(true);
  }
});

test('AirOcean placements and seam classification are independent of output scale', () => {
  const reference = createAirOceanMap();
  const source: XY = [12, 34];
  const expected = reference.projectPoint(source)!;
  for (const radius of [1e-200, 1e-8, 1e200]) {
    const map = createAirOceanMap({radius});
    const projected = map.projectPoint(source)!;
    expect(projected.position[0] / radius).toBeCloseTo(expected.position[0], 10);
    expect(projected.position[1] / radius).toBeCloseTo(expected.position[1], 10);
    const inverse = map.unprojectPoint(projected.position, projected.regionId);
    expect(inverse).toHaveLength(1);
    expect(distance(inverse[0].position, source)).toBeLessThan(1e-10);
    expect(map.seams.map(seam => seam.kind)).toEqual(reference.seams.map(seam => seam.kind));
  }
});

test('scaled affine placements reject singular matrices and safely invert finite large coefficients', () => {
  for (const scale of [1e-200, 1e200]) {
    expect(
      () =>
        new DiscontinuousMap([
          {...region('a', -2, 2), placement: [scale, scale, scale, scale, 0, 0]}
        ])
    ).toThrow(/invertible/);
    const map = new DiscontinuousMap([
      {...region('a', -2, 2), placement: [scale, scale / 2, -scale / 2, scale, scale, -scale]}
    ]);
    const source = sphere([0.25, 0.5]);
    const projected = map.projectPoint(source)!;
    const inverse = map.unprojectPoint(projected.position);
    expect(inverse).toHaveLength(1);
    expect(distance(inverse[0].position, source)).toBeLessThan(1e-10);
  }
});

test('small geographic exteriors and holes retain their topology without a fixed area floor', () => {
  const tiny: XY[] = [
    [0, 0],
    [1e-6, 0],
    [1e-6, 1e-6],
    [0, 1e-6]
  ];
  for (const map of [createAirOceanMap(), createInterruptedSinusoidalMap()]) {
    const pieces = map.projectPolygon([tiny]);
    expect(pieces).toHaveLength(1);
    expect(pieces[0].sourceCoordinates[0]).toHaveLength(5);
    const translated = pieces[0].sourceCoordinates[0].map(p => [p[0] * 1e6, p[1] * 1e6] as XY);
    expect(Math.abs(signedArea(translated))).toBeCloseTo(1, 5);
    const hole = tiny.map(([x, y]) => [10.1 + x, 10.1 + y] as XY);
    const withHole = map.projectPolygon([rectangle(10, 11, 10, 11), hole]);
    expect(withHole.some(p => p.coordinates.length === 2)).toBe(true);
  }
  expect(() =>
    splitMap().projectPolygon([
      [
        [0, 0],
        [1e-6, 0],
        [2e-6, 0]
      ]
    ])
  ).toThrow(/Degenerate/);
});

test('overlapping copies of a region retain independent seam relations and geometry', () => {
  const map = new DiscontinuousMap([
    region('a', -1, 1),
    region('b', -1, 1),
    region('inset', -1, 1, 10)
  ]);
  expect(map.findRegions([0, 0])).toEqual(['a', 'b', 'inset']);
  expect(map.unprojectPoint([0, 0]).map(p => p.regionId)).toEqual(['a', 'b']);
  expect(map.unprojectPoint([10, 0]).map(p => p.regionId)).toEqual(['inset']);
  expect(map.seams.filter(s => s.kind === 'join')).toHaveLength(4);
  expect(map.seams.filter(s => s.kind === 'cut')).toHaveLength(8);
  expect(
    map.projectLine([
      [-10, 0],
      [10, 0]
    ])
  ).toHaveLength(3);
  expect(map.projectPolygon([rectangle(-0.5, 0.5, -0.5, 0.5).map(sphere)])).toHaveLength(3);
});

test('seam labels depend on placed geometry rather than projection/placement scale factorization', () => {
  const make = (
    id: string,
    west: number,
    east: number,
    offset: number,
    factor: number
  ): MapRegion => ({
    ...region(id, west, east),
    project: p => chart(p).map(v => v / factor) as XY,
    unproject: p => sphere([p[0] * factor, p[1] * factor]),
    placement: [factor, 0, 0, factor, offset, 0]
  });
  for (const factor of [1e-9, 1, 1e9])
    for (const offset of [0, 1e9]) {
      const continuous = new DiscontinuousMap([
        make('west', -4, 0, offset, factor),
        make('east', 0, 4, offset, factor)
      ]);
      expect(continuous.seams.filter(s => s.kind === 'join')).toHaveLength(1);
      const interrupted = new DiscontinuousMap([
        make('west', -4, 0, offset, factor),
        make('east', 0, 4, offset + 1, factor)
      ]);
      expect(interrupted.seams.filter(s => s.kind === 'cut')).toHaveLength(1);
    }
});
