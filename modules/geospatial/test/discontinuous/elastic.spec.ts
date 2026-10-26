// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {ElasticGrid} from '../../src/discontinuous/elastic/grid';
import {MapEngine, createElasticMap} from '../../src/discontinuous';
import {elasticI, elasticII, elasticIII} from '../../src/elastic';
for (const data of [elasticI, elasticII, elasticIII]) {
  test(`${data.name}: global coverage, picking and geometry`, () => {
    const map = new MapEngine({version: 1, id: data.name, definition: {type: 'elastic', data}});
    for (let lat = -85; lat <= 85; lat += 10)
      for (let lon = -175; lon <= 175; lon += 10) {
        const p = map.projectPoint([lon, lat]);
        expect(p, `${lon},${lat}`).not.toBeNull();
        const candidates = map.unprojectPoint(p!.position, p!.regionId);
        expect(
          candidates.some(q => Math.hypot(q.position[0] - lon, q.position[1] - lat) < 1e-5),
          `${lon},${lat}`
        ).toBe(true);
      }
    const line = map.projectLine([
      [-170, 30],
      [0, 45],
      [170, 30]
    ]);
    expect(line.length).toBeGreaterThan(1);
    const polygon = map.projectPolygon([
      [
        [-40, 20],
        [40, 20],
        [40, 60],
        [-40, 60]
      ]
    ]);
    expect(polygon.length).toBeGreaterThan(0);
    for (const part of [
      ...line,
      ...polygon.flatMap(p =>
        p.coordinates.map((r, i) => ({
          regionId: p.regionId,
          coordinates: r,
          sourceCoordinates: p.sourceCoordinates[i]
        }))
      )
    ])
      for (let i = 0; i < part.coordinates.length; i++) {
        const p = map.projectPoint(part.sourceCoordinates[i], part.regionId);
        expect(p).not.toBeNull();
        expect(
          Math.hypot(
            p!.position[0] - part.coordinates[i][0],
            p!.position[1] - part.coordinates[i][1]
          )
        ).toBeLessThan(1e-8);
      }
    expect(map.fit({width: 800, height: 500}).scale).toBeGreaterThan(0);
  });
}

import {parseElasticMap, type ElasticMapData} from '../../src/discontinuous';
const rectangle: [number, number][] = [
  [-180, -90],
  [180, -90],
  [180, 90],
  [-180, 90],
  [-180, -90]
];
function synthetic(): ElasticMapData {
  return {
    version: 1,
    name: 'linear grid',
    radius: 1,
    sections: [
      {
        id: 'a',
        rows: 3,
        columns: 5,
        boundary: rectangle,
        values: Array.from({length: 15}, (_, i) => [
          -180 + (i % 5) * 90,
          -90 + Math.floor(i / 5) * 90
        ]).flat()
      }
    ]
  };
}
test('sampled maps preserve holes and split lines at concave domains', () => {
  const data = synthetic();
  data.sections[0].boundary = [
    [-50, -50],
    [50, -50],
    [50, 50],
    [10, 50],
    [10, 0],
    [-10, 0],
    [-10, 50],
    [-50, 50],
    [-50, -50]
  ];
  const map = createElasticMap(data);
  expect(map.projectPoint([0, 20])).toBeNull();
  expect(map.projectPoint([20, 20])).not.toBeNull();
  const pieces = map.projectLine([
    [-40, 20],
    [40, 20]
  ]);
  expect(pieces.length).toBeGreaterThanOrEqual(2);
  for (const part of pieces)
    expect(part.sourceCoordinates.every(p => Math.abs(p[0]) >= 10 - 1e-8)).toBe(true);
  const full = createElasticMap(synthetic());
  const polygons = full.projectPolygon([
    [
      [10, 10],
      [60, 10],
      [60, 60],
      [10, 60]
    ],
    [
      [20, 20],
      [20, 30],
      [30, 30],
      [30, 20]
    ]
  ]);
  expect(polygons.some(p => p.coordinates.length === 2)).toBe(true);
});
test('overlaps retain inverse candidates and gaps reject picking', () => {
  const data = synthetic();
  const first = data.sections[0];
  data.sections = [first, {...first, id: 'b', values: [...first.values]}];
  const map = createElasticMap(data);
  expect(map.unprojectPoint([15, 25]).length).toBe(2);
  expect(map.unprojectPoint([500, 500])).toEqual([]);
  expect(map.projectPoint([375, 25])!.position[0]).toBeCloseTo(15, 10);
  expect(map.projectPoint([375, 25])!.position[1]).toBeCloseTo(25, 10);
  expect(() => map.projectPoint([0, 0], 'missing')).toThrow();
  expect(() => map.unprojectPoint([NaN, 0])).toThrow();
  expect(() => map.projectPoint([0, 91])).toThrow();
});
test('data and output scale are independent snapshots', () => {
  const data = synthetic();
  const map = new MapEngine({
    version: 1,
    id: 'snapshot',
    radius: 2,
    definition: {type: 'elastic', data}
  });
  const point = map.projectPoint([20, 30])!;
  expect(point.position[0]).toBeCloseTo(40, 10);
  expect(point.position[1]).toBeCloseTo(60, 10);
  (data.sections[0].values as number[])[0] = 99999;
  expect(map.projectPoint([20, 30])).toEqual(point);
  expect(
    map
      .unprojectPoint(point.position)
      .some(p => Math.hypot(p.position[0] - 20, p.position[1] - 30) < 1e-7)
  ).toBe(true);
  expect(map.capabilities.hinged).toBe(false);
  expect(() => map.evaluate({type: 'hinge', amount: 0.5})).toThrow();
  expect(map.evaluate({type: 'globe'}).projectPoint([20, 30], point.regionId)).toBeDefined();
});
test('missing nodes are not silently extrapolated', () => {
  const data = synthetic();
  const values = data.sections[0].values as (number | null)[];
  values[12] = null;
  values[13] = null;
  const map = createElasticMap(data);
  expect(map.projectPoint([-45, 20])).toBeNull();
  expect(map.unprojectPoint([-45, 20])).toEqual([]);
  expect(() =>
    map.projectLine([
      [-60, 20],
      [-30, 20]
    ])
  ).toThrow(/undefined/);
});
test('complement boundaries, dateline and polar points', () => {
  const data = synthetic();
  data.sections[0].boundary = [
    [-20, -20],
    [20, -20],
    [20, 20],
    [-20, 20],
    [-20, -20]
  ];
  data.sections[0].complement = true;
  const map = createElasticMap(data);
  expect(map.projectPoint([0, 0])).toBeNull();
  expect(map.projectPoint([40, 0])).not.toBeNull();
  for (const data of [elasticI, elasticII, elasticIII]) {
    const map = createElasticMap(data);
    for (const p of [
      [-180, 40],
      [180, 40],
      [0, 90],
      [0, -90]
    ] as [number, number][])
      expect(map.projectPoint(p)).not.toBeNull();
    expect(
      map
        .projectLine([
          [170, 30],
          [-170, 30]
        ])
        .every(p => p.sourceCoordinates.every(q => Math.abs(q[0]) > 169))
    ).toBe(true);
  }
});
test.each([
  [
    'version',
    (d: ElasticMapData) => {
      d.version = 2 as 1;
    }
  ],
  [
    'radius',
    (d: ElasticMapData) => {
      d.radius = 0;
    }
  ],
  [
    'empty',
    (d: ElasticMapData) => {
      d.sections = [];
    }
  ],
  [
    'duplicate',
    (d: ElasticMapData) => {
      d.sections = [d.sections[0], d.sections[0]];
    }
  ],
  [
    'unclosed',
    (d: ElasticMapData) => {
      d.sections[0].boundary = rectangle.slice(0, 4);
    }
  ],
  [
    'bounds',
    (d: ElasticMapData) => {
      d.sections[0].boundary = [[200, 0], ...rectangle];
    }
  ],
  [
    'dimensions',
    (d: ElasticMapData) => {
      d.sections[0].rows = 1;
    }
  ],
  [
    'length',
    (d: ElasticMapData) => {
      d.sections[0].values = [];
    }
  ],
  [
    'infinite',
    (d: ElasticMapData) => {
      (d.sections[0].values as number[])[0] = Infinity;
    }
  ],
  [
    'unpaired',
    (d: ElasticMapData) => {
      (d.sections[0].values as (number | null)[])[0] = null;
    }
  ],
  [
    'undefined',
    (d: ElasticMapData) => {
      d.sections[0].values = d.sections[0].values.map(() => null);
    }
  ]
])('invalid Elastic %s is rejected', (_, mutate) => {
  const data = synthetic();
  mutate(data);
  expect(() => createElasticMap(data)).toThrow();
});
const text = `Tiny projection (1 sections):
section 0:
boundary (5 vertices):
-90,-180
-90,180
90,180
90,-180
-90,-180
projected points (2x2 points):
-1,-1,1,-1
-1,1,1,1
projected boundary (5 vertices):
-1,-1
1,-1
1,1
-1,1
-1,-1
inverse-projected points (2x2 points):
-1,-1,1,1
-90,-180,90,-180
-90,180,90,180`;
test('published parser converts axes, orientation and units', () => {
  const data = parseElasticMap(text, {radius: 1});
  expect(data.sections[0].boundary).toEqual(rectangle);
  expect(data.sections[0].complement).toBe(false);
  expect(createElasticMap(data).projectPoint([90, 45])!.position).toEqual([0.5, 0.5]);
  const reversed = text.replace(
    '-90,-180\n-90,180\n90,180\n90,-180\n-90,-180',
    '-90,-180\n90,-180\n90,180\n-90,180\n-90,-180'
  );
  expect(parseElasticMap(reversed).sections[0].complement).toBe(true);
  expect(
    parseElasticMap(text.replace('-1,-1,1,-1', 'NaN,NaN,1,-1')).sections[0].values[0]
  ).toBeNull();
});
test.each([
  text + '\njunk',
  text.replace('2x2', '0x2'),
  text.replace('2x2', '99999x2'),
  text.replace('-1,-1,1,-1', 'Infinity,-1,1,-1'),
  text.replace('Tiny projection', 'garbage'),
  text.replace('-1,-1,1,-1', '-1,-1')
])('malformed text fails explicitly', value => expect(() => parseElasticMap(value)).toThrow());
test('invalid sampling and work limits fail explicitly', () => {
  const map = createElasticMap(synthetic());
  expect(() =>
    map.projectLine(
      [
        [0, 0],
        [10, 10]
      ],
      {tolerance: 0}
    )
  ).toThrow();
  expect(() =>
    map.projectPolygon(
      [
        [
          [0, 0],
          [10, 0],
          [10, 10]
        ]
      ],
      {maxAngularStep: 91}
    )
  ).toThrow();
  expect(() => map.getRegionOutlines(map.regions[0].id, {maxAngularStep: 1e-12})).toThrow(/limit/);
});

import textI from './fixtures/elastic/elastic-I.txt?raw';
import textII from './fixtures/elastic/elastic-II.txt?raw';
import textIII from './fixtures/elastic/elastic-III.txt?raw';
test.each([
  [elasticI, textI],
  [elasticII, textII],
  [elasticIII, textIII]
] as const)('published text reproduces bundled tables: $0.name', (data, text) => {
  expect(parseElasticMap(text)).toEqual(data);
});

test.each([1e-12, 1, 1e12])('inverse conditioning is independent of map radius %s', radius => {
  const map = createElasticMap(synthetic(), {radius});
  const hit = map.projectPoint([37, 23])!;
  expect(
    map
      .unprojectPoint(hit.position)
      .some(p => Math.hypot(p.position[0] - 37, p.position[1] - 23) < 1e-7)
  ).toBe(true);
});
test('bilinear folds preserve both inverse branches', () => {
  const data = synthetic();
  data.sections = [{...data.sections[0], rows: 2, columns: 2, values: [0, 0, 1, 0, 1, 0, 2, 1]}];
  // x=u+v, y=u*v: (u,v)=(.2,.8) and (.8,.2) share the same XY.
  const map = createElasticMap(data);
  const hits = map.unprojectPoint([1, 0.16]);
  expect(hits.some(p => Math.hypot(p.position[0] + 108, p.position[1] - 54) < 1e-6)).toBe(true);
  expect(hits.some(p => Math.hypot(p.position[0] - 108, p.position[1] + 54) < 1e-6)).toBe(true);
});

test('fast path never bridges an enclosed exclusion or undefined grid cell', () => {
  const data = synthetic();
  const map = createElasticMap(data);
  expect(
    map.containsConvexPolygon(
      [
        [20, 20],
        [30, 20],
        [30, 30],
        [20, 30]
      ],
      'a/north-2'
    )
  ).toBe(true);
  data.sections[0].boundary = [
    [24, 24],
    [26, 24],
    [26, 26],
    [24, 26],
    [24, 24]
  ];
  data.sections[0].complement = true;
  const hole = createElasticMap(data);
  expect(
    hole.containsConvexPolygon(
      [
        [20, 20],
        [30, 20],
        [30, 30],
        [20, 30]
      ],
      'a/north-2'
    )
  ).toBe(false);
  expect(
    hole.containsConvexPolygon(
      [
        [85, 85],
        [95, 85],
        [95, 89],
        [85, 89]
      ],
      'a/north-2'
    )
  ).toBe(false);
  const sparse = synthetic();
  (sparse.sections[0].values as (number | null)[])[14] = null;
  (sparse.sections[0].values as (number | null)[])[15] = null;
  expect(
    createElasticMap(sparse).containsConvexPolygon(
      [
        [20, 20],
        [30, 20],
        [30, 30],
        [20, 30]
      ],
      'a/north-2'
    )
  ).toBe(false);
});

test('complement cut edges retain boundary-inclusive ownership', () => {
  const data = synthetic();
  data.sections[0].boundary = [
    [20, 20],
    [30, 20],
    [30, 30],
    [20, 30],
    [20, 20]
  ];
  data.sections[0].complement = true;
  const map = createElasticMap(data);
  const polygons = map.projectPolygon([
    [
      [10, 10],
      [40, 10],
      [40, 40],
      [10, 40]
    ]
  ]);
  expect(polygons.some(p => p.coordinates.length === 2)).toBe(true);
  for (const part of polygons)
    for (const ring of part.sourceCoordinates)
      for (const p of ring) expect(map.projectPoint(p, part.regionId)).not.toBeNull();
});

import reference from './fixtures/elastic/reference.json';
test('published forward coordinates match an independent reference calculation', () => {
  const maps = Object.fromEntries(
    [
      ['I', elasticI],
      ['II', elasticII],
      ['III', elasticIII]
    ].map(([name, data]) => [name, createElasticMap(data as ElasticMapData, {radius: 6371})])
  );
  expect(reference.length).toBe(126);
  for (const record of reference) {
    const hit = maps[record.preset].projectPoint(record.source as [number, number])!;
    expect(hit.regionId.split('/')[0]).toBe(record.section);
    expect(hit.position[0]).toBeCloseTo(record.kilometers[0], 7);
    expect(hit.position[1]).toBeCloseTo(record.kilometers[1], 7);
  }
});

import {contains, indexDomain, type Polygons} from '../../src/discontinuous/elastic/geometry';
test('indexed coverage agrees with direct polygon tests at edges and latitude bucket boundaries', () => {
  const domain: Polygons = [
    [
      [
        [-80, -70],
        [80, -70],
        [80, 70],
        [10, 70],
        [10, 0],
        [-10, 0],
        [-10, 70],
        [-80, 70],
        [-80, -70]
      ],
      [
        [20, 20],
        [30, 20],
        [30, 30],
        [20, 30],
        [20, 20]
      ]
    ]
  ];
  const indexed = indexDomain(domain);
  for (let lat = -90; lat <= 90; lat += 180 / 64)
    for (let lon = -90; lon <= 90; lon += 5)
      expect(indexed([lon, lat])).toBe(contains(domain, [lon, lat]));
  for (const polygon of domain)
    for (const ring of polygon)
      for (const [x, y] of ring)
        for (const d of [-1e-7, 0, 1e-7])
          expect(indexed([x + d, y + d])).toBe(contains(domain, [x + d, y + d]));
});

test('output scaling does not turn cuts into joins', () => {
  const normal = createElasticMap(elasticI),
    tiny = createElasticMap(elasticI, {radius: 1e-12});
  expect(tiny.seams.map(s => s.kind)).toEqual(normal.seams.map(s => s.kind));
  expect(() => createElasticMap(elasticI, {radius: 1e308})).toThrow(/representable/);
  const bad = synthetic();
  bad.sections[0].complement = 'yes' as unknown as boolean;
  expect(() => createElasticMap(bad)).toThrow(/complement/);
});

test('collapsed polar edges retain residual-checked inverse representatives', () => {
  for (const data of [elasticI, elasticII, elasticIII]) {
    const map = createElasticMap(data);
    for (const latitude of [-90, 90]) {
      const hit = map.projectPoint([0, latitude])!;
      const candidates = map.unprojectPoint(hit.position, hit.regionId);
      expect(
        candidates.some(p => Math.abs(p.position[1] - latitude) < 1e-7),
        data.name
      ).toBe(true);
      for (const candidate of candidates) {
        const projected = map.projectPoint(candidate.position, candidate.regionId)!;
        expect(
          Math.hypot(
            projected.position[0] - hit.position[0],
            projected.position[1] - hit.position[1]
          )
        ).toBeLessThan(1e-8);
      }
    }
  }
});
test('constant cells return representatives only for their collapsed image', () => {
  const data = synthetic();
  data.sections = [{...data.sections[0], rows: 2, columns: 2, values: [3, 7, 3, 7, 3, 7, 3, 7]}];
  const grid = new ElasticGrid(data.sections[0], 1);
  expect(grid.inverse([3, 7]).length).toBeGreaterThan(0);
  expect(grid.inverse([3.000001, 7])).toEqual([]);
});
