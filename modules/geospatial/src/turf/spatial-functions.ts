// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Binary,
  Bool,
  DataType,
  Field,
  FixedSizeList,
  Float64,
  vectorFromArray,
  type Vector
} from 'apache-arrow';
import type {ArrowTableFunction, ScalarFunction} from '@math.gl/sql/arrow';
import {
  getGeoArrowFieldInfo,
  isGeoArrowValueValid,
  makeGeoArrowColumnFromArrowVector,
  makeGeoArrowColumnFromGeometryRows,
  materializeGeoArrowRows,
  parseWKB,
  writeWKB,
  type GeoArrowColumn,
  type WellKnownGeometry
} from '@math.gl/core/arrow';
import {
  area,
  bearing,
  booleanPointInPolygon,
  centroid,
  distance,
  length,
  midpoint,
  type TurfBatchResult
} from '../turf';
import {planarArea, planarBounds, planarCentroid, planarEnvelope, planarLength} from './planar';

/** Field metadata key for the GeoArrow encoding. */
const EXTENSION_NAME = 'ARROW:extension:name';
/** Field metadata key for GeoArrow CRS and edge metadata. */
const EXTENSION_METADATA = 'ARROW:extension:metadata';

/** Supported 2D native encodings and their WKB counterparts. */
const geometryTypes = [
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
const pointKinds = ['Point'] as const;
/** Linear types accepted by line-only signatures. */
const lineKinds = ['LineString', 'MultiLineString'] as const;
/** Areal types accepted by polygon-only signatures. */
const polygonKinds = ['Polygon', 'MultiPolygon'] as const;

/** Supported Arrow result storage for a spatial function. */
type SpatialResult = Float64 | Bool | Binary | FixedSizeList<Float64>;
/** A nullable result value passed to the Arrow vector builder. */
type SpatialValue = number | boolean | number[] | Uint8Array | null;

/** Adapts an Arrow vector to a reader which decodes only active geometry rows. */
function readGeometry(
  vector: Vector,
  field: Field,
  active: Uint8Array
): (row: number) => WellKnownGeometry {
  if (field.metadata.get(EXTENSION_NAME) === 'geoarrow.wkb') {
    return row => {
      const {geometry, dimension, srid} = parseWKB(vector.get(row) as Uint8Array);
      if (dimension !== 'xy') throw new Error('Spatial SQL functions require 2D geometry');
      if (srid)
        throw new Error('Use GeoArrow field metadata for CRS information instead of EWKB SRIDs');
      return geometry.type === 'Point' && geometry.coordinates.every(Number.isNaN)
        ? {type: 'Point', coordinates: []}
        : geometry;
    };
  }
  const column = makeGeoArrowColumnFromArrowVector(vector, {field});
  let offset = 0;
  const chunks = column.chunks.map(chunk => {
    const values = new Uint8Array(Math.ceil(chunk.length / 8));
    for (let row = 0; row < chunk.length; row++) {
      if (active[offset + row] && isGeoArrowValueValid(chunk.validity, row)) {
        values[row >> 3] |= 1 << (row & 7);
      }
    }
    offset += chunk.length;
    return {...chunk, validity: {values}};
  });
  const geometries = materializeGeoArrowRows({...column, chunks});
  return row => geometries[row]!;
}

/** Declares a row-preserving spatial overload using the input columns' GeoArrow types. */
function spatialFunction(
  name: string,
  signatures: readonly (readonly GeometryKind[])[],
  type: SpatialResult,
  evaluate: (geometries: readonly WellKnownGeometry[]) => SpatialValue
): ScalarFunction {
  return {
    kind: 'scalar',
    name,
    prototypes: [],
    /** Binds the allowed geometry types and result metadata to a call. */
    resolvePrototype(fields) {
      if (fields.length !== signatures.length) return undefined;
      const extensions = fields.map((field, index) => {
        if (!field) return undefined;
        const extension = getGeoArrowFieldInfo(field);
        const encoding = extension?.encoding;
        const kinds = signatures[index]!;
        if (
          encoding === 'geoarrow.wkb' &&
          (DataType.isBinary(field.type) || DataType.isLargeBinary(field.type))
        ) {
          // WKB reveals its geometry kind and dimensionality per row.
        } else if (kinds.some(kind => encoding === 'geoarrow.' + kind.toLowerCase())) {
          if (extension?.dimension !== 'xy') throw new Error(`${name} requires 2D geometry`);
        } else {
          throw new Error(`${name} argument ${index + 1} requires GeoArrow ${kinds.join(' or ')}`);
        }
        if (name.startsWith('ST_') && extension?.metadata['edges'] === 'spherical')
          throw new Error(`${name} requires planar geometry`);
        return extension;
      });
      const crsValues = extensions
        .map(extension => extension?.metadata['crs'])
        .filter(crs => crs !== undefined && crs !== null);
      if (
        name.startsWith('ST_') &&
        crsValues.some(crs => JSON.stringify(crs) !== JSON.stringify(crsValues[0]))
      ) {
        throw new Error(`${name} requires arguments in the same CRS`);
      }
      const metadata = new Map<string, string>();
      if (DataType.isBinary(type)) {
        metadata.set(EXTENSION_NAME, 'geoarrow.wkb');
        const inputMetadata = fields[0]?.metadata.get(EXTENSION_METADATA);
        if (inputMetadata) metadata.set(EXTENSION_METADATA, inputMetadata);
      }
      const arguments_ = fields.map(field => field ?? new Field('geometry', new Binary(), true));
      return {
        arguments: arguments_,
        result: new Field(name, type, true, metadata),
        /** Evaluates active rows and retains their positions in the output batch. */
        evaluate(vectors, {activeRows, length: rowCount}) {
          const readers = vectors.map((vector, index) =>
            readGeometry(vector, arguments_[index]!, activeRows)
          );
          const values = new Array<SpatialValue>(rowCount).fill(null);
          for (let row = 0; row < rowCount; row++) {
            if (!activeRows[row]) continue;
            const geometries = readers.map((read, index) => {
              const geometry = read(row);
              if (!signatures[index]!.includes(geometry.type))
                throw new Error(
                  `${name} argument ${index + 1} does not support ${geometry.type} at row ${row}`
                );
              return geometry;
            });
            values[row] = evaluate(geometries);
          }
          return vectorFromArray(values, type);
        }
      };
    }
  };
}

/** Extracts a nonempty point coordinate pair. */
function pointCoordinates(geometry: WellKnownGeometry): readonly number[] | null {
  return geometry.type === 'Point' &&
    Number.isFinite(geometry.coordinates[0]) &&
    Number.isFinite(geometry.coordinates[1])
    ? geometry.coordinates
    : null;
}

/** Adapts one decoded geometry to the existing Turf batch interface. */
function column(geometry: WellKnownGeometry): GeoArrowColumn {
  return makeGeoArrowColumnFromGeometryRows([geometry], {dimension: 'xy'});
}

/** Returns the first valid scalar from a single-row Turf batch. */
function scalar(result: TurfBatchResult<Float64Array | Uint8Array>): number | null {
  return result.validity[0]! & 1 ? result.values[0]! : null;
}

/** Returns the first geometry from a single-row Turf batch as GeoArrow WKB. */
function geometryResult(result: GeoArrowColumn): Uint8Array | null {
  const [geometry] = materializeGeoArrowRows(result);
  return geometry ? writeWKB(geometry, 'xy') : null;
}

/** Reuses the Turf predicate with configurable boundary semantics. */
function pointInPolygon(
  point: WellKnownGeometry,
  polygon: WellKnownGeometry,
  ignoreBoundary = false
): boolean | null {
  if (!pointCoordinates(point)) return null;
  const value = scalar(booleanPointInPolygon(column(point), column(polygon), {ignoreBoundary}));
  return value === null ? null : value === 1;
}

/** X coordinate for the supported 2D geometry signature. */
export const ST_X = /* @__PURE__ */ spatialFunction(
  'ST_X',
  [pointKinds],
  /* @__PURE__ */ new Float64(),
  ([p]) => pointCoordinates(p!)?.[0] ?? null
);

/** Y coordinate for the supported 2D geometry signature. */
export const ST_Y = /* @__PURE__ */ spatialFunction(
  'ST_Y',
  [pointKinds],
  /* @__PURE__ */ new Float64(),
  ([p]) => pointCoordinates(p!)?.[1] ?? null
);

/** First vertex for the supported 2D geometry signature. */
export const ST_STARTPOINT = /* @__PURE__ */ spatialFunction(
  'ST_StartPoint',
  [['LineString']],
  /* @__PURE__ */ new Binary(),
  ([line]) => {
    if (line?.type !== 'LineString' || !line.coordinates.length) return null;
    return writeWKB({type: 'Point', coordinates: line.coordinates[0]!}, 'xy');
  }
);

/** Last vertex for the supported 2D geometry signature. */
export const ST_ENDPOINT = /* @__PURE__ */ spatialFunction(
  'ST_EndPoint',
  [['LineString']],
  /* @__PURE__ */ new Binary(),
  ([line]) => {
    if (line?.type !== 'LineString' || !line.coordinates.length) return null;
    return writeWKB(
      {type: 'Point', coordinates: line.coordinates[line.coordinates.length - 1]!},
      'xy'
    );
  }
);

/** Tests whether a point is in a polygon's interior. */
export const ST_CONTAINS = /* @__PURE__ */ spatialFunction(
  'ST_Contains',
  [polygonKinds, pointKinds],
  /* @__PURE__ */ new Bool(),
  ([polygon, point]) => pointInPolygon(point!, polygon!, true) ?? false
);

/** Tests whether a point is in a polygon's interior or boundary. */
export const ST_COVERS = /* @__PURE__ */ spatialFunction(
  'ST_Covers',
  [polygonKinds, pointKinds],
  /* @__PURE__ */ new Bool(),
  ([polygon, point]) => pointInPolygon(point!, polygon!) ?? false
);

/** Returns 2D Cartesian point-to-point distance in coordinate units. */
export const ST_DISTANCE = /* @__PURE__ */ spatialFunction(
  'ST_Distance',
  [pointKinds, pointKinds],
  /* @__PURE__ */ new Float64(),
  ([a, b]) => {
    const p = pointCoordinates(a!);
    const q = pointCoordinates(b!);
    return p && q ? Math.hypot(q[0]! - p[0]!, q[1]! - p[1]!) : null;
  }
);

/** Returns clockwise azimuth from positive Y in radians. */
export const ST_AZIMUTH = /* @__PURE__ */ spatialFunction(
  'ST_Azimuth',
  [pointKinds, pointKinds],
  /* @__PURE__ */ new Float64(),
  ([a, b]) => {
    const p = pointCoordinates(a!);
    const q = pointCoordinates(b!);
    if (!p || !q) return null;
    const dx = q[0]! - p[0]!;
    const dy = q[1]! - p[1]!;
    if (!dx && !dy) return null;
    const angle = Math.atan2(dx, dy);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }
);

/** Returns planar polygonal area, or zero for non-areal input. */
export const ST_AREA = /* @__PURE__ */ spatialFunction(
  'ST_Area',
  [geometryTypes],
  /* @__PURE__ */ new Float64(),
  ([geometry]) => planarArea(geometry!)
);

/** Returns planar linear length, or zero for non-linear input. */
export const ST_LENGTH = /* @__PURE__ */ spatialFunction(
  'ST_Length',
  [geometryTypes],
  /* @__PURE__ */ new Float64(),
  ([geometry]) => planarLength(geometry!)
);

/** Returns a geometry's 2D center of mass as GeoArrow WKB. */
export const ST_CENTROID = /* @__PURE__ */ spatialFunction(
  'ST_Centroid',
  [geometryTypes],
  /* @__PURE__ */ new Binary(),
  ([geometry]) => writeWKB(planarCentroid(geometry!), 'xy')
);

/** Returns the 2D extent as GeoArrow WKB. */
export const ST_ENVELOPE = /* @__PURE__ */ spatialFunction(
  'ST_Envelope',
  [[...geometryTypes, 'GeometryCollection']],
  /* @__PURE__ */ new Binary(),
  ([geometry]) => writeWKB(planarEnvelope(geometry!), 'xy')
);

/** Opt-in PostGIS-aligned 2D geometry functions for the Arrow SQL function list. */
export const POSTGIS_SPATIAL_FUNCTIONS: readonly ArrowTableFunction[] =
  /* @__PURE__ */ Object.freeze([
    ST_X,
    ST_Y,
    ST_STARTPOINT,
    ST_ENDPOINT,
    ST_CONTAINS,
    ST_COVERS,
    ST_DISTANCE,
    ST_AZIMUTH,
    ST_AREA,
    ST_LENGTH,
    ST_CENTROID,
    ST_ENVELOPE
  ]);

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
