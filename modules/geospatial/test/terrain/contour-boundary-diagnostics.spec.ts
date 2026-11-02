// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  diagnoseTerrainContourBoundaries,
  TerrainContourBoundaryAxis as Axis,
  type TerrainContours
} from '@math.gl/geospatial/terrain';

function graph(): TerrainContours {
  return {
    positions: Float64Array.from([2, 2, 0, 0, 2, 0, 4, 2, 0, 2, 0, 0, 2, 4, 0, 1, 1, 0]),
    gridCoordinates: Float64Array.from([2, 2, 0, 2, 4, 2, 2, 0, 2, 4, 1, 1]),
    segments: Uint32Array.from([0, 1, 0, 2, 0, 3, 0, 4]),
    levelIndices: Uint32Array.from([0, 0, 0, 0]),
    levels: Float64Array.from([0]),
    origin: [0, 0, 0],
    heightReference: 'unknown'
  };
}

test('reports open boundary ends and a four-way junction without changing the graph', () => {
  const contours = graph();
  const result = diagnoseTerrainContourBoundaries(contours, {width: 3, height: 3});
  expect([...result.vertexIndices]).toEqual([0, 1, 2, 3, 4]);
  expect([...result.degrees]).toEqual([4, 1, 1, 1, 1]);
  expect([...result.levelIndices]).toEqual([0, 0, 0, 0, 0]);
  expect([...result.boundaryAxes]).toEqual(Array(5).fill(Axis.COLUMN | Axis.ROW));
  expect(contours.segments).toEqual(Uint32Array.from([0, 1, 0, 2, 0, 3, 0, 4]));
});

test('ignores degree-two and non-boundary vertices, and distinguishes column from row', () => {
  const contours = graph();
  contours.gridCoordinates.set([-2, 1, 1, -2, 1, 1, 1, 1, 1, 1, 1, 1]);
  const result = diagnoseTerrainContourBoundaries(contours, {width: 3, height: 3});
  expect([...result.vertexIndices]).toEqual([0, 1]);
  expect([...result.boundaryAxes]).toEqual([Axis.COLUMN, Axis.ROW]);
});

test('rejects malformed graph indices, duplicate edges and work limits', () => {
  const contours = graph();
  expect(() => diagnoseTerrainContourBoundaries(contours, {width: 1, height: 3})).toThrow();
  expect(() =>
    diagnoseTerrainContourBoundaries(contours, {width: 3, height: 3, maxSegments: 3})
  ).toThrow();
  const duplicate = {
    ...contours,
    segments: Uint32Array.from([0, 1, 1, 0]),
    levelIndices: Uint32Array.from([0, 0])
  };
  expect(() => diagnoseTerrainContourBoundaries(duplicate, {width: 3, height: 3})).toThrow(
    /Duplicate/
  );
  const invalid = {
    ...contours,
    segments: Uint32Array.from([0, 100]),
    levelIndices: Uint32Array.from([0])
  };
  expect(() => diagnoseTerrainContourBoundaries(invalid, {width: 3, height: 3})).toThrow(/index/);
});
