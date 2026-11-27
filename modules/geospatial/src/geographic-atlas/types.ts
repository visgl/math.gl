// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GeographicClipOptions} from '../geographic-seams/cut-options';
import type {GeographicEdgeSource} from '../geographic-seams/types';
export type GeographicAtlasOptions = Omit<
  GeographicClipOptions,
  'latitudeRange' | 'seamLongitude'
> & {
  /** Values at generated chart junctions/full-circle boundaries; required for size > 2. */
  boundaryAttributes?: readonly number[];
};
/** A circle in unit surface-normal space: dot(normalized(normal), n) = offset. */
export type GeographicAtlasBoundary = {
  id: string;
  normal: readonly [number, number, number];
  offset?: number;
};
export type GeographicAtlasChart = {
  id: string;
  /** Cartesian center direction; an implicit closed hemisphere also bounds this chart. */
  center: readonly [number, number, number];
  cuts: readonly {boundary: string; side: 1 | -1}[];
};
export type GeographicCutGraph = {
  boundaries: readonly GeographicAtlasBoundary[];
  charts: readonly GeographicAtlasChart[];
};
export type GeographicAtlasSource = Omit<GeographicEdgeSource, 'longitudeShift'>;
export type GeographicAtlasEdge =
  | {kind: 'source'; source: GeographicAtlasSource}
  | {kind: 'boundary'; boundary: string; startAngle: number; endAngle: number};
export type GeographicAtlasRing = {
  positions: Float64Array;
  /** Canonical unit surface normals, stride 3, including closure. */
  normals: Float64Array;
  /** Shared within a single clip operation, across all charts. */
  vertexIds: string[];
  edges: GeographicAtlasEdge[];
};
export type GeographicAtlasPolygon = {chart: string; rings: GeographicAtlasRing[]};
export type GeographicAtlasPolyline = {
  chart: string;
  positions: Float64Array;
  normals: Float64Array;
  vertexIds: string[];
  edges: GeographicAtlasSource[];
};
