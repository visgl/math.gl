// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Field, Schema, RecordBatch, Vector, Table} from 'apache-arrow';
import type {Expression} from '../expressions';
import type {ArrowProjectionOperation} from './create-arrow-columns';

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
  /** Resolves a schema-dependent overload from inferred arguments. Undefined fields need context. */
  resolvePrototype?(
    fields: readonly (Field | undefined)[]
  ): ArrowTableFunctionPrototype | undefined;
}>;

/** Flat declaration for a schema-bound scalar function. */
export type ScalarFunction<M = never> = [M] extends [never]
  ? ArrowTableFunction & {
      /** SQL execution kind for a row-preserving schema-bound function. */
      readonly kind: 'scalar';
    }
  : PreparedScalarFunction<M>;

/** Scalar declaration requiring access to the projection input before evaluation. */
export type PreparedScalarFunction<M> = Pick<ArrowProjectionOperation<M>, 'prepare'> & {
  /** SQL execution kind for a row-preserving expression. */
  readonly kind: 'scalar';
  /** SQL call name matched case-insensitively during preparation. */
  readonly name: string;
};

/** Independent state for one aggregate call in one group. */
export interface AggregateAccumulator {
  /** Adds an input batch. A zero-argument aggregate receives its row count here. */
  update(arguments_: readonly Vector[], context: {length: number; signal?: AbortSignal}): void;
  /** Combines an independent partial accumulator when supported. */
  merge?(partial: AggregateAccumulator): void;
  /** Returns the result, including the declared empty or null-only behavior. */
  finalize(): ArrowExpressionValue;
}

/** A reduction that binds its schema and creates independent group state. */
export type AggregateFunction<M = never> = Readonly<{
  /** SQL execution kind for a group reduction. */
  kind: 'aggregate';
  /** SQL call name. */
  name: string;
  /** Binds the evaluated argument fields once per query. */
  bind(context: {arguments: readonly Field[]}): {
    /** Arrow field produced by each group. */
    outputField: Field;
    /** Creates independent state for a group. */
    createAccumulator(): AggregateAccumulator;
    /** Optional application data attached to the output expression. */
    metadata?: M;
  };
}>;

/** A function or a reusable package of functions. */
export type ArrowFunctionPackage =
  | ArrowTableFunction
  | ScalarFunction
  | PreparedScalarFunction<unknown>
  | AggregateFunction<unknown>
  | readonly ArrowFunctionPackage[];

/** Schema binding shared by predicate and expression compilation. */
export type ArrowExpressionOptions = Readonly<{
  /** Expected batch schema, validated before evaluation. */
  inputSchema: Schema;
  /** Named function declarations, snapshotted into a private lookup during compilation. */
  functions?: readonly ArrowFunctionPackage[];
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
