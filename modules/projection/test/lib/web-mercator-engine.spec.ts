// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/projection';
import {WebMercatorProjectionEngine} from '../../src/web-mercator';
import type {ProjectionEngine} from '../../src/types';

const engine = new WebMercatorProjectionEngine();
for (const from of ['WGS84', 'EPSG:4326', 'EPSG:3857']) {
  for (const to of ['WGS84', 'EPSG:4326', 'EPSG:3857']) {
    for (const enforceAxis of [false, true]) {
      test(`minimal engine matches full engine: ${from} to ${to}, axes=${enforceAxis}`, async () => {
        const full = projectionEngine.createProjection({
          from,
          to,
          enforceAxis
        });
        const minimal = engine.createProjection({from, to, enforceAxis});
        const point = from === 'EPSG:3857' ? [1200000, 6500000, 123, 7] : [12, 55, 123, 7];
        const expected = full.project(point);
        const actual = minimal.project(point);
        actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 7));
        minimal
          .unproject(actual)
          .forEach((value, index) => expect(value).toBeCloseTo(point[index], 7));
        for (const ArrayType of [Float32Array, Float64Array]) {
          const values = new ArrayType(point);
          const reference = new ArrayType(values);
          full.projectFlat(reference, 4);
          expect(minimal.projectFlat(values, 4)).toBe(values);
          values.forEach((value, index) => expect(value).toBeCloseTo(reference[index], 7));
          const output = new ArrayType(4);
          expect(minimal.projectTo(new ArrayType(point), output)).toBe(output);
          output.forEach((value, index) => expect(value).toBeCloseTo(reference[index], 7));
        }
        const project = minimal.projectSync;
        expect(project(point)).toEqual(actual);
        await minimal.preload();
        const contract: ProjectionEngine = engine;
        const ready = await contract.createProjectionAsync({
          from,
          to,
          enforceAxis
        });
        expect(ready.project(point)).toEqual(actual);
      });
    }
  }
}
test('minimal backend rejects unsupported CRS and invalid buffers without committing failing coordinates', () => {
  expect(() => engine.createProjection({to: 'EPSG:32631'})).toThrow('supports only');
  expect(() => engine.createProjection({to: '+proj=merc +datum=WGS84'})).toThrow('supports only');
  const p = engine.createProjection({to: 'EPSG:3857'});
  expect(() => p.project([0, 90])).toThrow('domain');
  expect(() => p.project([0, NaN])).toThrow('finite');
  expect(() => p.project([0])).toThrow('at least two');
  expect(() => p.projectFlat(new Float64Array(3), 2)).toThrow('dimension');
  expect(() => p.projectFlat(new Float64Array(4), 1)).toThrow('dimension');
  const values = new Float64Array([12, 55, 0, 90, 0, 45]);
  expect(() => p.projectFlat(values)).toThrow('domain');
  expect(Array.from(values.slice(2))).toEqual([0, 90, 0, 45]);
  const output = new Float32Array([1, 2, 3, 4]);
  expect(() => p.projectTo([12, 55, 123, 1e40], output)).toThrow('Float32');
  expect(Array.from(output)).toEqual([1, 2, 3, 4]);
  const overlap = new Float64Array([12, 55, 123, 7]);
  expect(() => p.projectTo(overlap.subarray(0, 2), overlap.subarray(1, 3))).toThrow('overlap');
  expect(p.projectFlat(new Float64Array())).toHaveLength(0);
  expect(engine.createProjection().project([12, 55, 123, 7])).toEqual([12, 55, 123, 7]);
});

test('minimal Web Mercator matches longitude wrapping and near-pole coordinates', () => {
  const minimal = engine.createProjection({to: 'EPSG:3857'});
  const full = projectionEngine.createProjection({to: 'EPSG:3857'});
  for (const point of [
    [180, 0],
    [-180, 0],
    [540, 85.5],
    [-540, -85.5],
    [12, 89.9],
    [0, -0]
  ]) {
    const expected = full.project(point);
    const actual = minimal.project(point);
    actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 7));
    minimal
      .unproject(actual)
      .forEach((value, index) => expect(value).toBeCloseTo(full.unproject(expected)[index], 7));
  }
  expect(() => engine.createProjection().project([0, 91])).toThrow('domain');
});
