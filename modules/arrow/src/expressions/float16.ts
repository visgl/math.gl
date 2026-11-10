// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {getFloat16ArrayConstructor, isFloat16Array, isFloat16ArrayConstructor} from '@math.gl/core';

/** Requires decoded native binary16 arithmetic rather than treating Uint16 storage as numbers. */
export function requireFloat16(): void {
  if (!isFloat16ArrayConstructor(getFloat16ArrayConstructor()))
    throw new Error('Arrow Float16 expressions require native Float16Array support');
}
/** Views Arrow Uint16 binary16 storage through the native decoded numeric array, without copying. */
export function float16Values(values: Uint16Array | Float16Array): Float16Array {
  if (isFloat16Array(values)) return values;
  requireFloat16();
  const Constructor = getFloat16ArrayConstructor() as Float16ArrayConstructor;
  return new Constructor(values.buffer, values.byteOffset, values.length) as Float16Array;
}
/** Creates one rounding cell per bound operation. */
export function roundFloat16(): (value: number) => number {
  const cell = float16Values(new Uint16Array(1));
  return value => {
    cell[0] = value;
    return cell[0]!;
  };
}
