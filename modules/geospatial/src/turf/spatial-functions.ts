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
  Int32,
  Utf8,
  vectorFromArray,
  type Vector
} from 'apache-arrow';
import type {AggregateFunction, ArrowTableFunction, ScalarFunction} from '@math.gl/sql/arrow';
import {
  getGeoArrowFieldInfo,
  isGeoArrowValueValid,
  makeGeoArrowColumnFromArrowVector,
  makeGeoArrowColumnFromGeometryRows,
  materializeGeoArrowRows,
  parseWKB,
  writeWKB,
  type GeoArrowColumn,
  type WellKnownDimension,
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
import {planarIntersects} from './planar-intersects';
import {lineLocatePoint, lineSubstring} from './linear-referencing';
import {normalizeCRSIdentifier} from '../crs/crs-identifier';
import {EPSG3857ToLngLat, EPSG4326ToEPSG3857} from '../web-mercator/mercator-meters';
import {vertexCount, memberCount, geometryMember} from './geometry-inspection';
import {reduceLineVertices} from './line-simplification';
import {collectPair, makeLine} from './geometry-constructors';
import {EPSG3857_HALF_CIRCUMFERENCE} from '../web-mercator/mercator-meters';
import {
  planarArea,
  planarBounds,
  planarCentroid,
  planarEnvelope,
  planarLength,
  planarPolygonPointOnSurface
} from './planar';

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
type SpatialResult = Int32 | Float64 | Bool | Binary | FixedSizeList<Float64> | Utf8;
/** A nullable result value passed to the Arrow vector builder. */
type SpatialValue = string | number | boolean | number[] | Uint8Array | null;

/** A decoded row with its semantic dimension for geometry-valued accessors. */
type GeometryRow = WellKnownGeometry & {
  dimension?: WellKnownDimension;
  members?: readonly Uint8Array[];
};

/** Adapts an Arrow vector to a reader which decodes only active geometry rows. */
function readGeometryValue<T>(
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
  return row => value(geometries[row]!, column.dimension);
}

/** Enforces the planar kernels' XY-only WKB contract at evaluation time. */
function planarGeometry(
  geometry: WellKnownGeometry,
  dimension: WellKnownDimension
): WellKnownGeometry {
  if (dimension !== 'xy') throw new Error('Spatial SQL functions require 2D geometry');
  return geometry;
}

/** Declares a row-preserving spatial overload using the input columns' GeoArrow types. */
function spatialFunction(
  name: string,
  signatures: readonly (readonly GeometryKind[])[],
  type: SpatialResult,
  evaluate: (geometries: readonly GeometryRow[], ...numbers: number[]) => SpatialValue,
  numericArguments = 0,
  allDimensions = false,
  skipNullGeometries = false
): ScalarFunction {
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
        } else if (kinds.some(kind => encoding === 'geoarrow.' + kind.toLowerCase())) {
          if (!allDimensions && extension?.dimension !== 'xy')
            throw new Error(`${name} requires 2D geometry`);
        } else {
          throw new Error(`${name} argument ${index + 1} requires GeoArrow ${kinds.join(' or ')}`);
        }
        if (
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
        name.startsWith('ST_') &&
        crsValues.some(crs => JSON.stringify(crs) !== JSON.stringify(crsValues[0]))
      ) {
        throw new Error(`${name} requires arguments in the same CRS`);
      }
      const metadata = new Map<string, string>();
      if (DataType.isBinary(type)) {
        metadata.set(EXTENSION_NAME, 'geoarrow.wkb');
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
          const values = new Array<SpatialValue>(rowCount).fill(null);
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
          return vectorFromArray(values, type);
        }
      };
    }
  };
}

/** Constructs XY, XYZ, or XYZM points from numeric ordinates. */
export const ST_MAKEPOINT: ScalarFunction = {
  kind: 'scalar',
  name: 'ST_MakePoint',
  prototypes: [],
  /** Binds two to four numeric ordinate fields and declares a WKB result. */
  resolvePrototype(fields) {
    if (fields.length < 2 || fields.length > 4) return undefined;
    const arguments_ = fields.map(field => {
      if (field && !DataType.isInt(field.type) && !DataType.isFloat(field.type))
        throw new Error('ST_MakePoint requires numeric coordinates');
      return field ?? new Field('coordinate', new Float64(), true);
    });
    const type = new Binary();
    return {
      arguments: arguments_,
      result: new Field('ST_MakePoint', type, true, new Map([[EXTENSION_NAME, 'geoarrow.wkb']])),
      /** Writes one point per active row, retaining nulls in all other rows. */
      evaluate(vectors, {activeRows, length}) {
        const values = new Array<Uint8Array | null>(length).fill(null);
        for (let row = 0; row < length; row++) {
          if (activeRows[row]) {
            const coordinates = vectors.map(vector => Number(vector.get(row)));
            values[row] = writeWKB({type: 'Point', coordinates});
          }
        }
        return vectorFromArray(values, type);
      }
    };
  }
};

/** Computes a closed XYZ tile polygon, clipping a fractional margin to the root extent. */
function tileEnvelope(
  zoom: number,
  x: number,
  y: number,
  bounds: readonly number[],
  margin: number
): Uint8Array {
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > 31)
    throw new Error('ST_TileEnvelope zoom must be an integer in [0,31]');
  const count = 2 ** zoom;
  if (![x, y].every(index => Number.isInteger(index) && index >= 0 && index < count))
    throw new Error('ST_TileEnvelope tile index outside zoom level');
  if (!Number.isFinite(margin) || margin < -0.5) throw new Error('Invalid ST_TileEnvelope margin');
  const [west, south, east, north] = bounds as [number, number, number, number];
  const width = (east - west) / count,
    height = (north - south) / count;
  if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)))
    throw new Error('ST_TileEnvelope requires nondegenerate bounds');
  const fullWidth = 1 + 2 * margin > count;
  const left = fullWidth ? west : Math.max(west, west + (x - margin) * width);
  const right = fullWidth ? east : Math.min(east, west + (x + 1 + margin) * width);
  const bottom = Math.max(south, north - (y + 1 + margin) * height);
  const top = Math.min(north, north - (y - margin) * height);
  return writeWKB(
    {
      type: 'Polygon',
      coordinates: [
        [
          [left, bottom],
          [left, top],
          [right, top],
          [right, bottom],
          [left, bottom]
        ]
      ]
    },
    'xy'
  );
}

/** Constructs an XYZ tile polygon in Web Mercator or a supplied root geometry's CRS. */
export const ST_TILEENVELOPE: ScalarFunction = {
  kind: 'scalar',
  name: 'ST_TileEnvelope',
  prototypes: [],
  /** Binds numeric tile indices and the optional GeoArrow root extent. */
  resolvePrototype(fields) {
    if (fields.length < 3 || fields.length > 5) return undefined;
    const custom = fields.length >= 4;
    const root = fields[3];
    if (custom) ST_ENVELOPE.resolvePrototype!([root]);
    const args = fields.map((field, i) => {
      if (i === 3) return field ?? new Field('bounds', new Binary(), true);
      if (field && !DataType.isInt(field.type) && !DataType.isFloat(field.type))
        throw new Error('ST_TileEnvelope requires numeric indices and margin');
      return field ?? new Field('number', new Float64(), true);
    });
    const metadata = new Map([[EXTENSION_NAME, 'geoarrow.wkb']]);
    const crs = custom
      ? root?.metadata.get(EXTENSION_METADATA)
      : '{"crs_type":"authority_code","crs":"EPSG:3857"}';
    if (crs) metadata.set(EXTENSION_METADATA, crs);
    const type = new Binary();
    const r = EPSG3857_HALF_CIRCUMFERENCE;
    const world = [-r, -r, r, r];
    return {
      arguments: args,
      result: new Field('ST_TileEnvelope', type, true, metadata),
      /** Computes bounds for active rows using the top-left XYZ origin. */
      evaluate(vectors, {activeRows, length}) {
        const values = new Array<Uint8Array | null>(length).fill(null);
        const read = root
          ? readGeometryValue(vectors[3]!, root, activeRows, planarGeometry)
          : undefined;
        for (let row = 0; row < length; row++) {
          if (!activeRows[row]) continue;
          const bounds = read ? planarBounds(read(row)) : world;
          if (!bounds) throw new Error('ST_TileEnvelope requires nonempty bounds');
          values[row] = tileEnvelope(
            Number(vectors[0]!.get(row)),
            Number(vectors[1]!.get(row)),
            Number(vectors[2]!.get(row)),
            bounds,
            vectors[4] ? Number(vectors[4].get(row)) : 0
          );
        }
        return vectorFromArray(values, type);
      }
    };
  }
};

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

/** Binds a point accessor while preserving the semantic distinction between Z and M. */
function pointOrdinate(ordinate: 'x' | 'y' | 'z' | 'm'): ScalarFunction {
  const name = 'ST_' + ordinate.toUpperCase();
  return {
    kind: 'scalar',
    name,
    prototypes: [],
    /** Accepts native Points or WKB whose geometry kind is checked per active row. */
    resolvePrototype(fields) {
      if (fields.length !== 1) return undefined;
      const field =
        fields[0] ??
        new Field('point', new Binary(), true, new Map([[EXTENSION_NAME, 'geoarrow.wkb']]));
      const extension = getGeoArrowFieldInfo(field);
      if (extension?.metadata['edges'] === 'spherical')
        throw new Error(`${name} requires planar geometry`);
      const encoding = extension?.encoding;
      if (
        encoding !== 'geoarrow.point' &&
        !(
          encoding === 'geoarrow.wkb' &&
          (DataType.isBinary(field.type) || DataType.isLargeBinary(field.type))
        )
      )
        throw new Error(`${name} requires a GeoArrow Point`);
      const type = new Float64();
      return {
        arguments: [field],
        result: new Field(name, type, true),
        /** Extracts ordinates using the WKB row or native field dimension. */
        evaluate([vector], {length, activeRows}) {
          const read = readGeometryValue(vector!, field, activeRows, (geometry, dimension) => {
            if (geometry.type !== 'Point') throw new Error(`${name} requires a Point`);
            return pointCoordinates(geometry)?.[dimension.indexOf(ordinate)] ?? null;
          });
          return vectorFromArray(
            Array.from({length}, (_, i) => (activeRows[i] ? read(i) : null)),
            type
          );
        }
      };
    }
  };
}

/** X coordinate of a point. */
export const ST_X = /* @__PURE__ */ pointOrdinate('x');
/** Y coordinate of a point. */
export const ST_Y = /* @__PURE__ */ pointOrdinate('y');
/** Elevation of a point with a Z ordinate. */
export const ST_Z = /* @__PURE__ */ pointOrdinate('z');
/** Measure of a point with an M ordinate. */
export const ST_M = /* @__PURE__ */ pointOrdinate('m');

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

/** Interior only for the supported 2D geometry signature. */
export const ST_WITHIN = /* @__PURE__ */ spatialFunction(
  'ST_Within',
  [pointKinds, polygonKinds],
  /* @__PURE__ */ new Bool(),
  ([p, polygon]) => pointInPolygon(p!, polygon!, true) ?? false
);

/** Interior or boundary for the supported 2D geometry signature. */
export const ST_COVEREDBY = /* @__PURE__ */ spatialFunction(
  'ST_CoveredBy',
  [pointKinds, polygonKinds],
  /* @__PURE__ */ new Bool(),
  ([p, polygon]) => pointInPolygon(p!, polygon!) ?? false
);

/** Returns a LineString vertex by signed one-based position. */
export const ST_POINTN = /* @__PURE__ */ spatialFunction(
  'ST_PointN',
  [['LineString']],
  /* @__PURE__ */ new Binary(),
  ([line], position) => {
    if (!Number.isInteger(position)) throw new Error('ST_PointN requires an integer position');
    if (line?.type !== 'LineString' || !position) return null;
    const index = position > 0 ? position - 1 : line.coordinates.length + position;
    const coordinates = line.coordinates[index];
    return coordinates ? writeWKB({type: 'Point', coordinates}, 'xy') : null;
  },
  1
);

/** Constructs a closed rectangular polygon in an unspecified coordinate system. */
export const ST_MAKEENVELOPE = /* @__PURE__ */ spatialFunction(
  'ST_MakeEnvelope',
  [],
  /* @__PURE__ */ new Binary(),
  (_, xmin, ymin, xmax, ymax) =>
    writeWKB(
      {
        type: 'Polygon',
        coordinates: [
          [
            [xmin, ymin],
            [xmin, ymax],
            [xmax, ymax],
            [xmax, ymin],
            [xmin, ymin]
          ]
        ]
      },
      'xy'
    ),
  4
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

/** Tests an inclusive planar radius in the coordinate units of two points. */
export const ST_DWITHIN = /* @__PURE__ */ spatialFunction(
  'ST_DWithin',
  [pointKinds, pointKinds],
  /* @__PURE__ */ new Bool(),
  ([a, b], radius) => {
    if (radius! < 0) throw new Error('ST_DWithin distance must be nonnegative');
    const p = pointCoordinates(a!);
    const q = pointCoordinates(b!);
    return Boolean(p && q && Math.hypot(q[0]! - p[0]!, q[1]! - p[1]!) <= radius!);
  },
  1
);

/** Tests whether two planar geometries share any point, including their boundaries. */
export const ST_INTERSECTS = /* @__PURE__ */ spatialFunction(
  'ST_Intersects',
  [
    [...geometryTypes, 'GeometryCollection'],
    [...geometryTypes, 'GeometryCollection']
  ],
  /* @__PURE__ */ new Bool(),
  ([a, b]) => planarIntersects(a!, b!)
);

/** Interpolates a point at a fraction of the planar length. */
export const ST_LINEINTERPOLATEPOINT = /* @__PURE__ */ spatialFunction(
  'ST_LineInterpolatePoint',
  [['LineString']],
  /* @__PURE__ */ new Binary(),
  ([line], fraction) =>
    writeWKB(lineSubstring(line!, fraction!, fraction!) ?? {type: 'Point', coordinates: []}, 'xy'),
  1
);

/** Locates the closest point along a route, measured as a fraction of total length. */
export const ST_LINELOCATEPOINT = /* @__PURE__ */ spatialFunction(
  'ST_LineLocatePoint',
  [['LineString'], pointKinds],
  /* @__PURE__ */ new Float64(),
  ([line, point]) => lineLocatePoint(line!, point!)
);

/** Extracts a route section between two inclusive fractions of the planar length. */
export const ST_LINESUBSTRING = /* @__PURE__ */ spatialFunction(
  'ST_LineSubstring',
  [['LineString']],
  /* @__PURE__ */ new Binary(),
  ([line], start, end) => {
    const result = lineSubstring(line!, start!, end!);
    return result ? writeWKB(result, 'xy') : null;
  },
  2
);

/** Extracts an EPSG code from a GeoArrow authority identifier or a PROJJSON root ID. */
function geometrySRID(crs: unknown): number {
  let identifier = typeof crs === 'string' ? normalizeCRSIdentifier(crs) : '';
  if (crs && typeof crs === 'object' && 'id' in crs) {
    const id = crs.id;
    if (
      id &&
      typeof id === 'object' &&
      'authority' in id &&
      'code' in id &&
      id.authority === 'EPSG'
    )
      identifier = 'EPSG:' + String(id.code);
  }
  return /^EPSG:\d+$/.test(identifier) ? Number(identifier.slice(5)) : 0;
}

/** Applies a planar coordinate conversion throughout a multipart or collection geometry. */
function projectGeometry(
  geometry: WellKnownGeometry,
  project: (p: readonly number[]) => number[]
): WellKnownGeometry {
  const path = (points: readonly (readonly number[])[]) => points.map(project);
  switch (geometry.type) {
    case 'Point':
      return {
        type: 'Point',
        coordinates:
          geometry.coordinates.length && !geometry.coordinates.every(Number.isNaN)
            ? project(geometry.coordinates)
            : []
      };
    case 'MultiPoint':
      return {
        type: 'MultiPoint',
        coordinates: geometry.coordinates.map(p =>
          !p.length || p.every(Number.isNaN) ? p : project(p)
        )
      };
    case 'LineString':
      return {type: 'LineString', coordinates: path(geometry.coordinates)};
    case 'MultiLineString':
    case 'Polygon':
      return {type: geometry.type, coordinates: geometry.coordinates.map(path)};
    case 'MultiPolygon':
      return {type: 'MultiPolygon', coordinates: geometry.coordinates.map(poly => poly.map(path))};
    case 'GeometryCollection':
      return {
        type: 'GeometryCollection',
        geometries: geometry.geometries.map(child => projectGeometry(child, project))
      };
  }
}

/** Binds a single output CRS for the entire Arrow field, including empty batches. */
function crsFunction(name: 'ST_SRID' | 'ST_SetSRID' | 'ST_Transform'): ScalarFunction {
  const read = name === 'ST_SRID';
  return {
    kind: 'scalar',
    name,
    prototypes: [],
    /** Resolves the source from field metadata and the target from the SQL literal. */
    resolvePrototype(fields, literals) {
      if (fields.length !== (read ? 1 : 2)) return undefined;
      const metadata = fields[0] && getGeoArrowFieldInfo(fields[0])?.metadata;
      const source = geometrySRID(metadata?.['crs']);
      const target = literals?.[1] ?? 0;
      if (
        !read &&
        (literals?.[1] === undefined ||
          !Number.isSafeInteger(target) ||
          target < 0 ||
          target > 998999)
      )
        throw new Error(name + ' requires a constant integer SRID between 0 and 998999');
      if (
        name === 'ST_Transform' &&
        (![4326, 3857].includes(source) || ![4326, 3857].includes(target))
      )
        throw new Error('ST_Transform supports EPSG:4326 and EPSG:3857 source and target CRS');
      const implementation = spatialFunction(
        name,
        [[...geometryTypes, 'GeometryCollection']],
        read ? new Int32() : new Binary(),
        ([geometry]) => {
          if (read) return source;
          const output =
            name === 'ST_Transform' && source !== target
              ? projectGeometry(geometry!, p =>
                  target === 3857
                    ? EPSG4326ToEPSG3857([...p], {clampLatitude: false})
                    : EPSG3857ToLngLat([...p])
                )
              : geometry!;
          return writeWKB(output, 'xy');
        },
        read ? 0 : 1
      ).resolvePrototype!(fields)!;
      if (!read) {
        const crsMetadata = {...metadata};
        delete crsMetadata['crs_type'];
        delete crsMetadata['crs'];
        if (target) Object.assign(crsMetadata, {crs_type: 'authority_code', crs: 'EPSG:' + target});
        implementation.result.metadata.set(EXTENSION_METADATA, JSON.stringify(crsMetadata));
      }
      return implementation;
    }
  };
}

/** Returns the field EPSG code, or zero for an unidentified CRS. */
export const ST_SRID = /* @__PURE__ */ crsFunction('ST_SRID');
/** Assigns a CRS to a geometry column, preserving its coordinate values. */
export const ST_SETSRID = /* @__PURE__ */ crsFunction('ST_SetSRID');
/** Reprojects a planar geometry column between geographic and Web Mercator coordinates. */
export const ST_TRANSFORM = /* @__PURE__ */ crsFunction('ST_Transform');

/** Declares a geometry-valued line reduction with an optional default tolerance. */
function lineReduction(name: string, mode: 'simplify' | 'removeRepeated'): ScalarFunction {
  return {
    kind: 'scalar',
    name,
    prototypes: [],
    /** Binds the geometry and any supplied numeric tolerance. */
    resolvePrototype(fields) {
      const numericArguments = mode === 'removeRepeated' && fields.length === 1 ? 0 : 1;
      return spatialFunction(
        name,
        [lineKinds],
        new Binary(),
        ([line], tolerance = 0) => {
          const result = reduceLineVertices(line!, tolerance, mode);
          return result ? writeWKB(result, 'xy') : null;
        },
        numericArguments
      ).resolvePrototype!(fields);
    }
  };
}

/** Removes consecutive duplicate or nearby vertices. */
export const ST_REMOVEREPEATEDPOINTS = /* @__PURE__ */ lineReduction(
  'ST_RemoveRepeatedPoints',
  'removeRepeated'
);
/** Reduces route vertices with Douglas-Peucker simplification. */
export const ST_SIMPLIFY = /* @__PURE__ */ lineReduction('ST_Simplify', 'simplify');

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

/** Inspection functions also accept WKB geometry collections. */
const inspectionKinds = [[...geometryTypes, 'GeometryCollection']] as const;

/** Vertex count including polygon ring closures. */
export const ST_NPOINTS = /* @__PURE__ */ spatialFunction(
  'ST_NPoints',
  inspectionKinds,
  /* @__PURE__ */ new Int32(),
  ([g]) => vertexCount(g!),
  0,
  true
);

/** Number of top-level components, or zero for empty geometry. */
export const ST_NUMGEOMETRIES = /* @__PURE__ */ spatialFunction(
  'ST_NumGeometries',
  inspectionKinds,
  /* @__PURE__ */ new Int32(),
  ([g]) => memberCount(g!),
  0,
  true
);

/** Whether the geometry contains no vertices. */
export const ST_ISEMPTY = /* @__PURE__ */ spatialFunction(
  'ST_IsEmpty',
  inspectionKinds,
  /* @__PURE__ */ new Bool(),
  ([g]) => !vertexCount(g!),
  0,
  true
);

/** Geometry type name with the ST_ prefix. */
export const ST_GEOMETRYTYPE = /* @__PURE__ */ spatialFunction(
  'ST_GeometryType',
  inspectionKinds,
  /* @__PURE__ */ new Utf8(),
  ([g]) => 'ST_' + g!.type,
  0,
  true
);

/** WKB geometry containing only XY ordinates. */
export const ST_FORCE2D = /* @__PURE__ */ spatialFunction(
  'ST_Force2D',
  inspectionKinds,
  /* @__PURE__ */ new Binary(),
  ([g]) => writeWKB(g!, 'xy'),
  0,
  true
);

/** One-based component as WKB with the input dimension. */
export const ST_GEOMETRYN = /* @__PURE__ */ spatialFunction(
  'ST_GeometryN',
  inspectionKinds,
  /* @__PURE__ */ new Binary(),
  ([g], position) => {
    const part = geometryMember(g!, position!);
    return part ? (g!.members?.[position! - 1] ?? writeWKB(part, g!.dimension ?? 'xy')) : null;
  },
  1,
  true
);

/** Connects two point, multipoint or line inputs in their given order. */
export const ST_MAKELINE = /* @__PURE__ */ spatialFunction(
  'ST_MakeLine',
  [
    ['Point', 'MultiPoint', 'LineString'],
    ['Point', 'MultiPoint', 'LineString']
  ],
  /* @__PURE__ */ new Binary(),
  geometries => writeWKB(makeLine(geometries), 'xy')
);

/** Collects two geometries without dissolving or flattening them. */
export const ST_COLLECT = /* @__PURE__ */ spatialFunction(
  'ST_Collect',
  [
    [...geometryTypes, 'GeometryCollection'],
    [...geometryTypes, 'GeometryCollection']
  ],
  /* @__PURE__ */ new Binary(),
  ([a, b]) => (a ? writeWKB(b ? collectPair(a, b) : a, 'xy') : null),
  0,
  false,
  true
);

/** Returns an interior label point for a planar polygonal surface. */
export const ST_POINTONSURFACE = /* @__PURE__ */ spatialFunction(
  'ST_PointOnSurface',
  [polygonKinds],
  /* @__PURE__ */ new Binary(),
  ([polygon]) => writeWKB(planarPolygonPointOnSurface(polygon!), 'xy')
);

/** Returns the 2D extent as GeoArrow WKB. */
export const ST_ENVELOPE = /* @__PURE__ */ spatialFunction(
  'ST_Envelope',
  [[...geometryTypes, 'GeometryCollection']],
  /* @__PURE__ */ new Binary(),
  ([geometry]) => writeWKB(planarEnvelope(geometry!), 'xy')
);

/** Reduces a geometry column to its four planar bounds, ignoring null and empty rows. */
export const ST_EXTENT: AggregateFunction = {
  kind: 'aggregate',
  name: 'ST_Extent',
  /** Binds the input geometry signature and the fixed-size box result. */
  bind({arguments: fields}) {
    const field = fields[0];
    if (!field || fields.length !== 1) throw new Error('ST_Extent requires one geometry column');
    ST_ENVELOPE.resolvePrototype!([field]);
    return {
      outputField: new Field(
        'ST_Extent',
        new FixedSizeList(4, new Field('value', new Float64(), false)),
        true
      ),
      /** Creates independent bounds for this group. */
      createAccumulator() {
        let bounds: number[] | null = null;
        /** Includes a geometry or partial accumulator in the current bounds. */
        function include(box: readonly number[]) {
          if (!bounds) bounds = [...box];
          else {
            bounds[0] = Math.min(bounds[0]!, box[0]!);
            bounds[1] = Math.min(bounds[1]!, box[1]!);
            bounds[2] = Math.max(bounds[2]!, box[2]!);
            bounds[3] = Math.max(bounds[3]!, box[3]!);
          }
        }
        return {
          /** Accumulates nonempty geometry bounds from one record batch. */
          update([vector], {length}) {
            const active = Uint8Array.from({length}, (_, i) => Number(vector!.isValid(i)));
            const read = readGeometryValue(vector!, field, active, planarGeometry);
            for (let i = 0; i < length; i++) {
              if (!active[i]) continue;
              const box = planarBounds(read(i));
              if (box) include(box);
            }
          },
          /** Combines bounds from another group partition. */
          merge(partial) {
            const box = partial.finalize();
            if (Array.isArray(box)) include(box);
          },
          /** Returns a detached snapshot, or null for a group without coordinates. */
          finalize: () => bounds && [...bounds]
        };
      }
    };
  }
};

/** Opt-in PostGIS-aligned 2D geometry functions for the Arrow SQL function list. */
export const POSTGIS_SPATIAL_FUNCTIONS: readonly (ArrowTableFunction | AggregateFunction)[] =
  /* @__PURE__ */ Object.freeze([
    ST_X,
    ST_Y,
    ST_Z,
    ST_M,
    ST_STARTPOINT,
    ST_ENDPOINT,
    ST_CONTAINS,
    ST_COVERS,
    ST_WITHIN,
    ST_COVEREDBY,
    ST_POINTN,
    ST_MAKEENVELOPE,
    ST_DISTANCE,
    ST_DWITHIN,
    ST_INTERSECTS,
    ST_SRID,
    ST_SETSRID,
    ST_TRANSFORM,
    ST_REMOVEREPEATEDPOINTS,
    ST_SIMPLIFY,
    ST_AZIMUTH,
    ST_MAKEPOINT,
    ST_TILEENVELOPE,
    ST_AREA,
    ST_LENGTH,
    ST_LINEINTERPOLATEPOINT,
    ST_LINELOCATEPOINT,
    ST_LINESUBSTRING,
    ST_POINTONSURFACE,
    ST_CENTROID,
    ST_NPOINTS,
    ST_NUMGEOMETRIES,
    ST_ISEMPTY,
    ST_GEOMETRYTYPE,
    ST_FORCE2D,
    ST_GEOMETRYN,
    ST_MAKELINE,
    ST_COLLECT,
    ST_ENVELOPE,
    ST_EXTENT
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
