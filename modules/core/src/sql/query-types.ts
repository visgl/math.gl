// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression} from '../expressions/index';
import type {ColumnarPredicate, ColumnarPredicateProperty} from '../expressions/columnar-predicate';

/** One source column selected for logical output, optionally under a new name. */
export type TableSelection =
  | Readonly<{array: readonly string[]; as: string; type?: 'float16' | 'float32' | 'float64'}>
  | Readonly<{expression: Expression; as?: string}>
  | string
  | Readonly<{
      /** Source column name, resolved before aliases are applied. */
      column: string;
      /** Output field name. Defaults to the source column name. */
      as?: string;
    }>;

/** Named source, or a named table exposed by a source. Strings are literal names, not dotted paths. */
export type TableReference =
  | string
  | Readonly<{
      /** Name of a registered data source. */
      source: string;
      /** Name of a table exposed by that source. */
      table: string;
    }>;

/** Logical query description, independent of cancellation and execution observers. */
export type TableQuery<
  PredicateT extends ColumnarPredicate<unknown, ColumnarPredicateProperty> = ColumnarPredicate
> = Readonly<{
  /** Optional named source or qualified table selected before planning. */
  from?: TableReference;
  /** Output columns in selection order. Omission selects all source columns. */
  select?: readonly TableSelection[];
  /** Predicate evaluated against source columns before output aliases are applied. */
  where?: PredicateT;
  /** Maximum number of rows retained after filtering. */
  limit?: number;
}>;

/** Portable logical metadata commands, independent of SQL parsing and execution controls. */
export type SQLCatalogQuery = Readonly<
  | {
      /** Lists locally registered source names. */
      command: 'showSources';
    }
  | {
      /** Lists discoverable tables in registration order. */
      command: 'showTables';
      /** Optional exact source name; omission discovers every registered source. */
      from?: string;
    }
  | {
      /** Describes the fields of one table. */
      command: 'describe';
      /** Literal source name, or separate source and loaded table names. */
      from: TableReference;
    }
>;

/** Logical table selection or catalog request, independent of execution. */
export type SQLQuery = TableQuery | SQLCatalogQuery;
