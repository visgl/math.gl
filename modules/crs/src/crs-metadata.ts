// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Metadata-only entry: importing units/signatures must not pull syntax readers into split bundles.
export {linearUnits} from './units-table';

/** Coordinate unit metadata. */
export type CRSUnit = Readonly<{
  /** Unit name, such as degrees, radians, meters, kilometers, or feet. */
  name: string;
  /** Metres per coordinate unit for linear units; omitted for angular units. */
  metersPerUnit?: number;
  /** Degrees per coordinate unit for angular units; omitted for linear units. */
  degreesPerUnit?: number;
}>;

/** Resolved executable CRS metadata, without projection algorithms or rendering conventions. */
export type CRSMetadata = Readonly<{
  /** Coordinate representation; identity describes an explicitly local, unreferenced space. */
  coordinateFrame: 'geographic' | 'projected' | 'geocentric' | 'identity';
  /** Resolved PROJ algorithm name, not a semantic CRS identity. */
  projection: string;
  /** Resolved PROJ parameters; angles are degrees and lengths are metres. */
  parameters: Readonly<Record<string, string | undefined>>;
  /** Resolved rotational ellipsoid. A sphere has equal axes; both axes are in metres. */
  ellipsoid: Readonly<{semiMajorAxis: number; semiMinorAxis: number}>;
  /** Effective array axis order/signs: e/w, n/s, u/d. Independent of authoritative axis order. */
  axis: string;
  /** Unit of the X component, such as degrees, radians, meters, kilometers, or feet. */
  xUnit: CRSUnit;
  /** Unit of the Y component, such as degrees, radians, meters, kilometers, or feet. */
  yUnit: CRSUnit;
  /** Unit of the Z component, such as degrees, radians, meters, kilometers, or feet. */
  zUnit: CRSUnit;
  /** Declared geographic area of use in Greenwich degrees: west, south, east, north.
   * East may be less than west for an extent crossing the antimeridian.
   */
  areaOfUse?: readonly [west: number, south: number, east: number, north: number];
  /** Whether explicit horizontal extraction discarded part of the input definition. */
  lossy: boolean;
}>;

/** Deterministic identity for resolved CRS metadata, independent of object/property order.
 * This compares execution conventions, not arbitrary semantic equivalence of CRS definitions.
 */
export function getCRSSignature(crs: CRSMetadata): string {
  // Derived rendering bounds and converter objects do not change resolved CRS identity.
  return JSON.stringify([
    crs.coordinateFrame,
    crs.projection,
    Object.keys(crs.parameters)
      .sort()
      .map(key => [key, crs.parameters[key]]),
    [crs.ellipsoid.semiMajorAxis, crs.ellipsoid.semiMinorAxis],
    crs.axis,
    [crs.xUnit.name, crs.xUnit.metersPerUnit, crs.xUnit.degreesPerUnit],
    [crs.yUnit.name, crs.yUnit.metersPerUnit, crs.yUnit.degreesPerUnit],
    [crs.zUnit.name, crs.zUnit.metersPerUnit, crs.zUnit.degreesPerUnit],
    crs.lossy,
    crs.areaOfUse
  ]);
}
