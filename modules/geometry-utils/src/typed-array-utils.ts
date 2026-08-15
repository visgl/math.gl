// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Concatenates the visible bytes of multiple typed-array or DataView instances. */
export function concatTypedArrays(arrays: readonly ArrayBufferView[] = []): Uint8Array {
  const byteLength = arrays.reduce((length, array) => length + array.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (const array of arrays) {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    result.set(bytes, byteOffset);
    byteOffset += bytes.byteLength;
  }
  return result;
}
