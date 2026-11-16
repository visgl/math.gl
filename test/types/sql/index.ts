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
} from '@math.gl/sql';
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

// Experimental catalog definitions are shared by loader and renderer integrations.
import {
  SQLCatalog,
  type SQLTableDefinition,
  type SQLTableInfo,
  type SQLTableSource
} from '@math.gl/sql';
import type {Table, Schema} from 'apache-arrow';

const arrowTable = tableFromArrays({id: new Int32Array([1])});
const lazySource: SQLTableSource = {
  async read({signal}): Promise<Table> {
    signal?.throwIfAborted();
    return arrowTable;
  },
  async getSchema(): Promise<Schema> {
    return arrowTable.schema;
  }
};
const tableDefinitions: SQLTableDefinition[] = [
  {name: 'resident', source: arrowTable, arrowSchema: arrowTable.schema},
  {schema: 'remote', name: 'lazy', source: lazySource}
];
const catalog = new SQLCatalog({tables: tableDefinitions, primaryTable: 'resident'});
const tableInfo: SQLTableInfo = catalog.describeTable({schema: 'remote', name: 'lazy'});
const queryResult: Table = catalog.query('SELECT *');
const asyncQueryResult: Promise<Table> = catalog.queryAsync('SELECT * FROM remote.lazy');
void [tableInfo, queryResult, asyncQueryResult];
// @ts-expect-error Materializers must return native Arrow tables.
const invalidSource: SQLTableSource = {read: async () => [{id: 1}]};
void invalidSource;
