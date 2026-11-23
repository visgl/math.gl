// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Binary,
  DataType,
  Field,
  Float64,
  vectorFromArray,
  type Bool,
  type FixedSizeList,
  type Int32,
  type Utf8,
  type Vector
} from 'apache-arrow';
import type {ScalarFunction} from '@math.gl/sql/arrow';
import {
  GeoArrowBuilder,
  getGeoArrowFieldInfo,
  makeArrowVectorFromGeoArrowColumn,
  isGeoArrowValueValid,
  makeGeoArrowColumnFromArrowVector,
  makeGeoArrowColumnFromGeometryRows,
  materializeGeoArrowRows,
  parseWKB,
  type GeoArrowColumn,
  type WellKnownDimension,
  type WellKnownGeometry
} from '@math.gl/core/arrow';
import {booleanPointInPolygon, type TurfBatchResult} from './turf';

/** Field metadata key for the GeoArrow encoding. */
export const EXTENSION_NAME = 'ARROW:extension:name';
/** Field metadata key for GeoArrow CRS and edge metadata. */
export const EXTENSION_METADATA = 'ARROW:extension:metadata';

/** Supported 2D native encodings and their WKB counterparts. */
export const geometryTypes = [
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon'
] as const;
/** Geometry kind discovered from a native field or a WKB row. */
type GeometryKind = WellKnownGeometry['type'];
/** Types accepted by point-only signatures. */
export const pointKinds = ['Point'] as const;
/** Linear types accepted by line-only signatures. */
export const lineKinds = ['LineString', 'MultiLineString'] as const;
/** Areal types accepted by polygon-only signatures. */
export const polygonKinds = ['Polygon', 'MultiPolygon'] as const;

/** Supported Arrow result storage for a spatial function. */
type SpatialResult = Int32 | Float64 | Bool | Binary | FixedSizeList<Float64> | Utf8;
/** Native geometry result storage and its row-aligned Arrow vector builder. */
export type NativeSpatialResult = {
  /** Extension encoding declared on the bound result field. */
  encoding: 'geoarrow.polygon' | 'geoarrow.multipolygon' | 'geoarrow.geometry';
  /** Fixed physical Arrow schema for all batches. */
  type: DataType;
  /** Packs decoded geometry rows into native coordinate buffers. */
  build: (rows: readonly (WellKnownGeometry | null)[]) => Vector;
};

/** Declares a fixed native polygon layout, including for empty or all-null batches. */
export function nativePolygonResult(
  encoding: Exclude<NativeSpatialResult['encoding'], 'geoarrow.geometry'>
): NativeSpatialResult {
  const options = {encoding, dimension: 'xy', coordinateLayout: 'interleaved'} as const;
  /** Packs the output rings into GeoArrow list offsets and interleaved XY coordinates. */
  const build: NativeSpatialResult['build'] = rows =>
    makeArrowVectorFromGeoArrowColumn(GeoArrowBuilder.build(rows, options));
  return {encoding, type: build([]).type, build};
}

/** A nullable result value passed to the Arrow vector builder. */
type SpatialValue = string | number | boolean | number[] | Uint8Array | null;

/** A decoded row with its semantic dimension for geometry-valued accessors. */
type GeometryRow = WellKnownGeometry & {
  dimension?: WellKnownDimension;
  members?: readonly Uint8Array[];
};

/** Adapts an Arrow vector to a reader which decodes only active geometry rows. */
export function readGeometryValue<T>(
  vector: Vector,
  field: Field,
  active: Uint8Array,
  value: (
    geometry: WellKnownGeometry,
    dimension: WellKnownDimension,
    members?: readonly Uint8Array[]
  ) => T,
  captureMembers = false
): (row: number) => T {
  if (DataType.isBinary(field.type) || DataType.isLargeBinary(field.type)) {
    return row => {
      const {geometry, dimension, srid, members} = parseWKB(vector.get(row) as Uint8Array, {
        captureMembers
      });
      if (srid)
        throw new Error('Use GeoArrow field metadata for CRS information instead of EWKB SRIDs');
      return value(
        geometry.type === 'Point' && geometry.coordinates.every(Number.isNaN)
          ? {type: 'Point', coordinates: []}
          : geometry,
        dimension,
        members
      );
    };
  }
  const column = readActiveGeoArrowColumn(vector, field, active);
  const geometries = materializeGeoArrowRows(column);
  return row => value(geometries[row]!, column.dimension);
}

/** Borrows native geometry buffers and overlays SQL's active-row mask when needed. */
export function readActiveGeoArrowColumn(
  vector: Vector,
  field: Field,
  active: Uint8Array
): GeoArrowColumn {
  const column = makeGeoArrowColumnFromArrowVector(vector, {field});
  let offset = 0;
  const chunks = column.chunks.map(chunk => {
    const start = offset;
    offset += chunk.length;
    let needsMask = false;
    for (let row = 0; row < chunk.length; row++) {
      if (!active[start + row] && isGeoArrowValueValid(chunk.validity, row)) {
        needsMask = true;
        break;
      }
    }
    if (!needsMask) return chunk;
    const values = new Uint8Array(Math.ceil(chunk.length / 8));
    for (let row = 0; row < chunk.length; row++) {
      if (active[start + row] && isGeoArrowValueValid(chunk.validity, row)) {
        values[row >> 3] |= 1 << (row & 7);
      }
    }
    return {...chunk, validity: {values}};
  });
  return {...column, chunks};
}

/** Enforces the planar kernels' XY-only WKB contract at evaluation time. */
export function planarGeometry(
  geometry: WellKnownGeometry,
  dimension: WellKnownDimension
): WellKnownGeometry {
  if (dimension !== 'xy') throw new Error('Spatial SQL functions require 2D geometry');
  return geometry;
}

/** Declares a row-preserving spatial overload using the input columns' GeoArrow types. */
export function spatialFunction<Value extends SpatialValue | WellKnownGeometry>(
  name: string,
  signatures: readonly (readonly GeometryKind[])[],
  output: SpatialResult | NativeSpatialResult,
  evaluate: (geometries: readonly GeometryRow[], ...numbers: number[]) => Value,
  numericArguments = 0,
  allDimensions = false,
  skipNullGeometries = false,
  validateCRS?: (crs: unknown, name: string) => void
): ScalarFunction {
  const type = 'encoding' in output ? output.type : output;
  return {
    kind: 'scalar',
    name,
    prototypes: [],
    /** Binds the allowed geometry types and result metadata to a call. */
    resolvePrototype(fields) {
      if (fields.length !== signatures.length + numericArguments) return undefined;
      const geometryFields = fields.slice(0, signatures.length);
      const numberFields = fields.slice(signatures.length).map(field => {
        if (field && !DataType.isInt(field.type) && !DataType.isFloat(field.type))
          throw new Error(`${name} requires numeric arguments`);
        return field ?? new Field('number', new Float64(), true);
      });
      const extensions = geometryFields.map((field, index) => {
        if (!field) return undefined;
        const extension = getGeoArrowFieldInfo(field);
        const encoding = extension?.encoding;
        const kinds = signatures[index]!;
        if (
          encoding === 'geoarrow.wkb' &&
          (DataType.isBinary(field.type) || DataType.isLargeBinary(field.type))
        ) {
          // WKB reveals its geometry kind and dimensionality per row.
        } else if (encoding === 'geoarrow.geometry' && extension.dimension === 'xy') {
          // Native XY union rows are checked against the input signature during evaluation.
        } else if (kinds.some(kind => encoding === 'geoarrow.' + kind.toLowerCase())) {
          if (!allDimensions && extension?.dimension !== 'xy')
            throw new Error(`${name} requires 2D geometry`);
        } else {
          throw new Error(`${name} argument ${index + 1} requires GeoArrow ${kinds.join(' or ')}`);
        }
        validateCRS?.(extension?.metadata['crs'], name);
        if (
          !validateCRS &&
          name.startsWith('ST_') &&
          name !== 'ST_SRID' &&
          name !== 'ST_SetSRID' &&
          extension?.metadata['edges'] === 'spherical'
        )
          throw new Error(`${name} requires planar geometry`);
        return extension;
      });
      const crsValues = extensions
        .map(extension => extension?.metadata['crs'])
        .filter(crs => crs !== undefined && crs !== null);
      if (
        !validateCRS &&
        name.startsWith('ST_') &&
        crsValues.some(crs => JSON.stringify(crs) !== JSON.stringify(crsValues[0]))
      ) {
        throw new Error(`${name} requires arguments in the same CRS`);
      }
      const metadata = new Map<string, string>();
      if ('encoding' in output || DataType.isBinary(type)) {
        metadata.set(EXTENSION_NAME, 'encoding' in output ? output.encoding : 'geoarrow.wkb');
        const inputMetadata = geometryFields
          .find(field => field?.metadata.has(EXTENSION_METADATA))
          ?.metadata.get(EXTENSION_METADATA);
        if (inputMetadata) metadata.set(EXTENSION_METADATA, inputMetadata);
      }
      const arguments_ = [
        ...geometryFields.map(field => field ?? new Field('geometry', new Binary(), true)),
        ...numberFields
      ];
      return {
        arguments: arguments_,
        nullHandling: skipNullGeometries ? 'call' : 'propagate',
        result: new Field(name, type, true, metadata),
        /** Evaluates active rows and retains their positions in the output batch. */
        evaluate(vectors, {activeRows, length: rowCount}) {
          const numbers = vectors.slice(signatures.length);
          const readers = vectors
            .slice(0, signatures.length)
            .map((vector, index) =>
              readGeometryValue<GeometryRow>(
                vector,
                arguments_[index]!,
                activeRows,
                allDimensions
                  ? (g, dimension, members) => ({...g, dimension, members})
                  : planarGeometry,
                name === 'ST_GeometryN'
              )
            );
          const values = new Array<Value | null>(rowCount).fill(null);
          for (let row = 0; row < rowCount; row++) {
            if (!activeRows[row]) continue;
            const geometries: WellKnownGeometry[] = [];
            for (let index = 0; index < readers.length; index++) {
              if (skipNullGeometries && !vectors[index]!.isValid(row)) continue;
              const geometry = readers[index]!(row);
              if (!signatures[index]!.includes(geometry.type))
                throw new Error(
                  `${name} argument ${index + 1} does not support ${geometry.type} at row ${row}`
                );
              geometries.push(geometry);
            }
            values[row] = evaluate(geometries, ...numbers.map(vector => Number(vector.get(row))));
          }
          return 'encoding' in output
            ? output.build(values as (WellKnownGeometry | null)[])
            : vectorFromArray(values as SpatialValue[], output);
        }
      };
    }
  };
}

/** Extracts a nonempty point coordinate pair. */
export function pointCoordinates(geometry: WellKnownGeometry): readonly number[] | null {
  return geometry.type === 'Point' &&
    Number.isFinite(geometry.coordinates[0]) &&
    Number.isFinite(geometry.coordinates[1])
    ? geometry.coordinates
    : null;
}

/** Adapts one decoded geometry to the existing Turf batch interface. */
export function column(geometry: WellKnownGeometry): GeoArrowColumn {
  return makeGeoArrowColumnFromGeometryRows([geometry], {dimension: 'xy'});
}

/** Returns the first valid scalar from a single-row Turf batch. */
export function scalar(result: TurfBatchResult<Float64Array | Uint8Array>): number | null {
  return result.validity[0]! & 1 ? result.values[0]! : null;
}

/** Reuses the Turf predicate with configurable boundary semantics. */
export function pointInPolygon(
  point: WellKnownGeometry,
  polygon: WellKnownGeometry,
  ignoreBoundary = false
): boolean | null {
  if (!pointCoordinates(point)) return null;
  const value = scalar(booleanPointInPolygon(column(point), column(polygon), {ignoreBoundary}));
  return value === null ? null : value === 1;
}
