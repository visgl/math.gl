// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Field, Schema, RecordBatch, Vector, Table} from 'apache-arrow';
import type {Expression} from '@math.gl/core/expressions';
import type {ArrowFunctionRegistry} from './registry';

/** Scalar values exposed to user callbacks. */
export type ArrowExpressionValue = number | bigint | boolean | string | null;

/** A vector kernel receives full-length inputs and must evaluate only active rows. */
export type ArrowFunctionKernel = (
  arguments_: readonly Vector[],
  context: {
    /** One byte per row; zero means the row must not be evaluated. */
    activeRows: Uint8Array;
    /** Number of rows in every argument and the returned vector. */
    length: number;
  }
) => Vector;

/** Schema-declared, row-preserving function usable directly and inside expressions. */
export type ArrowFunction = Readonly<{
  /** Ordered argument fields, with exact types and nullability. */
  arguments: readonly Field[];
  /** Declared result field; its name is retained for direct calls. */
  result: Field;
  /** Propagate null arguments, or pass them to the implementation. Defaults to propagate. */
  nullHandling?: 'propagate' | 'call';
}> &
  (
    | {
        /** Scalar fallback for primitive arguments and results. */
        scalar(...arguments_: ArrowExpressionValue[]): ArrowExpressionValue;
        /** Optional vector implementation with the same semantics. */
        kernel?: ArrowFunctionKernel;
      }
    | {
        /** Vector-only functions may accept nested fields without decoding rows. */
        kernel: ArrowFunctionKernel;
        scalar?: never;
      }
  );

/** Schema binding shared by predicate and expression compilation. */
export type ArrowExpressionOptions = Readonly<{
  /** Expected batch schema, validated before evaluation. */
  inputSchema: Schema;
  /** Instance-scoped function declarations, snapshotted during compilation. */
  registry?: ArrowFunctionRegistry;
}>;

/** Controls shared by batch and whole-table evaluation. */
export type ArrowExpressionEvaluationOptions = {
  /** One byte per logical row, including all batches when evaluating a table. */
  activeRows?: Uint8Array;
  /** Checked before and after each batch; synchronous execution does not yield. */
  signal?: AbortSignal;
};

/** A compiled expression preserves row count and returns a non-dictionary vector. */
export interface CompiledArrowExpression {
  /** Bound result type and nullability. */
  readonly outputField: Field;
  /** Evaluates a batch; optional masks skip rows and produce null at those positions. */
  evaluate(batch: RecordBatch, options?: ArrowExpressionEvaluationOptions): Vector;
  /** Evaluates ordered batches and combines output chunks without copying their buffers. */
  evaluateTable(arrowTable: Table, options?: ArrowExpressionEvaluationOptions): Vector;
}

/** Text or the existing core expression AST. */
export type ArrowExpression = string | Expression;
