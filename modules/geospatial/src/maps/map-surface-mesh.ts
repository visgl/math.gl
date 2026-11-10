// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GeographicPosition, MapBounds} from './map-layout';

export type MapSurfaceMesh = {
  positions: Float64Array;
  texCoords: Float32Array;
  partIds: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  bounds: MapBounds | null;
};
export type MapSurfaceMeshOptions = {
  /** Maximum longitude/latitude grid steps in degrees; one value or [longitude, latitude]. Default 0.5. */
  maxAngularStep?: number | readonly [number, number];
  /** Optional geographic raster bounds; default the whole world. */
  textureBounds?: MapBounds;
  textureProjection?: 'geographic' | 'mercator';
  /** Maximum prepared vertices, including distinct chart banks. Default 1000000. */
  maxVertices?: number;
  /** Optional guard against internal projection discontinuities, in output units. */
  maxEdgeLength?: number;
};

/** Prepare chart-local raster geometry. Projection and geographic clipping are
 * owned by MapEngine; texture coordinates retain each chart's longitude bank. */
export function prepareMapSurfaceMesh(
  map: {
    regions: readonly {
      id: string;
      interior: GeographicPosition;
      boundary: readonly GeographicPosition[];
      /** Explicit rectangular domain, without spherical pole expansion. */
      geographicBounds?: MapBounds;
    }[];
    projectPoint: (
      position: GeographicPosition,
      regionId?: string
    ) => {position: readonly number[]} | null;
    projectLine?: (
      positions: readonly GeographicPosition[],
      options: {maxAngularStep: number; tolerance: number}
    ) => {regionId: string; sourceCoordinates: readonly GeographicPosition[]}[];
  },
  options: MapSurfaceMeshOptions = {}
): MapSurfaceMesh {
  const step = options.maxAngularStep ?? 0.5;
  const steps = typeof step === 'number' ? [step, step] : step;
  if (
    steps.length !== 2 ||
    !steps.every(value => Number.isFinite(value) && value > 0 && value <= 180)
  )
    throw new RangeError('Invalid surface angular step');
  if (
    options.maxEdgeLength !== undefined &&
    (!Number.isFinite(options.maxEdgeLength) || options.maxEdgeLength <= 0)
  )
    throw new RangeError('Invalid projection edge limit');
  const maxVertices = options.maxVertices ?? 1000000;
  if (!Number.isInteger(maxVertices) || maxVertices < 3 || maxVertices > 0xffffffff)
    throw new RangeError('Invalid surface vertex budget');
  const raster = options.textureBounds ?? [-180, -90, 180, 90];
  if (
    !raster.every(Number.isFinite) ||
    raster[0] >= raster[2] ||
    raster[1] >= raster[3] ||
    raster[2] - raster[0] > 360 ||
    raster[1] < -90 ||
    raster[3] > 90 ||
    (options.textureProjection &&
      !['geographic', 'mercator'].includes(options.textureProjection)) ||
    (options.textureProjection === 'mercator' && (raster[1] <= -90 || raster[3] >= 90))
  )
    throw new RangeError('Invalid raster bounds or projection');
  const mercator = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const latitude = options.textureProjection === 'mercator' ? mercator : (lat: number) => lat;
  const positions: number[] = [],
    texCoords: number[] = [],
    partIds: number[] = [],
    outputIndices: number[] = [];
  const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [part, region] of map.regions.entries()) {
    const origin = region.interior[0];
    const wrap = (lon: number) => {
      const delta = ((lon - origin + 540) % 360) - 180;
      return origin + (delta === -180 && lon > origin ? 180 : delta);
    };
    const samples =
      map
        .projectLine?.([...region.boundary, region.boundary[0]], {
          maxAngularStep: 2,
          tolerance: 0.01
        })
        .filter(p => p.regionId === region.id)
        .flatMap(p => p.sourceCoordinates) ?? [];
    const boundary = [...region.boundary, ...samples].map(p => [wrap(p[0]), p[1]]);
    const northPole =
      Boolean(map.projectPoint([origin, 90], region.id)) &&
      map.regions.filter(r => map.projectPoint([origin, 90], r.id)).length === 1;
    const southPole =
      Boolean(map.projectPoint([origin, -90], region.id)) &&
      map.regions.filter(r => map.projectPoint([origin, -90], r.id)).length === 1;
    const regionWest =
      region.geographicBounds?.[0] ??
      (northPole || southPole ? origin - 180 : Math.min(...boundary.map(p => p[0])));
    const regionEast =
      region.geographicBounds?.[2] ??
      (northPole || southPole ? origin + 180 : Math.max(...boundary.map(p => p[0])));
    const intervals: {west: number; east: number; shift: number}[] = [];
    if (options.textureBounds) {
      const first = Math.ceil((regionWest - raster[2]) / 360);
      const last = Math.floor((regionEast - raster[0]) / 360);
      for (let copy = first; copy <= last; copy++) {
        const shift = copy * 360;
        const west = Math.max(regionWest, raster[0] + shift);
        const east = Math.min(regionEast, raster[2] + shift);
        if (west < east) intervals.push({west, east, shift});
      }
    } else intervals.push({west: regionWest, east: regionEast, shift: 0});
    for (const {west, east, shift} of intervals) {
      const south = Math.max(southPole ? -90 : Math.min(...boundary.map(p => p[1])), raster[1]);
      const north = Math.min(northPole ? 90 : Math.max(...boundary.map(p => p[1])), raster[3]);
      if (!(west < east && south < north)) continue;
      const columns = Math.ceil((east - west) / steps[0]),
        rows = Math.ceil((north - south) / steps[1]);
      if ((columns + 1) * (rows + 1) > maxVertices)
        throw new RangeError('Surface grid exceeds vertex budget');
      const grid: ({geographic: GeographicPosition; position: readonly number[]} | null)[] = [];
      for (let y = 0; y <= rows; y++)
        for (let x = 0; x <= columns; x++) {
          const geographic: GeographicPosition = [
            west + ((east - west) * x) / columns,
            south + ((north - south) * y) / rows
          ];
          const point = map.projectPoint(geographic, region.id);
          grid.push(
            point && point.position.every(Number.isFinite)
              ? {geographic, position: point.position}
              : null
          );
        }
      const sharedVertices = new Map<string, number>();
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < columns; x++) {
          const a = y * (columns + 1) + x,
            b = a + 1,
            c = a + columns + 1,
            d = c + 1;
          for (const indices of [
            [a, b, c],
            [b, d, c]
          ]) {
            const triangle = indices.map(i => grid[i]);
            if (!triangle.every(Boolean)) continue;
            if (
              options.maxEdgeLength !== undefined &&
              triangle.some(
                (p, i) =>
                  Math.hypot(
                    p!.position[0] - triangle[(i + 1) % 3]!.position[0],
                    p!.position[1] - triangle[(i + 1) % 3]!.position[1]
                  ) > options.maxEdgeLength!
              )
            )
              continue;
            const longitudeOffset = options.textureBounds
              ? 0
              : 360 *
                Math.max(
                  0,
                  Math.ceil((-180 - Math.min(...triangle.map(p => p!.geographic[0]))) / 360)
                );
            for (const gridIndex of indices) {
              const key = gridIndex + ':' + longitudeOffset;
              if (sharedVertices.has(key)) {
                outputIndices.push(sharedVertices.get(key)!);
                continue;
              }
              if (positions.length / 3 >= maxVertices)
                throw new RangeError('Surface exceeds vertex budget');
              const index = positions.length / 3;
              sharedVertices.set(key, index);
              outputIndices.push(index);
              const point = grid[gridIndex];
              const [px, py] = point!.position;
              positions.push(px, py, 0);
              partIds.push(part);
              const lon = point!.geographic[0];
              const textureLon = options.textureBounds ? lon - shift : lon + longitudeOffset;
              texCoords.push(
                (textureLon - raster[0]) / (raster[2] - raster[0]),
                (latitude(raster[3]) - latitude(point!.geographic[1])) /
                  (latitude(raster[3]) - latitude(raster[1]))
              );
              bounds[0] = Math.min(bounds[0], px);
              bounds[1] = Math.min(bounds[1], py);
              bounds[2] = Math.max(bounds[2], px);
              bounds[3] = Math.max(bounds[3], py);
            }
          }
        }
    }
  }
  const indices = Uint32Array.from(outputIndices);
  return {
    positions: new Float64Array(positions),
    texCoords: new Float32Array(texCoords),
    partIds: new Float32Array(partIds),
    indices,
    vertexCount: indices.length,
    bounds: indices.length ? bounds : null
  };
}

/** Prepare raster buffers independently of the point engine and polygon support. */
export function prepareMapSurface(
  map: import('./map-engine.js').MapEngine,
  options: MapSurfaceMeshOptions = {}
): MapSurfaceMesh {
  return prepareMapSurfaceMesh(
    {
      regions: map.regions,
      projectPoint: (p, id) => map.projectSurfacePoint(p, id),
      projectLine: (p, opts) => map.projectLine(p, opts)
    },
    options
  );
}
