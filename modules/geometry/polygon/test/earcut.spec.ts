// math.gl
// SPDX-License-Identifier: MIT AND ISC
// SPDX-FileCopyrightText: Copyright (c) 2016, Mapbox
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Adapted from Mapbox earcut. Original ISC notice retained below.

/*
  Adapted from https://github.com/mapbox/earcut

  ISC License

  Copyright (c) 2016, Mapbox

  Permission to use, copy, modify, and/or distribute this software for any purpose
  with or without fee is hereby granted, provided that the above copyright notice
  and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
  OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
  THIS SOFTWARE.

 */

// @ts-nocheck External code

import {test, expect} from 'vitest';
import fs from 'fs';
import {earcut} from '@math.gl/geometry';
import {extractAreas, deviation, flatten} from './earcut-utils';
import expected from './data/earcut/expected';

test('indices-2d', function () {
  const indices = earcut([10, 0, 0, 50, 60, 60, 70, 10]);
  expect(indices).toEqual([1, 0, 3, 3, 2, 1]);
});

test('indices-3d', function () {
  const indices = earcut([10, 4, 0, 0, 50, 0, 60, 60, 0, 70, 10, 0], null, 3);
  expect(indices).toEqual([1, 0, 3, 3, 2, 1]);
});

test('indices-3d', function () {
  const indices = earcut([10, 4, 0, 0, 50, 0, 60, 60, 0, 70, 10, 0], null, 3);
  expect(indices).toEqual([1, 0, 3, 3, 2, 1]);
});

test('projection', function () {
  let indices = earcut([0, 4, 0, 0, 50, 0, 0, 60, 20, 0, 10, 20], null, 3, undefined, 'xy');
  expect(indices).toEqual([]); // Polygon has no area on the XY plane

  indices = earcut([0, 4, 0, 0, 50, 0, 0, 60, 20, 0, 10, 20], null, 3, undefined, 'yz');
  expect(indices).toEqual([2, 3, 0, 0, 1, 2]);
});

async function openFile(filePath) {
  let data = null;
  if (fs && 'promises' in fs) {
    data = await fs.promises.readFile(filePath);
    data = JSON.parse(data.toString());
  } else if (typeof fetch !== 'undefined') {
    const request = await fetch(filePath);
    data = await request.json();
  }
  return data;
}

const FIXTURES_PATH = 'modules/geometry/polygon/test/data/earcut/fixtures/';

Object.keys(expected.triangles).forEach(id => {
  test(id, async () => {
    const filepath = FIXTURES_PATH + `${id}.json`;
    const raw = await openFile(filepath);
    const data = flatten(raw);
    const indices = earcut(data.vertices, data.holes, data.dimensions);
    const actualDeviation = deviation(data.vertices, data.holes, data.dimensions, indices);
    const expectedTriangles = expected.triangles[id];
    const expectedDeviation = expected.errors[id] || 0;

    const numTriangles = indices.length / 3;
    expect(
      numTriangles === expectedTriangles,
      `${numTriangles} triangles when expected ${expectedTriangles}`
    ).toBeTruthy();

    if (expectedTriangles > 0) {
      expect(
        actualDeviation <= expectedDeviation,
        `deviation ${actualDeviation} <= ${expectedDeviation}`
      ).toBeTruthy();
    }

    // Compare to result obtained with precomputed areas
    const areas = extractAreas(data.vertices, data.holes, data.dimensions);
    const indices2 = earcut(data.vertices, data.holes, data.dimensions, areas);
    expect(
      indices2,
      'earcut triangulation with precomputed areas should match one without precomputation'
    ).toEqual(indices);
  });
});

for (const plane of ['xz', 'yz']) {
  test(`hashed triangulation on ${plane}`, async () => {
    const data = flatten(await openFile(`${FIXTURES_PATH}water.json`));
    const reference = earcut(data.vertices, data.holes);
    const positions = new Float64Array((data.vertices.length / 2) * 3);
    for (let i = 0; i < data.vertices.length / 2; i++) {
      const x = data.vertices[i * 2];
      const y = data.vertices[i * 2 + 1];
      positions.set(plane === 'xz' ? [x, 1e6, y] : [1e6, x, y], i * 3);
    }
    const areas = extractAreas(data.vertices, data.holes, 2);
    expect(earcut(positions, data.holes, 3, undefined, plane)).toEqual(reference);
    expect(earcut(positions, data.holes, 3, areas, plane)).toEqual(reference);
    expect(deviation(data.vertices, data.holes, 2, reference)).toBeLessThanOrEqual(
      expected.errors.water
    );
  });
}

test('scratch storage is reset across holes, steiner points, and empty calls', async () => {
  const data = flatten(await openFile(`${FIXTURES_PATH}steiner.json`));
  const reference = earcut(data.vertices, data.holes);
  for (let i = 0; i < 3; i++) {
    expect(earcut([])).toEqual([]);
    expect(earcut([0, 0, 1, 0, 1, 1, 0, 1], [4, 4])).toEqual([2, 3, 0, 0, 1, 2]);
    expect(earcut(data.vertices, data.holes)).toEqual(reference);
    expect(deviation(data.vertices, data.holes, 2, reference)).toBe(0);
  }
});

test('scratch storage survives nested calls and exceptions from input getters', () => {
  const positions = [0, 0, 10, 0, 10, 10, 0, 10, 2, 2, 4, 2, 4, 4, 2, 4];
  const reference = earcut(positions, [4]);
  const nested = [...positions];
  Object.defineProperty(nested, 10, {
    get() {
      expect(earcut(positions, [4])).toEqual(reference);
      return positions[10];
    }
  });
  expect(earcut(nested, [4])).toEqual(reference);
  Object.defineProperty(nested, 8, {
    get() {
      throw new Error('input read failed');
    }
  });
  expect(() => earcut(nested, [4])).toThrow('input read failed');
  expect(earcut(positions, [4])).toEqual(reference);
});
