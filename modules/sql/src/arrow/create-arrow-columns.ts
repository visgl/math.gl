// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createRecordBatchWithMetadata} from '@math.gl/core/arrow';
import {Data, Schema, Struct, Table, type Field} from 'apache-arrow';
import type {Expression} from '../expressions';
import {compileArrowExpression} from './compiler';
import {walkArrowFunctions} from './registry';
import type {
  ArrowFunctionPackage,
  ArrowTableFunction,
  CompiledArrowExpression,
  PreparedScalarFunction
} from './types';

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

export function mapArrowExpressionChildren(
  node: Expression,
  visit: (child: Expression) => Expression
): Expression {
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
  functions: readonly ArrowFunctionPackage[] = []
): {compiled: CompiledArrowExpression; metadata: M[]} {
  const declarations = [...walkArrowFunctions(functions)].filter(
    (fn): fn is ArrowTableFunction => 'prototypes' in fn
  );
  const names = new Set(declarations.map(fn => fn.name.toUpperCase()));
  function reserve(node: Expression): Expression {
    if (node.type === 'Identifier') names.add(node.name.toUpperCase());
    mapArrowExpressionChildren(node, reserve);
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
    if (!operation) return mapArrowExpressionChildren(node, visit);
    const index = metadata.length++;
    const prepared = operation.prepare(mapArrowExpressionChildren(node, visit) as Call, context);
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

/** Indexes the prepared calls contributed by nested packages. */
export function getProjectionOperations(
  functions: readonly ArrowFunctionPackage[] = []
): readonly ArrowProjectionOperation<unknown>[] {
  const prepared = new Map<string, PreparedScalarFunction<unknown>>();
  const names = new Set<string>();
  for (const declaration of walkArrowFunctions(functions)) {
    if (typeof declaration?.name !== 'string') throw new Error('Invalid Arrow function name');
    const name = declaration.name.toUpperCase();
    if (prepared.has(name) || ('prepare' in declaration && names.has(name)))
      throw new Error(`Duplicate Arrow prepared function: ${name}`);
    names.add(name);
    if ('prepare' in declaration) prepared.set(name, declaration);
  }
  if (!prepared.size) return [];
  return [
    {
      matches: call =>
        call.callee.type === 'Identifier' &&
        prepared.has(String(call.callee['name']).toUpperCase()),
      prepare(call, context) {
        if (call.callee.type !== 'Identifier') throw new Error('Expected an Arrow function name');
        return prepared.get(String(call.callee['name']).toUpperCase())!.prepare(call, context);
      }
    }
  ];
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
    functions?: readonly ArrowFunctionPackage[];
  } = {}
) {
  type Metadata = ReturnType<O['prepare']>['metadata'];
  const operations = (options.operations ?? []) as readonly ArrowProjectionOperation<Metadata>[];
  const columnMetadata: Record<K, readonly Metadata[]> = Object.create(null);
  const fields: Field[] = [];
  const columns = (Object.entries(expressions) as [K, Expression][]).map(([name, expr]) => {
    const {compiled, metadata} = prepareArrowColumn(input, expr, operations, options.functions);
    fields.push(compiled.outputField.clone({name}));
    columnMetadata[name] = Object.freeze(metadata);
    return [name, compiled.evaluateTable(input)] as const;
  });
  const schema = new Schema(fields);
  const table: Table = columns.length
    ? new Table(schema, Object.fromEntries(columns))
    : new Table(
        schema,
        input.batches.map(batch =>
          createRecordBatchWithMetadata(schema, new Data(new Struct([]), 0, batch.numRows, 0))
        )
      );
  return {table, columnMetadata: Object.freeze(columnMetadata)};
}
