// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  HeightField,
  createTerrainLodMorph,
  coordinateTerrainLodMorphs,
  createTerrainMixedIsobands,
  createTerrainIsobands,
  type TerrainMixedVertexTile
} from '@math.gl/geospatial';
function tile(column: number, row: number, spacing: number): TerrainMixedVertexTile {
  return {
    column,
    row,
    spacing,
    field: {
      width: 5,
      height: 5,
      origin: [column, row],
      columnStep: [spacing, 0],
      rowStep: [0, spacing],
      heights: Float64Array.from(
        {length: 25},
        (_, i) => column + (i % 5) * spacing + row + Math.floor(i / 5) * spacing
      )
    }
  };
}
function morph(t: TerrainMixedVertexTile, factor: number) {
  const f = new HeightField(t.field),
    coarse = new HeightField({
      width: 3,
      height: 3,
      origin: f.origin,
      columnStep: f.columnStep.map(v => v * 2) as [number, number],
      rowStep: f.rowStep.map(v => v * 2) as [number, number],
      heights: Float64Array.from({length: 9}, () => 20)
    });
  return {
    column: t.column,
    row: t.row,
    spacing: t.spacing,
    morph: createTerrainLodMorph(f, coarse, {ratio: 2}),
    factor
  };
}
function area(
  b: Pick<ReturnType<typeof createTerrainIsobands>, 'positions' | 'indices' | 'offsets' | 'parents'>
) {
  let sum = 0;
  for (let r = 0; r < b.parents.length; r++)
    for (let i = b.offsets[r]; i + 1 < b.offsets[r + 1]; i++) {
      const a = b.indices[i],
        c = b.indices[i + 1];
      sum +=
        b.positions[2 * a] * b.positions[2 * c + 1] - b.positions[2 * c] * b.positions[2 * a + 1];
    }
  return sum / 2;
}
test('independent morph factors share coarse-owned seams and multi-tile corners', () => {
  const input = [morph(tile(-8, 0, 2), 1), morph(tile(0, 0, 1), 0), morph(tile(0, 4, 1), 0.5)];
  const coordinated = coordinateTerrainLodMorphs(input);
  expect(coordinateTerrainLodMorphs([...input].reverse())).toEqual(coordinated);
  const a = coordinated.tiles.find(t => t.column === 0 && t.row === 0)!,
    b = coordinated.tiles.find(t => t.column === 0 && t.row === 4)!;
  for (let y = 0; y < 5; y++) expect(a.field.heights[y * 5]).toBe(20);
  expect(a.field.heights[20]).toBe(20);
  expect(b.field.heights[0]).toBe(20);
  expect(a.field.heights[12]).toBe(4);
  expect(coordinated.maxHeightAdjustment).toBe(20);
  expect(coordinated.tiles[0].spacing).toBe(1);
});
test('2:1 and 4:1 bands match a conforming plane and join partial seams', () => {
  for (const ratio of [2, 4]) {
    const input = [tile(-4 * ratio, 0, ratio), tile(0, 0, 1), tile(0, 4, 1)];
    const bands = createTerrainMixedIsobands(input, [-100, 100]);
    expect(bands.parents.length).toBe(1);
    expect(area(bands)).toBeCloseTo(16 * ratio * ratio + 32);
    expect(createTerrainMixedIsobands([...input].reverse(), [-100, 100])).toEqual(bands);
  }
});
test('mixed bands preserve coarse triangle interiors and nodata holes without filling', () => {
  const a = tile(0, 0, 2);
  a.field.heights = new Float64Array(25).fill(1);
  a.field.heights[12] = NaN;
  const mixed = createTerrainMixedIsobands([a], [0, 2]),
    reference = createTerrainIsobands([new HeightField(a.field)], [0, 2]);
  const expected = reference.indices.length;
  expect(expected).toBeGreaterThan(0);
  expect(mixed.parents.some(p => p >= 0)).toBe(true);
  expect(area(mixed)).toBeLessThan(64);
  expect(area(mixed)).toBeCloseTo(area(reference), 12);
});
test('admission, frames, overlap and adjustment budgets are enforced', () => {
  const a = tile(0, 0, 1),
    b = tile(4, 0, 2);
  b.field.heights.fill(20);
  expect(() => createTerrainMixedIsobands([a, b], [0, 30])).toThrow(/adjustment/);
  expect(
    createTerrainMixedIsobands([a, b], [0, 30], {maxHeightAdjustment: 30}).indices.length
  ).toBeGreaterThan(0);
  expect(() => createTerrainMixedIsobands([a, a], [0, 30])).toThrow(/Duplicate/);
  for (const options of [{maxSamples: 1}, {maxTests: 0}])
    expect(() => createTerrainMixedIsobands([a], [0, 30], options)).toThrow(/capacity|budget/);
  expect(() => createTerrainMixedIsobands([a, tile(1, 1, 1)], [0, 30])).toThrow(/Overlapping/);
  const bad = tile(4, 0, 2);
  bad.field.origin = [5, 0];
  expect(() => createTerrainMixedIsobands([a, bad], [0, 30])).toThrow(/frames/);
});

test('shared nodata is conservative across incident tiles and output buffers are detached', () => {
  const a = morph(tile(-8, 0, 2), 1),
    b = morph(tile(0, 0, 1), 0);
  b.morph.statuses[2 * 5] = 1;
  const output = coordinateTerrainLodMorphs([a, b]);
  const fine = output.tiles.find(t => t.column === 0)!,
    coarse = output.tiles.find(t => t.column === -8)!;
  expect(fine.field.validity![2 * 5]).toBe(0);
  expect(coarse.field.validity![2 * 9 + 8]).toBe(0);
  output.tiles[0].field.heights.fill(999);
  expect(a.morph.fineHeights[0]).not.toBe(999);
});

test('mixed-resolution band intervals preserve plane areas and normalized output frames', () => {
  const a = tile(-8, 0, 2),
    b = tile(0, 0, 1),
    c = tile(0, 4, 1);
  const bands = createTerrainMixedIsobands([a, b, c], [-100, 0, 100]);
  expect(new Set(bands.bandIndices).size).toBe(2);
  expect(area(bands)).toBeCloseTo(96);
  const surface = coordinateTerrainLodMorphs([morph(a, 0), morph(b, 0)]);
  expect(surface.columnStep).toEqual([1, 0]);
  expect(surface.origin).toEqual([0, 0]);
  expect(() => createTerrainMixedIsobands([a, b], [0, 10], {maxTriangles: 1})).toThrow(
    /triangle capacity/
  );
});

test('all shared samples agree through a multi-tile corner under independent schedules', () => {
  const input = [
    morph(tile(0, 0, 1), 0),
    morph(tile(4, 0, 1), 0.3),
    morph(tile(0, 4, 1), 0.7),
    morph(tile(4, 4, 1), 1)
  ];
  const output = coordinateTerrainLodMorphs(input),
    shared = new Map<string, {height: number; valid: number}>();
  for (const t of output.tiles)
    for (let y = 0; y < t.field.height; y++)
      for (let x = 0; x < t.field.width; x++) {
        const i = y * t.field.width + x,
          key = `${t.column + x},${t.row + y}`,
          value = {height: t.field.heights[i], valid: t.field.validity![i]};
        if (shared.has(key)) expect(value).toEqual(shared.get(key));
        else shared.set(key, value);
      }
  expect(shared.get('4,4')!.height).toBe(8);
});

test('skew frames and negative addresses retain mixed-resolution world areas', () => {
  const input = [tile(-8, 0, 2), tile(0, 0, 1), tile(0, 4, 1)];
  for (const t of input) {
    t.field.origin = [100 + 2 * t.column - t.row, 200 + t.column + 2 * t.row];
    t.field.columnStep = [2 * t.spacing, t.spacing];
    t.field.rowStep = [-t.spacing, 2 * t.spacing];
  }
  const result = coordinateTerrainLodMorphs(input.map(t => morph(t, 0)));
  expect(result.origin).toEqual([100, 200]);
  expect(result.columnStep).toEqual([2, 1]);
  expect(area(createTerrainMixedIsobands(input, [-100, 100]))).toBeCloseTo(480, 10);
});
