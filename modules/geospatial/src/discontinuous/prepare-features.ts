// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {SphericalCutOptions} from './global-polygons';
import type {MapEngine} from './map-engine';
import type {GeographicPosition, MapSamplingOptions} from './map-layout';

/** Two-dimensional GeoJSON geometry shapes. Positions are validated as lon/lat pairs. */
export type MapFeatureGeometry =
  | {type: 'Point'; coordinates: readonly number[]}
  | {type: 'MultiPoint' | 'LineString'; coordinates: readonly (readonly number[])[]}
  | {type: 'MultiLineString' | 'Polygon'; coordinates: readonly (readonly (readonly number[])[])[]}
  | {type: 'MultiPolygon'; coordinates: readonly (readonly (readonly (readonly number[])[])[])[]}
  | {type: 'GeometryCollection'; geometries: readonly MapFeatureGeometry[]};
/** Properties remain with the caller; output parts address this array by featureIndex. */
export type MapFeature = {
  type?: 'Feature';
  id?: string | number;
  geometry: MapFeatureGeometry | null;
  properties?: unknown;
};
/** Original feature/component identity and the chart owning one generated part. */
export type PreparedMapPart = {
  featureIndex: number;
  /** Indices through GeometryCollection.geometries and multipart coordinates. */
  geometryPath: number[];
  regionIndex: number;
};
/** Only original line or polygon-boundary segments occur in the path batch. */
export type PreparedMapPathPart = PreparedMapPart & {
  role: 'line' | 'polygon-outline';
  /** Original input ring index (outer = 0), only for polygon outlines. */
  ringIndex?: number;
  /** A complete closed ring; cut fragments remain open. */
  closed: boolean;
};
/** XY in map units and corresponding longitude/latitude, both interleaved pairs. */
export type PreparedMapVertices = {
  positions: Float64Array;
  sourcePositions: Float64Array;
};
/** Packed, structured-cloneable geometry. All offsets count vertices or rings, not scalars. */
export type PreparedMapGeometry = {
  version: 1;
  mapId: string;
  /** Optional application IDs; featureIndex remains authoritative, including duplicate IDs. */
  featureIds: (string | number | null)[];
  regionIds: string[];
  /** One vertex per part. Point ownership follows MapEngine.projectPoint(). */
  points: PreparedMapVertices & {parts: PreparedMapPart[]};
  paths: PreparedMapVertices & {
    parts: PreparedMapPathPart[];
    pathStarts: Uint32Array;
    provenance?: {
      sourceSegmentIndices?: Uint32Array;
      sourceSegmentParameters?: Float64Array;
      sourceVertexIndices?: Uint32Array;
      sourceDistances?: Float64Array;
      distanceRadius?: number;
      /** Per part: source endpoint, coverage boundary, cut, or continuous join. */
      startReasons?: string[];
      endReasons?: string[];
    };
  };
  polygons: PreparedMapVertices & {
    parts: PreparedMapPart[];
    /** Vertex offsets for all rings, with a terminal sentinel. Rings repeat their first vertex. */
    ringStarts: Uint32Array;
    /** Ring offsets for polygon parts, with a terminal sentinel. Outer ring comes first. */
    polygonStarts: Uint32Array;
  };
};
/** Static preparation controls. This does not triangulate, interpolate attributes or pose meshes. */
export type MapPrepareFeaturesOptions = {
  sampling?: MapSamplingOptions;
  provenance?: {
    sourceSegments?: boolean;
    boundaries?: boolean;
    /** Source minor-great-circle distance in meters on the declared sphere. */
    distances?: {metric: 'spherical'; radius: number};
  };
  /** Project original polygon boundaries separately; default true. */
  polygonOutlines?: boolean;
  /** Directed global spherical polygons; original outlines never include atlas connectors. */
  sphericalCuts?: SphericalCutOptions;
};

type Vertices = {positions: number[]; sourcePositions: number[]};
const vertices = (): Vertices => ({positions: [], sourcePositions: []});
const pack = (v: Vertices): PreparedMapVertices => ({
  positions: new Float64Array(v.positions),
  sourcePositions: new Float64Array(v.sourcePositions)
});
function append(
  v: Vertices,
  xy: readonly GeographicPosition[],
  source: readonly GeographicPosition[]
) {
  if (xy.length !== source.length) throw new Error('Mismatched map source coordinates');
  if (v.positions.length / 2 + xy.length >= 0xffffffff)
    throw new Error('Map geometry exceeds Uint32 offsets');
  for (let i = 0; i < xy.length; i++) {
    if (!xy[i].every(Number.isFinite) || !source[i].every(Number.isFinite))
      throw new Error('Non-finite map geometry');
    v.positions.push(xy[i][0], xy[i][1]);
    v.sourcePositions.push(source[i][0], source[i][1]);
  }
}
function position(p: readonly number[]): GeographicPosition {
  if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite) || Math.abs(p[1]) > 90)
    throw new Error('Expected two-dimensional longitude/latitude positions');
  return [p[0], p[1]];
}
function closed(line: readonly GeographicPosition[]): boolean {
  if (line.length < 4) return false;
  const a = line[0],
    b = line[line.length - 1];
  return a[0] === b[0] && a[1] === b[1];
}

/** Internal implementation of MapEngine.prepareFeatures; no renderer dependencies. */
export function prepareMapFeatures(
  map: MapEngine,
  features: readonly MapFeature[],
  options: MapPrepareFeaturesOptions = {}
): PreparedMapGeometry {
  if (!Array.isArray(features)) throw new Error('Expected a feature array');
  if (options.polygonOutlines !== undefined && typeof options.polygonOutlines !== 'boolean')
    throw new Error('polygonOutlines must be boolean');
  const provenance = options.provenance;
  if (
    provenance !== undefined &&
    (!provenance || typeof provenance !== 'object' || Array.isArray(provenance))
  )
    throw new Error('Unsupported provenance policy');
  if (
    provenance?.distances !== undefined &&
    (!provenance.distances || typeof provenance.distances !== 'object')
  )
    throw new Error('Unsupported provenance distance policy');
  if (
    provenance &&
    (typeof provenance !== 'object' ||
      Object.keys(provenance).some(
        k => !['sourceSegments', 'boundaries', 'distances'].includes(k)
      ) ||
      [provenance.sourceSegments, provenance.boundaries].some(
        v => v !== undefined && typeof v !== 'boolean'
      ) ||
      (provenance.distances &&
        (provenance.distances.metric !== 'spherical' ||
          !Number.isFinite(provenance.distances.radius) ||
          provenance.distances.radius <= 0)))
  )
    throw new Error('Unsupported provenance policy');
  const lineage = Boolean(
    provenance?.sourceSegments || provenance?.boundaries || provenance?.distances
  );
  const segments: number[] = [],
    parameters: number[] = [],
    originalVertices: number[] = [],
    distances: number[] = [],
    startReasons: string[] = [],
    endReasons: string[] = [];
  const regionIds = map.regions.map(r => r.id),
    regionIndices = new Map(regionIds.map((id, i) => [id, i]));
  const points = vertices(),
    paths = vertices(),
    polygons = vertices();
  const pointParts: PreparedMapPart[] = [],
    pathParts: PreparedMapPathPart[] = [],
    polygonParts: PreparedMapPart[] = [];
  const pathStarts = [0],
    ringStarts = [0],
    polygonStarts = [0];
  const featureIds: PreparedMapGeometry['featureIds'] = [];
  const part = (
    featureIndex: number,
    geometryPath: number[],
    regionId: string
  ): PreparedMapPart => {
    const regionIndex = regionIndices.get(regionId);
    if (regionIndex === undefined) throw new Error('Unknown prepared map region');
    return {featureIndex, geometryPath: [...geometryPath], regionIndex};
  };
  const addLine = (
    input: readonly (readonly number[])[],
    featureIndex: number,
    geometryPath: number[],
    ringIndex?: number
  ) => {
    const line = input.map(position);
    if (!line.length) return;
    if (line.length < 2) throw new Error('A line needs at least two positions');
    const isRing = ringIndex !== undefined;
    if (isRing && !closed(line)) line.push([...line[0]]);
    for (const p of map.projectLine(line, {
      ...options.sampling,
      pathProvenance: lineage,
      pathDistances: Boolean(provenance?.distances),
      pathBoundaries: Boolean(provenance?.boundaries)
    })) {
      if (lineage) {
        if (!p.provenance) throw new Error('Map backend does not support path provenance');
        if (provenance?.sourceSegments) {
          segments.push(...p.provenance.segments);
          parameters.push(...p.provenance.parameters);
          originalVertices.push(...p.provenance.vertices);
        }
        if (provenance?.distances)
          distances.push(
            ...p.provenance.angularDistances.map(d => d * provenance.distances!.radius)
          );
        if (provenance?.boundaries) {
          startReasons.push(p.provenance.startReason!);
          endReasons.push(p.provenance.endReason!);
        }
      }
      append(paths, p.coordinates, p.sourceCoordinates);
      pathParts.push({
        ...part(featureIndex, geometryPath, p.regionId),
        role: isRing ? 'polygon-outline' : 'line',
        ...(isRing ? {ringIndex} : {}),
        closed: closed(p.sourceCoordinates) && closed(p.coordinates)
      });
      pathStarts.push(paths.positions.length / 2);
    }
  };
  const addPolygon = (
    input: readonly (readonly (readonly number[])[])[],
    featureIndex: number,
    geometryPath: number[]
  ) => {
    if (!input.length) return;
    const rings = input.map(r => r.map(position));
    const parts = options.sphericalCuts
      ? map.projectGlobalPolygon(rings, {...options.sampling, ...options.sphericalCuts})
      : map.projectPolygon(rings, options.sampling);
    for (const p of parts) {
      for (let i = 0; i < p.coordinates.length; i++) {
        append(polygons, p.coordinates[i], p.sourceCoordinates[i]);
        ringStarts.push(polygons.positions.length / 2);
      }
      polygonParts.push(part(featureIndex, geometryPath, p.regionId));
      polygonStarts.push(ringStarts.length - 1);
    }
    if (options.polygonOutlines !== false)
      rings.forEach((r, i) => addLine(r, featureIndex, geometryPath, i));
  };
  const visit = (
    geometry: MapFeatureGeometry,
    featureIndex: number,
    path: number[],
    depth: number
  ) => {
    if (depth > 64) throw new Error('Geometry collections are too deeply nested');
    if (!geometry || typeof geometry !== 'object') throw new Error('Invalid feature geometry');
    switch (geometry.type) {
      case 'Point': {
        const source = position(geometry.coordinates),
          hit = map.projectPoint(source);
        if (hit) {
          append(points, [hit.position], [source]);
          pointParts.push(part(featureIndex, path, hit.regionId));
        }
        break;
      }
      case 'MultiPoint':
        geometry.coordinates.forEach((p, i) =>
          visit({type: 'Point', coordinates: p}, featureIndex, [...path, i], depth)
        );
        break;
      case 'LineString':
        addLine(geometry.coordinates, featureIndex, path);
        break;
      case 'MultiLineString':
        geometry.coordinates.forEach((line, i) => addLine(line, featureIndex, [...path, i]));
        break;
      case 'Polygon':
        addPolygon(geometry.coordinates, featureIndex, path);
        break;
      case 'MultiPolygon':
        geometry.coordinates.forEach((rings, i) => addPolygon(rings, featureIndex, [...path, i]));
        break;
      case 'GeometryCollection':
        if (depth >= 64) throw new Error('Geometry collections are too deeply nested');
        geometry.geometries.forEach((g, i) => visit(g, featureIndex, [...path, i], depth + 1));
        break;
      default:
        throw new Error('Unsupported feature geometry type');
    }
  };
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    if (!feature || (feature.type !== undefined && feature.type !== 'Feature'))
      throw new Error('Expected GeoJSON features');
    if (
      feature.id !== undefined &&
      typeof feature.id !== 'string' &&
      !(typeof feature.id === 'number' && Number.isFinite(feature.id))
    )
      throw new Error('Invalid feature ID');
    featureIds.push(feature.id ?? null);
    if (feature.geometry !== null) visit(feature.geometry, i, [], 0);
  }
  return {
    version: 1,
    mapId: map.description.id,
    featureIds,
    regionIds,
    points: {...pack(points), parts: pointParts},
    paths: {
      ...pack(paths),
      parts: pathParts,
      pathStarts: new Uint32Array(pathStarts),
      ...(lineage
        ? {
            provenance: {
              ...(provenance?.sourceSegments
                ? {
                    sourceSegmentIndices: new Uint32Array(segments),
                    sourceSegmentParameters: new Float64Array(parameters),
                    sourceVertexIndices: new Uint32Array(originalVertices)
                  }
                : {}),
              ...(provenance?.distances
                ? {
                    sourceDistances: new Float64Array(distances),
                    distanceRadius: provenance.distances.radius
                  }
                : {}),
              ...(provenance?.boundaries ? {startReasons, endReasons} : {})
            }
          }
        : {})
    },
    polygons: {
      ...pack(polygons),
      parts: polygonParts,
      ringStarts: new Uint32Array(ringStarts),
      polygonStarts: new Uint32Array(polygonStarts)
    }
  };
}
