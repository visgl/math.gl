// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, makeData, Vector, vectorFromArray, type Data} from 'apache-arrow';

/** Creates null rows, placing dense union nulls in the first child. */
export function nullVectorData(type: DataType, length: number): Data {
  if (DataType.isDenseUnion(type)) {
    return makeData({
      type,
      length,
      typeIds: new Int8Array(length).fill(type.typeIds[0]),
      valueOffsets: new Int32Array(length),
      children: type.children.map((field, index) =>
        nullVectorData(field.type, index === 0 && length ? 1 : 0)
      )
    });
  }
  if (DataType.isList(type)) {
    return makeData({
      type,
      length,
      nullCount: length,
      nullBitmap: new Uint8Array(Math.ceil(length / 8)),
      valueOffsets: new Int32Array(length + 1),
      child: nullVectorData(type.valueType, 0)
    });
  }
  return vectorFromArray(new Array(length).fill(null), type).data[0];
}

/** Evaluates contiguous active spans and fills the gaps with typed nulls. */
export function evaluateVectorSpans(
  input: Vector,
  type: DataType,
  active: Uint8Array,
  evaluate: (span: Vector) => Vector
): Vector {
  if (!active.includes(0)) return evaluate(input);
  const chunks: Data[] = [];
  for (let start = 0; start < active.length; ) {
    const valid = Boolean(active[start]);
    let end = start + 1;
    while (end < active.length && Boolean(active[end]) === valid) end++;
    if (valid) chunks.push(...evaluate(input.slice(start, end)).data);
    else chunks.push(nullVectorData(type, end - start));
    start = end;
  }
  return new Vector(chunks);
}
