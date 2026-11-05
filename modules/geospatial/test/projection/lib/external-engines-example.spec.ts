// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {describe, expect, test} from 'vitest';
import {
  createExampleEngine,
  prepareMap,
  RADIUS
} from '../../../../../website/src/components/external-projection-engines/engines';

for (const backend of ['math.gl', 'proj4js', 'D3'] as const) {
  describe(`${backend} engine-switching recipe`, () => {
    test('uses the same application contract and independent Mercator anchors', async () => {
      const projection = await prepareMap(createExampleEngine(backend));
      for (const [lon, lat] of [
        [0, 0],
        [12, 55],
        [-74, 40],
        [151, -34],
        [-179, -80],
        [179, 80]
      ]) {
        const input = [lon, lat];
        const xy = projection.project(input);
        const radians = Math.PI / 180;
        expect(xy[0]).toBeCloseTo(RADIUS * lon * radians, 6);
        expect(xy[1]).toBeCloseTo(
          RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * radians) / 2)),
          6
        );
        expect(input).toEqual([lon, lat]);
        const output = new Float64Array(2);
        expect(projection.projectTo(input, output)).toBe(output);
        expect(Array.from(output)).toEqual(xy);
        projection.unprojectTo(output, output);
        expect(output[0]).toBeCloseTo(lon, 8);
        expect(output[1]).toBeCloseTo(lat, 8);
        const packed = new Float64Array([lon, lat, 0, 0]);
        expect(projection.projectFlat(packed, 2)).toBe(packed);
        projection.unprojectFlat(packed, 2);
        expect(packed[0]).toBeCloseTo(lon, 8);
        expect(packed[1]).toBeCloseTo(lat, 8);
      }
    });
    if (backend !== 'math.gl')
      test('rejects unsupported dimensions/options without partially writing', async () => {
        const engine = createExampleEngine(backend);
        expect(() => engine.createProjection({to: 'EPSG:32631'})).toThrow();
        expect(() => engine.createProjection({enforceAxis: true})).toThrow();
        const projection = await prepareMap(engine);
        const output = new Float64Array([9, 9]);
        expect(() => projection.projectTo([1, 2, 3], output)).toThrow();
        expect(Array.from(output)).toEqual([9, 9]);
        const packed = new Float64Array([1, 2, NaN, 3]);
        expect(() => projection.projectFlat(packed, 2)).toThrow();
        expect(Array.from(packed)).toEqual([1, 2, NaN, 3]);
        expect(() => projection.projectTo([1, 2], new Float64Array(1))).toThrow();
      });
  });
}
