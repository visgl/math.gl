// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Wraps a number into the half-open range `[0, 1)`. */
export function emod(value: number): number {
  return ((value % 1) + 1) % 1;
}
