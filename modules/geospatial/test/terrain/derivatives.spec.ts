// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField, TerrainSampleStatus as Status} from '@math.gl/geospatial/terrain';
import {createTerrainGradientGrid} from '@math.gl/geospatial/terrain/derivatives';
import {
  getTerrainSlopeAspect,
  createTerrainSlopeAspectGrid
} from '@math.gl/geospatial/terrain/slope-aspect';

for (const method of ['horn', 'zevenbergen-thorne'] as const) {
  test(`${method} recovers world plane gradients in rotated, reflected and sheared metric grids`, () => {
    for (const [columnStep, rowStep] of [
      [
        [2, 0],
        [0, 3]
      ],
      [
        [-2, 1],
        [1, 3]
      ],
      [
        [0, 2],
        [-3, 0]
      ]
    ] as const) {
      const heights = Float64Array.from({length: 25}, (_, i) => {
        const x = i % 5,
          y = Math.floor(i / 5);
        return (
          3 * (x * columnStep[0] + y * rowStep[0]) - 2 * (x * columnStep[1] + y * rowStep[1]) + 100
        );
      });
      const field = new HeightField({
        width: 5,
        height: 5,
        heights,
        columnStep,
        rowStep,
        origin: [1e12, -1e12],
        registration: 'cell',
        heightReference: 'survey'
      });
      const grid = createTerrainGradientGrid(field, {method});
      for (let y = 0; y < 5; y++)
        for (let x = 0; x < 5; x++) {
          const i = y * 5 + x;
          if (x === 0 || y === 0 || x === 4 || y === 4) {
            expect(grid.statuses[i]).toBe(Status.OUTSIDE_DOMAIN);
            expect(grid.gradients[2 * i]).toBe(0);
          } else {
            expect(grid.statuses[i]).toBe(Status.VALID);
            expect(grid.gradients[2 * i]).toBeCloseTo(3, 14);
            expect(grid.gradients[2 * i + 1]).toBeCloseTo(-2, 14);
          }
        }
      expect(grid.registration).toBe('cell');
      expect(grid.heightReference).toBe('survey');
      grid.gradients.fill(0);
      expect(field.getHeight(0, 0)).toBe(100);
    }
  });
  test(`${method} handles polynomial surfaces and strict nine-node validity`, () => {
    const heights = Float64Array.from(
      {length: 25},
      (_, i) => (i % 5) ** 2 + 3 * Math.floor(i / 5) ** 2
    );
    const field = new HeightField({width: 5, height: 5, heights});
    const grid = createTerrainGradientGrid(field, {method});
    expect(Array.from(grid.gradients.subarray(24, 26))).toEqual([4, 12]);
    for (const hole of [6, 7, 8, 11, 12, 13, 16, 17, 18]) {
      const values = heights.slice();
      values[hole] = NaN;
      const missing = createTerrainGradientGrid(
        new HeightField({width: 5, height: 5, heights: values}),
        {method}
      );
      expect(missing.statuses[12]).toBe(Status.NO_DATA);
      expect(missing.gradients[24]).toBe(0);
    }
  });
}

test('Horn weights diagonal neighbors while Zevenbergen-Thorne uses central differences', () => {
  const field = new HeightField({
    width: 3,
    height: 3,
    heights: Float64Array.from([0, 0, 8, 0, 0, 0, 0, 0, 0])
  });
  expect(Array.from(createTerrainGradientGrid(field).gradients.subarray(8, 10))).toEqual([1, -1]);
  expect(
    Array.from(
      createTerrainGradientGrid(field, {method: 'zevenbergen-thorne'}).gradients.subarray(8, 10)
    )
  ).toEqual([0, 0]);
});

test('gradient overflow is explicit and constant/large finite heights remain usable', () => {
  const constant = new HeightField({width: 3, height: 3, heights: new Float64Array(9).fill(1e308)});
  expect(createTerrainGradientGrid(constant).gradients[8]).toBe(0);
  const ramp = Float64Array.from({length: 9}, (_, i) => ((i % 3) - 1) * 1e308);
  const large = createTerrainGradientGrid(new HeightField({width: 3, height: 3, heights: ramp}));
  expect(large.statuses[4]).toBe(0);
  expect(large.gradients[8]).toBeCloseTo(1e308);
  const overflow = createTerrainGradientGrid(
    new HeightField({
      width: 3,
      height: 3,
      heights: ramp,
      columnStep: [1e-150, 0],
      rowStep: [0, 1e-150]
    })
  );
  expect(overflow.statuses[4]).toBe(Status.NUMERIC_ERROR);
  expect(overflow.gradients[8]).toBe(0);
  const small = new HeightField({width: 2, height: 2, heights: new Float64Array(4)});
  expect(Array.from(createTerrainGradientGrid(small).statuses)).toEqual([1, 1, 1, 1]);
  for (const options of [{method: 'bad'}, {maxSamples: 3}, {maxSamples: NaN}, {maxSamples: -1}])
    expect(() => createTerrainGradientGrid(small, options as never)).toThrow();
});

test('slope and downhill aspect use radians and explicit flat semantics', () => {
  for (const [x, y, angle] of [
    [0, -1, 0],
    [-1, 0, Math.PI / 2],
    [0, 1, Math.PI],
    [1, 0, (3 * Math.PI) / 2]
  ]) {
    const result = getTerrainSlopeAspect(x, y);
    expect(result.slope).toBe(Math.PI / 4);
    expect(result.aspect).toBe(angle);
  }
  expect(getTerrainSlopeAspect(0, -0)).toEqual({slope: 0, aspect: undefined});
  expect(getTerrainSlopeAspect(1e308, 1e308).slope).toBe(Math.PI / 2);
  for (const invalid of [NaN, Infinity, -Infinity])
    expect(() => getTerrainSlopeAspect(invalid, 0)).toThrow();
});

test('slope grids retain statuses, separate flat aspect validity and own their buffers', () => {
  const grid = {
    width: 2,
    height: 2,
    gradients: Float64Array.from([0, 0, 1, 0, NaN, NaN, 0, -1]),
    statuses: Uint8Array.from([0, 0, Status.NO_DATA, Status.NOT_RESIDENT])
  };
  const result = createTerrainSlopeAspectGrid(grid);
  expect(Array.from(result.statuses)).toEqual([0, 0, 2, 6]);
  expect(Array.from(result.aspectStatuses)).toEqual([2, 0, 2, 6]);
  expect(result.slopes[1]).toBe(Math.PI / 4);
  expect(result.aspects[1]).toBe((3 * Math.PI) / 2);
  result.statuses[0] = 6;
  expect(grid.statuses[0]).toBe(0);
  for (const bad of [
    {...grid, width: 1},
    {...grid, gradients: new Float64Array(2)},
    {...grid, statuses: new Uint8Array(2)},
    {...grid, statuses: Uint8Array.from([99, 0, 0, 0])},
    {...grid, statuses: new Uint8Array(4)}
  ])
    expect(() => createTerrainSlopeAspectGrid(bad)).toThrow();
  expect(() => createTerrainSlopeAspectGrid(grid, {maxSamples: 3})).toThrow();
});

test('near-north aspect preserves small positive angles', () => {
  expect(getTerrainSlopeAspect(-1e-20, -1).aspect).toBe(1e-20);
});
