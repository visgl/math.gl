// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  HeightField,
  createTerrainContours,
  weldTerrainMixedContourTiles,
  stitchTerrainContours
} from '@math.gl/geospatial/terrain';

function tile(
  column: number,
  row: number,
  spacing: number,
  fn = (x: number, y: number) => x + y,
  levels = [1, 2, 3, 4, 5, 6, 7]
) {
  const field = new HeightField({
    width: 3,
    height: 3,
    origin: [column, row],
    columnStep: [spacing, 0],
    rowStep: [0, spacing],
    heights: Float64Array.from({length: 9}, (_, i) =>
      fn(column + (i % 3) * spacing, row + Math.floor(i / 3) * spacing)
    )
  });
  return {
    column,
    row,
    spacing,
    width: 3,
    height: 3,
    contours: createTerrainContours(field, levels)
  };
}

test('mixed contour intersections join across a coarse tile and two fine neighbors', () => {
  const tiles = [tile(0, 0, 2), tile(4, 0, 1), tile(4, 2, 1)];
  const result = weldTerrainMixedContourTiles(tiles);
  expect(weldTerrainMixedContourTiles([...tiles].reverse())).toEqual(result);
  const paths = stitchTerrainContours(result);
  expect(paths.levelIndices.length).toBe(7);
  // The plane's contours have analytically known total lengths in the 6x4 rectangle.
  const lengths = new Float64Array(7);
  for (let i = 0; i < result.levelIndices.length; i++) {
    const a = result.segments[2 * i],
      b = result.segments[2 * i + 1];
    lengths[result.levelIndices[i]] += Math.hypot(
      result.positions[3 * a] - result.positions[3 * b],
      result.positions[3 * a + 1] - result.positions[3 * b + 1]
    );
  }
  for (let i = 0; i < 7; i++)
    expect(lengths[i]).toBeCloseTo(Math.min(i + 1, 4, 10 - i - 1) * Math.SQRT2, 12);
});

test('subdivides and deduplicates contour segments lying along mixed-resolution seams', () => {
  const ridge = (x: number) => 4 - Math.abs(x - 4);
  const tiles = [tile(0, 0, 2, ridge, [4]), tile(4, 0, 1, ridge, [4]), tile(4, 2, 1, ridge, [4])];
  const result = weldTerrainMixedContourTiles(tiles);
  expect(result.levelIndices.length).toBe(4);
  expect(stitchTerrainContours(result).levelIndices.length).toBe(1);
  let length = 0;
  for (let i = 0; i < result.segments.length; i += 2) {
    const a = result.segments[i],
      b = result.segments[i + 1];
    expect(result.gridCoordinates[2 * a]).toBe(4);
    length += Math.abs(result.gridCoordinates[2 * a + 1] - result.gridCoordinates[2 * b + 1]);
  }
  expect(length).toBe(4);
});

test('retains open ends for disagreeing source surfaces and missing neighbors', () => {
  const left = tile(0, 0, 2, (_x, y) => y, [1]);
  const right = tile(4, 0, 1, (_x, y) => y + 0.5, [1]);
  expect(
    stitchTerrainContours(weldTerrainMixedContourTiles([left, right])).levelIndices.length
  ).toBe(2);
  expect(weldTerrainMixedContourTiles([left]).segments.length).toBe(left.contours.segments.length);
});

test('rejects overlaps, incompatible metadata, frame disagreement and exceeded budgets', () => {
  const a = tile(0, 0, 2),
    b = tile(4, 0, 1);
  expect(() => weldTerrainMixedContourTiles([a, a])).toThrow(/overlap/);
  expect(() => weldTerrainMixedContourTiles([a, {...b, spacing: 3}])).toThrow(/lattice/);
  expect(() => weldTerrainMixedContourTiles([a, b], {maxBoundaryTests: 0})).toThrow(/budget/);
  expect(() => weldTerrainMixedContourTiles([a, b], {maxVertices: 1})).toThrow(/capacity/);
  expect(() => weldTerrainMixedContourTiles([a, b], {maxSegments: 1})).toThrow(/capacity/);
  expect(() => weldTerrainMixedContourTiles([a, b], {maxTiles: 1})).toThrow(/capacity/);
  expect(() =>
    weldTerrainMixedContourTiles([a, {...b, contours: {...b.contours, heightReference: 'other'}}])
  ).toThrow(/reference/);
  expect(() =>
    weldTerrainMixedContourTiles([a, {...b, contours: {...b.contours, origin: [5, 0, 0]}}])
  ).toThrow(/positions disagree/);
});

test('mixed contour admission rejects malformed graphs and imprecise common coordinates', () => {
  const a = tile(0, 0, 2);
  expect(() => weldTerrainMixedContourTiles([])).toThrow();
  for (const options of [{maxTiles: 0}, {maxBoundaryTests: -1}, {maxPositionDifference: NaN}])
    expect(() => weldTerrainMixedContourTiles([a], options)).toThrow();
  expect(() => weldTerrainMixedContourTiles([{...a, column: Number.MAX_SAFE_INTEGER}])).toThrow(
    /overflow/
  );
  expect(() => weldTerrainMixedContourTiles([{...a, spacing: 2 ** 49 + 1}])).toThrow(/lattice/);
  expect(() =>
    weldTerrainMixedContourTiles([{...a, contours: {...a.contours, segments: Uint32Array.of(0)}}])
  ).toThrow(/segments/);
  const grid = a.contours.gridCoordinates.slice();
  grid[0] = -1;
  expect(() =>
    weldTerrainMixedContourTiles([{...a, contours: {...a.contours, gridCoordinates: grid}}])
  ).toThrow(/outside/);
  const duplicate = {
    ...a.contours,
    segments: Uint32Array.from([...a.contours.segments, ...a.contours.segments.slice(0, 2)]),
    levelIndices: Uint32Array.from([...a.contours.levelIndices, a.contours.levelIndices[0]])
  };
  expect(() => weldTerrainMixedContourTiles([{...a, contours: duplicate}])).toThrow(/Duplicate/);
  const collapsed = {
    ...a.contours,
    segments: Uint32Array.of(0, 0),
    levelIndices: Uint32Array.of(0)
  };
  expect(() => weldTerrainMixedContourTiles([{...a, contours: collapsed}])).toThrow(/Degenerate/);
  const fractional = tile(0, 0, 1, (x, y) => x + y, [0.3]);
  expect(() => weldTerrainMixedContourTiles([{...fractional, column: 2 ** 50}])).toThrow(
    /precision/
  );
});

test('supports negative addresses, rectangular tiles, rotated frames and separate contour levels', () => {
  const make = (column: number, spacing: number, width: number) => {
    const height = 3;
    const field = new HeightField({
      width,
      height,
      origin: [2 * column, column],
      columnStep: [2 * spacing, spacing],
      rowStep: [-spacing, 3 * spacing],
      heights: Float64Array.from(
        {length: width * height},
        (_, i) => Math.floor(i / width) * spacing
      )
    });
    return {
      column,
      row: 0,
      spacing,
      width,
      height,
      contours: createTerrainContours(field, [0.5, 1.5])
    };
  };
  const result = weldTerrainMixedContourTiles([make(-4, 2, 3), make(0, 1, 4)], {
    maxPositionDifference: 1e-12
  });
  expect(stitchTerrainContours(result).levelIndices.length).toBe(2);
  expect(result.levels).toEqual(Float64Array.of(0.5, 1.5));
});

test('ordinary decimal intersections survive translated lattice coordinates', () => {
  const make = (column: number, spacing: number) => {
    const field = new HeightField({
      width: 3,
      height: 3,
      origin: [column, 4],
      columnStep: [spacing, 0],
      rowStep: [0, spacing],
      heights: Float64Array.from({length: 9}, (_, i) => Math.floor(i / 3) * spacing)
    });
    return {
      column,
      row: 4,
      width: 3,
      height: 3,
      spacing,
      contours: createTerrainContours(field, [0.3])
    };
  };
  const result = weldTerrainMixedContourTiles([make(0, 2), make(4, 1)], {
    maxPositionDifference: 1e-12
  });
  expect(stitchTerrainContours(result).levelIndices.length).toBe(1);
});
