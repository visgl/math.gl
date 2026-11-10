// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, Precision, makeData, makeVector, type Field} from 'apache-arrow';
import type {ArrowTableFunction} from '@math.gl/arrow/expressions';
import {makeGeoArrowColumnFromArrowVector} from '@math.gl/arrow/geoarrow';
import {isGeoArrowValueValid, type GeoArrowColumn} from '@math.gl/arrow/geoarrow-utils';
import type {TurfBatchResult} from '../turf';

/** Adapter for row-preserving numeric/Boolean functions from @math.gl/geospatial/turf. */
export type TurfArrowFunctionOptions<Fields extends readonly Field[] = readonly Field[]> = {
  /** Name used in expressions. */
  name: string;
  /** Exact GeoArrow fields, including extension metadata, in function argument order. */
  arguments: Fields;
  /** Nullable Float64 or Bool output field. */
  result: Field;
  /** Imported Turf kernel or a closure binding its units/options; no global registry is used. */
  evaluate: (
    ...columns: {[Index in keyof Fields]: GeoArrowColumn}
  ) => TurfBatchResult<Float64Array | Uint8Array>;
};

/**
 * Wraps a scalar-result Turf batch function as an Arrow expression vector kernel. Bind options
 * in the evaluate closure. Only selected Turf imports are bundled; this adapter imports no Turf
 * implementations. Geometry-valued results and flattened bbox results are not supported.
 */
export function createTurfArrowFunction<const Fields extends readonly Field[]>(
  options: TurfArrowFunctionOptions<Fields>
): ArrowTableFunction {
  const {result, evaluate} = options;
  const fields = [...options.arguments];
  const boolean = DataType.isBool(result.type);
  if (!boolean && !(DataType.isFloat(result.type) && result.type.precision === Precision.DOUBLE))
    throw new Error('Turf expressions require a Float64 or Bool result');
  if (!result.nullable) throw new Error('Turf expression results must be nullable');
  return {
    name: options.name,
    arguments: fields,
    result,
    nullHandling: 'propagate',
    evaluate(vectors, {activeRows, length}) {
      const columns = vectors.map((vector, index) => {
        const column = makeGeoArrowColumnFromArrowVector(vector, {field: fields[index]});
        let offset = 0;
        return {
          ...column,
          chunks: column.chunks.map(chunk => {
            const validity = new Uint8Array(Math.ceil(chunk.length / 8));
            for (let row = 0; row < chunk.length; row++) {
              if (activeRows[offset + row] && isGeoArrowValueValid(chunk.validity, row))
                validity[row >> 3] |= 1 << (row & 7);
            }
            offset += chunk.length;
            return {...chunk, validity: {values: validity}};
          })
        };
      });
      const output = (
        evaluate as (...args: GeoArrowColumn[]) => TurfBatchResult<Float64Array | Uint8Array>
      )(...columns);
      if (
        output.values.length !== length ||
        output.validity.length < Math.ceil(length / 8) ||
        (boolean
          ? !(output.values instanceof Uint8Array)
          : !(output.values instanceof Float64Array))
      )
        throw new Error('Turf expression kernel must return one declared scalar per input row');
      const validity = new Uint8Array(Math.ceil(length / 8));
      const values = boolean ? new Uint8Array(Math.ceil(length / 8)) : output.values;
      let nullCount = 0;
      for (let row = 0; row < length; row++) {
        const bit = 1 << (row & 7);
        if (activeRows[row] && output.validity[row >> 3]! & bit) {
          validity[row >> 3] |= bit;
          if (boolean && output.values[row]) values[row >> 3] |= bit;
        } else nullCount++;
      }
      return makeVector(
        makeData({type: result.type, data: values, length, nullBitmap: validity, nullCount} as any)
      );
    }
  };
}
