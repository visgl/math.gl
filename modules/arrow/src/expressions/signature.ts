// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {DataType, type Field} from 'apache-arrow';
import {typeKey} from './buffers';
/** Compares physical encoding as well as logical type when reusing a bound evaluator. */
export function physicalKey(type: DataType): string {
  try {
    return DataType.isDictionary(type)
      ? `dictionary:${typeKey(type.indices)}:${typeKey(type.dictionary)}:${type.isOrdered}`
      : typeKey(type);
  } catch {
    // Unreferenced columns may have nested or extension layouts outside this evaluator's subset.
    const properties = [
      'bitWidth',
      'isSigned',
      'precision',
      'scale',
      'unit',
      'timezone',
      'byteWidth',
      'listSize',
      'keysSorted',
      'isOrdered',
      'mode'
    ].map(key => (type as unknown as Record<string, unknown>)[key]);
    return JSON.stringify([
      type.typeId,
      properties,
      DataType.isUnion(type) ? Array.from(type.typeIds) : null,
      DataType.isDictionary(type)
        ? [physicalKey(type.indices), physicalKey(type.dictionary), type.isOrdered]
        : null,
      type.children?.map(field => [
        field.name,
        physicalKey(field.type),
        field.nullable,
        extensionKey(field)
      ])
    ]);
  }
}

/** Geometry encoding/CRS metadata is part of a schema-bound vector function contract. */
export function extensionKey(field: Field): string {
  return JSON.stringify([
    field.metadata.get('ARROW:extension:name'),
    field.metadata.get('ARROW:extension:metadata')
  ]);
}
