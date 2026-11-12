// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Table, RecordBatch, Schema, Struct, Vector, makeData, type Field} from 'apache-arrow';
import type {Task, TaskWorker} from '@math.gl/tasks';
import type {
  ParameterizedColumnarPredicate,
  ColumnarPredicateParameterValues
} from '../expressions/index';
import {dehydrateArrowTable, hydrateArrowTable, type DehydratedArrowTable} from '@math.gl/arrow';
import {compileArrowExpression} from './compiler';
import {compileArrowPredicate} from './predicate';
import type {ArrowExpression, CompiledArrowExpression} from './types';
import type {ArrowTableFunction} from './types';

/** Serializable program, compiled once in each initialized task instance. */
export type ArrowExpressionProgram =
  | {expression: ArrowExpression; predicate?: never; parameters?: never}
  | {
      predicate: ParameterizedColumnarPredicate;
      parameters?: ColumnarPredicateParameterValues;
      expression?: never;
    };

/** Borrowed column-buffer payload; use TaskRunner ownership controls when sending. */
export type ArrowExpressionTaskInput = {table: DehydratedArrowTable; activeRows?: Uint8Array};
/** One-column table retains the output field, validity and ordered chunks. */
export type ArrowExpressionTaskOutput = {table: DehydratedArrowTable};

type ExpressionTaskTypes = {
  initialization: ArrowExpressionProgram;
  input: ArrowExpressionTaskInput;
  output: ArrowExpressionTaskOutput;
  state: {program: ArrowExpressionProgram; compiled?: CompiledArrowExpression};
};

/**
 * Creates a reusable task. Construct custom function arrays inside the worker; callbacks never cross
 * the transport. Supply a module-worker URL or factory on the host and initialize the same task
 * with initializeTaskWorker in the worker. A retained task accepts one bound input schema.
 */
export function createArrowExpressionTask(
  options: {functions?: readonly ArrowTableFunction[]; worker?: TaskWorker} = {}
): Task<ExpressionTaskTypes> {
  return {
    id: 'math.gl-arrow-expression',
    worker: options.worker,
    initialize(program) {
      return {program};
    },
    async process(input, _options, context) {
      context.throwIfAborted();
      const table = hydrateArrowTable(input.table);
      const state = context.state;
      state.compiled ||=
        state.program.expression !== undefined
          ? compileArrowExpression(state.program.expression, {
              inputSchema: table.schema,
              functions: options.functions
            })
          : compileArrowPredicate(state.program.predicate!, {
              inputSchema: table.schema,
              functions: options.functions,
              parameters: state.program.parameters
            });
      const compiled = state.compiled;
      const mask = input.activeRows;
      if (mask && (mask.length !== table.numRows || mask.some(value => value !== 0 && value !== 1)))
        throw new Error('activeRows must contain one 0 or 1 per input row');
      // Validate even an empty table against the previously compiled schema.
      compiled.evaluateTable(new Table(table.schema, []), {signal: context.signal});
      const chunks = [];
      let offset = 0;
      for (const batch of table.batches) {
        // Yield to cancellation messages between batches, including before the first batch.
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        context.throwIfAborted();
        chunks.push(
          ...compiled.evaluate(batch, {
            activeRows: mask?.subarray(offset, offset + batch.numRows),
            signal: context.signal
          }).data
        );
        offset += batch.numRows;
        context.reportProgress({completed: offset, total: table.numRows, unit: 'rows'});
      }
      context.throwIfAborted();
      const vector = chunks.length ? new Vector(chunks) : compiled.evaluateTable(table);
      // A mask may introduce nulls even when the logical expression is non-nullable.
      const field = mask ? compiled.outputField.clone({nullable: true}) : compiled.outputField;
      const schema = new Schema([field]);
      const batches = vector.data.map(
        data =>
          new RecordBatch(
            schema,
            makeData({
              type: new Struct([field]),
              length: data.length,
              nullCount: 0,
              children: [data]
            })
          )
      );
      return {table: dehydrateArrowTable(new Table(schema, batches), {copy: 'none'})};
    }
  };
}

/**
 * Prepares borrowed buffers without copying values or detaching the input. TaskRunner defaults
 * to copying them. inputOwnership:'transfer' relinquishes every referenced ArrayBuffer, including
 * buffers shared with slices or other columns; do not read the original table afterward.
 */
export function prepareArrowExpressionInput(
  arrowTable: Table,
  options: {activeRows?: Uint8Array} = {}
): ArrowExpressionTaskInput {
  return {table: dehydrateArrowTable(arrowTable, {copy: 'none'}), activeRows: options.activeRows};
}

/** Hydrates worker results without copying data buffers. */
export function hydrateArrowExpressionResult(output: ArrowExpressionTaskOutput): {
  field: Field;
  vector: Vector;
} {
  const table = hydrateArrowTable(output.table);
  if (table.numCols !== 1) throw new Error('Arrow expression task must return exactly one column');
  return {field: table.schema.fields[0]!, vector: table.getChildAt(0)!};
}
