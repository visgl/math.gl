// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Portable point, line, and triangle primitive types. */
export const GL_PRIMITIVE = {
  POINTS: 0x0000,
  LINES: 0x0001,
  TRIANGLES: 0x0004
} as const;

/** WebGL-compatible primitive topology constants. */
export const GL_PRIMITIVE_MODE = {
  POINTS: 0x0000,
  LINES: 0x0001,
  LINE_LOOP: 0x0002,
  LINE_STRIP: 0x0003,
  TRIANGLES: 0x0004,
  TRIANGLE_STRIP: 0x0005,
  TRIANGLE_FAN: 0x0006
} as const;

/** WebGL-compatible vertex component type constants. */
export const GL_TYPE = {
  BYTE: 5120,
  UNSIGNED_BYTE: 5121,
  SHORT: 5122,
  UNSIGNED_SHORT: 5123,
  INT: 5124,
  UNSIGNED_INT: 5125,
  FLOAT: 5126,
  DOUBLE: 5130,
  UNSIGNED_SHORT_4_4_4_4: 32819,
  UNSIGNED_SHORT_5_5_5_1: 32820,
  UNSIGNED_SHORT_5_6_5: 33635
} as const;

/** WebGL-compatible constants used by geometry utilities. */
export const GL = {
  ...GL_PRIMITIVE_MODE,
  ...GL_TYPE
} as const;
