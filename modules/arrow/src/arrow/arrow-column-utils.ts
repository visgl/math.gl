// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  DataType,
  FixedSizeList,
  Float,
  Int,
  RecordBatch,
  Table,
  Type,
  Vector
} from 'apache-arrow';

/** Recognizes an Arrow table across Arrow package instances without loading the Arrow runtime. */
export function isArrowTable(value: unknown): value is Table {
  const table = value as Table | null | undefined;
  return Boolean(
    table &&
      Number.isInteger(table.numRows) &&
      Array.isArray(table.batches) &&
      Array.isArray(table.schema?.fields) &&
      typeof table.get === 'function' &&
      typeof table.getChild === 'function'
  );
}

// Arrow IPC type IDs are stable across Arrow package versions.
const INT_TYPE = 2 satisfies Type.Int;
const FLOAT_TYPE = 3 satisfies Type.Float;
const FIXED_SIZE_LIST_TYPE = 16 satisfies Type.FixedSizeList;

/** Tests whether an Arrow type describes integer or floating-point scalars. */
export function isNumericArrowType(type: DataType): type is Int | Float {
  return type.typeId === INT_TYPE || type.typeId === FLOAT_TYPE;
}

/** Tests whether an Arrow type describes a fixed-size list. */
export function isFixedSizeListArrowType(type: DataType): type is FixedSizeList {
  return type.typeId === FIXED_SIZE_LIST_TYPE;
}

/**
 * Finds a column by path segments and returns null if a segment is missing.
 * Use a single segment for a literal name containing dots.
 */
export function findArrowColumn(
  source: Table | RecordBatch,
  path: readonly string[]
): Vector | null {
  if (!path.length) return null;
  let column: Vector | null = source.getChild(path[0]);
  for (let index = 1; column && index < path.length; index++) {
    column = column.getChild(path[index]);
  }
  return column;
}
