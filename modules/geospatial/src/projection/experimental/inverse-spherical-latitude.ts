// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original Cartesian rotation identity; preserves the horizontal components near a pole instead of subtracting a rounded sine from one.

export function inverseSphericalLatitude(
  sin0: number,
  cos0: number,
  sinDistance: number,
  cosDistance: number,
  x: number,
  y: number,
  radius: number
): number {
  const east = (x * sinDistance) / radius;
  const meridian = cosDistance * cos0 - (y * sinDistance * sin0) / radius;
  const vertical = cosDistance * sin0 + (y * sinDistance * cos0) / radius;
  return Math.atan2(vertical, Math.hypot(east, meridian));
}
