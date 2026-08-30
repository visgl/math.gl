// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {earcut} from '@math.gl/polygon';
import type {GeoArrowColumn, GeoArrowGeometryValue} from './types';
import {getGeoArrowDimensionSize} from './types';
import {materializeGeoArrowRows} from './layout';
import {assertGeoArrowResourceLimits, type GeoArrowResourceLimitOptions} from './kernels';

/** Options for polygon tessellation. */
export type TessellateGeoArrowPolygonsOptions = Readonly<{
  /** Number of values emitted for each output vertex. Defaults to the input dimension. */
  positionSize?: 2 | 3 | 4;
  /** Value added to every source row index. */
  sourceRowOffset?: number;
  limits?: GeoArrowResourceLimitOptions;
}>;

/** Flat, renderer-ready output for polygon and multipolygon rows. */
export type GeoArrowTessellation = Readonly<{
  positions: Float32Array;
  /** Source column row for every emitted vertex. */
  sourceRowIndices: Uint32Array;
  indices: Uint16Array | Uint32Array;
  sourceDimension: 2 | 3 | 4;
  positionSize: 2 | 3 | 4;
  rowCount: number;
  polygonCount: number;
  vertexCount: number;
  triangleCount: number;
}>;

/**
 * Tessellates Polygon and MultiPolygon values with stable source-row attribution.
 *
 * Non-polygon members of mixed columns and geometry collections are skipped. Closing coordinates
 * are removed before triangulation and all input descriptors remain borrowed and untouched.
 */
export function tessellateGeoArrowPolygons(
  column: GeoArrowColumn,
  options: TessellateGeoArrowPolygonsOptions = {}
): GeoArrowTessellation {
  assertGeoArrowResourceLimits(column, options.limits);
  const rows = materializeGeoArrowRows(column);
  const sourceDimension = getGeoArrowDimensionSize(column.dimension);
  const positionSize = options.positionSize || sourceDimension;
  const sourceRowOffset = options.sourceRowOffset || 0;
  const positions: number[] = [];
  const sourceRowIndices: number[] = [];
  const indices: number[] = [];
  let polygonCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row) {
      visitPolygons(row, polygon => {
        const vertexOffset = positions.length / positionSize;
        const flatCoordinates: number[] = [];
        const holeIndices: number[] = [];
        let localVertexCount = 0;

        for (let ringIndex = 0; ringIndex < polygon.length; ringIndex++) {
          const ring = removeClosingCoordinate(polygon[ringIndex]);
          if (ring.length < 3) continue;
          if (localVertexCount > 0) holeIndices.push(localVertexCount);
          for (const coordinate of ring) {
            for (let component = 0; component < sourceDimension; component++) {
              flatCoordinates.push(coordinate[component] ?? 0);
            }
            for (let component = 0; component < positionSize; component++) {
              positions.push(coordinate[component] ?? 0);
            }
            sourceRowIndices.push(sourceRowOffset + rowIndex);
            localVertexCount++;
          }
        }

        if (localVertexCount >= 3) {
          const localIndices = earcut(flatCoordinates, holeIndices, sourceDimension);
          for (const index of localIndices) indices.push(vertexOffset + index);
          polygonCount++;
        }
      });
    }
  }

  const vertexCount = positions.length / positionSize;
  const IndexArray = vertexCount <= 65535 ? Uint16Array : Uint32Array;
  return {
    positions: Float32Array.from(positions),
    sourceRowIndices: Uint32Array.from(sourceRowIndices),
    indices: IndexArray.from(indices),
    sourceDimension,
    positionSize,
    rowCount: rows.length,
    polygonCount,
    vertexCount,
    triangleCount: indices.length / 3
  };
}

function visitPolygons(
  geometry: GeoArrowGeometryValue,
  visitor: (polygon: readonly (readonly (readonly number[])[])[]) => void
): void {
  switch (geometry.type) {
    case 'Polygon':
      visitor(geometry.coordinates);
      break;
    case 'MultiPolygon':
      for (const polygon of geometry.coordinates) visitor(polygon);
      break;
    case 'GeometryCollection':
      for (const child of geometry.geometries) visitPolygons(child, visitor);
      break;
    default:
      break;
  }
}

function removeClosingCoordinate(
  ring: readonly (readonly number[])[]
): readonly (readonly number[])[] {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first.length !== last.length) return ring;
  for (let index = 0; index < first.length; index++) {
    if (first[index] !== last[index]) return ring;
  }
  return ring.slice(0, -1);
}
