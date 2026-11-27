// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {EllipsoidGeodesic} from '../ellipsoid-geodesic';
import type {EllipsoidRhumb} from '../ellipsoid-rhumb';

export type GeographicSeamOptions = {
  /** Explicit edge semantics; no guessing from whether an array is closed. */
  edgeModel: 'linear' | 'geodesic' | 'rhumb';
  /** Linear edges only. Default supplied; shortest chooses the short longitude interval. */
  linearLongitude?: 'supplied' | 'shortest';
  /** Right edge of the 360-degree output chart. Default 180. */
  seamLongitude?: number;
  /** Coordinate stride, including linearly interpolated scalar attributes. Default 2. */
  size?: number;
  geodesic?: EllipsoidGeodesic;
  rhumb?: EllipsoidRhumb;
  /** Bound both working and output vertices. Default 65536. */
  maxVertices?: number;
  /** Bound edge visits and solver/root evaluations. Default 1000000. */
  maxWork?: number;
  /** Maximum bisections per root. Default 64, maximum 128. */
  maxIterations?: number;
};
export type GeographicEdgeSource = {
  ringIndex: number;
  edgeIndex: number;
  startFraction: number;
  endFraction: number;
  /** Add to the independently unrolled original edge longitude when resampling. */
  longitudeShift: number;
};
export type GeographicSeamRing = {
  /** Packed coordinates; polygon rings are explicitly closed. Caller-owned storage. */
  positions: Float64Array;
  /** One per output edge; null denotes a generated seam/pole connector. */
  edges: (GeographicEdgeSource | null)[];
};
export type GeographicSeamPolyline = {
  positions: Float64Array;
  /** Line edges always retain an original source interval. */
  edges: GeographicEdgeSource[];
  /** Original unrolled world index; polyline positions are not necessarily closed. */
  world: number;
};
export type GeographicPolygonRing = {
  positions: ArrayLike<number>;
  /** Rhumb turns per original edge, including the closing edge. */
  longitudeTurns?: readonly number[];
  /** Required for a once-winding polar ring. Other complements are not inferred. */
  pole?: 'north' | 'south';
  /** Explicit values for generated pole vertices when size > 2. */
  poleAttributes?: readonly number[];
};
export type GeographicSeamPolygon = {
  /** Outer first, then holes. Outer winding follows the input; holes are opposite. */
  rings: GeographicSeamRing[];
};
export class GeographicSeamError extends RangeError {
  constructor(
    readonly reason: 'input' | 'precision' | 'topology' | 'limit',
    message: string
  ) {
    super(message);
    this.name = 'GeographicSeamError';
  }
}
