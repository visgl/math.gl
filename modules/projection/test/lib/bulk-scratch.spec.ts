// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original shared scalar/bulk scratch lifetime and recursive stack isolation tests.
import {expect, test} from 'vitest';
import {ProjectionTransform, ProjectionPipeline} from '@math.gl/projection';
import type {ProjectionPoint, ProjectionPlugin} from '@math.gl/projection/core';

for (const kind of ['engine', 'pipeline']) {
  test('bulk scratch lifetime across scalar/bulk recursion and failure: ' + kind, () => {
    const points = new Set<object>();
    let recurse: 'scalar' | 'flat' | undefined,
      fail = false;
    const hook = (point: ProjectionPoint, inverse: boolean) => {
      points.add(point);
      const x = point.x,
        y = point.y,
        z = point.z;
      point.x += inverse ? -0.1 : 0.1;
      if (recurse) {
        const mode = recurse;
        recurse = undefined;
        const input = kind === 'engine' ? [4, 5, 200, 9] : [0.4, 0.5, 200, 9];
        if (mode === 'scalar') expect(operation.project(input)).toEqual(expected(input));
        else {
          const buffer = new Float64Array(input);
          expect(operation.projectFlat(buffer, 4)).toBe(buffer);
          expect(Array.from(buffer)).toEqual(expected(input));
        }
        expect(point.x).toBe(x + (inverse ? -0.1 : 0.1));
        expect(point.y).toBe(y);
        expect(point.z).toBe(z);
      }
      if (fail) throw new Error('hook failed');
      return true;
    };
    const plugin: ProjectionPlugin = {
      name: 'scratch_lifetime',
      parameters: [],
      create: () => ({
        forward: () => {
          throw new Error('mutable hook required');
        },
        inverse: () => {
          throw new Error('mutable hook required');
        },
        forwardInPlace: point => {
          hook(point, false);
        },
        inverseInPlace: point => {
          hook(point, true);
        }
      })
    };
    const operation =
      kind === 'engine'
        ? new ProjectionTransform({to: '+proj=scratch_lifetime', projections: [plugin]})
        : new ProjectionPipeline({
            input: {space: 'geographic', units: ['rad', 'rad', 'm']},
            steps: [
              {type: 'push', components: [1, 2]},
              {type: 'hgridshift', grids: 'scratch'},
              {type: 'pop', components: [1, 2]}
            ],
            datumGrids: {
              scratch: {
                subgridCount: 1,
                shift: () => {
                  throw new Error('mutable hook required');
                },
                shiftInPlace: (point, inverse) => hook(point as ProjectionPoint, inverse)
              }
            }
          });
    const expected = (input: number[]) =>
      kind === 'engine'
        ? [input[0] * (Math.PI / 180) + 0.1, input[1] * (Math.PI / 180), ...input.slice(2)]
        : [...input];
    const input = [1, 0.2, 100, 8];
    for (const ArrayType of [Float32Array, Float64Array]) {
      for (let i = 0; i < 3; i++) {
        const buffer = new ArrayType(input);
        const rounded = Array.from(buffer);
        expect(operation.projectFlat(buffer, 4)).toBe(buffer);
        expect(Array.from(buffer)).toEqual(Array.from(new ArrayType(expected(rounded))));
      }
    }
    expect(operation.project(input)).toEqual(expected(input));
    expect(points.size).toBe(1); // Ordinary scalar and flat calls share the instance lease.
    for (const outer of ['scalar', 'flat']) {
      for (const inner of ['scalar', 'flat'] as const) {
        recurse = inner;
        if (outer === 'scalar') expect(operation.project(input)).toEqual(expected(input));
        else {
          const buffer = new Float64Array([...input, ...input]);
          operation.projectFlat(buffer, 4);
          expect(Array.from(buffer)).toEqual([...expected(input), ...expected(input)]);
        }
      }
    }
    const afterRecursion = points.size;
    expect(afterRecursion).toBe(2);
    for (let i = 0; i < 5; i++) {
      recurse = 'scalar';
      operation.project(input);
    }
    expect(points.size).toBe(afterRecursion);
    fail = true;
    const failing = new Float64Array(input),
      before = failing.slice();
    expect(() => operation.projectFlat(failing, 4)).toThrow('hook failed');
    expect(failing).toEqual(before);
    fail = false;
    expect(operation.project(input)).toEqual(expected(input));
    operation.projectFlat(failing, 4);
    expect(Array.from(failing)).toEqual(expected(input));
    const inverse = operation.unproject(Array.from(failing));
    operation.unprojectFlat(failing, 4);
    expect(Array.from(failing)).toEqual(inverse);
    expect(points.size).toBe(afterRecursion); // Failure released the original lease.
  });
}
