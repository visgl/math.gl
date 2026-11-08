// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Counts retained backing buffers once, including shared buffers and entire subview buffers.
 * This is an input-buffer budget, not an estimate of total JavaScript heap usage.
 */
export function getInputByteLength(input: unknown): number {
  const seen = new Set<object>();
  let bytes = 0;
  function visit(value: any): void {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (ArrayBuffer.isView(value)) {
      visit(value.buffer);
    } else if (
      value instanceof ArrayBuffer ||
      (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer)
    ) {
      bytes += value.byteLength;
    } else if (value instanceof Map) {
      for (const [key, item] of value) {
        visit(key);
        visit(item);
      }
    } else if (value instanceof Set) {
      for (const item of value) visit(item);
    } else {
      for (const key of Object.keys(value)) visit(value[key]);
    }
  }
  visit(input);
  return bytes;
}
