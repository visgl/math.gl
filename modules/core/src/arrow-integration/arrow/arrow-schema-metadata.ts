// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {validateArrowTableSchema} from './arrow-schema-utils';

/** Copies schema and nested field metadata maps without serializing Arrow types. */
export function snapshotArrowSchema<T extends arrow.TypeMap>(
  schema: arrow.Schema<T>
): arrow.Schema<T> {
  return mergeArrowSchemas(undefined, schema);
}

/**
 * Merges metadata from structurally equivalent Arrow schemas, with the later
 * value winning for each key. The output owns its metadata maps.
 */
export function mergeArrowSchemas<T extends arrow.TypeMap>(
  previous: arrow.Schema | undefined,
  next: arrow.Schema<T>
): arrow.Schema<T> {
  if (previous) {
    validateArrowTableSchema(new arrow.Table(next, []), previous, {rejectExtraFields: true});
  }
  const dictionaries = new Map<number, arrow.DataType>();
  const fields = next.fields.map((field, index) =>
    mergeFieldMetadata(previous?.fields[index], field, dictionaries)
  );
  return new arrow.Schema<T>(
    fields,
    new Map([...(previous?.metadata ?? []), ...next.metadata]),
    undefined,
    next.metadataVersion
  );
}

/** Snapshots one field and recurses into its type's metadata-bearing children. */
function mergeFieldMetadata<T extends arrow.DataType>(
  previous: arrow.Field | undefined,
  next: arrow.Field<T>,
  dictionaries: Map<number, arrow.DataType>
): arrow.Field<T> {
  return next.clone({
    type: mergeTypeMetadata(previous?.type, next.type, dictionaries),
    metadata: new Map([...(previous?.metadata ?? []), ...next.metadata])
  });
}

/** Retains native Arrow prototypes and shared dictionary value types. */
function mergeTypeMetadata<T extends arrow.DataType>(
  previous: arrow.DataType | undefined,
  next: T,
  dictionaries: Map<number, arrow.DataType>
): T {
  if (arrow.DataType.isDictionary(next)) {
    let values = dictionaries.get(next.id);
    if (!values) {
      values = mergeTypeMetadata(
        previous && arrow.DataType.isDictionary(previous) ? previous.dictionary : undefined,
        next.dictionary,
        dictionaries
      );
      dictionaries.set(next.id, values);
    }
    return cloneArrowType(next, 'dictionary', values);
  }
  if (!next.children?.length) return next;
  const children = next.children.map((field, index) =>
    mergeFieldMetadata(previous?.children?.[index], field, dictionaries)
  );
  return cloneArrowType(next, 'children', children);
}

/** Copies a native type instance with one updated metadata-bearing property. */
function cloneArrowType<T extends arrow.DataType>(type: T, property: string, value: unknown): T {
  return Object.create(Object.getPrototypeOf(type), {
    ...Object.getOwnPropertyDescriptors(type),
    [property]: {value, enumerable: true, writable: true, configurable: true}
  }) as T;
}
