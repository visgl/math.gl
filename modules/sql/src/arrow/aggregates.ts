// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, type Table, type RecordBatch} from 'apache-arrow';
import {compareUTF8} from '@math.gl/arrow/utf8';
import {ColumnReader, valueType} from './buffers';
import {compileArrowExpression} from './compiler';
import type {
  ArrowExpression,
  ArrowExpressionOptions,
  ArrowExpressionValue,
  CompiledArrowExpression
} from './types';

type Operation =
  | 'COUNT'
  | 'SUM'
  | 'MIN'
  | 'MAX'
  | 'AVG'
  | 'EVERY'
  | 'BOOL_AND'
  | 'BOOL_OR'
  | 'BIT_AND'
  | 'BIT_OR'
  | 'BIT_XOR';

/** One scalar reduction. Omit the COUNT expression for COUNT(*). */
export type ArrowAggregate =
  | {readonly operation: 'COUNT'; readonly expression?: ArrowExpression}
  | {readonly operation: Exclude<Operation, 'COUNT'>; readonly expression: ArrowExpression};

export interface ArrowAggregateAccumulator<K extends string> {
  /** Adds a batch. A failed expression leaves the previous state intact. */
  update(batch: RecordBatch, options?: {signal?: AbortSignal}): void;
  /** Adds the partial state of another accumulator from this compiled plan. */
  merge(other: ArrowAggregateAccumulator<K>): void;
  /** Returns a snapshot. Further batches may change the next result. */
  result(): Record<K, ArrowExpressionValue>;
}

/** Incrementally reduces rows into groups without storing the input rows. */
export interface ArrowGroupedAggregateAccumulator<K extends string> {
  /** Adds one batch atomically. An expression error or cancellation leaves the previous state intact. */
  update(batch: RecordBatch, options?: {signal?: AbortSignal}): void;
  /** Returns a detached snapshot in first-seen key order. Null keys form one group. */
  result(): ReadonlyMap<ArrowExpressionValue, Record<K, ArrowExpressionValue>>;
}

/** A schema-bound plan for scalar or grouped reductions. */
export interface CompiledArrowAggregates<K extends string> {
  /** Starts a grouped reduction using one scalar key expression. */
  createGroupedAccumulator(groupBy: ArrowExpression): ArrowGroupedAggregateAccumulator<K>;
  createAccumulator(): ArrowAggregateAccumulator<K>;
  evaluate(
    input: Table | Iterable<RecordBatch>,
    options?: {signal?: AbortSignal}
  ): Record<K, ArrowExpressionValue>;
  evaluateInBatches(
    input: AsyncIterable<RecordBatch> | Iterable<RecordBatch>,
    options?: {signal?: AbortSignal}
  ): Promise<Record<K, ArrowExpressionValue>>;
}

type Value = Exclude<ArrowExpressionValue, null | string> | Uint8Array;
type State = {
  count: bigint;
  sum: number | bigint;
  values: Map<Operation, Value>;
};
type Group = {
  expression?: CompiledArrowExpression;
  operations: Set<Operation>;
  integer: boolean;
  wide: boolean;
  utf8: boolean;
  sums: boolean;
  reductions: Operation[];
};

const reductions = new Set<Operation>([
  'MIN',
  'MAX',
  'EVERY',
  'BOOL_AND',
  'BOOL_OR',
  'BIT_AND',
  'BIT_OR',
  'BIT_XOR'
]);

/** Compiles named scalar aggregates. Identical expression strings or shared ASTs run once per batch. */
export function compileArrowAggregates<K extends string>(
  aggregates: Readonly<Record<K, ArrowAggregate>>,
  options: ArrowExpressionOptions
): CompiledArrowAggregates<K> {
  const groups: Group[] = [];
  const byExpression = new Map<ArrowExpression | undefined, Group>();
  const outputs = (Object.entries(aggregates) as [K, ArrowAggregate][]).map(([name, aggregate]) => {
    const {operation, expression} = aggregate;
    if (!reductions.has(operation) && !['COUNT', 'SUM', 'AVG'].includes(operation))
      throw new Error(`Unsupported Arrow aggregate: ${operation}`);
    if (expression === undefined && operation !== 'COUNT')
      throw new Error(`${operation} requires an expression`);
    let group = byExpression.get(expression);
    if (!group) {
      const compiled =
        expression === undefined ? undefined : compileArrowExpression(expression, options);
      const type = compiled && valueType(compiled.outputField.type);
      group = {
        expression: compiled,
        operations: new Set(),
        integer: Boolean(type && DataType.isInt(type)),
        wide: Boolean(type && DataType.isInt(type) && type.bitWidth === 64),
        utf8: Boolean(type && DataType.isUtf8(type)),
        sums: false,
        reductions: []
      };
      byExpression.set(expression, group);
      groups.push(group);
    }
    const type = group.expression && valueType(group.expression.outputField.type);
    if (type && !DataType.isNull(type) && operation !== 'COUNT') {
      const numeric = group.integer || DataType.isFloat(type);
      const supported = operation.startsWith('BIT_')
        ? group.integer
        : operation === 'EVERY' || operation.startsWith('BOOL_')
          ? DataType.isBool(type)
          : numeric || (group.utf8 && (operation === 'MIN' || operation === 'MAX'));
      if (!supported) throw new Error(`${operation} does not support Arrow type ${type}`);
    }
    group.operations.add(operation);
    return {name, operation, group};
  });
  for (const group of groups) {
    group.sums = group.operations.has('SUM') || group.operations.has('AVG');
    group.reductions = [...group.operations].filter(operation => reductions.has(operation));
  }

  /** Materializes one aggregate result without exposing accumulator state. */
  const resultFor = (states: Map<Group, State>): Record<K, ArrowExpressionValue> =>
    Object.fromEntries(
      outputs.map(({name, operation, group}) => [
        name,
        finish(operation, group, states.get(group)!)
      ])
    ) as Record<K, ArrowExpressionValue>;

  const accumulators = new WeakMap<ArrowAggregateAccumulator<K>, Map<Group, State>>();
  const createAccumulator = (): ArrowAggregateAccumulator<K> => {
    const states = new Map(groups.map(group => [group, emptyState(group)]));
    const accumulator: ArrowAggregateAccumulator<K> = {
      update(batch, {signal} = {}) {
        signal?.throwIfAborted();
        const partials = groups.map(group => summarize(group, batch, signal)[0]!);
        signal?.throwIfAborted();
        groups.forEach((group, index) => mergeState(group, states.get(group)!, partials[index]!));
      },
      merge(other) {
        const source = accumulators.get(other);
        if (!source || other === accumulator)
          throw new Error('Merge requires another accumulator from the same Arrow aggregate plan');
        for (const group of groups) mergeState(group, states.get(group)!, source.get(group)!);
      },
      result() {
        return resultFor(states);
      }
    };
    accumulators.set(accumulator, states);
    return accumulator;
  };
  return {
    createAccumulator,
    createGroupedAccumulator(groupBy) {
      const keyExpression = compileArrowExpression(groupBy, options);
      const type = valueType(keyExpression.outputField.type);
      if (
        !(
          DataType.isInt(type) ||
          DataType.isFloat(type) ||
          DataType.isBool(type) ||
          DataType.isUtf8(type) ||
          DataType.isNull(type)
        )
      ) {
        throw new Error(`Unsupported Arrow aggregate group key type: ${type}`);
      }
      const statesByKey = new Map<ArrowExpressionValue, Map<Group, State>>();
      return {
        update(batch, {signal} = {}) {
          const partition = partitionRows(keyExpression, batch, signal);
          const partials = groups.map(group => summarize(group, batch, signal, partition));
          signal?.throwIfAborted();
          for (const [key, index] of partition.indexByKey) {
            let states = statesByKey.get(key);
            if (!states) {
              states = new Map(groups.map(group => [group, emptyState(group)]));
              statesByKey.set(key, states);
            }
            groups.forEach((group, groupIndex) =>
              mergeState(group, states.get(group)!, partials[groupIndex]![index]!)
            );
          }
        },
        result() {
          return new Map(Array.from(statesByKey, ([key, states]) => [key, resultFor(states)]));
        }
      };
    },
    evaluate(input, evaluation) {
      evaluation?.signal?.throwIfAborted();
      const accumulator = createAccumulator();
      for (const batch of 'batches' in input ? input.batches : input)
        accumulator.update(batch, evaluation);
      return accumulator.result();
    },
    async evaluateInBatches(input, evaluation) {
      evaluation?.signal?.throwIfAborted();
      const accumulator = createAccumulator();
      for await (const batch of input) accumulator.update(batch, evaluation);
      evaluation?.signal?.throwIfAborted();
      return accumulator.result();
    }
  };
}

function emptyState(group: Group): State {
  return {count: 0n, sum: group.integer ? 0n : 0, values: new Map()};
}

/** Dense batch-local group indices keep expression evaluation independent of group count. */
type RowPartition = {
  indexByKey: ReadonlyMap<ArrowExpressionValue, number>;
  indexByRow: Uint32Array;
  rowCounts: readonly number[];
};

/** Resolves one group key per row and records first-seen order. */
function partitionRows(
  expression: CompiledArrowExpression,
  batch: RecordBatch,
  signal?: AbortSignal
): RowPartition {
  const reader = new ColumnReader(expression.evaluate(batch, {signal}));
  const indexByKey = new Map<ArrowExpressionValue, number>();
  const indexByRow = new Uint32Array(batch.numRows);
  const rowCounts: number[] = [];
  for (let row = 0; row < batch.numRows; row++) {
    if (row % 1024 === 0) signal?.throwIfAborted();
    const key = reader.get(row);
    if (typeof key === 'number' && !Number.isFinite(key))
      throw new Error('Arrow aggregate group keys must be finite');
    let index = indexByKey.get(key);
    if (index === undefined) {
      index = indexByKey.size;
      indexByKey.set(key, index);
      rowCounts.push(0);
    }
    indexByRow[row] = index;
    rowCounts[index]!++;
  }
  return {indexByKey, indexByRow, rowCounts};
}

/** Reduces one expression across the batch, optionally routing rows to groups. */
function summarize(
  group: Group,
  batch: RecordBatch,
  signal?: AbortSignal,
  partition?: RowPartition
): State[] {
  const states = Array.from({length: partition?.indexByKey.size ?? 1}, () => emptyState(group));
  if (!group.expression) {
    for (let index = 0; index < states.length; index++)
      states[index]!.count = BigInt(partition?.rowCounts[index] ?? batch.numRows);
    return states;
  }
  const vector = group.expression.evaluate(batch, {signal});
  const countOnly = !group.sums && !group.reductions.length;
  if (countOnly && !partition) {
    states[0]!.count = BigInt(vector.length - vector.nullCount);
    return states;
  }
  const reader = new ColumnReader(vector);
  const counts = Array.from({length: states.length}, () => 0);
  for (let row = 0; row < vector.length; row++) {
    if (row % 1024 === 0) signal?.throwIfAborted();
    const index = partition?.indexByRow[row] ?? 0;
    const state = states[index]!;
    if (countOnly || group.utf8) {
      if (!reader.isValid(row)) continue;
      counts[index]!++;
      if (countOnly) continue;
      const bytes = reader.utf8(row);
      for (const operation of group.reductions) {
        const previous = state.values.get(operation) as Uint8Array | undefined;
        if (winsUTF8(operation, bytes, previous))
          state.values.set(operation, bytes[0].slice(bytes[1], bytes[2]));
      }
    } else {
      const value = reader.get(row) as number | bigint | boolean | null;
      if (value === null) continue;
      counts[index]!++;
      if (group.sums) state.sum = add(group, state.sum, value as number | bigint);
      for (const operation of group.reductions) {
        const operand = operation.startsWith('BIT_') ? BigInt(value) : value;
        state.values.set(operation, reduce(operation, state.values.get(operation), operand));
      }
    }
  }
  states.forEach((state, index) => {
    state.count = BigInt(counts[index]!);
  });
  return states;
}

function add(group: Group, left: number | bigint, right: number | bigint): number | bigint {
  return group.integer ? BigInt(left) + BigInt(right) : Number(left) + Number(right);
}

function winsUTF8(
  operation: Operation,
  [bytes, start, end]: [Uint8Array, number, number],
  previous: Uint8Array | undefined
): boolean {
  if (!previous) return true;
  const order = compareUTF8(bytes, start, end, previous, 0, previous.length);
  return operation === 'MIN' ? order < 0 : order > 0;
}

function reduce(operation: Operation, left: Value | undefined, right: Value): Value {
  if (left === undefined) return right;
  switch (operation) {
    case 'MIN':
      return typeof left === 'number'
        ? Math.min(left, right as number)
        : left < right
          ? left
          : right;
    case 'MAX':
      return typeof left === 'number'
        ? Math.max(left, right as number)
        : left > right
          ? left
          : right;
    case 'EVERY':
    case 'BOOL_AND':
      return Boolean(left && right);
    case 'BOOL_OR':
      return Boolean(left || right);
    case 'BIT_AND':
      return (left as bigint) & (right as bigint);
    case 'BIT_OR':
      return (left as bigint) | (right as bigint);
    case 'BIT_XOR':
      return (left as bigint) ^ (right as bigint);
    default:
      throw new Error(`Invalid Arrow reduction: ${operation}`);
  }
}

function mergeState(group: Group, target: State, source: State): void {
  if (!source.count) return;
  target.count += source.count;
  if (group.sums) target.sum = add(group, target.sum, source.sum);
  for (const [operation, value] of source.values) {
    const previous = target.values.get(operation);
    if (value instanceof Uint8Array) {
      if (winsUTF8(operation, [value, 0, value.length], previous as Uint8Array | undefined))
        target.values.set(operation, value);
    } else {
      target.values.set(operation, reduce(operation, previous, value));
    }
  }
}

function finish(operation: Operation, group: Group, state: State): ArrowExpressionValue {
  if (operation === 'COUNT') return state.count;
  if (!state.count) return null;
  if (operation === 'SUM') return state.sum;
  if (operation === 'AVG') return Number(state.sum) / Number(state.count);
  const value = state.values.get(operation)!;
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  return operation.startsWith('BIT_') && !group.wide ? Number(value) : value;
}
