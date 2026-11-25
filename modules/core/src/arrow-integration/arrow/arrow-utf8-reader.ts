// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, type Vector} from 'apache-arrow';

/** Backing UTF-8 bytes, inclusive start and exclusive end. */
export type ArrowUtf8Range = [bytes: Uint8Array, start: number, end: number];

/**
 * Creates a zero-copy reader for Utf8, LargeUtf8 and dictionary-encoded text.
 * Null or out-of-bounds rows return null. The returned tuple is borrowed until
 * the next read. Copy its three fields to retain a range across reads.
 */
export function createArrowUtf8Reader(vector: Vector): (row: number) => ArrowUtf8Range | null {
  let type = vector.type;
  while (DataType.isDictionary(type)) type = type.dictionary;
  if (!DataType.isUtf8(type) && !DataType.isLargeUtf8(type)) {
    throw new TypeError('Expected an Arrow UTF-8 vector');
  }

  let end = 0;
  const chunks = vector.data.map(data => {
    const start = end;
    end += data.length;
    return {
      data,
      start,
      end,
      dictionary: data.dictionary && createArrowUtf8Reader(data.dictionary)
    };
  });
  let index = 0;
  const range: ArrowUtf8Range = [new Uint8Array(0), 0, 0];
  return row => {
    if (!Number.isInteger(row) || row < 0 || row >= vector.length) return null;
    if (row < chunks[index]!.start || row >= chunks[index]!.end) {
      let low = 0;
      let high = chunks.length - 1;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (row < chunks[middle]!.end) high = middle;
        else low = middle + 1;
      }
      index = low;
    }
    const {data, start, dictionary} = chunks[index]!;
    const local = row - start;
    if (!data.getValid(local)) return null;
    if (dictionary) return dictionary(Number(data.values[local]));
    range[0] = data.values as Uint8Array;
    range[1] = Number(data.valueOffsets[local]);
    range[2] = Number(data.valueOffsets[local + 1]);
    return range;
  };
}
