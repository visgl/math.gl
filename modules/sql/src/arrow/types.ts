// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Field, Schema, RecordBatch, Vector, Table} from 'apache-arrow';
import type {Expression} from '../expressions/index';

/**
 * Scalar values exposed to user callbacks. Date32 uses epoch days and microsecond
 * timestamps use bigint microseconds, matching their Arrow storage buffers.
 */
export type ArrowExpressionValue = number | bigint | boolean | string | Uint8Array | null;

/** A vector kernel receives full-length inputs and must evaluate only active rows. */
export type ArrowTableFunctionType = (
  arguments_: readonly Vector[],
  context: {
    /** One byte per row; zero means the row must not be evaluated. */
    activeRows: Uint8Array;
    /** Number of rows in every argument and the returned vector. */
    length: number;
    /** Report a row failure; TRY recovers classified errors, otherwise the call throws. */
    reportError?(row: number, error: unknown): void;
  }
) => Vector;

/** One schema-bound implementation of a named table function. */
export type ArrowTableFunctionPrototype = Readonly<{
  /** Ordered argument fields, with exact types, nullability and extension metadata. */
  arguments: readonly Field[];
  /** Declared result field; its name is retained for direct calls. */
  result: Field;
  /** Propagate null arguments, or pass them to the implementation. Defaults to propagate. */
  nullHandling?: 'propagate' | 'call';
  /** Batch implementation, also independently callable with the declared arguments and mask. */
  evaluate: ArrowTableFunctionType;
  /** Optional equivalent primitive implementation used for fused expression execution. */
  evaluateScalar?(...arguments_: ArrowExpressionValue[]): ArrowExpressionValue;
}>;

/** Named overload group; each argument signature must be unique. */
export type ArrowTableFunction = Readonly<{
  /** Unique expression identifier; built-in names are reserved. */
  name: string;
  /** Typed implementations selected once when compiling a call. */
  prototypes: readonly ArrowTableFunctionPrototype[];
}>;

/** Schema binding shared by predicate and expression compilation. */
export type ArrowExpressionOptions = Readonly<{
  /** Expected batch schema, validated before evaluation. */
  inputSchema: Schema;
  /** Named function declarations, snapshotted into a private lookup during compilation. */
  functions?: readonly ArrowTableFunction[];
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
