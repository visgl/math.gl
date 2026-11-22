// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import {getGeoArrowFieldInfo, getGeoArrowVectorBounds} from '@math.gl/core/arrow';
import {executeArrowProjection, type ArrowBatchQuery} from '../arrow/query-arrow-table';
import {parseSQLExpression} from '../parser/parse-sql-expression';
import type {SQLParameterOptions} from '../parser/sql-parameters';

/** SQL expression bindings and Arrow execution options for frame operations. */
export type DataFrameQueryOptions = SQLParameterOptions &
  Pick<ArrowBatchQuery, 'functions' | 'signal'>;

/** Experimental immutable wrapper around an Arrow table. */
export class DataFrame {
  /** Wraps an Arrow table without copying its buffers. */
  constructor(protected readonly table: Table) {}

  /** Wraps an Arrow table without copying its buffers. */
  static fromArrow(table: Table): DataFrame {
    return new DataFrame(table);
  }

  /** Returns the underlying Arrow table. */
  toArrow(): Table {
    return this.table;
  }

  /** Keeps rows for which the SQL expression evaluates to true, in source order. */
  filter(predicate: string, options: DataFrameQueryOptions = {}): DataFrame {
    const where = {expression: parseSQLExpression(predicate, options)};
    return new DataFrame(
      executeArrowProjection(this.table, {
        where,
        functions: options.functions,
        signal: options.signal
      })
    );
  }

  /** Adds or replaces columns. Every expression reads the original input table. */
  withColumns(
    expressions: Readonly<Record<string, string>>,
    options: DataFrameQueryOptions = {}
  ): DataFrame {
    options.signal?.throwIfAborted();
    const fields = this.table.schema.fields;
    const pending = new Map(Object.entries(expressions));
    if (!pending.size) return this;
    const select: NonNullable<ArrowBatchQuery['select']>[number][] = fields.map(({name}) => {
      const expression = pending.get(name);
      if (expression === undefined) return name;
      pending.delete(name);
      return {as: name, expression: parseSQLExpression(expression, options)};
    });
    for (const [name, expression] of pending) {
      select.push({as: name, expression: parseSQLExpression(expression, options)});
    }
    return new DataFrame(
      executeArrowProjection(this.table, {
        select,
        functions: options.functions,
        signal: options.signal
      })
    );
  }

  /** Selects columns in the requested order and shares their Arrow buffers. */
  select(...columns: string[]): DataFrame {
    const indices = columns.map(name => {
      const index = this.table.schema.fields.findIndex(field => field.name === name);
      if (index === -1) {
        throw new Error(`Unknown column "${name}"`);
      }
      return index;
    });
    return new DataFrame(this.table.selectAt(indices));
  }
}

/** Options for choosing an active GeoArrow field. */
export type GeoDataFrameOptions = {
  /** Active geometry field. Defaults to the sole GeoArrow field. */
  geometry?: string;
};

/** Experimental Arrow data frame with a validated active GeoArrow field. */
export class GeoDataFrame extends DataFrame {
  /** Active geometry with its Arrow field metadata and vector. */
  readonly geometry;

  /** Wraps a table and binds its active geometry without copying buffers. */
  constructor(table: Table, {geometry}: GeoDataFrameOptions = {}) {
    super(table);
    const fields = table.schema.fields.filter(field =>
      geometry === undefined ? getGeoArrowFieldInfo(field) : field.name === geometry
    );
    const field = fields[0];
    if (fields.length !== 1 || !field || !getGeoArrowFieldInfo(field)) {
      throw new Error(
        geometry === undefined
          ? 'Expected exactly one GeoArrow field. Specify an active geometry when several exist.'
          : `Expected one GeoArrow field named "${geometry}"`
      );
    }
    const vector = table.getChildAt(table.schema.fields.indexOf(field))!;
    this.geometry = {
      field,
      vector,
      /** Computes the extent in stored coordinates, or null for empty geometry. */
      totalBounds: () => getGeoArrowVectorBounds(vector, {field})
    } as const;
  }

  /** Wraps an Arrow table and chooses its active geometry. */
  static override fromArrow(table: Table, options?: GeoDataFrameOptions): GeoDataFrame {
    return new GeoDataFrame(table, options);
  }

  /** Filters rows and retains the active geometry field. */
  override filter(predicate: string, options?: DataFrameQueryOptions): GeoDataFrame {
    return this.withTable(super.filter(predicate, options).toArrow());
  }

  /** Derives attributes and retains the active geometry field. */
  override withColumns(
    expressions: Readonly<Record<string, string>>,
    options?: DataFrameQueryOptions
  ): GeoDataFrame {
    if (Object.prototype.hasOwnProperty.call(expressions, this.geometry.field.name)) {
      throw new Error('Cannot replace the active geometry with a SQL expression');
    }
    return this.withTable(super.withColumns(expressions, options).toArrow());
  }

  /** Rebinds the active geometry after a table operation. */
  private withTable(table: Table): GeoDataFrame {
    return table === this.table
      ? this
      : new GeoDataFrame(table, {geometry: this.geometry.field.name});
  }

  /** Returns a frame with a different active geometry and the same Arrow table. */
  setGeometry(name: string): GeoDataFrame {
    return new GeoDataFrame(this.table, {geometry: name});
  }
}
