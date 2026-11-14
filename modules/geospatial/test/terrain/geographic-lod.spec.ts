// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  createTerrainMesh,
  discoverGeographicTerrainLodSeams,
  discoverGeographicTerrainPoles,
  GeographicHeightField,
  getGeographicTerrainNeighbor,
  HeightField,
  measureGeographicTerrainSeam,
  selectTerrainLod,
  stitchTerrainLodCut,
  TerrainSampleStatus,
  wrapTerrainLongitude,
  type TerrainLodCandidate
} from '@math.gl/geospatial/terrain';

test('wrapped seam compares mixed stencils and preserves polar and residency status', () => {
  const a = new GeographicHeightField({
    bounds: [179, 88, 180, 89],
    width: 2,
    height: 2,
    heights: Float64Array.of(0, 100, 0, 100)
  });
  const b = new GeographicHeightField({
    bounds: [-180, 88, -179, 89],
    width: 3,
    height: 2,
    heights: Float64Array.of(100, 200, 300, 100, 200, 300)
  });
  const [seam, pole] = measureGeographicTerrainSeam(a, b, [
    [540, 88.5],
    [180, 90]
  ]);
  expect(seam.heightJump).toBe(0);
  expect(seam.normalAngle).toBeGreaterThan(0);
  expect(pole.statusA).toBe(TerrainSampleStatus.OUTSIDE_DOMAIN);
  expect(pole.normalAngle).toBeNull();
  const [evicted] = measureGeographicTerrainSeam(a, null, [[180, 88.5]]);
  expect(evicted.statusB).toBe(TerrainSampleStatus.NOT_RESIDENT);
  expect(evicted.heightJump).toBeNull();
  expect(wrapTerrainLongitude(180, -180, 180)).toBe(-180);
  expect(wrapTerrainLongitude(0, 179, 181)).toBeUndefined();
});

test('LOD projection, hysteresis and missing children retain a complete resident cut', () => {
  const leaf: TerrainLodCandidate = {
    id: 'leaf',
    min: [0, 0, 0],
    max: [1, 1, 0],
    geometricError: 0,
    resident: true
  };
  const root = {...leaf, id: 'root', geometricError: 1, children: [leaf]};
  const view = {
    position: [0, 0, 55] as const,
    verticalFov: Math.PI / 2,
    viewportHeight: 1000,
    targetPixels: 10
  };
  expect(selectTerrainLod([root], view).selected[0].tile.id).toBe('root');
  const refined = selectTerrainLod([root], {...view, previouslyRefined: new Set(['root'])});
  expect(refined.selected[0].tile.id).toBe('leaf');
  expect(
    selectTerrainLod([{...root, children: [{...leaf, resident: false}]}], {
      ...view,
      position: [0, 0, 1]
    }).selected[0].tile.id
  ).toBe('root');
  expect(() => selectTerrainLod([root], {...view, position: [0, 0, 1], maxVisited: 1})).toThrow(
    /limit/
  );
});

test('sparse cut inserts only the two half-side chains and preserves total area', () => {
  const make = (width: number, height: number, x: number, y: number, step: number) =>
    createTerrainMesh(
      new HeightField({
        width,
        height,
        heights: new Float64Array(width * height),
        origin: [x, y],
        columnStep: [step, 0],
        rowStep: [0, step]
      })
    );
  const coarse = make(3, 3, 0, 0, 1);
  const south = make(3, 3, 2, 0, 0.5),
    north = make(3, 3, 2, 1, 0.5);
  const output = stitchTerrainLodCut(
    [coarse, south, north],
    [
      {a: 0, edgeA: 'maxColumn', b: 1, edgeB: 'minColumn', options: {rangeA: [0, 0.5]}},
      {a: 0, edgeA: 'maxColumn', b: 2, edgeB: 'minColumn', options: {rangeA: [0.5, 1]}}
    ]
  );
  expect(output[0].indices.length / 3).toBe(10);
  expect(output[1].indices.length / 3).toBe(8);
  expect(output[2].indices.length / 3).toBe(8);
  expect(coarse.indices.length / 3).toBe(8);
  const p = output[0].positions,
    ids = output[0].indices;
  let area = 0;
  for (let i = 0; i < ids.length; i += 3) {
    const a = 3 * ids[i],
      b = 3 * ids[i + 1],
      c = 3 * ids[i + 2];
    area += ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])) / 2;
  }
  expect(area).toBe(4);
});

test('same-level terrain seams agree from both sides, including wrapped aliases', () => {
  const level = 2;
  const edgePairs = [
    ['west', 'east'],
    ['north', 'south']
  ] as const;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const tile = {x, y, level};
      for (const [ownerEdge, otherEdge] of edgePairs) {
        const seam = getGeographicTerrainNeighbor(tile, ownerEdge);
        if (ownerEdge === 'north' && y === 0) {
          expect(seam).toBeNull();
          continue;
        }
        expect(seam?.owner).toEqual(tile);
        expect(seam?.ownerEdge).toBe(ownerEdge);
        expect(seam?.otherEdge).toBe(otherEdge);
        expect(seam?.crossesAntimeridian).toBe(ownerEdge === 'west' && x === 0);
        expect(getGeographicTerrainNeighbor(seam!.other, otherEdge)).toEqual(seam);
      }
    }
  }
  expect(getGeographicTerrainNeighbor({x: 0, y: 3, level}, 'south')).toBeNull();
  const world = {x: 0, y: 0, level: 0};
  expect(getGeographicTerrainNeighbor(world, 'west')).toEqual({
    owner: world,
    ownerEdge: 'west',
    other: world,
    otherEdge: 'east',
    crossesAntimeridian: true
  });
  expect(getGeographicTerrainNeighbor(world, 'east')).toEqual(
    getGeographicTerrainNeighbor(world, 'west')
  );
  expect(() => getGeographicTerrainNeighbor({x: 4, y: 0, level}, 'east')).toThrow(RangeError);
  expect(() => getGeographicTerrainNeighbor(world, 'invalid' as 'west')).toThrow(RangeError);
});

test('resident geographic cut discovers fine edge spans and stitches a wrapped coarse edge', () => {
  const cut = [
    {x: 0, y: 0, level: 1},
    {x: 3, y: 0, level: 2},
    {x: 3, y: 1, level: 2}
  ];
  const seams = discoverGeographicTerrainLodSeams(cut);
  expect(seams).toEqual([
    {
      a: 0,
      edgeA: 'minColumn',
      b: 1,
      edgeB: 'maxColumn',
      offsetBX: -360,
      options: {rangeA: [0, 0.5]}
    },
    {
      a: 0,
      edgeA: 'minColumn',
      b: 2,
      edgeB: 'maxColumn',
      offsetBX: -360,
      options: {rangeA: [0.5, 1]}
    }
  ]);
  const make = (x: number, y: number, dx: number, dy: number) =>
    createTerrainMesh(
      new HeightField({
        width: 3,
        height: 3,
        heights: new Float64Array(9),
        origin: [x, y],
        columnStep: [dx, 0],
        rowStep: [0, dy]
      })
    );
  const meshes = [make(-180, 90, 90, -45), make(90, 90, 45, -22.5), make(90, 45, 45, -22.5)];
  const stitched = stitchTerrainLodCut(meshes, seams);
  expect(stitched.map(mesh => mesh.indices.length / 3)).toEqual([10, 8, 8]);
  expect(meshes[0].indices.length / 3).toBe(8);
  for (const mesh of stitched.slice(1)) {
    const longitudes = Array.from(mesh.positions)
      .filter((_, i) => i % 3 === 0)
      .map(x => x + mesh.origin[0]);
    expect(Math.min(...longitudes)).toBe(90);
    expect(Math.max(...longitudes)).toBe(180);
  }
});

test('resident geographic cut reports partial horizontal coverage and rejects overlap', () => {
  const coarse = {x: 0, y: 0, level: 1};
  const fine = {x: 1, y: 4, level: 3};
  expect(discoverGeographicTerrainLodSeams([fine, coarse])).toEqual([
    {a: 1, edgeA: 'maxRow', b: 0, edgeB: 'minRow', options: {rangeA: [0.25, 0.5]}}
  ]);
  expect(discoverGeographicTerrainLodSeams([coarse, {x: 2, y: 2, level: 2}])).toEqual([]);
  expect(() => discoverGeographicTerrainLodSeams([coarse, coarse])).toThrow(/Duplicate/);
  expect(() => discoverGeographicTerrainLodSeams([coarse, {...fine, y: 0}])).toThrow(/Overlapping/);
});

test('polar incidence reports resident sectors and gaps in canonical longitude order', () => {
  const poles = discoverGeographicTerrainPoles([
    {x: 3, y: 0, level: 2},
    {x: 0, y: 0, level: 1},
    {x: 0, y: 3, level: 2}
  ]);
  expect(poles.north).toEqual({
    latitude: 90,
    incident: [
      {tile: 1, edge: 'north', longitude: [-180, 0]},
      {tile: 0, edge: 'north', longitude: [90, 180]}
    ],
    gaps: [[0, 90]]
  });
  expect(poles.south).toEqual({
    latitude: -90,
    incident: [{tile: 2, edge: 'south', longitude: [-180, -90]}],
    gaps: [[-90, 180]]
  });
  const world = discoverGeographicTerrainPoles([{x: 0, y: 0, level: 0}]);
  expect(world.north.gaps).toEqual([]);
  expect(world.south.gaps).toEqual([]);
  expect(discoverGeographicTerrainPoles([]).north.gaps).toEqual([[-180, 180]]);
  expect(() =>
    discoverGeographicTerrainPoles([
      {x: 0, y: 0, level: 0},
      {x: 0, y: 0, level: 1}
    ])
  ).toThrow(/Overlapping/);
});
