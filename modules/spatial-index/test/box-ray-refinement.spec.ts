// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {BoxIndex} from '../src';

test.each([2, 3] as const)(
  'nearest %iD box rays agree with ordered broad-phase candidates',
  dimension => {
    const boxes = new BoxIndex({
      bounds:
        dimension === 2
          ? [2, -1, 3, 1, 5, -1, 6, 1, -1, -1, 1, 1]
          : [2, -1, -1, 3, 1, 1, 5, -1, -1, 6, 1, 1, -1, -1, -1, 1, 1, 1],
      dimension,
      leafSize: 1
    });
    const origin = new Array(dimension).fill(0),
      direction = origin.map((_, axis) => (axis ? 0 : 7));
    expect(boxes.intersectRay(origin, direction)).toEqual({index: 2, distance: 0});
    expect(boxes.intersectRay(origin, direction, {filter: index => index !== 2})).toEqual({
      index: 0,
      distance: 2
    });
    expect(
      boxes.intersectRay(origin, direction, {filter: index => index !== 2, maxDistance: 2})
    ).toEqual({index: 0, distance: 2});
    expect(
      boxes.intersectRay(origin, direction, {filter: index => index !== 2, maxDistance: 1})
    ).toBeNull();
    expect(boxes.intersectRay(origin, direction, {intersectItem: () => null})).toBeNull();
    expect(boxes.intersectRay(origin, direction, {filter: () => false})).toBeNull();
    expect(
      boxes.intersectRay(
        origin.map(() => 10),
        direction
      )
    ).toBeNull();
  }
);

test('rejection preserves later geometry, inclusive limits and original-row tie breaking', () => {
  const index = new BoxIndex({
    bounds: [1, -1, 10, 1, 2, -1, 3, 1, 20, -1, 21, 1],
    dimension: 2,
    leafSize: 1
  });
  const limits: number[] = [];
  expect(
    index.intersectRay([0, 0], [1, 0], {
      maxDistance: 30,
      intersectItem: (row, maximum) => {
        limits.push(maximum);
        return row === 0 ? null : row === 1 ? 3 : 21;
      }
    })
  ).toEqual({index: 1, distance: 3});
  // Near-first siblings are not a global best-first queue; predicate order is unspecified.
  expect(limits[0]).toBe(30);
  expect(limits.every(maximum => maximum >= 3 && maximum <= 30)).toBe(true);
  expect(
    index.intersectRay([0, 0], [1, 0], {intersectItem: row => (row === 2 ? null : 3)})
  ).toEqual({index: 0, distance: 3});
  expect(index.intersectRay([0, 0], [1, 0], {maxDistance: 2, intersectItem: () => 3})).toBeNull();
});

test.each([1, 8, 64])(
  'accepted-near-hit pruning avoids refining 1023 farther boxes (leaf %i)',
  leafSize => {
    const bounds = Array.from({length: 1024}, (_, index) => [
      index * 2 + 1,
      -1,
      index * 2 + 2,
      1
    ]).flat();
    const index = new BoxIndex({bounds, dimension: 2, leafSize});
    const refine = vi.fn((row: number) => row * 2 + 1);
    expect(index.intersectRay([0, 0], [3, 0], {intersectItem: refine})).toEqual({
      index: 0,
      distance: 1
    });
    expect(refine).toHaveBeenCalledTimes(1);
  }
);

test('refinements validate lower bounds and distances, preserve exceptions and support empty indexes', () => {
  const index = new BoxIndex({bounds: [1, -1, 2, 1], dimension: 2});
  for (const distance of [-1, NaN, 0.5])
    expect(() => index.intersectRay([0, 0], [1, 0], {intersectItem: () => distance})).toThrow();
  expect(index.intersectRay([0, 0], [1, 0], {intersectItem: () => Infinity})).toBeNull();
  expect(() =>
    index.intersectRay([0, 0], [1, 0], {
      intersectItem: () => {
        throw new Error('refinement failed');
      }
    })
  ).toThrow('refinement failed');
  expect(() => index.intersectRay([0, 0], [0, 0])).toThrow();
  expect(() => index.intersectRay([0, 0], [1, 0], {maxDistance: NaN})).toThrow();
  expect(new BoxIndex({bounds: [], dimension: 2}).intersectRay([0, 0], [1, 0])).toBeNull();
});

test.each([1, 1e-8, 1e8])(
  'roundoff preserves refined distances, inclusive limits and stable ties at scale %s',
  scale => {
    const exact = 0.29999999999999993 * scale;
    const index = new BoxIndex({
      bounds: [0.3 * scale, -1, 0.4 * scale, 1, 0.2 * scale, -1, 0.4 * scale, 1],
      dimension: 2,
      leafSize: 1
    });
    expect(index.intersectRay([0, 0], [1, 0], {intersectItem: () => exact})).toEqual({
      index: 0,
      distance: exact
    });
    expect(
      index.intersectRay([0, 0], [1, 0], {maxDistance: exact, intersectItem: () => exact})
    ).toEqual({index: 0, distance: exact});
    expect(
      index.intersectRay([0, 0], [1, 0], {
        maxDistance: exact * (1 - 1e-10),
        intersectItem: () => exact
      })
    ).toBeNull();
    expect(() => index.intersectRay([0, 0], [1, 0], {intersectItem: () => 0.19 * scale})).toThrow();
  }
);

test.each([1, 8])(
  'exact filtered ray refinements match exhaustive row scans (leaf %i)',
  leafSize => {
    const bounds = Array.from({length: 64}, (_, index) => [index - 10, -2, index - 8, 2]).flat();
    const boxes = new BoxIndex({bounds, dimension: 2, leafSize});
    for (const start of [-20, 0, 25, 100])
      for (const direction of [-7, 7])
        for (const maximum of [0, 1, 10, Infinity]) {
          const candidates = boxes.searchRay([start, 0], [direction, 0], maximum);
          const expected =
            candidates
              .filter(candidate => candidate.index % 3 !== 0)
              .map(candidate => ({index: candidate.index, distance: candidate.distance + 0.25}))
              .filter(candidate => candidate.distance <= maximum)
              .sort(
                (first, second) => first.distance - second.distance || first.index - second.index
              )[0] ?? null;
          const distances = new Map(
            candidates.map(candidate => [candidate.index, candidate.distance + 0.25])
          );
          expect(
            boxes.intersectRay([start, 0], [direction, 0], {
              maxDistance: maximum,
              filter: row => row % 3 !== 0,
              intersectItem: row => distances.get(row) ?? null
            })
          ).toEqual(expected);
        }
  }
);
