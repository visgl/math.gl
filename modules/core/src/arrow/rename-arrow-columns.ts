// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import {validateArrowTableSchema, areArrowTypesEquivalent} from './arrow-schema-utils';

type StringKeyOf<T> = Extract<keyof T, string>;

/**
 * Mapping from source Arrow field names to target Arrow field names.
 *
 * @typeParam TSource - Source Arrow type map.
 * @typeParam TTarget - Target Arrow type map.
 */
export type ArrowFieldNameMap<
  TSource extends arrow.TypeMap,
  TTarget extends arrow.TypeMap
> = Partial<Record<StringKeyOf<TSource>, StringKeyOf<TTarget>>>;

/**
 * Type map produced by renaming selected source Arrow fields to target Arrow fields.
 *
 * @typeParam TSource - Source Arrow type map.
 * @typeParam TTarget - Target Arrow type map.
 * @typeParam TFieldNameMap - Source-to-target field name mapping.
 */
export type RenamedArrowColumns<
  TSource extends arrow.TypeMap,
  TTarget extends arrow.TypeMap,
  TFieldNameMap extends ArrowFieldNameMap<TSource, TTarget>
> = Omit<TSource, keyof TFieldNameMap> & {
  [TSourceName in keyof TFieldNameMap as TFieldNameMap[TSourceName] extends string
    ? TFieldNameMap[TSourceName]
    : never]: TSourceName extends keyof TSource
    ? TFieldNameMap[TSourceName] extends keyof TTarget
      ? TTarget[TFieldNameMap[TSourceName]]
      : never
    : never;
};

/**
 * Validates an Arrow table against a source schema, then renames selected columns to fields defined
 * in a target schema while preserving any untouched source columns.
 *
 * This is useful when an Arrow endpoint emits wire-format field names such as `record_id`, but a
 * consumer wants a table with JavaScript-oriented field names such as `recordId`.
 *
 * @typeParam TSource - Source Arrow type map.
 * @typeParam TTarget - Target Arrow type map containing renamed fields.
 * @typeParam TFieldNameMap - Source-to-target field name mapping.
 * @param table - Arrow table to validate and rename.
 * @param sourceSchema - Expected schema for the input table.
 * @param targetSchema - Schema that defines renamed field names and their expected types.
 * @param fieldNameMap - Source-to-target field name mapping.
 * @returns New Arrow table with renamed columns.
 */
export function renameArrowColumns<
  TSource extends arrow.TypeMap,
  TTarget extends arrow.TypeMap,
  TFieldNameMap extends ArrowFieldNameMap<TSource, TTarget>
>(
  table: arrow.Table,
  sourceSchema: arrow.Schema<TSource>,
  targetSchema: arrow.Schema<TTarget>,
  fieldNameMap: TFieldNameMap
): arrow.Table<RenamedArrowColumns<TSource, TTarget, TFieldNameMap>> {
  const validatedTable = validateArrowTableSchema(table, sourceSchema, {
    schemaName: 'source Arrow schema before column rename'
  });
  const targetFieldsByName = new Map(targetSchema.fields.map(field => [field.name, field]));
  const resultFields: arrow.Field[] = [];
  const resultColumns: Record<string, arrow.Vector> = Object.create(null);

  for (const sourceName of Object.keys(fieldNameMap)) {
    if (!validatedTable.schema.fields.some(field => field.name === sourceName)) {
      throw new Error(`Missing Arrow column for ${sourceName}`);
    }
  }

  for (const sourceField of validatedTable.schema.fields) {
    const sourceName = sourceField.name as StringKeyOf<TSource>;
    const renamedFieldName = Object.prototype.hasOwnProperty.call(fieldNameMap, sourceName)
      ? fieldNameMap[sourceName]
      : undefined;
    const resultFieldName = renamedFieldName ?? sourceName;
    const resultField =
      renamedFieldName === undefined ? sourceField : targetFieldsByName.get(resultFieldName);
    if (!resultField) {
      throw new Error(`Missing target Arrow field for ${resultFieldName}`);
    }
    const sourceColumn = validatedTable.getChild(sourceName);

    if (sourceColumn === null || sourceColumn === undefined) {
      throw new Error(`Missing Arrow column for ${sourceName}`);
    }
    if (resultColumns[resultFieldName] !== null && resultColumns[resultFieldName] !== undefined) {
      throw new Error(`Duplicate Arrow column name after rename: ${resultFieldName}`);
    }
    if (
      !areArrowTypesEquivalent(sourceColumn.type, resultField.type) ||
      sourceField.nullable !== resultField.nullable
    ) {
      throw new Error(
        `Unexpected Arrow schema for renamed field ${resultFieldName}: ` +
          `expected type ${resultField.type.typeId}, got ${sourceColumn.type.typeId}`
      );
    }

    resultFields.push(resultField);
    resultColumns[resultFieldName] = sourceColumn;
  }

  const resultSchema = new arrow.Schema(
    resultFields,
    new Map(validatedTable.schema.metadata),
    undefined,
    validatedTable.schema.metadataVersion
  );
  const renamedTable = new (arrow.Table as any)(resultSchema, resultColumns) as arrow.Table<
    RenamedArrowColumns<TSource, TTarget, TFieldNameMap>
  >;

  return validateArrowTableSchema(renamedTable, resultSchema, {
    schemaName: 'renamed Arrow schema'
  });
}
