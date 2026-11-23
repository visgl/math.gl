// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Data, Schema, Struct, Table} from 'apache-arrow';
import {
  createRecordBatchWithMetadata,
  getRecordBatchMetadata,
  getGeoArrowFieldInfo,
  makeGeoArrowColumnFromArrowVector,
  materializeGeoArrowRows,
  type WellKnownGeometry
} from '@math.gl/core/arrow';
import type {TableFunction} from '@math.gl/sql/arrow';
import {simplifyCoverage} from './coverage-simplification';
import {nativeGeometryResult} from './spatial-sql';

/** Settings for a whole-relation coverage simplification. */
export type CoverageSimplifyOptions = {
  /** Maximum vertex displacement in planar coordinate units. */
  tolerance: number;
  /** Name of the native Polygon or MultiPolygon column. */
  geometry: string;
};

/** Creates an opted-in ST_CoverageSimplify table function with fixed tolerance. */
export function createSTCoverageSimplify({
  geometry,
  tolerance
}: CoverageSimplifyOptions): TableFunction {
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new Error('ST_CoverageSimplify requires a finite nonnegative tolerance');
  return {
    kind: 'table',
    name: 'ST_CoverageSimplify',
    /** Binds one native 2D polygon field and a stable output schema. */
    bind(inputSchema) {
      const index = inputSchema.fields.findIndex(field => field.name === geometry);
      const field = inputSchema.fields[index];
      const info = field && getGeoArrowFieldInfo(field);
      const encoding = info?.encoding;
      if (
        !field ||
        (encoding !== 'geoarrow.polygon' && encoding !== 'geoarrow.multipolygon') ||
        info.dimension !== 'xy' ||
        info.metadata['edges'] === 'spherical'
      )
        throw new Error(
          'ST_CoverageSimplify requires a native planar XY Polygon or MultiPolygon column'
        );
      const output = nativeGeometryResult(encoding);
      const fields = inputSchema.fields.slice();
      fields[index] = field.clone({type: output.type});
      const outputSchema = new Schema(
        fields,
        inputSchema.metadata,
        undefined,
        inputSchema.metadataVersion
      );
      return {
        outputSchema,
        /** Simplifies shared boundaries across batches while preserving row alignment. */
        evaluate(input, {signal}) {
          signal?.throwIfAborted();
          if (!input.numRows) return new Table(outputSchema, []);
          const vector = input.getChildAt(index)!;
          const column = makeGeoArrowColumnFromArrowVector(vector, {field});
          const rows = materializeGeoArrowRows(column) as (Extract<
            WellKnownGeometry,
            {type: 'Polygon' | 'MultiPolygon'}
          > | null)[];
          const result = simplifyCoverage(rows, tolerance, signal);
          let first = 0;
          const type = new Struct(fields);
          const batches = input.batches.map(batch => {
            signal?.throwIfAborted();
            const children = batch.data.children.slice();
            children[index] = output.build(result.slice(first, first + batch.numRows)).data[0]!;
            first += batch.numRows;
            const data = new Data(type, 0, batch.numRows, 0, undefined, children);
            return createRecordBatchWithMetadata(outputSchema, data, getRecordBatchMetadata(batch));
          });
          return new Table(outputSchema, batches);
        }
      };
    }
  };
}
