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
  expect(indices).toEqual([1, 0, 3, 1, 3, 2]);
});

test('indices-3d', function () {
  const indices = earcut([10, 4, 0, 0, 50, 0, 60, 60, 0, 70, 10, 0], null, 3);
  expect(indices).toEqual([1, 0, 3, 1, 3, 2]);
});

test('indices-3d', function () {
  const indices = earcut([10, 4, 0, 0, 50, 0, 60, 60, 0, 70, 10, 0], null, 3);
  expect(indices).toEqual([1, 0, 3, 1, 3, 2]);
});

test('projection', function () {
  let indices = earcut([0, 4, 0, 0, 50, 0, 0, 60, 20, 0, 10, 20], null, 3, undefined, 'xy');
  expect(indices).toEqual([]); // Polygon has no area on the XY plane

  indices = earcut([0, 4, 0, 0, 50, 0, 0, 60, 20, 0, 10, 20], null, 3, undefined, 'yz');
  expect(indices).toEqual([2, 3, 0, 2, 0, 1]);
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

const FIXTURES_PATH = 'modules/geometry/test/polygon/data/earcut/fixtures/';

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

  for (const rotation of [90, 180, 270]) {
    test(`${id} rotation ${rotation}`, async () => {
      const raw = await openFile(`${FIXTURES_PATH}${id}.json`);
      const theta = (rotation * Math.PI) / 180;
      const xx = Math.round(Math.cos(theta));
      const xy = Math.round(-Math.sin(theta));
      const yx = Math.round(Math.sin(theta));
      const yy = Math.round(Math.cos(theta));
      for (const ring of raw) {
        for (const point of ring) {
          const [x, y] = point;
          point[0] = xx * x + xy * y;
          point[1] = yx * x + yy * y;
        }
      }
      const {vertices, holes, dimensions} = flatten(raw);
      const indices = earcut(vertices, holes, dimensions);
      const tolerance = expected['errors-with-rotation'][id] || expected.errors[id] || 0;
      if (expected.triangles[id] > 0) {
        expect(deviation(vertices, holes, dimensions, indices)).toBeLessThanOrEqual(tolerance);
      }
      expect(
        earcut(vertices, holes, dimensions, extractAreas(vertices, holes, dimensions))
      ).toEqual(indices);
    });
  }

  test(`${id} typed projections and precomputed areas`, async () => {
    const {vertices, holes, dimensions} = flatten(await openFile(`${FIXTURES_PATH}${id}.json`));
    const indices = earcut(vertices, holes, dimensions);
    const areas = new Float64Array(extractAreas(vertices, holes, dimensions));
    for (const plane of ['xy', 'xz', 'yz']) {
      const positions = new Float64Array((vertices.length / dimensions) * 3);
      const i0 = plane === 'yz' ? 1 : 0;
      const i1 = plane === 'xy' ? 1 : 2;
      positions.fill(1e9); // the unused coordinate must not affect the hash bbox or winding
      for (let i = 0; i < vertices.length / dimensions; i++) {
        positions[i * 3 + i0] = vertices[i * dimensions];
        positions[i * 3 + i1] = vertices[i * dimensions + 1];
      }
      const typedHoles = new Uint32Array(holes);
      expect(earcut(positions, typedHoles, 3, undefined, plane)).toEqual(indices);
      expect(earcut(positions, typedHoles, 3, areas, plane)).toEqual(indices);
    }
  });
});

test('hole touching another ring at its leftmost vertex leaves no gap', async () => {
  // Land polygon from a 4096-unit vector tile: 120 rings, several holes share a vertex
  // with another ring. Before the bridge fix, a hairline crack of these points stayed open.
  const data = flatten(await openFile(`${FIXTURES_PATH}vector-tile-touching-holes.json`));
  const indices = earcut(data.vertices, data.holes);
  expect(deviation(data.vertices, data.holes, 2, indices)).toBeLessThan(1e-12);

  const crackPoints = [
    [1427.3, 2419.3],
    [2666.9, 2502.7],
    [3085.3, 2525.3],
    [3922.1, 2570.6]
  ];
  for (const [x, y] of crackPoints) {
    expect(isCovered(data.vertices, indices, x, y), `${x},${y} is covered`).toBe(true);
  }
});

/** Returns true when 2D point `x`,`y` lies inside or on one of the triangles. */
function isCovered(vertices, indices, x, y) {
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 2;
    const b = indices[i + 1] * 2;
    const c = indices[i + 2] * 2;
    const d1 =
      (vertices[b] - vertices[a]) * (y - vertices[a + 1]) -
      (vertices[b + 1] - vertices[a + 1]) * (x - vertices[a]);
    const d2 =
      (vertices[c] - vertices[b]) * (y - vertices[b + 1]) -
      (vertices[c + 1] - vertices[b + 1]) * (x - vertices[b]);
    const d3 =
      (vertices[a] - vertices[c]) * (y - vertices[c + 1]) -
      (vertices[a + 1] - vertices[c + 1]) * (x - vertices[c]);
    if ((d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0)) return true;
  }
  return false;
}

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
    expect(earcut([0, 0, 1, 0, 1, 1, 0, 1], [4, 4])).toEqual([2, 3, 0, 2, 0, 1]);
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

test('large convex polygon and smaller calls release and reuse scratch safely', () => {
  const count = 100000;
  const vertices = new Float64Array(count * 2);
  for (let i = 0; i < count; i++) {
    vertices[i * 2] = Math.cos((2 * Math.PI * i) / count);
    vertices[i * 2 + 1] = Math.sin((2 * Math.PI * i) / count);
  }
  const indices = earcut(vertices);
  expect(indices.length / 3).toBe(count - 2);
  expect(deviation(vertices, undefined, 2, indices)).toBeLessThan(1e-12);
  expect(earcut([0, 0, 1, 0, 1, 1, 0, 1])).toEqual([2, 3, 0, 2, 0, 1]);
});

test('nested calls and thrown getters preserve indexed holes, sorting, and steiner state', async () => {
  const {vertices, holes} = flatten(await openFile(`${FIXTURES_PATH}touching-holes6.json`));
  const reference = earcut(vertices, holes);
  const steiner = flatten(await openFile(`${FIXTURES_PATH}steiner.json`));
  const steinerReference = earcut(steiner.vertices, steiner.holes);
  const nested = [...vertices];
  Object.defineProperty(nested, holes[1] * 2, {
    get() {
      expect(earcut(steiner.vertices, steiner.holes)).toEqual(steinerReference);
      expect(earcut(vertices, holes)).toEqual(reference);
      expect(() =>
        earcut(
          new Proxy([0, 0, 1, 0, 1, 1], {
            get(target, key) {
              if (key === '2') throw new Error('nested input read failed');
              return Reflect.get(target, key);
            }
          })
        )
      ).toThrow('nested input read failed');
      return vertices[holes[1] * 2];
    }
  });
  expect(earcut(nested, holes)).toEqual(reference);
  const areaValues = extractAreas(vertices, holes, 2);
  const nestedAreas = [...areaValues];
  Object.defineProperty(nestedAreas, 1, {
    get() {
      expect(earcut(vertices, holes)).toEqual(reference);
      return areaValues[1];
    }
  });
  expect(earcut(vertices, holes, 2, nestedAreas)).toEqual(reference);
  expect(earcut(vertices, holes)).toEqual(reference);
});

test('deeply nested splits complete without recursive clipping', () => {
  const count = 600;
  const vertices = [-1, -count, 2 * count + 1, -count, 2 * count + 1, 7, -1, 7];
  const holes = [];
  for (let i = 0; i < count; i++) {
    holes.push(vertices.length / 2);
    vertices.push(1 + 2 * i, -i, 2 * i, 6 - i, 2 + 2 * i, 6 - i);
  }
  const indices = earcut(vertices, holes);
  expect(indices.length / 3).toBe(3002);
  expect(deviation(vertices, holes, 2, indices)).toBe(0);
});
