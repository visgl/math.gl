// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Table} from 'apache-arrow';
import {
  getGeoArrowFieldInfo,
  getGeoArrowVectorBounds,
  getGeoArrowVectorRowBounds,
  type GeoArrowBounds
} from '@math.gl/core/arrow';
import {
  executeArrowProjection,
  selectArrowBatchRows,
  type ArrowBatchQuery
} from '../arrow/query-arrow-table';
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

/** Options for intersecting the active geometry's row envelopes with a viewport. */
export type GeoDataFrameViewportOptions = {
  /** Interpret x as longitude in degrees and repeat envelopes every 360 degrees. */
  wrapLongitude?: boolean;
};

/** Cached row envelopes per immutable source table and active field. */
const rowBoundsByTable = new WeakMap<Table, Map<string, readonly (GeoArrowBounds | null)[]>>();

/** Maps a longitude difference to [0, 360). */
function wrapLongitudeDelta(delta: number): number {
  const remainder = delta % 360;
  return remainder < 0 ? remainder + 360 : remainder;
}

/** Compiles inclusive envelope intersection for a planar or repeating longitude domain. */
function makeViewportIntersection(
  [west, south, east, north]: GeoArrowBounds,
  wrapLongitude: boolean
): (row: GeoArrowBounds) => boolean {
  if (
    ![west, south, east, north].every(Number.isFinite) ||
    south > north ||
    (!wrapLongitude && west > east)
  ) {
    throw new Error('Invalid GeoDataFrame viewport bounds');
  }
  const delta = east - west;
  const width = Math.abs(delta) >= 360 ? 360 : wrapLongitudeDelta(delta);
  return ([xmin, ymin, xmax, ymax]) => {
    if (ymax < south || ymin > north) return false;
    if (!wrapLongitude) return xmin <= east && xmax >= west;
    const span = xmax - xmin;
    if (width === 360 || Math.abs(span) >= 360) return true;
    const start = wrapLongitudeDelta((xmin % 360) - (west % 360));
    const rowWidth = span < 0 ? wrapLongitudeDelta(span) : span;
    return start <= width || start + rowWidth >= 360;
  };
}

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

  /**
   * Keeps rows whose active geometry envelopes intersect the viewport, including contact
   * at its edges. Bounds are [minX, minY, maxX, maxY] in the geometry's stored coordinates.
   * With longitude wrapping enabled, a west value greater than east crosses the seam.
   */
  filterViewport(
    bounds: GeoArrowBounds,
    {wrapLongitude = false}: GeoDataFrameViewportOptions = {}
  ): GeoDataFrame {
    const intersects = makeViewportIntersection(bounds, wrapLongitude);
    const rowBounds = this.getCachedRowBounds();
    let offset = 0;
    const batches = this.table.batches.flatMap(batch => {
      const indexes: number[] = [];
      for (let row = 0; row < batch.numRows; row++) {
        const extent = rowBounds[offset + row];
        if (extent && intersects(extent)) indexes.push(row);
      }
      offset += batch.numRows;
      const selected = selectArrowBatchRows(batch, indexes, this.table.schema);
      return selected ? [selected] : [];
    });
    const unchanged =
      batches.length === this.table.batches.length &&
      batches.every((batch, index) => batch === this.table.batches[index]);
    return unchanged ? this : this.withTable(new Table(this.table.schema, batches));
  }

  /** Computes row envelopes once for each source table and geometry field. */
  private getCachedRowBounds(): readonly (GeoArrowBounds | null)[] {
    const {field, vector} = this.geometry;
    let columns = rowBoundsByTable.get(this.table);
    if (!columns) {
      columns = new Map();
      rowBoundsByTable.set(this.table, columns);
    }
    let bounds = columns.get(field.name);
    if (!bounds) {
      bounds = getGeoArrowVectorRowBounds(vector, {field});
      columns.set(field.name, bounds);
    }
    return bounds;
  }

  /** Returns a frame with a different active geometry and the same Arrow table. */
  setGeometry(name: string): GeoDataFrame {
    return new GeoDataFrame(this.table, {geometry: name});
  }
}
