// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import {getGeoArrowFieldInfo, getGeoArrowVectorBounds} from '@math.gl/core/arrow';

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

  /** Returns a frame with a different active geometry and the same Arrow table. */
  setGeometry(name: string): GeoDataFrame {
    return new GeoDataFrame(this.table, {geometry: name});
  }
}
