// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Field, Float64, type RecordBatch, type Vector} from 'apache-arrow';
import {type ParameterizedColumnarPredicate} from '@math.gl/core/expressions';
import {
  ArrowFunctionRegistry,
  compileArrowExpression,
  compileArrowFunction,
  compileArrowPredicate
} from '@math.gl/arrow/expressions';

declare const batch: RecordBatch;
const registry = new ArrowFunctionRegistry().registerFunction('discount', {
  arguments: [new Field('price', new Float64(), false)],
  result: new Field('discounted', new Float64(), false),
  scalar: (price: number) => price * 0.9
});
const options = {inputSchema: batch.schema, registry};
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
compileArrowExpression('price', {registry});
// @ts-expect-error The active mask is an explicit byte array.
compileArrowExpression('price', options).evaluate(batch, {activeRows: [true]});
void output;
