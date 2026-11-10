// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  Bool,
  Field,
  Float64,
  Float32,
  FixedSizeList,
  List,
  type RecordBatch,
  type Vector,
  vectorFromArray
} from 'apache-arrow';
import {type ParameterizedColumnarPredicate} from '@math.gl/core/expressions';
import {
  type ArrowTableFunction,
  type ArrowTableFunctionType,
  compileArrowExpression,
  compileArrowFunction,
  compileArrowPredicate
} from '@math.gl/arrow/expressions';

declare const batch: RecordBatch;
const evaluate: ArrowTableFunctionType = ([prices], {length, activeRows}) =>
  vectorFromArray(
    Array.from({length}, (_, row) =>
      activeRows[row] && prices!.isValid(row) ? prices!.get(row) * 0.9 : null
    ),
    new Float64()
  );
const discount: ArrowTableFunction = {
  name: 'discount',
  arguments: [new Field('price', new Float64(), false)],
  result: new Field('discounted', new Float64(), false),
  evaluate,
  evaluateScalar: (price: number) => price * 0.9
};
const functions = [discount];
const options = {inputSchema: batch.schema, functions};
const predicate: ParameterizedColumnarPredicate = {
  op: '>',
  args: [{property: 'price'}, {parameter: 'minimum'}]
};
const output: Vector = compileArrowPredicate(predicate, {
  ...options,
  parameters: {minimum: 10}
}).evaluate(batch);
compileArrowFunction('discount', ['price'], options).evaluate(batch, {
  activeRows: new Uint8Array(batch.numRows)
});
compileArrowExpression('discount(price) > 10', options).evaluate(batch);
// @ts-expect-error An input schema is required.
compileArrowExpression('price', {functions});
// @ts-expect-error The active mask is an explicit byte array.
compileArrowExpression('price', options).evaluate(batch, {activeRows: [true]});
void output;

import type {Table} from 'apache-arrow';
import {TaskRunner} from '@math.gl/tasks';
import {
  createArrowExpressionTask,
  prepareArrowExpressionInput,
  hydrateArrowExpressionResult
} from '@math.gl/arrow/expressions/worker';
declare const table: Table;
compileArrowExpression('price', options).evaluateTable(table, {
  signal: new AbortController().signal
});
const runner = new TaskRunner();
const task = createArrowExpressionTask();
async function workerTypes() {
  const session = await runner.initializeTask(task, {expression: 'price'});
  const result = hydrateArrowExpressionResult(
    await session.runTask(prepareArrowExpressionInput(table))
  );
  const vector: Vector = result.vector;
  void vector;
  await session.close();
  await runner.close();
}
void workerTypes;

import {createTurfArrowFunction} from '@math.gl/geospatial/turf/expressions';
import {distance, booleanPointInPolygon} from '@math.gl/geospatial/turf';
declare const geometryField: Field;
createTurfArrowFunction({
  name: 'geometryFunction',
  arguments: [geometryField, geometryField],
  result: new Field('distance', new Float64(), true),
  evaluate: distance
});
createTurfArrowFunction({
  name: 'geometryFunction',
  arguments: [geometryField, geometryField],
  result: new Field('distance', new Float64(), true),
  evaluate: (a, b) => distance(a, b, {units: 'meters'})
});
createTurfArrowFunction({
  name: 'geometryFunction',
  arguments: [geometryField, geometryField],
  result: new Field('inside', new Bool(), true),
  evaluate: booleanPointInPolygon
});

// @ts-expect-error evaluate is required even when a fused callback is supplied.
const missingVector: ArrowTableFunction = {
  name: 'invalid',
  arguments: [],
  result: new Field('x', new Float64()),
  evaluateScalar: () => 1
};
// @ts-expect-error Public registration uses declarations, not a registry option.
compileArrowExpression('price', {inputSchema: batch.schema, registry: {}});
void missingVector;
createArrowExpressionTask({functions});

const rgbaType = new FixedSizeList(4, new Field('channel', new Float32(), false));
const color: ArrowTableFunction = {
  name: 'color',
  arguments: [new Field('bins', new List(new Field('item', new Float64(), false)), false)],
  result: new Field('rgba', rgbaType, true),
  evaluate: (_arguments, {length}) => vectorFromArray(new Array(length).fill(null), rgbaType)
};
compileArrowFunction('color', ['[0, 1, 2]'], {
  inputSchema: batch.schema,
  functions: [color]
}).evaluateTable(table);

import {compileArrowArray} from '@math.gl/arrow/expressions';
compileArrowArray(['x', 'y'], {inputSchema: batch.schema, type: 'float32'}).evaluateTable(table);
