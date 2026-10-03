// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
/** Prepared horizontal datum grid. Inputs/outputs are east-positive longitude/latitude radians. */
export type DatumGrid = {
  readonly subgridCount: number;
  /** Optional mutable hook. On false, x/y must remain unchanged; always preserve z. */
  shiftInPlace?(point: {x: number; y: number}, inverse: boolean): boolean;
  /** undefined means no usable subgrid covers this coordinate; other failures throw. */
  shift(longitude: number, latitude: number, inverse: boolean): [number, number] | undefined;
};
/** Per-instance registration. Readers produce grids before synchronous construction. */
export type DatumGridCollection = Readonly<Record<string, DatumGrid>>;
export type DatumGridReference = {
  readonly name: string;
  readonly optional: boolean;
  readonly grid?: DatumGrid;
};
/** Internal west-positive node layout, matching the pinned proj4js grid convention. */
export type Subgrid = {
  readonly origin: readonly [number, number];
  readonly step: readonly [number, number];
  readonly size: readonly [number, number];
  readonly shifts: readonly (readonly [number, number])[];
};

/** Geoid undulation N in metres: ellipsoidal height h = gravity-related height H + N.
 * Inputs are east-positive Greenwich longitude and latitude in radians, in the
 * horizontal datum of the CRS carrying +geoidgrids. Undefined means no coverage.
 */
export type VerticalGrid = {
  getOffset(longitude: number, latitude: number): number | undefined;
};
export type VerticalGridCollection = Readonly<Record<string, VerticalGrid>>;
