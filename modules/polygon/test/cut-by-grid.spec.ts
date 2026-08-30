// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import type {NumericArray} from '@math.gl/core';
import {equals} from '@math.gl/core';
import {cutPolylineByGrid, cutPolygonByGrid} from '@math.gl/polygon';

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
