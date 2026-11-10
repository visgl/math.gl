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
} from '@math.gl/core/sql';
import type {
  TableQuery,
  TableReference,
  TableSelection,
  SQLCatalogQuery,
  SQLPredicate,
  BoundSQLPredicate
} from '@math.gl/core/sql';
import type {ColumnarPredicate} from '@math.gl/core/expressions';

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
