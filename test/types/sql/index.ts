// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  parseSQLQuery,
  parseSQLExpression,
  parseSQLSelect,
  parseSQLPredicate,
  bindSQLPredicate,
  validateSQLPredicate,
  isSQLPredicate,
  SQL_PREDICATE_JSON_SCHEMA
} from '@math.gl/sql/parser';
import type {
  TableQuery,
  TableReference,
  TableSelection,
  SQLCatalogQuery,
  SQLPredicate,
  BoundSQLPredicate
} from '@math.gl/sql/parser';
import type {ColumnarPredicate} from '@math.gl/sql/expressions';

const reference: TableReference = {source: 'warehouse', table: 'cities'};
const selection: TableSelection = {column: 'city', as: 'name'};
const predicate: SQLPredicate = parseSQLPredicate('population > :min', {
  preserveParameters: true
});
const bound: BoundSQLPredicate = bindSQLPredicate(predicate, {min: 10});
const portable: ColumnarPredicate = bound;
const query: TableQuery = {
  from: reference,
  select: [selection],
  where: portable,
  limit: 5
};
const parsed: TableQuery | SQLCatalogQuery = parseSQLQuery('SHOW SOURCES');
const structural: TableQuery = parseSQLSelect('SELECT city WHERE population > 10', {
  parseWhere: parseSQLPredicate
});
validateSQLPredicate(bound);
const valid: boolean = isSQLPredicate(predicate);
void [query, parsed, structural, valid, SQL_PREDICATE_JSON_SCHEMA];
// @ts-expect-error Logical queries have no execution signal.
const controlled: TableQuery = {signal: new AbortController().signal};
// @ts-expect-error Table references require both source and table names.
const incomplete: TableReference = {source: 'warehouse'};
// @ts-expect-error Catalog commands use a closed discriminant.
const unsupported: SQLCatalogQuery = {command: 'showDatabases'};
// @ts-expect-error Parameters must be bound before using the default TableQuery.
const unresolved: TableQuery = {where: predicate};
void [controlled, incomplete, unsupported, unresolved];

const castSelection: TableSelection = {
  expression: parseSQLExpression('value::INTEGER'),
  as: 'count'
};
void castSelection;

const computedQuery = parseSQLQuery('SELECT SIN(angle) AS value WHERE x + 1 > 0');
if ('where' in computedQuery && computedQuery.where && 'expression' in computedQuery.where) {
  const expression: import('@math.gl/sql/expressions').Expression = computedQuery.where.expression;
  void expression;
}

const byteSelection: import('@math.gl/sql/parser').TableSelection = {
  array: ['r', 'g', 'b', 'a'],
  as: 'color',
  type: 'uint8'
};
void byteSelection;

// The primary entry point accepts native Arrow tables and typed function declarations.
import {tableFromArrays} from 'apache-arrow';
import {
  queryArrowSQL,
  queryArrowTable,
  queryArrowTableInBatches,
  type ArrowTableQuery,
  type ArrowStreamingQuery
} from '@math.gl/sql/query';
import {SQRT} from '@math.gl/sql/math-functions';
import {COLOR_RGB} from '@math.gl/sql/color-functions';

const orders = tableFromArrays({quantity: new Int32Array([2, 1, 3])});
const tables = new Map([['orders', orders]]);
queryArrowSQL('SELECT SQRT(CAST(quantity AS FLOAT64)) AS root FROM orders', tables, {
  functions: [SQRT, COLOR_RGB]
});
const tableQuery: ArrowTableQuery = {select: ['quantity'], limit: 2};
queryArrowTable(orders, tableQuery);
const streamingQuery: ArrowStreamingQuery = {...tableQuery, emitEmptyBatches: true};
queryArrowTableInBatches(orders.batches, orders.schema, streamingQuery);

import {parseSQLScaleAST, parseSQLScaleExpression, type ParsedSQLScale} from '@math.gl/sql/scales';
import {SCALE_CONFORMANCE_CASES, type ScaleConformanceCase} from '@math.gl/sql/scales-conformance';

const parsedScale: ParsedSQLScale = parseSQLScaleAST(
  parseSQLExpression('SCALE_LINEAR(quantity, DOMAIN(0, 10), RANGE(0, 1))')
);
const textScale: ParsedSQLScale = parseSQLScaleExpression(
  'SCALE_LINEAR(quantity, DOMAIN(0, 10), RANGE(0, 1))'
);
const scaleCases: readonly ScaleConformanceCase[] = SCALE_CONFORMANCE_CASES;
void parsedScale;
void textScale;
void scaleCases;
// @ts-expect-error The AST entry point does not accept SQL source text.
parseSQLScaleAST('quantity');

// Readonly tuples and palette lists bind through the public parser APIs.
import type {SQLParameters, SQLParameterValue} from '@math.gl/sql/parser';
const sqlParameters: SQLParameters = {
  minimum: 1,
  vector: [1, 2, 3] as const,
  names: ['a', 'b'] as const,
  colors: [
    [0, 0, 0],
    [1, 1, 1, 1]
  ] as const
};
const sqlValue: SQLParameterValue = sqlParameters.colors!;
parseSQLExpression(':vector', {parameters: sqlParameters});
parseSQLQuery('SELECT :minimum AS minimum', {parameters: sqlParameters});
queryArrowSQL('SELECT :minimum FROM data', new Map(), {parameters: sqlParameters});
// @ts-expect-error Arbitrary objects are not SQL values.
const invalidSQLValue: SQLParameterValue = {value: 1};
void [sqlValue, invalidSQLValue];

import type {SQLBinaryParameter, SQLNumericArray} from '@math.gl/sql/parser';
const binaryText: SQLBinaryParameter = {type: 'utf8', value: new Uint8Array([65])};
const numericArray: SQLNumericArray = new Float32Array([1, 2]);
parseSQLExpression('fn(:values, :text)', {parameters: {values: numericArray, text: binaryText}});
// @ts-expect-error UTF-8 requires byte storage, not a JavaScript string.
const invalidBinary: SQLBinaryParameter = {type: 'utf8', value: 'text'};
void invalidBinary;
