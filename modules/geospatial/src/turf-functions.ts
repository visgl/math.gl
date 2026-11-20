// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Binary,
  Bool,
  FixedSizeList,
  Float64,
  DataType,
  Precision,
  makeData,
  makeVector,
  Field
} from 'apache-arrow';
import type {ArrowTableFunction} from '@math.gl/sql/arrow';
import {makeGeoArrowColumnFromArrowVector} from '@math.gl/core/arrow';
import {
  materializeGeoArrowRows,
  writeWKB,
  isGeoArrowValueValid,
  type GeoArrowColumn
} from '@math.gl/core/arrow';
import type {TurfBatchResult} from './turf';

import {area, bearing, centroid, distance, length, midpoint} from './turf';
import {
  column,
  geometryTypes,
  lineKinds,
  pointInPolygon,
  pointKinds,
  polygonKinds,
  scalar,
  spatialFunction
} from './spatial-sql';
import {planarBounds} from './spatial-planar';

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
    prototypes: [
      {
        arguments: fields,
        result,
        nullHandling: 'propagate',
        evaluate(vectors, {activeRows, length}) {
          const columns = vectors.map((vector, index) => {
            const column = makeGeoArrowColumnFromArrowVector(vector, {
              field: fields[index]
            });
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
            makeData({
              type: result.type,
              data: values,
              length,
              nullBitmap: validity,
              nullCount
            } as any)
          );
        }
      }
    ]
  };
}

/** Returns the first geometry from a single-row Turf batch as GeoArrow WKB. */
function geometryResult(result: GeoArrowColumn): Uint8Array | null {
  const [geometry] = materializeGeoArrowRows(result);
  return geometry ? writeWKB(geometry, 'xy') : null;
}

/** Returns great-circle point distance in kilometers. */
export const TURF_DISTANCE = /* @__PURE__ */ spatialFunction(
  'TURF_DISTANCE',
  [pointKinds, pointKinds],
  /* @__PURE__ */ new Float64(),
  ([a, b]) => scalar(distance(column(a!), column(b!)))
);

/** Returns initial great-circle bearing in degrees. */
export const TURF_BEARING = /* @__PURE__ */ spatialFunction(
  'TURF_BEARING',
  [pointKinds, pointKinds],
  /* @__PURE__ */ new Float64(),
  ([a, b]) => scalar(bearing(column(a!), column(b!)))
);

/** Returns spherical polygon area in square meters. */
export const TURF_AREA = /* @__PURE__ */ spatialFunction(
  'TURF_AREA',
  [polygonKinds],
  /* @__PURE__ */ new Float64(),
  ([geometry]) => scalar(area(column(geometry!)))
);

/** Returns great-circle line length in kilometers. */
export const TURF_LENGTH = /* @__PURE__ */ spatialFunction(
  'TURF_LENGTH',
  [lineKinds],
  /* @__PURE__ */ new Float64(),
  ([geometry]) => scalar(length(column(geometry!)))
);

/** Returns the Turf vertex-mean centroid as GeoArrow WKB. */
export const TURF_CENTROID = /* @__PURE__ */ spatialFunction(
  'TURF_CENTROID',
  [geometryTypes],
  /* @__PURE__ */ new Binary(),
  ([geometry]) => geometryResult(centroid(column(geometry!)))
);

/** Returns the Turf great-circle midpoint as GeoArrow WKB. */
export const TURF_MIDPOINT = /* @__PURE__ */ spatialFunction(
  'TURF_MIDPOINT',
  [pointKinds, pointKinds],
  /* @__PURE__ */ new Binary(),
  ([a, b]) => geometryResult(midpoint(column(a!), column(b!)))
);

/** Returns [minX, minY, maxX, maxY] per geometry. */
export const TURF_BBOX = /* @__PURE__ */ spatialFunction(
  'TURF_BBOX',
  [geometryTypes],
  /* @__PURE__ */ new FixedSizeList(
    4,
    /* @__PURE__ */ new Field('value', /* @__PURE__ */ new Float64(), false)
  ),
  ([geometry]) => planarBounds(geometry!)
);

/** Tests whether a point is in a polygon, including its boundary, with Turf argument order. */
export const TURF_BOOLEAN_POINT_IN_POLYGON = /* @__PURE__ */ spatialFunction(
  'TURF_BOOLEAN_POINT_IN_POLYGON',
  [pointKinds, polygonKinds],
  /* @__PURE__ */ new Bool(),
  ([point, polygon]) => pointInPolygon(point!, polygon!)
);

/** Opt-in SQL declarations for the initial row-preserving Turf function library. */
export const TURF_FUNCTIONS: readonly ArrowTableFunction[] = /* @__PURE__ */ Object.freeze([
  TURF_DISTANCE,
  TURF_BEARING,
  TURF_AREA,
  TURF_LENGTH,
  TURF_CENTROID,
  TURF_MIDPOINT,
  TURF_BBOX,
  TURF_BOOLEAN_POINT_IN_POLYGON
]);
