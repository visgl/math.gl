// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {isSQLParameterSnapshot} from './parameter-snapshots';
import type {SQLParameterOptions} from './sql-parameters';
import type {SQLPredicateParameterValues} from './sql-predicate-types';
import {reportDiagnosticError, type DiagnosticLog} from '../diagnostic-log';
import type {TableQuery} from './query-types';
import {parseSQLExpression} from './parse-sql-expression';
import {parseSQLPredicate} from './parse-sql-predicate';
import type {BoundSQLPredicate, SQLPredicateProperty} from './sql-predicate-types';
import type {SQLCatalogQuery} from './query-types';
import {parseSQLSelect, SQLQueryReader} from './parse-sql-select';

/** Parses the supported SELECT subset or SHOW SOURCES, SHOW TABLES and DESCRIBE commands. */
export function parseSQLQuery(
  sql: string,
  options: SQLParameterOptions & {log?: DiagnosticLog} = {}
): TableQuery | SQLCatalogQuery {
  try {
    return parseQuery(sql, options);
  } catch (error) {
    reportDiagnosticError(options?.log, error);
    throw error;
  }
}

/** Parses a SQL request, including internal grammar fallbacks. */
function parseQuery(sql: string, options: SQLParameterOptions): TableQuery | SQLCatalogQuery {
  const reader = new SQLQueryReader(sql, options);
  if (reader.takeKeyword('SHOW')) {
    let request: SQLCatalogQuery;
    if (reader.takeKeyword('SOURCES')) request = {command: 'showSources'};
    else {
      reader.expectKeyword('TABLES');
      request = reader.takeKeyword('FROM')
        ? {command: 'showTables', from: reader.identifier()}
        : {command: 'showTables'};
    }
    reader.end();
    return request;
  }
  if (reader.takeKeyword('DESCRIBE')) {
    const source = reader.identifier();
    const from = reader.takeSymbol('.') ? {source, table: reader.identifier()} : source;
    reader.end();
    return {command: 'describe', from};
  }
  return parseSQLSelect(sql, {
    ...options,
    parseWhere: expression => {
      try {
        // The portable predicate fast path accepts scalars. Arrays and custom bindings
        // are handled by the shared expression parser below.
        if (options.parseParameter || isSQLParameterSnapshot(options.parameters))
          throw new Error('Custom parameter AST requires expression parsing');
        const predicate = parseSQLPredicate(expression, {
          parameters: options.parameters as SQLPredicateParameterValues
        });
        validateColumnReferences(predicate);
        return predicate;
      } catch {
        return {expression: parseSQLExpression(expression, options)};
      }
    }
  });
}

/** Routes unquoted nested fields to expression evaluation instead of flat predicates. */
function validateColumnReferences(predicate: BoundSQLPredicate): void {
  if (predicate.op === 'and' || predicate.op === 'or') {
    predicate.args.forEach(validateColumnReferences);
  } else if (predicate.op === 'not') validateColumnReferences(predicate.args[0]);
  else {
    const values =
      predicate.op === 'in'
        ? predicate.args[1]
        : predicate.op === 'isNull'
          ? []
          : [predicate.args[1]];
    if (values.some(value => value instanceof Date || value instanceof Uint8Array))
      throw new Error('Date and binary values require expression evaluation');
    const property = predicate.args[0] as SQLPredicateProperty;
    if (!property.quoted && property.property.includes('.'))
      throw new Error(
        'Nested fields require expression evaluation; quote literal column names containing dots.'
      );
  }
}
