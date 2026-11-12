// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DGGS_DECODERS} from '@math.gl/dggs';
import {getResolution, hexToU64} from 'a5-js';
import {
  GRID_LEVELS,
  getCellId,
  getGridLevel,
  generateCells
} from '../../../../../examples/dggs/cell-explorer/src/generator.js';

function tileBounds(longitude, latitude, zoom) {
  const size = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * size);
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan((latitude * Math.PI) / 180)) / Math.PI) / 2) * size
  );
  const tileLatitude = row =>
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * row) / size))) * 180) / Math.PI;
  return [
    [(x / size) * 360 - 180, tileLatitude(y + 1)],
    [((x + 1) / size) * 360 - 180, tileLatitude(y)]
  ];
}

for (const grid of Object.keys(GRID_LEVELS)) {
  test(`${grid}: tile bounds produce unique, decodable cells covering their interior`, () => {
    const decoder = DGGS_DECODERS.find(item => item.name === grid);
    for (const zoom of [0, 4, 9, 15, 20]) {
      const level = getGridLevel(grid, zoom);
      const bounds = tileBounds(-122.4, 37.78, zoom);
      const ids = generateCells(grid, bounds, level);
      assert(ids.length > 0 && ids.length < 2000, `${grid} zoom ${zoom}: ${ids.length} cells`);
      assert.equal(new Set(ids).size, ids.length);
      for (const id of ids) {
        assert.equal(typeof id, 'string');
        assert(decoder.cellToBoundary(id).flat().every(Number.isFinite));
        if (grid === 'a5') assert.equal(getResolution(hexToU64(id)), level);
      }
      const [[west, south], [east, north]] = bounds;
      for (const x of [0.1, 0.5, 0.9]) {
        for (const y of [0.1, 0.5, 0.9]) {
          const point = [west + x * (east - west), south + y * (north - south)];
          assert(
            ids.includes(getCellId(grid, point, level)),
            `${grid} zoom ${zoom} must cover ${point}`
          );
        }
      }
    }
  });

  test(`${grid}: normalized tiles on both sides of the antimeridian cover their cells`, () => {
    const level = getGridLevel(grid, 4);
    for (const bounds of [
      [
        [178, -1],
        [180, 1]
      ],
      [
        [-180, -1],
        [-178, 1]
      ]
    ]) {
      const ids = generateCells(grid, bounds, level);
      const longitude = (bounds[0][0] + bounds[1][0]) / 2;
      assert(ids.includes(getCellId(grid, [longitude, 0], level)));
      assert.equal(new Set(ids).size, ids.length);
    }
  });

  test(`${grid}: a subcell-sized bound still includes its containing cell`, () => {
    const level = getGridLevel(grid, 9);
    const point = [-122.4, 37.78];
    const bounds = [
      [point[0] - 0.000001, point[1] - 0.000001],
      [point[0] + 0.000001, point[1] + 0.000001]
    ];
    assert(generateCells(grid, bounds, level).includes(getCellId(grid, point, level)));
  });

  test(`${grid}: zoom-dependent levels start at the configured detail and grow monotonically`, () => {
    assert.equal(getGridLevel(grid, 0), grid === 'quadkey' ? 2 : GRID_LEVELS[grid].levels[0]);
    let previous = -1;
    for (let zoom = 0; zoom <= 24; zoom++) {
      const level = getGridLevel(grid, zoom);
      assert(GRID_LEVELS[grid].levels.includes(level));
      assert(level >= previous);
      assert.equal(getGridLevel(grid, zoom + 0.75), level);
      previous = level;
    }
    assert(getGridLevel(grid, 16) > getGridLevel(grid, 4));
  });
}

test('S2 bounds cover a cube vertex and both polar regions', () => {
  for (const bounds of [
    [
      [44, 34],
      [46, 36]
    ],
    [
      [-10, 84],
      [10, 90]
    ],
    [
      [170, -90],
      [180, -84]
    ]
  ]) {
    const ids = generateCells('s2', bounds, 6);
    const [[west, south], [east, north]] = bounds;
    for (const point of [
      [west, south],
      [east, north],
      [(west + east) / 2, (south + north) / 2]
    ]) {
      assert(ids.includes(getCellId('s2', point, 6)), `${point}`);
    }
  }
});

test('reject invalid grids, zooms, and levels', () => {
  const bounds = [
    [-123, 37],
    [-122, 38]
  ];
  assert.throws(() => generateCells('unknown', bounds, 1));
  assert.throws(() => generateCells('h3', bounds, 16));
  assert.throws(() => generateCells('plus-code', bounds, 3));
  assert.throws(() => getGridLevel('unknown', 1));
  assert.throws(() => getGridLevel('h3', NaN));
});

// a5-js 0.10.0 reuses a cached face projection for antipodal points.
// Keep this upstream reproducer separate from the example's bounds checks.
test.todo('upstream A5: north-to-south pole lookup selects the south-pole cell', () => {
  const decoder = DGGS_DECODERS.find(item => item.name === 'a5');
  const north = getCellId('a5', [0, 90], 12);
  const south = getCellId('a5', [0, -90], 12);
  assert.notEqual(north, south);
  assert(decoder.cellToLngLat(south)[1] < 0);
});
