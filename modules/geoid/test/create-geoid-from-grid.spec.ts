// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {createGeoidFromGrid, parsePGM} from '@math.gl/geoid';
import type {GeoidGridProps} from '@math.gl/geoid';
import {openFile} from './utils/file-utils';
import {createForeignTypedArray} from '../../../test/utils/foreign-typed-array';

test('decoded geoid accepts foreign-realm Uint16Array values for both interpolation modes', async () => {
  const foreign = (await createForeignTypedArray('Uint16Array', 16)) as Uint16Array;
  expect(foreign instanceof Uint16Array).toBe(false);
  const values = foreign.subarray(2, 14);
  values.set([100, 100, 100, 100, 200, 300, 400, 500, 600, 600, 600, 600]);
  for (const cubic of [false, true]) {
    const options = {width: 4, height: 3, offset: -108, scale: 0.003, cubic};
    const grid = createGeoidFromGrid({...options, values});
    const local = createGeoidFromGrid({...options, values: new Uint16Array(values)});
    expect(grid.options.data).toBe(values);
    for (const [latitude, longitude] of [
      [90, 0],
      [0, 0],
      [45, 30],
      [-89, -179],
      [-90, 120]
    ]) {
      expect(grid.getHeight(latitude, longitude)).toBe(local.getHeight(latitude, longitude));
    }
    if (!cubic) {
      expect(grid.getHeight(0, 0)).toBeCloseTo(-107.4, 12);
    }
  }
});

test.skipIf(typeof globalThis.Float16Array !== 'function')(
  'decoded geoid rejects Float16Array values rather than interpreting floats as raw integers',
  () => {
    expect(() =>
      createGeoidFromGrid({
        width: 4,
        height: 3,
        values: new globalThis.Float16Array(12) as unknown as Uint16Array,
        offset: -108,
        scale: 0.003
      })
    ).toThrow('Uint16Array');
  }
);

for (const resolution of ['low', 'hi']) {
  for (const cubic of [false, true]) {
    test(`decoded ${resolution} grid matches PGM with cubic=${cubic}`, async () => {
      const bytes = (await openFile(`modules/geoid/data/geoid-egm96-${resolution}.pgm`))!;
      const pgm = parsePGM(bytes, {cubic});
      const {
        _width: width,
        _height: height,
        _offset: offset,
        _scale: scale,
        _datastart
      } = pgm.options;
      // Sliced columns must respect their byte offset, not the backing buffer's.
      const storage = new Uint16Array(width * height + 4);
      storage.fill(65535);
      const values = storage.subarray(2, storage.length - 2);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      for (let i = 0; i < values.length; i++) {
        values[i] = view.getUint16(_datastart + i * 2, false);
      }
      const grid = createGeoidFromGrid({width, height, values, offset, scale, cubic});
      expect(grid.options.data).toBe(values);
      // Interior nodes, fractional positions, polar stencils, seam wrapping and cache reuse.
      const coordinates = [
        [0, 0],
        [0, 80],
        [-5, 145],
        [51.5, -0.12],
        [-23.47, 179.99],
        [89.99, -179.99],
        [-89.99, 180.01],
        [90, 120],
        [-90, -120],
        [0, -180],
        [0, 180],
        [51.5, 359.88],
        [51.5, -0.12],
        [51.5, -0.12]
      ];
      for (const [latitude, longitude] of coordinates) {
        expect(grid.getHeight(latitude, longitude)).toBe(pgm.getHeight(latitude, longitude));
      }
      expect(grid.getHeight(91, 0)).toBeNaN();
      expect(grid.getHeight(0, NaN)).toBeNaN();
    });
  }
}

test('decoded grid defaults to bilinear interpolation and decodes raw heights', () => {
  const grid = createGeoidFromGrid({
    width: 4,
    height: 3,
    values: new Uint16Array(12).fill(100),
    offset: -108,
    scale: 0.003
  });
  expect(grid.options.cubic).toBe(false);
  expect(grid.getHeight(12.5, -47.25)).toBeCloseTo(-107.7, 12);
});

test('decoded grid rejects incompatible layouts, samples, and height encoding', () => {
  const valid: GeoidGridProps = {
    width: 4,
    height: 3,
    values: new Uint16Array(12),
    offset: -108,
    scale: 0.003
  };
  const invalid: Partial<GeoidGridProps>[] = [
    {width: 0},
    {width: 3},
    {width: 4.5},
    {width: Infinity},
    {height: 1},
    {height: 4},
    {height: 3.5},
    {height: NaN},
    {values: new Uint16Array(11)},
    {values: new Uint16Array(13)},
    {values: new Float64Array(12) as unknown as Uint16Array},
    {values: new Int16Array(12) as unknown as Uint16Array},
    {values: null},
    {offset: NaN},
    {offset: Infinity},
    {scale: 0},
    {scale: -1},
    {scale: NaN},
    {scale: Infinity}
  ];
  for (const options of invalid) {
    expect(() => createGeoidFromGrid({...valid, ...options})).toThrow('Geoid grid:');
  }
});
