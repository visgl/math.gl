// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {earcut} from '@math.gl/geometry';
import type {GeoArrowColumn} from './types';
import {streamGeoArrow, type GeoArrowGeometryStream, type StreamGeoArrowOptions} from './stream';

/** Resource-bounded planar tessellation after a synchronous external geometry stream. */
export type TessellateGeoArrowStreamOptions = StreamGeoArrowOptions & {
  /** Construct a clipping/resampling stream around the supplied sink. Closures stay in the
   * executing thread; worker requests should carry serializable factory names/parameters.
   */
  createStream?: (sink: GeoArrowGeometryStream) => GeoArrowGeometryStream;
  /** Default 65536, counting all emitted polygon coordinates, including discarded rings. */
  maxVertices?: number;
  /** Default 131072. */
  maxTriangles?: number;
  /** Default 1000000; bounds ring containment classification work. */
  maxRingComparisons?: number;
};
/** Flat XY geometry and source-row attribution, ready for rendering or explicit transfer. */
export type GeoArrowStreamMesh = {
  positions: Float64Array;
  indices: Uint32Array;
  /** Vertex offsets with terminal sentinel, one per output polygon. */
  polygonStarts: Uint32Array;
  /** Source row per output polygon; split components retain the original row. */
  polygonSourceRows: Uint32Array;
  /** Source row per output vertex. */
  sourceRowIndices: Uint32Array;
};

/** Tessellate polygon output from a geometry stream; points and standalone lines are ignored.
 * The transform must emit finite planar simple rings with disjoint or nested interiors.
 * Ring containment distinguishes split exteriors from holes independently of winding. No
 * spherical clipping, rewinding or CRS inference is performed here. All work is synchronous;
 * run this function in a task worker for expensive transforms. Partial results are never returned.
 */
export function tessellateGeoArrowStream(
  column: GeoArrowColumn,
  options: TessellateGeoArrowStreamOptions = {}
): GeoArrowStreamMesh {
  const {maxVertices = 65536, maxTriangles = 131072, maxRingComparisons = 1000000} = options;
  if (
    ![maxVertices, maxTriangles, maxRingComparisons].every(
      v => Number.isSafeInteger(v) && v >= 0 && v <= 0xffffffff
    )
  )
    throw new RangeError('Invalid stream limits');
  const positions: number[] = [],
    indices: number[] = [],
    polygonStarts = [0],
    polygonSourceRows: number[] = [],
    sourceRowIndices: number[] = [];
  let row = 0,
    vertices = 0,
    comparisons = 0,
    inPolygon = false;
  let rings: number[][] = [],
    ring: number[] | null = null;
  const sink: GeoArrowGeometryStream = {
    polygonStart() {
      if (inPolygon) throw new Error('Nested stream polygon');
      inPolygon = true;
      rings = [];
    },
    lineStart() {
      if (inPolygon) {
        if (ring) throw new Error('Nested stream ring');
        ring = [];
      }
    },
    point(x, y) {
      if (!inPolygon) return;
      if (!ring || !Number.isFinite(x) || !Number.isFinite(y))
        throw new Error('Invalid polygon stream point');
      if (++vertices > maxVertices) throw new RangeError('Stream exceeded maxVertices');
      ring.push(x, y);
    },
    lineEnd() {
      if (!inPolygon) return;
      if (!ring) throw new Error('Missing stream ring');
      if (
        ring.length >= 4 &&
        ring[0] === ring[ring.length - 2] &&
        ring[1] === ring[ring.length - 1]
      )
        ring.splice(-2);
      if (ring.length >= 6) rings.push(ring);
      ring = null;
    },
    polygonEnd() {
      if (!inPolygon || ring) throw new Error('Incomplete stream polygon');
      const areas = rings.map(signedArea);
      const parents = rings.map((r, i) => {
        let parent = -1;
        for (let j = 0; j < rings.length; j++) {
          if (++comparisons > maxRingComparisons)
            throw new RangeError('Stream exceeded maxRingComparisons');
          if (
            Math.abs(areas[j]) > Math.abs(areas[i]) &&
            (parent < 0 || Math.abs(areas[j]) < Math.abs(areas[parent])) &&
            contains(rings[j], r[0], r[1])
          )
            parent = j;
        }
        return parent;
      });
      const depths = parents.map(parent => {
        let depth = 0;
        while (parent >= 0) {
          depth++;
          parent = parents[parent];
        }
        return depth;
      });
      for (let i = 0; i < rings.length; i++) {
        if (depths[i] % 2 || areas[i] === 0) continue;
        const flat = [...rings[i]],
          holes: number[] = [];
        for (let j = 0; j < rings.length; j++)
          if (parents[j] === i) {
            holes.push(flat.length / 2);
            for (const value of rings[j]) flat.push(value);
          }
        const triangles = earcut(flat, holes, 2);
        if (indices.length / 3 + triangles.length / 3 > maxTriangles)
          throw new RangeError('Stream exceeded maxTriangles');
        const start = positions.length / 2;
        for (const value of flat) positions.push(value);
        for (let j = 0; j < flat.length / 2; j++) sourceRowIndices.push(row);
        for (const index of triangles) indices.push(start + index);
        polygonSourceRows.push(row);
        polygonStarts.push(positions.length / 2);
      }
      rings = [];
      inPolygon = false;
    }
  };
  const stream = options.createStream?.(sink) ?? sink;
  streamGeoArrow(column, stream, {
    ...options,
    onRowStart(index) {
      if (index > 0xffffffff) throw new RangeError('Source row exceeds Uint32');
      row = index;
      options.onRowStart?.(index);
    },
    onRowEnd(index) {
      if (inPolygon || ring) throw new Error('Stream must flush each source row synchronously');
      options.onRowEnd?.(index);
    }
  });
  return {
    positions: new Float64Array(positions),
    indices: new Uint32Array(indices),
    polygonStarts: new Uint32Array(polygonStarts),
    polygonSourceRows: new Uint32Array(polygonSourceRows),
    sourceRowIndices: new Uint32Array(sourceRowIndices)
  };
}
function signedArea(ring: number[]): number {
  let result = 0;
  for (let i = 2; i + 3 < ring.length; i += 2)
    result +=
      (ring[i] - ring[0]) * (ring[i + 3] - ring[1]) -
      (ring[i + 1] - ring[1]) * (ring[i + 2] - ring[0]);
  if (!Number.isFinite(result)) throw new RangeError('Unrepresentable stream ring area');
  return result;
}
function contains(ring: number[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const ax = ring[i],
      ay = ring[i + 1],
      bx = ring[j],
      by = ring[j + 1];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}
