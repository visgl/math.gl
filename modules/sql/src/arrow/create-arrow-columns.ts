// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createRecordBatchWithMetadata} from '@math.gl/core/arrow';
import {Data, Schema, Struct, Table} from 'apache-arrow';
import type {Expression} from '../expressions';
import {compileArrowExpression} from './compiler';
import type {ArrowTableFunction, CompiledArrowExpression} from './types';

type Call = Extract<Expression, {type: 'CallExpression'}>;

/** Prepares a recognized call after its arguments have been prepared. */
export type ArrowProjectionOperation<M> = Readonly<{
  matches(call: Call): boolean;
  prepare(
    call: Call,
    context: {
      readonly table: Table;
      readonly functions: readonly ArrowTableFunction[];
      allocateName(): string;
    }
  ): {
    expression: Expression;
    metadata: M;
    functions?: readonly ArrowTableFunction[];
  };
}>;

function mapChildren(node: Expression, visit: (child: Expression) => Expression): Expression {
  // Literal payloads can contain binary data or dates. They are opaque to traversal.
  if (node.type === 'Literal') return node;
  function map(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(map);
    return value && typeof value === 'object' && 'type' in value
      ? visit(value as Expression)
      : value;
  }
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, map(value)])
  ) as Expression;
}

export function prepareArrowColumn<M>(
  table: Table,
  expression: Expression,
  operations: readonly ArrowProjectionOperation<M>[],
  functions: readonly ArrowTableFunction[] = []
): {compiled: CompiledArrowExpression; metadata: M[]} {
  const declarations = [...functions];
  const names = new Set(functions.map(fn => fn.name.toUpperCase()));
  function reserve(node: Expression): Expression {
    if (node.type === 'Identifier') names.add(node.name.toUpperCase());
    mapChildren(node, reserve);
    return node;
  }
  const metadata: M[] = [];
  let nextName = 0;
  const context = {
    table,
    functions: declarations,
    allocateName() {
      let name: string;
      do {
        name = '__projection_' + nextName++;
      } while (names.has(name.toUpperCase()));
      names.add(name.toUpperCase());
      return name;
    }
  };
  function visit(node: Expression): Expression {
    const operation = node.type === 'CallExpression' && operations.find(op => op.matches(node));
    if (!operation) return mapChildren(node, visit);
    const index = metadata.length++;
    const prepared = operation.prepare(mapChildren(node, visit) as Call, context);
    metadata[index] = prepared.metadata;
    declarations.push(...(prepared.functions ?? []));
    return prepared.expression;
  }
  if (operations.length) reserve(expression);
  const compiled = compileArrowExpression(operations.length ? visit(expression) : expression, {
    inputSchema: table.schema,
    functions: declarations
  });
  return {compiled, metadata};
}

/** Creates a new table of named output columns and collects metadata per column. */
export function createArrowColumns<
  K extends string,
  O extends ArrowProjectionOperation<unknown> = never
>(
  input: Table,
  expressions: Readonly<Record<K, Expression>>,
  options: {
    operations?: readonly O[];
    functions?: readonly ArrowTableFunction[];
  } = {}
) {
  type Metadata = ReturnType<O['prepare']>['metadata'];
  const operations = (options.operations ?? []) as readonly ArrowProjectionOperation<Metadata>[];
  const columnMetadata: Record<K, readonly Metadata[]> = Object.create(null);
  const columns = (Object.entries(expressions) as [K, Expression][]).map(([name, expr]) => {
    const {compiled, metadata} = prepareArrowColumn(input, expr, operations, options.functions);
    columnMetadata[name] = Object.freeze(metadata);
    return [name, compiled.evaluateTable(input)] as const;
  });
  const schema = new Schema([]);
  const table: Table = columns.length
    ? new Table(Object.fromEntries(columns))
    : new Table(
        schema,
        input.batches.map(batch =>
          createRecordBatchWithMetadata(schema, new Data(new Struct([]), 0, batch.numRows, 0))
        )
      );
  return {table, columnMetadata: Object.freeze(columnMetadata)};
}
