// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  TypeScriptProjection,
  mercator,
  universalTransverseMercator,
  transverseMercator,
  extendedTransverseMercator,
  lambertConformalConic,
  albersEqualArea,
  equidistantConic
} from '@math.gl/proj4/experimental';
import type {
  ProjectionPlugin,
  ProjectionFlatContext,
  TypeScriptProjectionOptions
} from '@math.gl/proj4/core';
import {commonProjectionCases} from '../fixtures/common-projections';

const plugins = [
  mercator,
  universalTransverseMercator,
  transverseMercator,
  extendedTransverseMercator,
  lambertConformalConic,
  albersEqualArea,
  equidistantConic
];
function observed(
  plugin: ProjectionPlugin,
  report: (kind: 'prepare' | 'run', context: ProjectionFlatContext) => void
): ProjectionPlugin {
  return {
    ...plugin,
    create(context) {
      const implementation = plugin.create(context);
      for (const name of ['createForwardFlat', 'createInverseFlat'] as const) {
        const prepare = implementation[name]!;
        implementation[name] = function (units) {
          expect(Object.isFrozen(units)).toBe(true);
          report('prepare', units);
          const operation = prepare.call(this, units)!;
          return (buffer, dimension) => {
            report('run', units);
            operation(buffer, dimension);
          };
        };
      }
      return implementation;
    }
  };
}

const cases = [
  {id: 'merc-sphere', definition: 'EPSG:3857', center: [12, 48]},
  {id: 'merc-ellipsoid', definition: '+proj=merc +ellps=WGS84 +units=us-ft', center: [12, 48]},
  ...commonProjectionCases.filter(row => /^(utm|tmerc|etmerc|lcc|aea|eqdc)-/.test(row.id))
];
for (const fixture of cases)
  test('whole-buffer/scalar exact parity: ' + fixture.id, () => {
    let runs = 0;
    const projection = new TypeScriptProjection({
      to: fixture.definition,
      projections: plugins.map(plugin =>
        observed(plugin, kind => {
          if (kind === 'run') runs++;
        })
      )
    });
    for (const ArrayType of [Float32Array, Float64Array])
      for (const dimension of [2, 3, 4, 6]) {
        const buffer = new ArrayType(3 * dimension);
        for (let i = 0; i < 3; i++) {
          buffer[i * dimension] = fixture.center[0] + i * 0.1;
          buffer[i * dimension + 1] = fixture.center[1] - i * 0.1;
          if (dimension >= 3) buffer[i * dimension + 2] = i === 0 ? -0 : 123;
          for (let axis = 3; axis < dimension; axis++)
            buffer[i * dimension + axis] = axis === 3 ? NaN : Infinity;
        }
        for (const direction of ['project', 'unproject'] as const) {
          const expected = buffer.slice();
          for (let offset = 0; offset < buffer.length; offset += dimension)
            expected.set(
              projection[direction]([...buffer.subarray(offset, offset + dimension)]),
              offset
            );
          expect(
            projection[direction === 'project' ? 'projectFlat' : 'unprojectFlat'](buffer, dimension)
          ).toBe(buffer);
          expect(buffer).toEqual(expected);
        }
      }
    expect(runs).toBe(16);
  });

test('batch selection retains the general pipeline for other transform stages', () => {
  const cases: TypeScriptProjectionOptions[] = [
    {from: '+proj=longlat +axis=neu', enforceAxis: true},
    {from: '+proj=longlat +pm=paris'},
    {to: '+proj=merc +pm=paris'},
    {from: '+proj=longlat +vunits=ft'},
    {to: '+proj=merc +vunits=ft'},
    {from: '+proj=longlat +lon_wrap=180'},
    {from: '+proj=longlat +ellps=clrk66 +towgs84=1,2,3'},
    {from: '+proj=merc +ellps=WGS84'},
    {from: '+proj=identity'}
  ];
  for (const options of cases) {
    let prepared = 0;
    const projection = new TypeScriptProjection({
      to: 'EPSG:3857',
      ...options,
      projections: [
        observed(mercator, kind => {
          if (kind === 'prepare') prepared++;
        })
      ]
    });
    // lon_wrap affects only geographic output, so only the inverse must fall back.
    expect(prepared).toBe(options.from === '+proj=longlat +lon_wrap=180' ? 1 : 0);
    const input = new Float64Array([0.25, 0.5, 30, 7]);
    expect(projection.projectFlat(input, 4)).toEqual(
      new Float64Array(projection.project([0.25, 0.5, 30, 7]))
    );
  }
});

test('optional custom batch factories may decline without changing scalar fallback', () => {
  const contexts: ProjectionFlatContext[] = [];
  const plugin: ProjectionPlugin = {
    name: 'custom',
    parameters: [],
    create: () => ({
      forward: (x, y) => [x, y],
      inverse: (x, y) => [x, y],
      createForwardFlat(context) {
        contexts.push(context);
        return undefined;
      }
    })
  };
  const projection = new TypeScriptProjection({
    to: '+proj=custom +units=km',
    projections: [plugin]
  });
  const input = new Float64Array([12, 30, 4, 5]);
  expect(projection.projectFlat(input, 4)).toEqual(
    new Float64Array(projection.project([12, 30, 4, 5]))
  );
  expect(contexts).toEqual([{inputScale: Math.PI / 180, outputScale: 1000}]);
});

test('batch failures preserve the failing record, later records and view boundaries', () => {
  for (const ArrayType of [Float32Array, Float64Array])
    for (const direction of ['project', 'unproject'] as const) {
      const projection = new TypeScriptProjection({to: 'EPSG:3857', projections: [mercator]});
      for (const invalid of [
        [NaN, 2, 3],
        [1, Infinity, 3],
        [1, 2, NaN],
        ...(direction === 'project'
          ? [
              [1, 90, 3],
              [1, 91, 3]
            ]
          : [])
      ]) {
        const backing = new ArrayType([999, 1, 2, 3, ...invalid, 4, 5, 6, -999]);
        const view = backing.subarray(1, 10);
        const original = backing.slice();
        expect(() =>
          projection[direction === 'project' ? 'projectFlat' : 'unprojectFlat'](view, 3)
        ).toThrow();
        expect(view.subarray(0, 3)).toEqual(new ArrayType(projection[direction]([1, 2, 3])));
        expect(backing.subarray(4)).toEqual(original.subarray(4));
        expect(backing[0]).toBe(999);
      }
    }
  const huge = new TypeScriptProjection({
    to: '+proj=merc +a=1e40 +b=1e40 +datum=none',
    projections: [mercator]
  });
  const buffer = new Float32Array([0, 0, 5, 0]);
  expect(() => huge.projectFlat(buffer)).toThrow('Float32 range');
  expect(buffer).toEqual(new Float32Array([0, 0, 5, 0]));
});

test('decorating a built-in mutable hook does not inherit an incompatible batch kernel', () => {
  const plugin: ProjectionPlugin = {
    ...mercator,
    create(context) {
      const implementation = mercator.create(context);
      const forward = implementation.forwardInPlace!;
      return {
        ...implementation,
        forwardInPlace(point) {
          forward(point);
          point.x += 100;
        }
      };
    }
  };
  const projection = new TypeScriptProjection({to: 'EPSG:3857', projections: [plugin]});
  const result = projection.projectFlat(new Float64Array([0, 0]));
  expect([...result]).toEqual([100, 0]);
  expect([...result]).toEqual(projection.project([0, 0]));
});
