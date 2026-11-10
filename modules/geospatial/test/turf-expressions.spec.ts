// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Bool, Field, Float64, Schema, Table, Int32, vectorFromArray} from 'apache-arrow';
import {ArrowFunctionRegistry, compileArrowExpression} from '@math.gl/arrow/expressions';
import {makeArrowVectorFromGeoArrowColumn} from '@math.gl/arrow/geoarrow';
import {makeGeoArrowColumnFromGeometryRows} from '@math.gl/arrow/geoarrow-utils';
import {createTurfArrowFunction} from '../src/turf/expressions';
import {area, distance, booleanPointInPolygon, bbox} from '../src/turf';

const polygon = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0]
    ]
  ]
};
const point = {type: 'Point' as const, coordinates: [0.75, 0.25]};
function input() {
  const geometry = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([polygon, null, polygon])
  );
  const points = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([point, point, point])
  );
  const fields = [
    new Field(
      'geometry',
      geometry.type,
      true,
      new Map([['ARROW:extension:name', 'geoarrow.polygon']])
    ),
    new Field('point', points.type, true, new Map([['ARROW:extension:name', 'geoarrow.point']])),
    new Field('index', new Int32(), true)
  ];
  return new Table(new Schema(fields), {
    geometry,
    point: points,
    index: vectorFromArray([0, 1, 2], new Int32())
  });
}

test('Turf scalar adapters compose in expressions and mask inactive geometry rows', () => {
  const table = input();
  const evaluate = vi.fn(area);
  const registry = new ArrowFunctionRegistry()
    .registerFunction(
      'area',
      createTurfArrowFunction({
        arguments: [table.schema.fields[0]!],
        result: new Field('area', new Float64(), true),
        evaluate
      })
    )
    .registerFunction(
      'inside',
      createTurfArrowFunction({
        arguments: [table.schema.fields[1]!, table.schema.fields[0]!],
        result: new Field('inside', new Bool(), true),
        evaluate: booleanPointInPolygon
      })
    );
  const values = [
    ...compileArrowExpression('index == 0 ? area(geometry) : 0', {
      inputSchema: table.schema,
      registry
    }).evaluateTable(table)
  ];
  expect(values[0]).toBeGreaterThan(0);
  expect(values.slice(1)).toEqual([0, 0]);
  expect(evaluate).toHaveBeenCalledTimes(1);
  expect(evaluate.mock.calls[0]![0].chunks[0]!.validity!.values[0]).toBe(1);
  expect([
    ...compileArrowExpression('inside(point, geometry)', {
      inputSchema: table.schema,
      registry
    }).evaluateTable(table)
  ]).toEqual([true, null, true]);
  const sliced = table.slice(1, 3);
  expect([
    ...compileArrowExpression('area(geometry) > 0', {
      inputSchema: sliced.schema,
      registry
    }).evaluateTable(sliced)
  ]).toEqual([null, true]);
});

test('Turf adapters support bound options and reject non-scalar or incompatible results', () => {
  const table = input();
  const field = table.schema.fields[1]!;
  const registry = new ArrowFunctionRegistry().registerFunction(
    'meters',
    createTurfArrowFunction({
      arguments: [field, field],
      result: new Field('distance', new Float64(), true),
      evaluate: (a, b) => distance(a, b, {units: 'meters'})
    })
  );
  expect([
    ...compileArrowExpression('meters(point, point)', {
      inputSchema: table.schema,
      registry
    }).evaluateTable(table)
  ]).toEqual([0, 0, 0]);
  registry.registerFunction(
    'bbox',
    createTurfArrowFunction({
      arguments: [field],
      result: new Field('bbox', new Float64(), true),
      evaluate: bbox
    })
  );
  expect(() =>
    compileArrowExpression('bbox(point)', {inputSchema: table.schema, registry}).evaluateTable(
      table
    )
  ).toThrow('one declared scalar');
  expect(() =>
    compileArrowExpression('meters(geometry, point)', {inputSchema: table.schema, registry})
  ).toThrow('type mismatch');
  expect(() =>
    compileArrowExpression('geometry + 1', {inputSchema: table.schema, registry})
  ).toThrow('Unsupported');
  expect(() =>
    createTurfArrowFunction({
      arguments: [field],
      result: new Field('x', new Int32(), true),
      evaluate: area
    })
  ).toThrow('Float64 or Bool');
});

test('geometry extension metadata is validated when reusing a compiled evaluator', () => {
  const table = input();
  const field = table.schema.fields[0]!;
  const registry = new ArrowFunctionRegistry().registerFunction(
    'area',
    createTurfArrowFunction({
      arguments: [field],
      result: new Field('a', new Float64(), true),
      evaluate: area
    })
  );
  const compiled = compileArrowExpression('area(geometry)', {inputSchema: table.schema, registry});
  const changed = field.clone({
    metadata: new Map([['ARROW:extension:name', 'geoarrow.multilinestring']])
  });
  const schema = new Schema([changed, ...table.schema.fields.slice(1)]);
  expect(() => compiled.evaluateTable(new Table(schema, []))).toThrow('schema mismatch');
});
