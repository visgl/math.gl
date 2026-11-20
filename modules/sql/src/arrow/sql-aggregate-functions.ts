// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RecordBatch, Table} from 'apache-arrow';
import {DataType} from 'apache-arrow';
import type {Expression} from '../expressions';
import type {ArrowAggregate} from './aggregates';
import {createValueValidator} from './buffers';
import {compileArrowExpression} from './compiler';
import {mapArrowExpressionChildren} from './create-arrow-columns';
import {walkArrowFunctions} from './registry';
import type {BoundRelationAggregate} from './relational-query';
import type {AggregateFunction, ArrowFunctionPackage, ArrowExpressionValue} from './types';

/** Built-in SQL reductions remain available without registration. */
const operations = new Set<ArrowAggregate['operation']>([
  'COUNT',
  'SUM',
  'MIN',
  'MAX',
  'AVG',
  'EVERY',
  'BOOL_AND',
  'BOOL_OR',
  'BIT_AND',
  'BIT_OR',
  'BIT_XOR'
]);

/** An aggregate call extracted from a grouped projection. */
type AggregateCall = {
  readonly arguments: readonly Expression[];
  readonly builtin?: ArrowAggregate['operation'];
  readonly custom?: AggregateFunction<unknown>;
};

/** Collects named custom aggregates and rejects conflicts with built-in aggregate names. */
export function getSQLAggregateFunctions(functions: readonly ArrowFunctionPackage[] = []) {
  const custom = new Map<string, AggregateFunction<unknown>>();
  const names = new Set<string>(operations);
  for (const entry of walkArrowFunctions(functions)) {
    if (!('kind' in entry) || entry.kind !== 'aggregate') continue;
    const name = entry.name.toUpperCase();
    if (names.has(name)) throw new Error(`Duplicate Arrow SQL aggregate function: ${name}`);
    names.add(name);
    custom.set(name, entry);
  }
  return custom;
}

/** Identifies a built-in or registered aggregate call in a parsed SQL expression. */
export function getSQLAggregateCall(
  node: Expression,
  functions: ReadonlyMap<string, AggregateFunction<unknown>>
): AggregateCall | undefined {
  if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier' || !node.sqlFunction)
    return undefined;
  const name = String(node.callee['name']).toUpperCase() as ArrowAggregate['operation'];
  const builtin = operations.has(name) ? name : undefined;
  const custom = functions.get(name);
  if (!builtin && !custom) return undefined;
  const args = node.arguments as readonly (Expression & {sqlWildcard?: boolean})[];
  if (builtin && args.length !== 1) throw new Error(`Arrow SQL ${name} requires one argument`);
  if (args.some(arg => arg.sqlWildcard) && (builtin !== 'COUNT' || args.length !== 1))
    throw new Error(`Arrow SQL ${name} does not accept *`);
  return {builtin, custom, arguments: args[0]?.sqlWildcard ? [] : args};
}

/** Rejects a reduction inside a row-wise expression or another reduction. */
export function rejectSQLAggregates(
  node: Expression,
  functions: ReadonlyMap<string, AggregateFunction<unknown>>,
  context: string
): void {
  if (getSQLAggregateCall(node, functions))
    throw new Error(`Arrow SQL aggregates are not allowed in ${context}`);
  mapArrowExpressionChildren(node, child => {
    rejectSQLAggregates(child, functions, context);
    return child;
  });
}

/** Binds a custom aggregate once and uses a separate accumulator for each evaluated group. */
export function bindSQLAggregate(
  call: AggregateCall,
  table: Table,
  functions?: readonly ArrowFunctionPackage[],
  signal?: AbortSignal
): BoundRelationAggregate & {metadata?: unknown} {
  const args = call.arguments.map(expression => {
    // An aggregate consumes vectors. Pass nested source columns through with their
    // physical layout and extension metadata, just as a spatial scalar kernel does.
    if (expression.type === 'Identifier') {
      const index = table.schema.fields.findIndex(field => field.name === expression.name);
      const field = table.schema.fields[index];
      if (
        field &&
        (DataType.isList(field.type) ||
          DataType.isStruct(field.type) ||
          DataType.isFixedSizeList(field.type))
      ) {
        return {outputField: field, evaluate: (batch: RecordBatch) => batch.getChildAt(index)!};
      }
    }
    return compileArrowExpression(expression, {inputSchema: table.schema, functions});
  });
  const {outputField, createAccumulator, metadata} = call.custom!.bind({
    arguments: args.map(arg => arg.outputField)
  });
  const type = outputField.type;
  const tuple = DataType.isFixedSizeList(type);
  if (tuple && !DataType.isFloat(type.valueType))
    throw new Error('Aggregate tuple results require floating-point elements');
  const validate = tuple ? undefined : createValueValidator(type);
  return {
    outputField,
    metadata,
    evaluate(input) {
      const accumulator = createAccumulator();
      for (const batch of input.batches) {
        signal?.throwIfAborted();
        if (!batch.numRows) continue;
        accumulator.update(
          args.map(arg => arg.evaluate(batch, {signal})),
          {length: batch.numRows, signal}
        );
      }
      signal?.throwIfAborted();
      const value = accumulator.finalize();
      if (value === null && !outputField.nullable && !DataType.isNull(outputField.type))
        throw new Error(
          `Arrow SQL aggregate ${call.custom!.name} returned null for a non-nullable field`
        );
      if (tuple) {
        if (
          value !== null &&
          (!Array.isArray(value) ||
            value.length !== type.listSize ||
            !value.every(component => typeof component === 'number'))
        )
          throw new Error(`Invalid aggregate result for ${type}`);
      } else {
        if (Array.isArray(value)) throw new Error(`Invalid aggregate result for ${type}`);
        validate!(value as ArrowExpressionValue);
      }
      return value;
    }
  };
}
