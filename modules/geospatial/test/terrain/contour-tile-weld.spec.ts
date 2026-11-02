// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  HeightField,
  createTerrainContours,
  weldTerrainContourTiles,
  stitchTerrainContours
} from '@math.gl/geospatial/terrain';

function tile(column: number, row: number, missing = false) {
  const heights = Float64Array.from(
    {length: 9},
    (_, i) => column * 2 + (i % 3) + row * 2 + Math.floor(i / 3)
  );
  const validity = new Uint8Array(9).fill(1);
  if (missing) validity[3] = 0;
  const field = new HeightField({
    width: 3,
    height: 3,
    heights,
    validity,
    origin: [column * 2, row * 2],
    registration: 'vertex'
  });
  return {column, row, contours: createTerrainContours(field, [1, 2, 3, 4, 5, 6])};
}

test('welds same-level boundaries and four-way corners deterministically', () => {
  const tiles = [tile(1, 1), tile(0, 1), tile(1, 0), tile(0, 0)];
  const welded = weldTerrainContourTiles(tiles, {width: 3, height: 3});
  expect(weldTerrainContourTiles([...tiles].reverse(), {width: 3, height: 3})).toEqual(welded);
  const paths = stitchTerrainContours(welded);
  expect([...paths.levelIndices]).toEqual([0, 1, 2, 3, 4, 5]);
  const lengths = new Float64Array(6);
  for (let i = 0; i < welded.levelIndices.length; i++) {
    const a = welded.segments[2 * i],
      b = welded.segments[2 * i + 1];
    lengths[welded.levelIndices[i]] += Math.hypot(
      welded.positions[3 * a] - welded.positions[3 * b],
      welded.positions[3 * a + 1] - welded.positions[3 * b + 1]
    );
  }
  for (let i = 0; i < lengths.length; i++)
    expect(lengths[i]).toBeCloseTo([1, 2, 3, 4, 3, 2][i] * Math.SQRT2, 12);
  const cornerVertices = [];
  for (let i = 0; i < welded.positions.length / 3; i++)
    if (
      welded.gridCoordinates[2 * i] === 2 &&
      welded.gridCoordinates[2 * i + 1] === 2 &&
      welded.positions[3 * i + 2] === 4
    )
      cornerVertices.push(i);
  expect(cornerVertices).toHaveLength(1);
  expect([...paths.closed].every(v => v === 0)).toBe(true);
});

test('missing neighbors and missing samples do not produce invented segments', () => {
  const left = tile(0, 0),
    right = tile(1, 0, true);
  const a = weldTerrainContourTiles([left], {width: 3, height: 3});
  expect(a.segments.length).toBe(left.contours.segments.length);
  const b = weldTerrainContourTiles([left, right], {width: 3, height: 3});
  expect(b.segments.length).toBeLessThanOrEqual(
    left.contours.segments.length + right.contours.segments.length
  );
  expect(() => stitchTerrainContours(b)).not.toThrow();
});

test('a contour lying on a shared edge is emitted once even when both tiles produce it', () => {
  const ridge = (column: number) => {
    const field = new HeightField({
      width: 3,
      height: 3,
      origin: [column * 2, 0],
      heights: Float64Array.from({length: 9}, (_, i) => 2 - Math.abs(column * 2 + (i % 3) - 2))
    });
    return {column, row: 0, contours: createTerrainContours(field, [2])};
  };
  const left = ridge(0),
    right = ridge(1);
  expect(left.contours.segments.length).toBeGreaterThan(0);
  expect(right.contours.segments.length).toBeGreaterThan(0);
  const welded = weldTerrainContourTiles([left, right], {width: 3, height: 3});
  expect(welded.segments.length).toBe(left.contours.segments.length);
  const paths = stitchTerrainContours(welded);
  expect(paths.levelIndices).toHaveLength(1);
});

test('welded tiled contours match an untiled triangle-grid oracle', () => {
  const fn = (x: number, y: number) => Math.sin(x * 0.7) + Math.cos(y * 0.9);
  const levels = [-0.5, 0, 0.5, 1];
  const makeField = (width: number, height: number, x0: number, y0: number) =>
    new HeightField({
      width,
      height,
      origin: [x0, y0],
      heights: Float64Array.from({length: width * height}, (_, i) =>
        fn(x0 + (i % width), y0 + Math.floor(i / width))
      )
    });
  const untiled = createTerrainContours(makeField(5, 5, 0, 0), levels);
  const tiles = [0, 1].flatMap(column =>
    [0, 1].map(row => ({
      column,
      row,
      contours: createTerrainContours(makeField(3, 3, 2 * column, 2 * row), levels)
    }))
  );
  const welded = weldTerrainContourTiles(tiles, {width: 3, height: 3});
  const lengths = (contours: typeof untiled) => {
    const result = new Float64Array(levels.length);
    for (let i = 0; i < contours.levelIndices.length; i++) {
      const a = contours.segments[2 * i],
        b = contours.segments[2 * i + 1];
      result[contours.levelIndices[i]] += Math.hypot(
        contours.positions[3 * a] - contours.positions[3 * b],
        contours.positions[3 * a + 1] - contours.positions[3 * b + 1]
      );
    }
    return result;
  };
  expect(welded.segments.length).toBe(untiled.segments.length);
  expect(stitchTerrainContours(welded).levelIndices.length).toBe(
    stitchTerrainContours(untiled).levelIndices.length
  );
  const a = lengths(untiled),
    b = lengths(welded);
  for (let i = 0; i < levels.length; i++) expect(b[i]).toBeCloseTo(a[i], 12);
});

test('rejects inconsistent frames, levels, duplicate addresses and capacities', () => {
  const a = tile(0, 0),
    b = tile(1, 0);
  expect(() => weldTerrainContourTiles([a, a], {width: 3, height: 3})).toThrow(/duplicate/);
  expect(() => weldTerrainContourTiles([a, b], {width: 3, height: 3, maxVertices: 0})).toThrow(
    /capacity/
  );
  expect(() => weldTerrainContourTiles([a, b], {width: 3, height: 3, maxTiles: 1})).toThrow();
  const wrongLevels = {...b, contours: {...b.contours, levels: Float64Array.from([1, 2])}};
  expect(() => weldTerrainContourTiles([a, wrongLevels], {width: 3, height: 3})).toThrow(/levels/);
  const wrongFrame = {...b, contours: {...b.contours, origin: [3, 0, 0] as const}};
  expect(() => weldTerrainContourTiles([a, wrongFrame], {width: 3, height: 3})).toThrow(
    /positions disagree/
  );
  expect(() =>
    weldTerrainContourTiles([a, wrongFrame], {width: 3, height: 3, maxPositionDifference: 1})
  ).not.toThrow();
});

test('distinct fractional boundary coordinates do not weld after global-coordinate rounding', () => {
  const make = (column: number, y: number) => ({
    column,
    row: 2 ** 50,
    contours: {
      positions: Float64Array.from(column === 0 ? [2, y, 0, 1, y, 0] : [0, y, 0, 1, y, 0]),
      gridCoordinates: Float64Array.from(column === 0 ? [2, y, 1, y] : [0, y, 1, y]),
      segments: Uint32Array.from([0, 1]),
      levelIndices: Uint32Array.from([0]),
      levels: Float64Array.from([0]),
      origin: [column * 2, 0, 0] as const,
      heightReference: 'unknown'
    }
  });
  const welded = weldTerrainContourTiles([make(0, 0.26), make(1, 0.49)], {
    width: 3,
    height: 3,
    maxPositionDifference: 1
  });
  expect(welded.positions.length / 3).toBe(4);
  expect(stitchTerrainContours(welded).levelIndices).toHaveLength(2);
});

test('welds negative tile addresses in a rotated affine frame', () => {
  const make = (column: number) => {
    const x0 = column * 2;
    const field = new HeightField({
      width: 3,
      height: 3,
      origin: [2 * x0, x0],
      columnStep: [2, 1],
      rowStep: [-1, 2],
      heights: Float64Array.from({length: 9}, (_, i) => Math.floor(i / 3))
    });
    return {column, row: 0, contours: createTerrainContours(field, [0.5, 1.5])};
  };
  const result = weldTerrainContourTiles([make(0), make(-1)], {width: 3, height: 3});
  const paths = stitchTerrainContours(result);
  expect([...paths.levelIndices]).toEqual([0, 1]);
  expect([...paths.closed]).toEqual([0, 0]);
  for (const level of [0, 1]) {
    let length = 0;
    for (let i = 0; i < result.levelIndices.length; i++)
      if (result.levelIndices[i] === level) {
        const a = result.segments[2 * i],
          b = result.segments[2 * i + 1];
        length += Math.hypot(
          result.positions[3 * a] - result.positions[3 * b],
          result.positions[3 * a + 1] - result.positions[3 * b + 1]
        );
      }
    expect(length).toBeCloseTo(4 * Math.sqrt(5), 12);
  }
});
