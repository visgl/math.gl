// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, type Table, type RecordBatch} from 'apache-arrow';
import {compareUTF8} from '../utf8/utf8-utils';
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

export interface CompiledArrowAggregates<K extends string> {
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

  const accumulators = new WeakMap<ArrowAggregateAccumulator<K>, Map<Group, State>>();
  const createAccumulator = (): ArrowAggregateAccumulator<K> => {
    const states = new Map(groups.map(group => [group, emptyState(group)]));
    const accumulator: ArrowAggregateAccumulator<K> = {
      update(batch, {signal} = {}) {
        signal?.throwIfAborted();
        const partials = groups.map(group => summarize(group, batch, signal));
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
        return Object.fromEntries(
          outputs.map(({name, operation, group}) => [
            name,
            finish(operation, group, states.get(group)!)
          ])
        ) as Record<K, ArrowExpressionValue>;
      }
    };
    accumulators.set(accumulator, states);
    return accumulator;
  };
  return {
    createAccumulator,
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

function summarize(group: Group, batch: RecordBatch, signal?: AbortSignal): State {
  const state = emptyState(group);
  if (!group.expression) {
    state.count = BigInt(batch.numRows);
    return state;
  }
  const vector = group.expression.evaluate(batch, {signal});
  if (!group.sums && !group.reductions.length) {
    state.count = BigInt(vector.length - vector.nullCount);
    return state;
  }
  const reader = new ColumnReader(vector);
  let count = 0;
  for (let row = 0; row < vector.length; row++) {
    if (group.utf8) {
      if (!reader.isValid(row)) continue;
      count++;
      const bytes = reader.utf8(row);
      for (const operation of group.reductions) {
        const previous = state.values.get(operation) as Uint8Array | undefined;
        if (winsUTF8(operation, bytes, previous))
          state.values.set(operation, bytes[0].slice(bytes[1], bytes[2]));
      }
    } else {
      const value = reader.get(row) as number | bigint | boolean | null;
      if (value === null) continue;
      count++;
      if (group.sums) state.sum = add(group, state.sum, value as number | bigint);
      for (const operation of group.reductions) {
        const operand = operation.startsWith('BIT_') ? BigInt(value) : value;
        state.values.set(operation, reduce(operation, state.values.get(operation), operand));
      }
    }
  }
  state.count = BigInt(count);
  return state;
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
