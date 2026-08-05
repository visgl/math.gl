// math.gl
// SPDX-License-Identifier: MIT and ISC
// Copyright (c) vis.gl contributors

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
import {earcut} from '@math.gl/polygon';
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

const FIXTURES_PATH = 'modules/polygon/test/data/earcut/fixtures/';

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
