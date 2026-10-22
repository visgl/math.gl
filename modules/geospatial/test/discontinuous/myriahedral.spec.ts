// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createMyriahedralMap,
  createMyriahedralLayout,
  MYRIAHEDRAL_PRESETS,
  type MyriahedralSolid
} from '../../src/discontinuous';
import {angle, geographic} from '../../src/discontinuous/math';

const isLand = ([longitude, latitude]: readonly [number, number]) =>
  longitude > -40 && longitude < 70 && latitude > -30;
for (const preset of MYRIAHEDRAL_PRESETS) {
  test(`myriahedral ${preset}: global coverage, inverse, seams and rigid motion`, () => {
    const map = createMyriahedralMap({preset, columns: 12, subdivisions: 1, isLand});
    const {layout} = map;
    expect(layout.edges.filter(e => e.hinge)).toHaveLength(layout.mesh.faces.length - 1);
    expect(map.seams.some(s => s.kind === 'boundary')).toBe(false);
    const flat = layout.evaluate(1);
    expect(Math.max(...flat.flat().map(p => Math.abs(p[2])))).toBeLessThan(1e-10);
    for (let lat = -87; lat <= 87; lat += 29)
      for (let lon = -177; lon < 180; lon += 31) {
        const point = map.projectPoint([lon, lat]);
        expect(point).not.toBeNull();
        const inverse = map.unprojectPoint(point!.position, point!.regionId);
        expect(inverse).toHaveLength(1);
        expect(angle(geographic(inverse[0].position), geographic([lon, lat]))).toBeLessThan(1e-8);
      }
    for (const lat of [-90, 90]) expect(map.projectPoint([0, lat])).not.toBeNull();
    for (let i = 0; i < layout.mesh.faces.length; i++) {
      layout.mesh.faces[i].forEach((v, j) => {
        const source = layout.mesh.vertices[v];
        const point = map.projectPoint(
          [
            (Math.atan2(source[1], source[0]) * 180) / Math.PI,
            (Math.asin(source[2]) * 180) / Math.PI
          ],
          `panel-${i}`
        )!;
        expect(
          Math.hypot(point.position[0] - flat[i][j][0], point.position[1] - flat[i][j][1])
        ).toBeLessThan(1e-9);
      });
    }
    const halfway = layout.evaluate(0.5);
    for (const e of layout.edges.filter(e => e.hinge)) {
      const [a, b] = e.faces;
      for (const vertex of [e.a, e.b]) {
        const p = halfway[a][layout.mesh.faces[a].indexOf(vertex)],
          q = halfway[b][layout.mesh.faces[b].indexOf(vertex)];
        expect(Math.hypot(...p.map((v, k) => v - q[k]))).toBeLessThan(1e-10);
      }
      expect(
        map.seams.find(s => s.regions.includes(`panel-${a}`) && s.regions.includes(`panel-${b}`))!
          .kind
      ).toBe('join');
    }
    for (const [i, face] of layout.mesh.faces.entries()) {
      const p = layout.mesh.vertices[face[0]],
        q = layout.mesh.vertices[face[1]];
      expect(Math.hypot(...halfway[i][0].map((v, k) => v - halfway[i][1][k]))).toBeCloseTo(
        Math.hypot(...p.map((v, k) => v - q[k])),
        10
      );
    }
  });
}

test('graticule strategies produce distinct deterministic cuts, and hemispheres join once at equator', () => {
  const patterns = new Set<string>();
  for (const preset of ['polyconic', 'cylindric', 'azimuthal', 'hemispheres'] as const) {
    const a = createMyriahedralLayout({preset, columns: 12});
    const b = createMyriahedralLayout({preset, columns: 12});
    const key = (layout: typeof a) =>
      layout.edges
        .filter(e => e.hinge)
        .map(e => `${e.a}:${e.b}`)
        .join(',');
    expect(key(a)).toBe(key(b));
    patterns.add(key(a));
    if (preset === 'hemispheres')
      expect(
        a.edges.filter(
          e =>
            e.hinge &&
            e.a !== 0 &&
            Math.abs(a.mesh.vertices[e.a][2]) < 1e-10 &&
            Math.abs(a.mesh.vertices[e.b][2]) < 1e-10
        )
      ).toHaveLength(1);
  }
  expect(patterns.size).toBe(4);
});

for (const solid of [
  'tetrahedron',
  'cube',
  'octahedron',
  'dodecahedron',
  'icosahedron'
] as MyriahedralSolid[]) {
  test(`${solid}: unsubdivided and recursively subdivided spherical panels`, () => {
    for (const subdivisions of [0, 1, 2]) {
      const map = createMyriahedralMap({preset: 'polyhedral', solid, subdivisions});
      const mesh = map.layout.mesh;
      expect(mesh.vertices.length - map.layout.edges.length + mesh.faces.length).toBe(2);
      expect(map.seams.every(s => s.regions.length === 2)).toBe(true);
      expect(map.projectPoint([17, 23])).not.toBeNull();
    }
  });
}

test('seam-aware lines and polygon holes retain geographic coordinates across date line', () => {
  const map = createMyriahedralMap({columns: 12});
  const parts = map.projectLine([
    [165, 10],
    [-165, 15]
  ]);
  expect(parts.length).toBeGreaterThan(1);
  const polygons = map.projectPolygon([
    [
      [160, -20],
      [-160, -20],
      [-160, 20],
      [160, 20]
    ],
    [
      [170, -10],
      [170, 10],
      [-170, 10],
      [-170, -10]
    ]
  ]);
  expect(polygons.length).toBeGreaterThan(1);
  for (const part of parts)
    part.coordinates.forEach((p, i) => {
      const inverse = map.unprojectPoint(p, part.regionId)[0];
      expect(
        angle(geographic(inverse.position), geographic(part.sourceCoordinates[i]))
      ).toBeLessThan(1e-8);
    });
  for (const part of polygons) {
    expect(part.coordinates[0][0]).toEqual(part.coordinates[0].at(-1));
    part.coordinates.forEach((ring, r) =>
      ring.forEach((p, i) => {
        const inverse = map.unprojectPoint(p, part.regionId)[0];
        expect(
          angle(geographic(inverse.position), geographic(part.sourceCoordinates[r][i]))
        ).toBeLessThan(1e-8);
      })
    );
  }
  expect(map.unprojectPoint([100, 100])).toEqual([]);
});

test('radius scales both map and animation; supplied mesh and geography remain independent', () => {
  const base = createMyriahedralMap({columns: 12});
  expect(base.layout.cutLandRadians).toBeUndefined();
  const scaled = createMyriahedralMap({columns: 12, radius: 7});
  const p = base.projectPoint([33, 21])!,
    q = scaled.projectPoint([33, 21])!;
  expect(q.regionId).toBe(p.regionId);
  q.position.forEach((v, i) => expect(v).toBeCloseTo(p.position[i] * 7, 10));
  const original = base.layout.evaluate(0.4),
    larger = scaled.layout.evaluate(0.4);
  expect(larger[2][0][1]).toBeCloseTo(original[2][0][1] * 7, 10);
  const mesh = base.layout.mesh;
  const custom = createMyriahedralMap({mesh});
  const before = custom.projectPoint([33, 21]);
  mesh.vertices[0][0] = 99;
  expect(custom.projectPoint([33, 21])).toEqual(before);
  const land = createMyriahedralLayout({columns: 12, preset: 'sealine', isLand});
  const sea = createMyriahedralLayout({columns: 12, preset: 'coastline', isLand});
  expect(land.cutLandRadians!).toBeLessThan(sea.cutLandRadians!);
});

test('invalid options, mesh, weights, and animation are rejected', () => {
  for (const radius of [0, -1, NaN, Infinity])
    expect(() => createMyriahedralMap({radius})).toThrow();
  for (const columns of [0, 13, 100, NaN]) expect(() => createMyriahedralMap({columns})).toThrow();
  for (const preset of ['sealine', 'coastline'] as const)
    expect(() => createMyriahedralMap({preset})).toThrow('isLand');
  expect(() => createMyriahedralMap({preset: 'unknown' as never})).toThrow();
  expect(() => createMyriahedralMap({centralMeridian: NaN})).toThrow();
  expect(() => createMyriahedralMap({landSampleStep: 0})).toThrow();
  expect(() => createMyriahedralMap({preset: 'polyhedral', subdivisions: 4})).toThrow();
  expect(() => createMyriahedralMap({preset: 'polyhedral', solid: 'bad' as never})).toThrow();
  expect(() => createMyriahedralMap({columns: 12, edgeWeight: () => NaN})).toThrow();
  expect(() => createMyriahedralMap({mesh: {vertices: [], faces: []}})).toThrow();
  const source = createMyriahedralLayout({preset: 'polyhedral', solid: 'cube', subdivisions: 0});
  for (const amount of [-0.1, 1.1, NaN]) expect(() => source.evaluate(amount)).toThrow();
  const copy = () => JSON.parse(JSON.stringify(source.mesh));
  let mesh = copy();
  mesh.vertices[0][0] = 9;
  expect(() => createMyriahedralMap({mesh})).toThrow('unit sphere');
  mesh = copy();
  mesh.faces[0][0] = -1;
  expect(() => createMyriahedralMap({mesh})).toThrow('indices');
  mesh = copy();
  mesh.faces[0].reverse();
  expect(() => createMyriahedralMap({mesh})).toThrow('outward');
  mesh = copy();
  mesh.faces.pop();
  expect(() => createMyriahedralMap({mesh})).toThrow('two-manifold');
});

test('overlapping nets return all inverse candidates and accept a panel hint', () => {
  const map = createMyriahedralMap({
    columns: 24,
    edgeWeight: edge => Math.sin(edge.vertices[0] * 12 + edge.vertices[1] * 17)
  });
  expect(map.layout.overlaps).toBeGreaterThan(0);
  let found = false;
  for (const region of map.regions) {
    for (const vertex of region.boundary) {
      // Interior samples near corners detect narrow overlaps without picking a seam.
      const p = map.projectPoint(
        [
          region.interior[0] * 0.05 + vertex[0] * 0.95,
          region.interior[1] * 0.05 + vertex[1] * 0.95
        ],
        region.id
      );
      if (!p) continue;
      const candidates = map.unprojectPoint(p.position);
      if (candidates.length < 2) continue;
      found = true;
      expect(new Set(candidates.map(c => c.regionId)).size).toBe(candidates.length);
      expect(map.unprojectPoint(p.position, region.id)).toHaveLength(1);
      for (const candidate of candidates) {
        const projected = map.projectPoint(candidate.position, candidate.regionId)!;
        expect(Math.hypot(...projected.position.map((v, i) => v - p.position[i]))).toBeLessThan(
          1e-8
        );
      }
      break;
    }
    if (found) break;
  }
  expect(found).toBe(true);
});

test('land callbacks are sampled once per edge and custom weights receive geographic metadata', () => {
  let calls = 0,
    weights = 0;
  const layout = createMyriahedralLayout({
    columns: 12,
    landSampleStep: 1,
    isLand: () => {
      calls++;
      return true;
    },
    edgeWeight: (edge, weight) => {
      weights++;
      expect(edge.landFraction).toBe(1);
      expect(edge.arcLength).toBeGreaterThan(0);
      expect(Object.isFrozen(edge)).toBe(true);
      return weight;
    }
  });
  const expected = layout.edges.reduce(
    (sum, edge) =>
      sum +
      Math.max(
        1,
        Math.ceil(
          (angle(layout.mesh.vertices[edge.a], layout.mesh.vertices[edge.b]) * 180) / Math.PI
        )
      ),
    0
  );
  expect(calls).toBe(expected);
  expect(weights).toBe(layout.edges.length);
});
