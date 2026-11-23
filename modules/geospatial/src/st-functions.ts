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
  vectorFromArray
} from 'apache-arrow';
import type {AggregateFunction, ArrowTableFunction, ScalarFunction} from '@math.gl/sql/arrow';
import {
  getGeoArrowFieldInfo,
  mapGeoArrowVectorCoordinates,
  getGeoArrowBounds,
  getGeoArrowRowBounds,
  getGeoArrowColumnView,
  materializeGeoArrowRows,
  visitGeoArrowCoordinates,
  makeGeoArrowColumnFromArrowVector,
  writeWKB,
  type WellKnownGeometry
} from '@math.gl/core/arrow';
import {planarIntersects} from './spatial-planar-intersects';
import {planarTouches} from './spatial-touches';
import {linesWithinDistance, pointWithinPolygonDistance} from './spatial-dwithin';
import {lineLocatePoint, lineSubstring, projectPointToLine} from './linear-referencing';
import {addMeasure, locateAlong, locateBetween, measuredDimension} from './measure-referencing';
import {normalizeCRSIdentifier} from './crs/crs-identifier';
import {EPSG3857ToLngLat, EPSG4326ToEPSG3857} from './web-mercator/mercator-meters';
import {vertexCount, memberCount, geometryMember} from './geometry-inspection';
import {reduceLineVertices} from './line-simplification';
import {simplifyPolygonTopology} from './polygon-simplification';
import {collectPair, makeLine} from './geometry-constructors';
import {EPSG3857_HALF_CIRCUMFERENCE} from './web-mercator/mercator-meters';
import {
  planarArea,
  planarBounds,
  planarCentroid,
  planarEnvelope,
  envelopeFromBounds,
  planarLength,
  planarPolygonPointOnSurface
} from './spatial-planar';

import {
  EXTENSION_METADATA,
  EXTENSION_NAME,
  geometryTypes,
  lineKinds,
  nativeGeometryResult,
  nativePointVector,
  planarGeometry,
  pointCoordinates,
  pointInPolygon,
  pointKinds,
  polygonKinds,
  readActiveGeoArrowColumn,
  readGeometryValue,
  spatialFunction
} from './spatial-sql';

/** Constructs XY, XYZ, or XYZM points from numeric ordinates. */
export const ST_MAKEPOINT: ScalarFunction = {
  kind: 'scalar',
  name: 'ST_MakePoint',
  prototypes: [],
  /** Binds two to four numeric ordinates to a native GeoArrow point. */
  resolvePrototype(fields) {
    if (fields.length < 2 || fields.length > 4) return undefined;
    const arguments_ = fields.map(field => {
      if (field && !DataType.isInt(field.type) && !DataType.isFloat(field.type))
        throw new Error('ST_MakePoint requires numeric coordinates');
      return field ?? new Field('coordinate', new Float64(), true);
    });
    const dimension = fields.length === 2 ? 'xy' : fields.length === 3 ? 'xyz' : 'xyzm';
    const coordinateType = new Float64();
    const size = fields.length;
    const type = new FixedSizeList(size, new Field(dimension, coordinateType, true));
    return {
      arguments: arguments_,
      result: new Field('ST_MakePoint', type, true, new Map([[EXTENSION_NAME, 'geoarrow.point']])),
      /** Writes active rows directly to the interleaved coordinate buffer. */
      evaluate(vectors, {activeRows, length}) {
        const data = new Float64Array(length * size);
        const nullBitmap = new Uint8Array(Math.ceil(length / 8));
        let nullCount = 0;
        for (let row = 0; row < length; row++) {
          if (!activeRows[row]) {
            nullCount++;
            continue;
          }
          nullBitmap[row >> 3]! |= 1 << (row & 7);
          for (let coordinate = 0; coordinate < size; coordinate++) {
            data[row * size + coordinate] = Number(vectors[coordinate]!.get(row));
          }
        }
        return nativePointVector(type, data, nullBitmap, nullCount);
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
          if (encoding === 'geoarrow.point') {
            const column = readActiveGeoArrowColumn(vector!, field, activeRows);
            const result = new Array<number | null>(length).fill(null);
            const index = column.dimension.indexOf(ordinate);
            if (index >= 0) {
              visitGeoArrowCoordinates(column, (coordinate, row) => {
                if (Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1])) {
                  result[row] = coordinate[index] ?? null;
                }
                return coordinate;
              });
            }
            return vectorFromArray(result, type);
          }
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

/** Geometry arguments supported by the route-snapping functions. */
const routePointKinds = ['Point', 'LineString'] as const;

/** Returns the closest pair in argument order for point/point and point/line inputs. */
function closestPair(a: WellKnownGeometry, b: WellKnownGeometry) {
  if (a.type === 'LineString' && b.type === 'LineString') {
    throw new Error('Route snapping requires at least one Point');
  }
  if (a.type === 'LineString' || b.type === 'LineString') {
    const lineFirst = a.type === 'LineString';
    const point = lineFirst ? b : a;
    const xy = pointCoordinates(point);
    const projection = projectPointToLine(lineFirst ? a : b, point);
    if (!xy || !projection) return null;
    const {coordinate, distance} = projection;
    return {start: lineFirst ? coordinate : xy, end: lineFirst ? xy : coordinate, distance};
  }
  const start = pointCoordinates(a);
  const end = pointCoordinates(b);
  return start && end
    ? {start, end, distance: Math.hypot(end[0]! - start[0]!, end[1]! - start[1]!)}
    : null;
}

/** Returns the closest point on the first geometry as a native GeoArrow point. */
export const ST_CLOSESTPOINT = /* @__PURE__ */ spatialFunction(
  'ST_ClosestPoint',
  [routePointKinds, routePointKinds],
  /* @__PURE__ */ nativeGeometryResult('geoarrow.point'),
  ([a, b]) => {
    const pair = closestPair(a!, b!);
    return pair ? {type: 'Point', coordinates: pair.start} : null;
  }
);

/** Returns the shortest segment from the first geometry to the second as a native GeoArrow line. */
export const ST_SHORTESTLINE = /* @__PURE__ */ spatialFunction(
  'ST_ShortestLine',
  [routePointKinds, routePointKinds],
  /* @__PURE__ */ nativeGeometryResult('geoarrow.linestring'),
  ([a, b]) => {
    const pair = closestPair(a!, b!);
    return pair ? {type: 'LineString', coordinates: [pair.start, pair.end]} : null;
  }
);

/** Geometry kinds accepted by the supported proximity pairings. */
const proximityKinds = [...pointKinds, ...lineKinds, ...polygonKinds];

/** Dispatches to the exact planar kernel for the two input geometry types. */
function withinDistance(a: WellKnownGeometry, b: WellKnownGeometry, radius: number): boolean {
  if (radius < 0) throw new Error('ST_DWithin distance must be nonnegative');
  if (Number.isNaN(radius)) return false;
  if (a.type === 'Point' && (b.type === 'Polygon' || b.type === 'MultiPolygon'))
    return pointWithinPolygonDistance(a, b, radius);
  if (b.type === 'Point' && (a.type === 'Polygon' || a.type === 'MultiPolygon'))
    return pointWithinPolygonDistance(b, a, radius);
  if (
    (a.type === 'LineString' || a.type === 'MultiLineString') &&
    (b.type === 'LineString' || b.type === 'MultiLineString')
  )
    return linesWithinDistance(a, b, radius);
  if (
    (a.type === 'Point' && (b.type === 'Point' || b.type === 'LineString')) ||
    (b.type === 'Point' && a.type === 'LineString')
  ) {
    const pair = closestPair(a, b);
    return pair !== null && pair.distance <= radius;
  }
  throw new Error(`ST_DWithin does not support ${a.type} and ${b.type}`);
}

/** Binds supported combinations when both input encodings identify their geometry kinds. */
function makeDWithin(): ScalarFunction {
  const spatial = spatialFunction(
    'ST_DWithin',
    [proximityKinds, proximityKinds],
    new Bool(),
    ([a, b], radius) => withinDistance(a!, b!, radius!),
    1
  );
  return {
    ...spatial,
    /** Checks concrete native pairs at binding; WKB pairs are checked per row. */
    resolvePrototype(fields) {
      const result = spatial.resolvePrototype!(fields);
      const a = fields[0]?.metadata.get(EXTENSION_NAME);
      const b = fields[1]?.metadata.get(EXTENSION_NAME);
      if (result && a && b && a !== 'geoarrow.wkb' && b !== 'geoarrow.wkb') {
        /** Identifies either concrete native line encoding. */
        const linear = (encoding: string) =>
          encoding === 'geoarrow.linestring' || encoding === 'geoarrow.multilinestring';
        const pointPair =
          (a === 'geoarrow.point' && b !== 'geoarrow.multilinestring') ||
          (b === 'geoarrow.point' && a !== 'geoarrow.multilinestring');
        if (!pointPair && !(linear(a) && linear(b)))
          throw new Error(`ST_DWithin does not support ${a} and ${b}`);
      }
      return result;
    }
  };
}

/** Tests an inclusive planar radius in the coordinate units of the geometries. */
export const ST_DWITHIN = /* @__PURE__ */ makeDWithin();

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

/** Tests boundary contact while excluding intersections between geometry interiors. */
export const ST_TOUCHES = /* @__PURE__ */ spatialFunction(
  'ST_Touches',
  [geometryTypes, geometryTypes],
  /* @__PURE__ */ new Bool(),
  ([a, b]) => planarTouches(a!, b!)
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

/** Interpolates a new M ordinate by cumulative XY length while retaining Z. */
export const ST_ADDMEASURE = /* @__PURE__ */ spatialFunction(
  'ST_AddMeasure',
  [lineKinds],
  /* @__PURE__ */ new Binary(),
  ([line], start, end) => {
    const result = addMeasure(line!, line!.dimension!, start!, end!);
    return writeWKB(result.geometry, result.dimension);
  },
  2,
  true
);

/** Returns the points on a measured route that match the requested measure. */
export const ST_LOCATEALONG = /* @__PURE__ */ spatialFunction(
  'ST_LocateAlong',
  [lineKinds],
  /* @__PURE__ */ new Binary(),
  ([line], measure) => {
    const dimension = measuredDimension(line!.dimension!);
    return writeWKB(locateAlong(line!, dimension, measure!), dimension);
  },
  1,
  true
);

/** Returns the portions of a measured route within an inclusive measure interval. */
export const ST_LOCATEBETWEEN = /* @__PURE__ */ spatialFunction(
  'ST_LocateBetween',
  [lineKinds],
  /* @__PURE__ */ new Binary(),
  ([line], start, end) => {
    const dimension = measuredDimension(line!.dimension!);
    return writeWKB(locateBetween(line!, dimension, start!, end!), dimension);
  },
  2,
  true
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

/** A synchronous projection engine with the requested CRS definitions available. */
export type SpatialSQLProjectionEngine = {
  /** Prepares a transform in GeoArrow XY axis order. */
  createProjection(options: {from: string | object; to: string; enforceAxis: false}): {
    /** Projects one horizontal coordinate. */
    projectSync(coordinate: readonly number[]): readonly number[];
  };
};

/** Creates an ST_Transform overload backed by a supplied CRS projection engine. */
export function createSTTransform(engine: SpatialSQLProjectionEngine): ScalarFunction {
  return {
    kind: 'scalar',
    name: 'ST_Transform',
    prototypes: [],
    /** Resolves one source and target CRS for the entire projection. */
    resolvePrototype(fields, literals) {
      if (fields.length !== 2 || !fields[0]) return undefined;
      const field = fields[0];
      const target = literals?.[1];
      if (target === undefined || !Number.isSafeInteger(target) || target <= 0 || target > 998999)
        throw new Error('ST_Transform requires a constant positive integer EPSG code');
      const info = getGeoArrowFieldInfo(field);
      if (!info) throw new Error('ST_Transform requires a GeoArrow geometry column');
      if (info.metadata['edges'] === 'spherical')
        throw new Error('ST_Transform requires planar geometry');
      const source = info.metadata['crs'];
      if (
        !(typeof source === 'string'
          ? source.trim()
          : source && typeof source === 'object' && !Array.isArray(source))
      )
        throw new Error('ST_Transform requires source CRS metadata');
      const to = 'EPSG:' + target;
      const transform = engine.createProjection({
        from: source as string | object,
        to,
        enforceAxis: false
      });
      const metadata = JSON.stringify({...info.metadata, crs: to, crs_type: 'authority_code'});
      const targetField = fields[1] ?? new Field('srid', new Int32(), false);
      if (!DataType.isInt(targetField.type) && !DataType.isFloat(targetField.type))
        throw new Error('ST_Transform requires a numeric SRID');

      /** Projects XY and retains additional ordinates, including the empty-point sentinel. */
      const project = (coordinate: readonly number[]): number[] => {
        if (coordinate.every(Number.isNaN)) return [...coordinate];
        const [x, y] = transform.projectSync([coordinate[0]!, coordinate[1]!]);
        if (!Number.isFinite(x) || !Number.isFinite(y))
          throw new Error('ST_Transform produced nonfinite coordinates');
        return [x!, y!, ...coordinate.slice(2)];
      };

      if (info.encoding === 'geoarrow.wkb') {
        const prototype = spatialFunction(
          'ST_Transform',
          [[...geometryTypes, 'GeometryCollection']],
          new Binary(),
          ([geometry]) => writeWKB(projectGeometry(geometry!, project), 'xy'),
          1
        ).resolvePrototype!(fields)!;
        prototype.result.metadata.set(EXTENSION_METADATA, metadata);
        return prototype;
      }
      if (!geometryTypes.some(kind => 'geoarrow.' + kind.toLowerCase() === info.encoding))
        throw new Error('ST_Transform requires WKB or a specialized native GeoArrow encoding');
      const outputMetadata = new Map(field.metadata);
      outputMetadata.set(EXTENSION_METADATA, metadata);
      return {
        arguments: [field, targetField],
        result: new Field('ST_Transform', field.type, field.nullable, outputMetadata),
        /** Maps native coordinate buffers directly, retaining topology and null rows. */
        evaluate([vector], {activeRows}) {
          return mapGeoArrowVectorCoordinates(
            vector!,
            (coordinate, row) => (activeRows[row] ? project(coordinate) : coordinate),
            {field}
          );
        }
      };
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

/** Simplifies polygon boundaries while retaining shells, holes, and component topology. */
export const ST_SIMPLIFYPRESERVETOPOLOGY: ScalarFunction = {
  kind: 'scalar',
  name: 'ST_SimplifyPreserveTopology',
  prototypes: [],
  /** Preserves specialized native storage where the input schema identifies its family. */
  resolvePrototype(fields) {
    const encoding = fields[0]?.metadata.get(EXTENSION_NAME);
    const native = encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multipolygon';
    return spatialFunction(
      'ST_SimplifyPreserveTopology',
      [polygonKinds],
      native ? nativeGeometryResult(encoding) : new Binary(),
      ([geometry], tolerance) => {
        const result = simplifyPolygonTopology(
          geometry as Extract<WellKnownGeometry, {type: 'Polygon' | 'MultiPolygon'}>,
          tolerance!
        );
        return native ? result : writeWKB(result, 'xy');
      },
      1
    ).resolvePrototype!(fields);
  }
};

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

/** Returns the summed planar length of linear components. */
export const ST_LENGTH = /* @__PURE__ */ spatialFunction(
  'ST_Length',
  [[...geometryTypes, 'GeometryCollection']],
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
  /* @__PURE__ */ nativeGeometryResult('geoarrow.point'),
  ([polygon]) => planarPolygonPointOnSurface(polygon!)
);

/** Binds the WKB fallback and native row-bounds implementation. */
function makeEnvelopeFunction(): ScalarFunction {
  const envelopeFunction = spatialFunction(
    'ST_Envelope',
    [[...geometryTypes, 'GeometryCollection']],
    /* @__PURE__ */ new Binary(),
    ([geometry]) => writeWKB(planarEnvelope(geometry!), 'xy')
  );

  return {
    ...envelopeFunction,
    /** Keeps the WKB evaluator and binds the bounds kernel for native columns. */
    resolvePrototype(fields) {
      const prototype = envelopeFunction.resolvePrototype!(fields);
      const field = fields[0];
      if (
        !prototype ||
        !field ||
        DataType.isBinary(field.type) ||
        DataType.isLargeBinary(field.type)
      ) {
        return prototype;
      }
      return {
        ...prototype,
        /** Evaluates active rows and preserves the type of empty geometries. */
        evaluate([vector], {activeRows, length}) {
          const column = readActiveGeoArrowColumn(vector!, field, activeRows);
          const bounds = getGeoArrowRowBounds(column);
          const values = Array.from({length}, (_, row) => {
            if (!activeRows[row]) return null;
            const box = bounds[row];
            if (box) return writeWKB(envelopeFromBounds(box), 'xy');
            const [geometry] = materializeGeoArrowRows(getGeoArrowColumnView(column, row, row + 1));
            return geometry ? writeWKB(geometry, 'xy') : null;
          });
          return vectorFromArray(values, new Binary());
        }
      };
    }
  };
}

/** Returns the 2D envelope as GeoArrow WKB. */
export const ST_ENVELOPE = /* @__PURE__ */ makeEnvelopeFunction();

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
            if (!DataType.isBinary(field.type) && !DataType.isLargeBinary(field.type)) {
              const column = makeGeoArrowColumnFromArrowVector(vector!, {field});
              const box = getGeoArrowBounds(column);
              if (box) include(box);
              return;
            }
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
    ST_CLOSESTPOINT,
    ST_SHORTESTLINE,
    ST_INTERSECTS,
    ST_TOUCHES,
    ST_SRID,
    ST_SETSRID,
    ST_TRANSFORM,
    ST_REMOVEREPEATEDPOINTS,
    ST_SIMPLIFY,
    ST_SIMPLIFYPRESERVETOPOLOGY,
    ST_AZIMUTH,
    ST_MAKEPOINT,
    ST_TILEENVELOPE,
    ST_AREA,
    ST_LENGTH,
    ST_LINEINTERPOLATEPOINT,
    ST_LINELOCATEPOINT,
    ST_LINESUBSTRING,
    ST_ADDMEASURE,
    ST_LOCATEALONG,
    ST_LOCATEBETWEEN,
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

export {
  ST_GEODESICDISTANCE,
  ST_GEODESICLENGTH,
  ST_GEODESICDWITHIN,
  GEODESIC_SPATIAL_FUNCTIONS
} from './st-geodesic-functions';
export {createSTCoverageSimplify, type CoverageSimplifyOptions} from './st-coverage-functions';
