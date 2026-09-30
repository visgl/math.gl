// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

/** A projection operates on radians and meters; the engine handles CRS units. */
export type ProjectionImplementation = {
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
