// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CRSMetadata} from './crs-metadata';

/** Supported coordinate input storage. */
export type CRSCoordinate = readonly number[] | Float32Array | Float64Array;
/** Caller-owned conversion output storage. */
export type CRSOutput = number[] | Float32Array | Float64Array;

/** Finite target-coordinate XYZ envelope describing an appropriate rendering target.
 * This is not the projection algorithm's validity domain or a coordinate validity test.
 */
export type CRSBounds = readonly [
  minimum: readonly [number, number, number],
  maximum: readonly [number, number, number]
];

/** Rendering factors in effective target-axis order. Horizontal factors measure
 * WGS84 reference-surface metres per stored coordinate unit through the full inverse
 * transform. For projected CRSs the vertical factor uses the square root of the
 * inverse horizontal area scale, expressed in the declared vertical unit.
 * This sizing convention is independent of altitude conversion; use the component
 * unit metadata and converters for physical heights. Geocentric/identity factors
 * are constant physical unit conversions.
 */
export type CRSRenderingScale = readonly [x: number, y: number, z: number];

/** Evaluate at a position in the descriptor's CRS; null means scale calculation failed. */
export type CRSRenderingScaleCallback = (coordinate: CRSCoordinate) => CRSRenderingScale | null;

/** Synchronous conversion; omit output to allocate an array, or supply storage to reuse it. */
export interface CRSConversion {
  (coordinate: CRSCoordinate): number[];
  <T extends CRSOutput>(coordinate: CRSCoordinate, output: T): T;
}

/** Prepared bidirectional conversion between a source CRS and a descriptor's target CRS. */
export interface CRSConverter {
  /** Convert source coordinates to target coordinates, optionally reusing output storage. */
  readonly from: CRSConversion;
  /** Convert target coordinates to source coordinates, optionally reusing output storage. */
  readonly to: CRSConversion;
  /** Normalize source coordinates for the target projection, optionally reusing output storage. */
  readonly normalize: CRSConversion;
}

/** Prepared CRS metadata, target-space behavior, and converters keyed by source CRS string.
 * WGS84 uses longitude/latitude in degrees and ellipsoidal height in metres. Converters
 * retain the engine's datum policy; fourth and later components pass through.
 */
export interface CRSDescriptor extends CRSMetadata {
  /** Original string under default conventions; otherwise a resolved @math.gl/geospatial/crs signature.
   * Opaque to consumers; no arbitrary CRS equivalence comparison is implied.
   * Does not fingerprint algorithm implementations or grid contents; equality does
   * not guarantee packed-coordinate interchangeability across engines.
   */
  readonly signature: string;
  /** Finite XYZ envelope chosen as an appropriate rendering target, in effective units and axis order.
   * Bounds describe a rendering policy for the reference surface, not the algorithm's
   * mathematical validity domain or altitude limits. Coordinates outside the envelope
   * may still be converted; being inside it does not guarantee a valid conversion.
   */
  readonly renderingBounds: CRSBounds;
  /** Constant scale or target-position callback; no viewport fallback is applied. */
  readonly renderingScale: CRSRenderingScale | CRSRenderingScaleCallback;
  /** Return rendering sizing factors at the anchor; null means sampling is unavailable
   * or derivatives fail numerical agreement. Invalid finite geometry raises an error. */
  getRenderingScale(coordinate: CRSCoordinate): CRSRenderingScale | null;
  /** Prepared converters; WGS84 is always available, plus explicitly requested source strings. */
  readonly converter: Readonly<Record<string, CRSConverter>> & {
    readonly WGS84: CRSConverter;
  };
}
