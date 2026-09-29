// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Raw PROJ parameters. Angles are decimal degrees and lengths are meters. */
export type ProjectionParameters = Readonly<Record<string, string | undefined>>;

/** Mutable scratch owned by the caller. Hooks must update synchronously and never retain it. */
export type ProjectionPoint = {x: number; y: number; z: number};

/** A projection operates on radians and meters; the engine handles CRS units. */
export type ProjectionImplementation = {
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
