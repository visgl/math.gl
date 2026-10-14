// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CRSMetadata} from '@math.gl/crs';
import type {TypeScriptCRSInput} from './crs/spatial-reference';
import type {
  CreateProjectionOptions,
  ProjectionEngine,
  ProjectionCoordinate,
  ProjectionOutput
} from '../types';

/** Raw PROJ parameters. Angles are decimal degrees and lengths are meters. */
export type ProjectionParameters = Readonly<Record<string, string | undefined>>;

/** Mutable scratch owned by the caller. Hooks must update synchronously and never retain it. */
export type ProjectionPoint = {x: number; y: number; z: number};

/** Engine-validated interleaved floating-point storage. */
export type ProjectionFlatOperation = (
  coordinates: Float32Array | Float64Array,
  dimension: number
) => void;
/** Unit conversion for a horizontal geographic/projected batch, in pipeline order. */
export type ProjectionFlatContext = {
  readonly inputScale: number;
  readonly outputScale: number;
};

/** Projection-owned reference-surface envelope and geographic normalization, in radians/metres. */
export type ProjectionRenderingProfile = {
  /** Finite native XYZ envelope chosen as an appropriate rendering target.
   * This is a rendering policy, not the algorithm's mathematical validity domain.
   * Coordinates outside it may still be converted; membership does not validate a coordinate.
   * Horizontal projections use zero reference height; geocentric profiles enclose XYZ.
   */
  readonly bounds: readonly [readonly [number, number, number], readonly [number, number, number]];
  /** Native geographic longitude at the center of the normalization interval, in radians. */
  readonly longitudeCenter: number;
  /** Maximum absolute latitude for normalization, in radians. */
  readonly maxLatitude: number;
  /** Optional rendering-domain clamp on native geographic radians; preserve altitude.
   * Conversion kernels remain unrestricted by this rendering envelope.
   */
  normalize?(point: ProjectionPoint): void;
};

/** A projection operates on radians and meters; the engine handles CRS units. */
export type ProjectionImplementation = {
  /** Projection-specific bounds and normalization derived at initialization. */
  readonly profile?: ProjectionRenderingProfile;
  /** Optional whole-buffer specialization. Return undefined to keep the general pipeline.
   * Called only for geographic/projected pairs without datum, axis, prime-meridian,
   * vertical-unit, longitude-wrap or lossy stages. The engine validates storage and stride.
   * The operation must validate each XYZ, scale XY before/after projection, check domains
   * and Float32 range, preserve Z/trailing ordinates, and commit only completed records.
   * Factories run at construction; operations must not retain buffers or scratch across calls.
   */
  createForwardFlat?(context: ProjectionFlatContext): ProjectionFlatOperation | undefined;
  createInverseFlat?(context: ProjectionFlatContext): ProjectionFlatOperation | undefined;
  /** Optional mutable hooks avoid scalar coordinate arrays; preserve z for horizontal projections. */
  forwardInPlace?(point: ProjectionPoint): void;
  inverseInPlace?(point: ProjectionPoint): void;
  /** Optional Cartesian operations used by geocentric plugins. */
  forward3D?(point: [number, number, number]): [number, number, number];
  inverse3D?(point: [number, number, number]): [number, number, number];
  forward(longitude: number, latitude: number): [number, number];
  inverse(x: number, y: number): [number, number];
};

/** Initialized geometry shared by projection plugins. No datum shift is implied. */
export type ProjectionContext = {
  /** Preserve the normalized polar axis; recovering it from eccentricity can lose precision. */
  readonly semiMinorAxis?: number;
  readonly semiMajorAxis: number;
  readonly eccentricitySquared: number;
  readonly parameters: ProjectionParameters;
};

/** Explicit registration avoids global state and imports of unused projections. */
export type ProjectionPlugin = {
  readonly name: string;
  readonly aliases?: readonly string[];
  /** Projection-specific PROJ parameters accepted in addition to the core parameters. */
  readonly parameters: readonly string[];
  /** Parameters accepted without a value, such as +south. */
  readonly flags?: readonly string[];
  create(context: ProjectionContext): ProjectionImplementation;
};

/** Coordinate conventions used when resolving a single CRS. */
export type GetCRSOptions = Pick<CreateProjectionOptions, 'enforceAxis' | 'mode'> & {
  /** Additional source CRS strings to prepare; WGS84 is always included. */
  converters?: readonly string[];
};

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
export type CRSRenderingScaleCallback = (
  coordinate: ProjectionCoordinate
) => CRSRenderingScale | null;

/** Synchronous conversion; omit output to allocate an array, or supply storage to reuse it. */
export interface CRSConversion {
  (coordinate: ProjectionCoordinate): number[];
  <T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T;
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
  /** Original string under default conventions; otherwise a resolved @math.gl/crs signature.
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
  getRenderingScale(coordinate: ProjectionCoordinate): CRSRenderingScale | null;
  /** Prepared converters; WGS84 is always available, plus explicitly requested source strings. */
  readonly converter: Readonly<Record<string, CRSConverter>> & {
    readonly WGS84: CRSConverter;
  };
}

/** General CRS-capable engine; specialized pair-only engines need not implement retrieval. */
export interface CRSEngine extends ProjectionEngine {
  /** Resolve metadata and preload only required algorithms. Returned conversions are synchronous. */
  getCRS(definition: TypeScriptCRSInput, options?: GetCRSOptions): Promise<CRSDescriptor>;
}
