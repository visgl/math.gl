// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression} from '../expressions/index';
import {
  isColumnarPredicateValue,
  type ColumnarPredicateValue
} from '../expressions/columnar-predicate';

/** Bound SQL value, including flat lists and numeric tuples used by color palettes. */
export type SQLParameterValue =
  | ColumnarPredicateValue
  | null
  | readonly number[]
  | readonly string[]
  | readonly (readonly number[])[];

/** Caller-owned values keyed by case-sensitive names without the leading colon. */
export type SQLParameters = Readonly<Record<string, SQLParameterValue>>;

/** Bind values directly, or retain the existing custom AST interpretation callback. */
export type SQLParameterOptions = Readonly<{
  /** Values referenced by SQL placeholders such as `:minimum` or `:colors`. */
  parameters?: SQLParameters;
  /** Custom interpretation of a placeholder; mutually exclusive with parameters. */
  parseParameter?: (name: string) => Expression;
}>;

/** Rejects ambiguous binding configuration even when a statement has no placeholders. */
export function validateSQLParameterOptions(options: SQLParameterOptions): void {
  if (options.parameters !== undefined && options.parseParameter !== undefined) {
    throw new Error('SQL parameters and parseParameter are mutually exclusive');
  }
}

/** Resolves a named value into a copied literal AST without interpreting it as SQL. */
export function bindSQLParameter(name: string, options: SQLParameterOptions): Expression {
  if (options.parseParameter) return options.parseParameter(name);
  if (!Object.prototype.hasOwnProperty.call(options.parameters ?? {}, name)) {
    throw new Error(`SQL parameter ":${name}" requires a value`);
  }
  const value = options.parameters![name];
  if (Array.isArray(value)) {
    if (
      value.length > 4096 ||
      !(
        Array.from(value).every(item => typeof item === 'number' && Number.isFinite(item)) ||
        Array.from(value).every(item => typeof item === 'string') ||
        Array.from(value).every(
          item =>
            Array.isArray(item) &&
            item.length <= 4096 &&
            Array.from(item).every(
              component => typeof component === 'number' && Number.isFinite(component)
            )
        )
      )
    )
      throw new Error(`SQL parameter ":${name}" has an unsupported array value`);
    return arrayLiteral(value);
  }
  if (value !== null && !isColumnarPredicateValue(value)) {
    throw new Error(`SQL parameter ":${name}" has an unsupported value`);
  }
  return literal(
    value instanceof Date
      ? new Date(value.getTime())
      : value instanceof Uint8Array
        ? value.slice()
        : value
  );
}

/** Builds an independent array tree; array elements are never identifiers or executable text. */
function arrayLiteral(values: readonly unknown[]): Expression {
  return {
    type: 'ArrayExpression',
    elements: Array.from(values, value =>
      Array.isArray(value) ? arrayLiteral(value) : literal(value)
    )
  } as Expression;
}

/** Creates a typed literal, including scalar values that cannot be represented in JSON. */
function literal(value: unknown): Expression {
  return {
    type: 'Literal',
    value,
    raw: typeof value === 'bigint' ? String(value) : JSON.stringify(value)
  } as Expression;
}
