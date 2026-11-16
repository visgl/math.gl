// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import type {NumericArray} from '@math.gl/core';
import {equals} from '@math.gl/core';
import {cutPolylineByGrid, cutPolygonByGrid} from '@math.gl/geometry';

import {flatten} from './lineclip.spec';

test('subdivide line', () => {
  const result = cutPolylineByGrid([0, 0, 25, 40]);
  console.log(JSON.stringify(result));
  expect(
    equals(
      result,
      flatten([
        [0, 0],
        [6.25, 10],
        [10, 16],
        [12.5, 20],
        [18.75, 30],
        [20, 32],
        [25, 40]
      ])
    )
  ).toBeTruthy();
});

test('subdivide polyline', () => {
  const result = cutPolylineByGrid(
    flatten([
      [30, 20],
      [25, 25],
      [5, 5],
      [10, 20]
    ])
  );
  console.log(JSON.stringify(result));
  expect(
    equals(
      result,
      flatten([
        [30, 20],
        [25, 25],
        [20, 20],
        [10, 10],
        [5, 5],
        [6.6666667, 10],
        [10, 20]
      ])
    )
  ).toBeTruthy();
});

test('subdivide polyline - custom grid', () => {
  const result = cutPolylineByGrid(
    flatten([
      [30, 20],
      [25, 25],
      [5, 5],
      [10, 20]
    ]),
    {
      gridResolution: 20,
      gridOffset: [-5, -5]
    }
  );
  console.log(JSON.stringify(result));
  expect(
    equals(
      result,
      flatten([
        [30, 20],
        [25, 25],
        [15, 15],
        [5, 5],
        [8.3333333, 15],
        [10, 20]
      ])
    )
  ).toBeTruthy();
});

test('subdivide polyline - multiple parts', () => {
  const result = cutPolylineByGrid(
    flatten([
      [30, 20],
      [25, 25],
      [5, 5],
      [10, 20]
    ]),
    {broken: true}
  );
  console.log(JSON.stringify(result));
  expect(
    equals(result, [
      [30, 20, 25, 25, 20, 20],
      [20, 20, 10, 10],
      [10, 10, 5, 5, 6.6666667, 10],
      [6.6666667, 10, 10, 20]
    ])
  ).toBeTruthy();
});

test('subdivide 3d polyline', () => {
  const result = cutPolylineByGrid(
    flatten([
      [30, 20, 0],
      [25, 25, 0],
      [5, 5, 20],
      [10, 20, 30]
    ]),
    {
      size: 3
    }
  );
  console.log(JSON.stringify(result));
  expect(
    equals(
      result,
      flatten([
        [30, 20, 0],
        [25, 25, 0],
        [20, 20, 5],
        [10, 10, 15],
        [5, 5, 20],
        [6.6666667, 10, 23.3333333],
        [10, 20, 30]
      ])
    )
  ).toBeTruthy();
});

test('subdivide polyline from partial array', () => {
  const polyline = flatten([
    [30, 20],
    [25, 25],
    [5, 5],
    [10, 20]
  ]);
  const result = cutPolylineByGrid([].concat([0, 0, 0, 20], polyline, [20, 20, 20, 0]), {
    startIndex: 4,
    endIndex: 12
  });
  console.log(JSON.stringify(result));
  expect(
    equals(
      result,
      flatten([
        [30, 20],
        [25, 25],
        [20, 20],
        [10, 10],
        [5, 5],
        [6.6666667, 10],
        [10, 20]
      ])
    )
  ).toBeTruthy();
});

function arePolygonsEqual(p1, p2) {
  const positions1 = p1.positions;
  const positions2 = p2.positions;
  const holeIndices1 = p1.holeIndices || null;
  const holeIndices2 = p2.holeIndices || null;

  return equals(positions1, positions2) && equals(holeIndices1, holeIndices2);
}

// Debug with https://codepen.io/Pessimistress/pen/BaNOmKM
test('subdivide polygon', () => {
  const result = cutPolygonByGrid(
    flatten([
      [5, 20],
      [20, 5],
      [5, -10]
    ])
  );

  console.log(JSON.stringify(result));
  const expected = [
    {positions: [5, 0, 10, 0, 10, -5, 5, -10]},
    {positions: [10, 0, 15, 0, 10, -5]},
    {positions: [10, 0, 5, 0, 5, 10, 10, 10]},
    {positions: [10, 0, 10, 10, 15, 10, 20, 5, 15, 0]},
    {positions: [10, 10, 5, 10, 5, 20, 10, 15]},
    {positions: [10, 10, 10, 15, 15, 10]}
  ];

  expect(result.length, `should return ${expected.length} polygons`).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(arePolygonsEqual(result[i], expected[i]), `polygon ${i}`).toBeTruthy();
  }
});

test('subdivide polygon - empty', () => {
  expect(cutPolygonByGrid([]), 'returns empty array').toEqual([]);
});

test('subdivide polygon#edgeTypes', () => {
  // This polygon tests:
  // - vertex on grid intersection
  // - interpolated edge point on grid intersection
  // - subpolygon that is entirely inside
  const testPolygon = [
    [-10, 20],
    [20, 10],
    [5, -10],
    [5, 5],
    [12, 5],
    [5, 12]
  ];
  const testPolygonEdges = [
    [testPolygon[0], testPolygon[1]],
    [testPolygon[1], testPolygon[2]],
    [testPolygon[2], testPolygon[0]],
    [testPolygon[3], testPolygon[4]],
    [testPolygon[4], testPolygon[5]],
    [testPolygon[5], testPolygon[3]]
  ];
  const displayString = {
    0: 'inside',
    1: 'border'
  };
  const findEdges = (p: number[]) => {
    return testPolygonEdges.filter(
      ([p0, p1]) =>
        equals(p, p0) ||
        equals(p, p1) ||
        equals(Math.atan2(p0[1] - p[1], p0[0] - p[0]), Math.atan2(p[1] - p1[1], p[0] - p1[0]))
    );
  };
  const getType = (p: NumericArray, pNext: number[]) => {
    const edges = findEdges(p);
    const edgesNext = findEdges(pNext);
    // console.log(p, pNext)
    // console.log(edges, edgesNext)
    return edges.some(edge => edgesNext.includes(edge)) ? 1 : 0;
  };

  const result = cutPolygonByGrid(flatten(testPolygon), [6], {
    edgeTypes: true
  });

  for (const {positions, edgeTypes, holeIndices} of result) {
    let loopStart = 0;
    let loopEnd = (holeIndices && holeIndices[0]) || positions.length;
    for (let i = 0, loop = 0; i < edgeTypes?.length; i++) {
      const position = positions.slice(i * 2, i * 2 + 2);
      const nextPosition =
        i * 2 + 2 < loopEnd
          ? positions.slice(i * 2 + 2, i * 2 + 4)
          : positions.slice(loopStart, loopStart + 2);
      const type = edgeTypes && edgeTypes[i];
      expect(type, `edge should be ${displayString[type]}`).toBe(getType(position, nextPosition));

      if (i * 2 + 2 === loopEnd) {
        loopStart = loopEnd;
        loopEnd = (holeIndices && holeIndices[++loop]) || positions.length;
      }
    }
  }
});

test('subdivide polygon with custom grid', () => {
  const result = cutPolygonByGrid(
    flatten([
      [5, 20],
      [20, 5],
      [5, -10]
    ]),
    null,
    {
      gridResolution: 20,
      gridOffset: [5, 5]
    }
  );

  console.log(JSON.stringify(result));
  const expected = [{positions: [5, 5, 20, 5, 5, -10]}, {positions: [5, 5, 5, 20, 20, 5]}];

  expect(result.length, `should return ${expected.length} polygons`).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(arePolygonsEqual(result[i], expected[i]), `polygon ${i}`).toBeTruthy();
  }
});

test('subdivide 3D polygon', () => {
  const result = cutPolygonByGrid(
    flatten([
      [5, 20, 0],
      [20, 5, 15],
      [5, -10, 30]
    ]),
    null,
    {
      size: 3,
      gridResolution: 20,
      gridOffset: [5, 5]
    }
  );

  console.log(JSON.stringify(result));
  const expected = [
    {positions: [5, 5, 15, 20, 5, 15, 5, -10, 30]},
    {positions: [5, 5, 15, 5, 20, 0, 20, 5, 15]}
  ];

  expect(result.length, `should return ${expected.length} polygons`).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(arePolygonsEqual(result[i], expected[i]), `polygon ${i}`).toBeTruthy();
  }
});

test('subdivide polygon with holes', () => {
  const result = cutPolygonByGrid(
    flatten([
      [5, 5],
      [20, 5],
      [20, 15],
      [5, 15],
      [10, 10],
      [10, 12],
      [15, 12],
      [15, 10]
    ]),
    [8]
  );

  console.log(JSON.stringify(result));

  const expected = [
    {positions: [10, 10, 5, 10, 5, 5, 10, 5]},
    {positions: [10, 10, 10, 5, 20, 5, 20, 10]},
    {positions: [5, 10, 10, 10, 10, 15, 5, 15]},
    {
      positions: [10, 10, 20, 10, 20, 15, 10, 15, 10, 10, 10, 12, 15, 12, 15, 10],
      holeIndices: [8]
    }
  ];

  expect(result.length, `should return ${expected.length} polygons`).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(arePolygonsEqual(result[i], expected[i]), `polygon ${i}`).toBeTruthy();
  }
});

/** Returns the area of a polygon: the outer ring minus its holes. */
function getCutArea(positions: Readonly<NumericArray>, holeIndices: Readonly<NumericArray> = []) {
  const ends = [...holeIndices, positions.length];
  let area = 0;
  let start = 0;
  for (const end of ends) {
    // Measure from the first vertex to keep precision far from the origin.
    const x0 = positions[start];
    const y0 = positions[start + 1];
    let ringArea = 0;
    for (let i = start; i < end; i += 2) {
      const j = i + 2 < end ? i + 2 : start;
      ringArea +=
        (positions[i] - x0) * (positions[j + 1] - y0) -
        (positions[j] - x0) * (positions[i + 1] - y0);
    }
    area += start === 0 ? Math.abs(ringArea) / 2 : -Math.abs(ringArea) / 2;
    start = end;
  }
  return area;
}

/** Cuts a polygon and checks that every part fits one grid cell and the area is kept. */
function expectValidCut(positions: number[], gridResolution: number) {
  const parts = cutPolygonByGrid(positions, null, {gridResolution, edgeTypes: true});
  let area = 0;
  for (const part of parts) {
    const xs = part.positions.filter((_, i) => i % 2 === 0);
    const ys = part.positions.filter((_, i) => i % 2 === 1);
    const tolerance = gridResolution * 1e-9;
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(gridResolution + tolerance);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(gridResolution + tolerance);
    expect(part.edgeTypes).toHaveLength(part.positions.length / 2);
    area += getCutArea(part.positions);
  }
  const expected = getCutArea(positions);
  expect(Math.abs(area - expected)).toBeLessThanOrEqual(expected * 1e-9 + 1e-15);
  return parts;
}

test('subdivide polygon - cut lies on a rounded grid line', () => {
  // A tile-local MVT ring with the grid step that deck.gl uses for 360 subdivisions at zoom 0.
  // 0.6 + 1/90 rounds below 55/90, so the upper part starts on the line it was cut at.
  const parts = expectValidCut(
    [
      0.204345703125, 0.612548828125, 0.206787109375, 0.6064453125, 0.2060546875, 0.605712890625,
      0.204345703125, 0.612548828125
    ],
    1 / 90
  );
  expect(parts.length).toBe(2);
});

test('subdivide polygon - grid cell rounds past the minimum', () => {
  // Math.floor(1.7 / 0.1) * 0.1 is 1.7000000000000002, above the ring.
  const parts = cutPolygonByGrid([0.05, 1.7, 0.08, 1.7, 0.06, 1.7], null, {gridResolution: 0.1});
  expect(parts.length).toBe(1);
});

test('subdivide polygon - near the Web Mercator latitude limit', () => {
  for (const gridResolution of [0.1, 0.3, 1 / 3, 1 / 90]) {
    expectValidCut(
      [10.03, -85.0511, 10.47, -85.0511, 10.47, -84.73, 10.03, -84.73],
      gridResolution
    );
    expectValidCut([-179.3, -85.0511, -178.1, -85.0511, -178.7, -84.3], gridResolution);
  }
});

test('subdivide polygon - vertices and edges on grid lines', () => {
  expectValidCut([0, 0, 0.3, 0.6, 0.6, 0], 0.1);
  expectValidCut([0, 0, 20, 0, 20, 20, 0, 20], 10);
  expectValidCut([0.1, 0.1, 0.7, 0.1, 0.7, 0.3, 0.1, 0.3], 0.1);
});
