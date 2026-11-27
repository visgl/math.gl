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
  return vectorSpans(type, active.length, row => (active[row] ? input : undefined), evaluate);
}

/** Selects union rows from either branch, preserving the selected child buffers. */
export function selectUnionVectors(
  type: DataType,
  yes: Vector,
  no: Vector,
  selected: Uint8Array,
  active: Uint8Array,
  failed?: Uint8Array
): Vector {
  return vectorSpans(
    type,
    active.length,
    row => (active[row] && !failed?.[row] ? (selected[row] ? yes : no) : undefined),
    span => span
  );
}

/** Combines contiguous spans from a vector callback, using typed nulls for gaps. */
function vectorSpans(
  type: DataType,
  length: number,
  sourceAt: (row: number) => Vector | undefined,
  evaluate: (span: Vector) => Vector
): Vector {
  const chunks: Data[] = [];
  for (let start = 0; start < length; ) {
    const source = sourceAt(start);
    let end = start + 1;
    while (end < length && sourceAt(end) === source) end++;
    if (source) chunks.push(...evaluate(source.slice(start, end)).data);
    else chunks.push(nullVectorData(type, end - start));
    start = end;
  }
  return new Vector(chunks.length ? chunks : [nullVectorData(type, 0)]);
}
