// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Copyright (c) 2017 Uber Technologies, Inc.
// MIT License

/* eslint-disable max-statements */
import {test, expect} from 'vitest';
import {toNested} from './utils';

import {configure, equals} from '@math.gl/core';
import {_Polygon as Polygon, WINDING} from '@math.gl/polygon';

const TEST_CASES = [
  {
    title: 'non-closed poly (flat TypedArray array)',
    polygon: new Float32Array([5, 0, 6, 4, 4, 5, 1, 5, 1, 0]),
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  },
  {
    title: 'exactly closed poly (flat TypedArray array)',
    polygon: new Float32Array([5, 0, 6, 4, 4, 5, 1, 5, 1, 0, 5, 0]),
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  },
  {
    title: 'EPSILON closed poly (flat TypedArray array)',
    polygon: new Float32Array([5, 0, 6, 4, 4, 5, 1, 5, 1, 0, 5, 0.0000001]),
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  },
  {
    title: 'non-closed poly (flat array)',
    polygon: [5, 0, 6, 4, 4, 5, 1, 5, 1, 0],
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  },
  {
    title: 'exactly closed poly (flat array)',
    polygon: [5, 0, 6, 4, 4, 5, 1, 5, 1, 0, 5, 0],
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  },
  {
    title: 'EPSILON closed poly (flat array)',
    polygon: [5, 0, 6, 4, 4, 5, 1, 5, 1, 0, 5, 0.0000001],
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  },
  {
    title: 'Flat 2d array with custom start and end offsets',
    polygon: [0, 0, 1, 1, 2, 1, 2, 2, 1, 2, 9, 5],
    area: 1,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 4,
    options: {
      start: 2,
      end: 10,
      size: 2
    }
  },
  {
    title: 'Flat 3d array with custom start and end offsets',
    polygon: [0, 0, 0, 1, 1, 0, 1, 2, 0, 2, 2, 0, 2, 1, 0, 9, 5, 2],
    area: 1,
    sign: WINDING.CLOCKWISE,
    segments: 4,
    options: {
      start: 3,
      end: 15,
      size: 3
    }
  },
  {
    title: 'non-closed poly',
    polygon: [
      [5, 0],
      [6, 4],
      [4, 5],
      [1, 5],
      [1, 0]
    ],
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  },
  {
    title: 'exactly closed poly',
    polygon: [
      [5, 0],
      [6, 4],
      [4, 5],
      [1, 5],
      [1, 0],
      [5, 0]
    ],
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  },
  {
    title: 'EPSILON closed poly',
    polygon: [
      [5, 0],
      [6, 4],
      [4, 5],
      [1, 5],
      [1, 0],
      [5, 0.0000001]
    ],
    area: 22,
    sign: WINDING.COUNTER_CLOCKWISE,
    segments: 5
  }
];

test('Polygon#import', () => {
  expect(typeof Polygon).toBe('function');
});

test('Polygon#construct', () => {
  expect(
    new Polygon([
      [0, 0],
      [1, 1]
    ])
  ).toBeTruthy();
});

test('Polygon#methods', () => {
  configure({EPSILON: 1e-4});

  for (const tc of TEST_CASES) {
    const polygon = new Polygon(tc.polygon, tc.options);
    expect(polygon, `${tc.title}: Created polygon`).toBeTruthy();
    expect(
      equals(polygon.getSignedArea(), tc.area * tc.sign),
      `${tc.title}: getSignedArea() returned expected result`
    ).toBe(true);
    expect(
      equals(polygon.getArea(), tc.area),
      `${tc.title}: getArea() returned expected result`
    ).toBe(true);
    expect(
      equals(polygon.getWindingDirection(), tc.sign),
      `${tc.title}: getWindingDirection() returned expected result`
    ).toBe(true);
  }

  configure({EPSILON: 1e-12});
});

test('Polygon#forEachSegment', () => {
  const config = configure({EPSILON: 1e-4});

  for (const tc of TEST_CASES) {
    const polygon = new Polygon(tc.polygon, tc.options);
    let count = 0;
    polygon.forEachSegment(() => {
      count++;
    });
    expect(count, 'forEachSegment() iterated over all virtual segments').toBe(tc.segments);
  }

  configure(config);
});

test('Polygon#modifyWindingDirection', () => {
  const testPolygon = [1, 1, 2, 2, 1, 3];
  const testPolygonReversed = [1, 3, 2, 2, 1, 1];

  const polygon = new Polygon(testPolygon);

  expect(polygon.getWindingDirection(), 'getWindingDirection() returned expected result').toBe(
    WINDING.COUNTER_CLOCKWISE
  );

  polygon.modifyWindingDirection(WINDING.CLOCKWISE);
  expect(
    testPolygon.every((value, index) => value === testPolygonReversed[index]),
    'modifyWindingDirection() reversed polygon as expected'
  ).toBeTruthy();

  expect(polygon.getWindingDirection(), 'getWindingDirection() returned expected result').toBe(
    WINDING.CLOCKWISE
  );
});

test('Polygon#Compare flat and complex input', () => {
  const testFlatData = [0.5, 0.5, 2.0, 0.25, 4, 2, 5, 1, 6, 4, 3.5, 4.1, 1, 2.5, -6, 1];
  const testPointsData = toNested(testFlatData);

  const flatPolygon = new Polygon(testFlatData);
  const pointsPolygon = new Polygon(testPointsData);

  const area1 = flatPolygon.getSignedArea();
  const area2 = pointsPolygon.getSignedArea();

  expect(
    area1,
    'results from flat getSignedArea() results are identical to results of array of points getSignedArea()'
  ).toBe(area2);
});

test('Polygon#Compare open and closed', () => {
  const testDataOpen = [0.5, 0.5, 2.0, 0.25, 4, 2, 5, 1, 6, 4, 3.5, 4.1, 1, 2.5, -6, 1];
  const testDataClosed = [...testDataOpen, ...testDataOpen.slice(0, 2)];

  const openPolygon = new Polygon(testDataOpen);
  const closedPolygon = new Polygon(testDataClosed);

  const area1 = openPolygon.getSignedArea();
  const area2 = closedPolygon.getSignedArea();

  expect(area1, 'area of an open polygon are the same as for a closed one').toBe(area2);
});

test('Polygon#Compare 2D and 3D input', () => {
  const testFlatData = [0.5, 0.5, 2.0, 0.25, 4, 2, 5, 1, 6, 4, 3.5, 4.1, 1, 2.5, -6, 1];
  const testPointsData2D = toNested(testFlatData);
  const testPointsData3D = toNested(testFlatData, {addZ: true});

  const polygon2D = new Polygon(testPointsData2D);
  const polygon3D = new Polygon(testPointsData3D);

  const area1 = polygon2D.getSignedArea();
  const area2 = polygon3D.getSignedArea();

  expect(
    area1,
    'results from 2D Polygon.getSignedArea() results are identical to results 3D Polygon.getSignedArea()'
  ).toBe(area2);
});
