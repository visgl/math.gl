// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Dictionary,
  Int32,
  LargeUtf8,
  Utf8,
  vectorFromArray,
} from "apache-arrow";
import { expect, test } from "vitest";
import { createArrowUtf8Reader } from "../../src/arrow";

for (const type of [
  new Utf8(),
  new LargeUtf8(),
  new Dictionary(new Utf8(), new Int32()),
]) {
  test(`createArrowUtf8Reader reads sliced and chunked ${type}`, () => {
    const first = vectorFromArray(["skip", "", null], type).slice(1);
    const vector = first.concat(vectorFromArray(["東京", "last"], type));
    const read = createArrowUtf8Reader(vector);
    for (const row of [2, 0, 3, 1, -1, 4, 0.5]) {
      const range = read(row);
      const decoded =
        range &&
        new TextDecoder().decode(range[0].subarray(range[1], range[2]));
      expect(decoded).toBe(["", null, "東京", "last"][row] ?? null);
    }
  });
}

test("returns the original bytes and reuses the range tuple", () => {
  const vector = vectorFromArray(["a", "bb"], new Utf8());
  const read = createArrowUtf8Reader(vector);
  const first = read(0)!;
  expect(first[0]).toBe(vector.data[0]!.values);
  expect(read(1)).toBe(first);
  expect(first.slice(1)).toEqual([1, 3]);
  expect(() => createArrowUtf8Reader(vectorFromArray([1]))).toThrow(TypeError);
});
