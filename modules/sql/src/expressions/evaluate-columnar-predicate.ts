// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {compareUTF8} from '@math.gl/core/utf8';
import {
  getColumnarPredicatePath,
  type ColumnarPredicate,
  type ColumnarPredicateValue
} from './columnar-predicate';

/** A resolved column accessor for a portable row predicate. */
export type ColumnarPredicateReader = (
  rowIndex: number
) => ColumnarPredicateValue | null | undefined;

/** Resolves one exact column path to its row accessor. */
export type ColumnarPredicateColumnResolver = (path: readonly string[]) => ColumnarPredicateReader;

/** SQL truth value, where null represents UNKNOWN. */
export type ColumnarPredicateResult = boolean | null;

/**
 * Binds an already parameter-bound predicate to row accessors without Arrow or SQL parsing.
 * The returned predicate short-circuits logical operators and propagates SQL UNKNOWN.
 * Accessors supply logical values, including Date objects for temporal comparisons.
 */
export function compileColumnarPredicate(
  predicate: ColumnarPredicate,
  resolveColumn: ColumnarPredicateColumnResolver
): (rowIndex: number) => ColumnarPredicateResult {
  switch (predicate.op) {
    case 'and':
    case 'or': {
      const children = predicate.args.map(child => compileColumnarPredicate(child, resolveColumn));
      const terminal = predicate.op === 'or';
      return rowIndex => {
        let unknown = false;
        for (const child of children) {
          const value = child(rowIndex);
          if (value === terminal) return terminal;
          if (value === null) unknown = true;
        }
        return unknown ? null : !terminal;
      };
    }
    case 'not': {
      const read = compileColumnarPredicate(predicate.args[0], resolveColumn);
      return rowIndex => {
        const value = read(rowIndex);
        return value === null ? null : !value;
      };
    }
    case 'isNull': {
      const read = bindColumn(predicate.args[0], resolveColumn);
      return rowIndex => read(rowIndex) == null;
    }
    case 'in': {
      const read = bindColumn(predicate.args[0], resolveColumn);
      const candidates = predicate.args[1];
      return rowIndex => {
        const value = read(rowIndex);
        return value == null
          ? null
          : candidates.some(
              candidate => comparable(value, candidate) && compareValues(value, candidate) === 0
            );
      };
    }
    default: {
      const read = bindColumn(predicate.args[0], resolveColumn);
      const comparison = COMPARISONS[predicate.op];
      const literal = predicate.args[1];
      return rowIndex => {
        const value = read(rowIndex);
        return value == null ? null : comparison(compareValues(value, literal));
      };
    }
  }
}

/** Comparison operators applied to the ordered difference of two scalar values. */
const COMPARISONS = {
  '=': (order: number) => order === 0,
  '<>': (order: number) => order !== 0,
  '<': (order: number) => order < 0,
  '<=': (order: number) => order <= 0,
  '>': (order: number) => order > 0,
  '>=': (order: number) => order >= 0
};

/** Resolves a path once and rejects casts that require a typed executor. */
function bindColumn(
  property: Parameters<typeof getColumnarPredicatePath>[0],
  resolveColumn: ColumnarPredicateColumnResolver
): ColumnarPredicateReader {
  if (property.casts?.length) throw new Error('Portable row predicates do not support casts');
  return resolveColumn(getColumnarPredicatePath(property));
}

/** Compares logical values without narrowing bigint or treating NaN as equal. */
function compareValues(left: ColumnarPredicateValue, right: ColumnarPredicateValue): number {
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return compareUTF8(left, 0, left.length, right, 0, right.length);
  }
  if (left instanceof Date && right instanceof Date) {
    return compareValues(left.getTime(), right.getTime());
  }
  if (
    (typeof left === 'number' && !Number.isFinite(left)) ||
    (typeof right === 'number' && !Number.isFinite(right))
  ) {
    throw new Error('Columnar predicate cannot compare non-finite numbers');
  }
  if (isNumeric(left) && isNumeric(right)) return left < right ? -1 : left > right ? 1 : 0;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  if (typeof left === 'string' && typeof right === 'string') {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  throw new Error('Columnar predicate operands must have comparable types');
}

/** Identifies a number or exact integer in the portable numeric domain. */
function isNumeric(value: ColumnarPredicateValue): value is number | bigint {
  return typeof value === 'number' || typeof value === 'bigint';
}

/** Checks membership compatibility without rejecting other candidate types. */
function comparable(left: ColumnarPredicateValue, right: ColumnarPredicateValue): boolean {
  if (isNumeric(left) && isNumeric(right)) return true;
  if (left instanceof Date || right instanceof Date) {
    return left instanceof Date && right instanceof Date;
  }
  if (left instanceof Uint8Array || right instanceof Uint8Array) {
    return left instanceof Uint8Array && right instanceof Uint8Array;
  }
  return typeof left === typeof right;
}
