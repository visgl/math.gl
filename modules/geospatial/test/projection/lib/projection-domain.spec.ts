// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createCRSProjectionDomain} from '@math.gl/geospatial/crs';
import type {CRSProjectionDomain, CRSProjectionDomainRing} from '@math.gl/geospatial/crs';
const ring: CRSProjectionDomainRing = [
  [0, 0],
  [4, 0],
  [4, 4],
  [0, 4],
  [0, 0]
];
test('projection domains snapshot disconnected components, holes and periodic seams', () => {
  const input = {
    polygons: [
      {
        outer: ring.map(p => [...p]),
        holes: [
          [
            [1, 1],
            [1, 2],
            [2, 1],
            [1, 1]
          ]
        ]
      }
    ],
    periodic: {axis: 0, minimum: -180, period: 360}
  };
  const domain = createCRSProjectionDomain(input as CRSProjectionDomain);
  input.polygons[0].outer[0][0] = 99;
  input.polygons[0].holes[0][0][0] = 99;
  input.periodic.minimum = 0;
  expect(domain.polygons[0].outer[0]).toEqual([0, 0]);
  expect(domain.polygons[0].holes![0][0]).toEqual([1, 1]);
  expect(domain.periodic!.minimum).toBe(-180);
  expect(Object.isFrozen(domain.polygons[0].outer[0])).toBe(true);
  expect(Object.isFrozen(domain.polygons[0].holes)).toBe(true);
  expect(Object.isFrozen(domain.periodic)).toBe(true);
  expect(
    createCRSProjectionDomain({
      polygons: [{outer: ring}, {outer: ring.map(([x, y]) => [x + 10, y])}]
    }).polygons
  ).toHaveLength(2);
  expect(createCRSProjectionDomain({polygons: []})).toEqual({polygons: []});
});
test('projection domains reject malformed rings and unrepresentable periods', () => {
  for (const outer of [
    [],
    ring.slice(0, -1),
    [
      [0, 0],
      [1, 1],
      [2, 2],
      [0, 0]
    ],
    [
      [0, 0],
      [1, 0],
      [0, Infinity],
      [0, 0]
    ],
    new Array(4),
    [[0, 0], [1, 0], [0], [0, 0]]
  ]) {
    expect(() => createCRSProjectionDomain({polygons: [{outer}]} as CRSProjectionDomain)).toThrow(
      RangeError
    );
  }
  for (const periodic of [
    {axis: 2, minimum: 0, period: 1},
    {axis: 0, minimum: 0, period: 0},
    {axis: 0, minimum: 1e30, period: 1},
    {axis: 0, minimum: 1e308, period: 1e308}
  ]) {
    expect(() =>
      createCRSProjectionDomain({polygons: [], periodic} as CRSProjectionDomain)
    ).toThrow(RangeError);
  }
  for (const value of [
    null,
    {},
    {polygons: [null]},
    {polygons: [{outer: ring, holes: 1}]},
    {polygons: [], periodic: null}
  ]) {
    expect(() => createCRSProjectionDomain(value as CRSProjectionDomain)).toThrow(RangeError);
  }
});
