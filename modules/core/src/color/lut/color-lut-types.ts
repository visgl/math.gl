// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Numerical RGB lookup table, independent of its file encoding or renderer. */
export type ColorLUT = {
  /** Independent 1D curves or one 3D RGB mapping. */
  dimension: 1 | 3;
  /** Number of samples along each axis. */
  size: number;
  /** Interleaved RGB values, red coordinate varying fastest for 3D tables. */
  data: Float32Array;
  /** Minimum input coordinate for each channel. */
  domainMinimum: number[];
  /** Maximum input coordinate for each channel. */
  domainMaximum: number[];
  /** Optional strictly increasing normalized knots from 0 through 1. */
  inputGrid?: Float64Array;
};
