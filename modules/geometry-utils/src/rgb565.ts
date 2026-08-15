// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Decodes a packed RGB565 value into 8-bit RGB components. */
export function decodeRGB565(rgb565: number, target: number[] = [0, 0, 0]): number[] {
  const red = (rgb565 >> 11) & 31;
  const green = (rgb565 >> 5) & 63;
  const blue = rgb565 & 31;
  target[0] = (red << 3) | (red >> 2);
  target[1] = (green << 2) | (green >> 4);
  target[2] = (blue << 3) | (blue >> 2);
  return target;
}

/** Encodes 8-bit RGB components into a packed RGB565 value. */
export function encodeRGB565(rgb: ArrayLike<number>): number {
  const red = Math.round(clampByte(rgb[0] ?? 0) * (31 / 255));
  const green = Math.round(clampByte(rgb[1] ?? 0) * (63 / 255));
  const blue = Math.round(clampByte(rgb[2] ?? 0) * (31 / 255));
  return (red << 11) | (green << 5) | blue;
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, value));
}
