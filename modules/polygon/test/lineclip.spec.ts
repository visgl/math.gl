// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {clipPolyline, clipPolygon} from '@math.gl/polygon';

export function flatten(arr: unknown, result: any[] = []): any[] {
  if (Array.isArray(arr)) {
    for (let i = 0; i < arr.length; i++) {
      flatten(arr[i], result);
    }
  } else {
    result.push(arr);
  }
  return result;
}

test('clips line', () => {
  const result = clipPolyline(
    flatten([
      [-10, 10],
      [10, 10],
      [10, -10],
      [20, -10],
      [20, 10],
      [40, 10],
      [40, 20],
      [20, 20],
      [20, 40],
      [10, 40],
      [10, 20],
      [5, 20],
      [-10, 20]
    ]),
    [0, 0, 30, 30]
  );

  console.log(JSON.stringify(result));
  expect(result).toEqual([
    [0, 10, 10, 10, 10, 0],
    [20, 0, 20, 10, 30, 10],
    [30, 20, 20, 20, 20, 30],
    [10, 30, 10, 20, 5, 20, 0, 20]
  ]);
});

test('clips line crossing through many times', () => {
  const result = clipPolyline(
    flatten([
      [10, -10],
      [10, 30],
      [20, 30],
      [20, -10]
    ]),
    [0, 0, 20, 20]
  );

  console.log(JSON.stringify(result));
  expect(result).toEqual([
    [10, 0, 10, 20],
    [20, 20, 20, 0]
  ]);
});

test('clips 3d line', () => {
  const result = clipPolyline(
    flatten([
      [10, -10, 0],
      [10, 30, 20],
      [20, 30, 10],
      [20, -10, -10]
    ]),
    [0, 0, 20, 20],
    {size: 3}
  );

  console.log(JSON.stringify(result));
  expect(result).toEqual([
    [10, 0, 5, 10, 20, 15],
    [20, 20, 5, 20, 0, -5]
  ]);
});

test('clips line from partial array', () => {
  const polyline = flatten([
    [10, -10],
    [10, 30],
    [20, 30],
    [20, -10]
  ]);
  const result = clipPolyline([].concat([0, 0, 0, 20], polyline, [20, 0, 20, 20]), [0, 0, 20, 20], {
    startIndex: 4,
    endIndex: 12
  });

  console.log(JSON.stringify(result));
  expect(result).toEqual([
    [10, 0, 10, 20],
    [20, 20, 20, 0]
  ]);
});

test('clips polygon', () => {
  const result = clipPolygon(
    flatten([
      [-10, 20],
      [-10, 10],
      [0, 10],
      [10, 10],
      [10, 5],
      [10, -5],
      [10, -10],
      [20, -10],
      [20, 10],
      [40, 10],
      [40, 20],
      [20, 20],
      [20, 40],
      [10, 40],
      [10, 20],
      [5, 20]
    ]),
    [0, 0, 30, 30]
  );

  console.log(JSON.stringify(result));
  expect(result).toEqual(
    flatten([
      [0, 20],
      [0, 10],
      [10, 10],
      [10, 5],
      [10, 0],
      [20, 0],
      [20, 10],
      [30, 10],
      [30, 20],
      [20, 20],
      [20, 30],
      [10, 30],
      [10, 20],
      [5, 20]
    ])
  );
});

test('polygon contains bbox', () => {
  const result = clipPolygon(
    flatten([
      [10, 40],
      [40, 10],
      [10, -20],
      [-20, 10]
    ]),
    [0, 0, 20, 20]
  );

  console.log(JSON.stringify(result));
  expect(result).toEqual(
    flatten([
      [0, 0],
      [0, 20],
      [20, 20],
      [20, 0]
    ])
  );
});

test('clips 3d polygon', () => {
  const result = clipPolygon(
    flatten([
      [10, -5, 0],
      [25, 10, 12],
      [10, 25, 24],
      [-5, 10, 12]
    ]),
    [0, 0, 20, 20],
    {size: 3}
  );

  console.log(JSON.stringify(result));
  expect(result).toEqual(
    flatten([
      [0, 5, 8],
      [5, 0, 4],
      [15, 0, 4],
      [20, 5, 8],
      [20, 15, 16],
      [15, 20, 20],
      [5, 20, 20],
      [0, 15, 16]
    ])
  );
});

test('clips polygon fom partial array', () => {
  const polygon = flatten([
    [10, -5],
    [25, 10],
    [10, 25],
    [-5, 10]
  ]);
  const result = clipPolygon([].concat([0, 0, 0, 20], polygon, [20, 0, 20, 20]), [0, 0, 20, 20], {
    startIndex: 4,
    endIndex: 12
  });

  console.log(JSON.stringify(result));
  expect(result).toEqual(
    flatten([
      [0, 5],
      [5, 0],
      [15, 0],
      [20, 5],
      [20, 15],
      [15, 20],
      [5, 20],
      [0, 15]
    ])
  );
});

test('clips floating point lines', () => {
  const line = flatten([
    [-86.66015624999999, 42.22851735620852],
    [-81.474609375, 38.51378825951165],
    [-85.517578125, 37.125286284966776],
    [-85.8251953125, 38.95940879245423],
    [-90.087890625, 39.53793974517628],
    [-91.93359375, 42.32606244456202],
    [-86.66015624999999, 42.22851735620852]
  ]);

  const bbox = [-91.93359375, 42.29356419217009, -91.7578125, 42.42345651793831];

  // @ts-expect-error
  const result = clipPolyline(line, bbox);

  console.log(JSON.stringify(result));
  expect(result).toEqual([
    flatten([
      [-91.91208030440808, 42.29356419217009],
      [-91.93359375, 42.32606244456202],
      [-91.7578125, 42.3228109416169]
    ])
  ]);
});

test('preserves line if no protrusions exist', () => {
  const result = clipPolyline([1, 1, 2, 2, 3, 3], [0, 0, 30, 30]);

  console.log(JSON.stringify(result));
  expect(result).toEqual([[1, 1, 2, 2, 3, 3]]);
});

test('clips without leaving empty parts', () => {
  const result = clipPolyline([40, 40, 50, 50], [0, 0, 30, 30]);

  expect(result).toEqual([]);
});

test('still works when polygon never crosses bbox', () => {
  const result = clipPolygon(
    flatten([
      [3, 3],
      [5, 3],
      [5, 5],
      [3, 5]
    ]),
    [0, 0, 2, 2]
  );

  expect(result).toEqual([]);
});
