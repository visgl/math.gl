// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Geometry of a sphere or oblate spheroid, in metres. No datum, axes or epoch metadata.
 * Both axes must be finite and positive, with semiMinorAxis <= semiMajorAxis.
 */
export type SpheroidParameters = {
  readonly semiMajorAxis: number;
  readonly semiMinorAxis: number;
};
