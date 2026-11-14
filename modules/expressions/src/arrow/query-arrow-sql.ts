// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {Expression} from '../expressions/index';
import {
  parseSQLSelectCompound,
  type SQLSelectStatement,
  type SQLSelectStatementOptions,
  type SQLSort
} from '../sql/parse-sql-statement';
import {queryArrowTable, type ArrowTableQuery} from './query-arrow-table';
import type {ArrowAggregate} from './aggregates';

type Execution = Pick<ArrowTableQuery, 'signal' | 'functions'>;

/** Executes relational SQL over a caller-supplied catalog of in-memory Arrow tables. */
export function queryArrowSQL(
  sql: string,
  tables: ReadonlyMap<string, Table>,
  options: Execution & SQLSelectStatementOptions = {}
): Table {
  const {inputs, orderBy, offset, limit} = parseSQLSelectCompound(sql, options);
  const execution = {signal: options.signal, functions: options.functions};
  const [first, ...rest] = inputs.map(input => executeSelect(input, tables, execution)) as [
    Table,
    ...Table[]
  ];
  // Plan the final order against the projected names, including SELECT aliases.
  return queryArrowTable(first, {
    ...execution,
    union: rest.map(table => {
      if (table.numCols !== first.numCols)
        throw new Error('Arrow SQL UNION ALL requires the same number of columns in each input');
      return queryArrowTable(table, {
        select: table.schema.fields.map((field, index) => ({
          column: field.name,
          as: first.schema.fields[index]!.name
        })),
        signal: execution.signal
      });
    }),
    orderBy: planOrder(orderBy),
    offset,
    limit
  });
}

function planOrder(orderBy?: readonly SQLSort[]) {
  return orderBy?.map(({expression, direction, nulls}) => ({
    column: requireColumn(expression),
    direction,
    nulls
  }));
}

function executeSelect(
  statement: SQLSelectStatement,
  tables: ReadonlyMap<string, Table>,
  execution: Execution
): Table {
  const source = getTable(tables, statement.from.name);
  const leftAlias = statement.from.alias ?? statement.from.name;
  const [right] = statement.joins;
  let join: ArrowTableQuery['join'];
  let rightAlias: string | undefined;
  let rightTable: Table | undefined;
  if (right) {
    if (statement.joins.length > 1 || right.type !== 'inner')
      throw new Error('Arrow SQL supports one INNER JOIN per SELECT');
    rightAlias = right.table.alias ?? right.table.name;
    rightTable = getTable(tables, right.table.name);
    if (leftAlias === rightAlias) throw new Error('Duplicate Arrow SQL table alias');
    const {on} = right;
    if (on.type !== 'BinaryExpression' || on.operator !== '==')
      throw new Error('Arrow SQL JOIN requires equality between two columns');
    const sides = [on.left, on.right].map(node => qualifiedColumn(node as Expression));
    const left = sides.find(column => column?.qualifier === leftAlias);
    const rightColumn = sides.find(column => column?.qualifier === rightAlias);
    if (!left || !rightColumn) throw new Error('Qualify both Arrow SQL JOIN keys');
    join = {
      table: rightTable,
      left: left.name,
      right: rightColumn.name,
      rightPrefix: rightAlias + '.'
    };
  }

  const bind = (node: Expression): Expression =>
    bindColumns(node, column => {
      if (column.qualifier === leftAlias) return column.name;
      if (column.qualifier && column.qualifier === rightAlias)
        return column.qualifier + '.' + column.name;
      if (column.qualifier) throw new Error(`Unknown Arrow SQL table alias: ${column.qualifier}`);
      const onRight = rightTable?.schema.fields.some(field => field.name === column.name);
      if (!onRight) return column.name;
      if (source.schema.fields.some(field => field.name === column.name))
        throw new Error(`Ambiguous Arrow SQL column: ${column.name}`);
      return rightAlias + '.' + column.name;
    });
  const groupBy = statement.groupBy?.map(expression => requireColumn(bind(expression)));
  const aggregates = new Map<string, ArrowAggregate>();
  const select = statement.select?.map(({expression, alias}, index) => {
    const aggregate = planAggregate(expression, bind);
    if (aggregate) {
      const name = alias ?? `aggregate_${index + 1}`;
      if (aggregates.has(name) || groupBy?.includes(name))
        throw new Error(`Duplicate Arrow SQL aggregate name: ${name}`);
      aggregates.set(name, aggregate);
      return name;
    }
    const bound = bind(expression);
    if (bound.type === 'Identifier') return {column: bound.name, as: alias};
    return {expression: bound, as: alias};
  });
  return queryArrowTable(source, {
    ...execution,
    join,
    select,
    where: statement.where && {expression: bind(statement.where)},
    groupBy,
    aggregates: Object.fromEntries(aggregates)
  });
}

function getTable(tables: ReadonlyMap<string, Table>, name: string): Table {
  const table = tables.get(name);
  if (!table) throw new Error(`Unknown Arrow SQL table: ${name}`);
  return table;
}

type Column = {name: string; qualifier?: string};

function qualifiedColumn(node: Expression): Column | undefined {
  if (node.type === 'Identifier') return {name: node.name};
  if (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    node.property.type === 'Identifier'
  )
    return {name: String(node.property['name']), qualifier: String(node.object['name'])};
  return undefined;
}

function requireColumn(node: Expression): string {
  if (node.type !== 'Identifier')
    throw new Error('Arrow SQL requires a column name in this clause');
  return node.name;
}

/** Resolves SQL column references while leaving function names and literals intact. */
function bindColumns(node: Expression, resolve: (column: Column) => string): Expression {
  const column = qualifiedColumn(node);
  if (column) return {type: 'Identifier', name: resolve(column)};
  const bind = (child: unknown) => bindColumns(child as Expression, resolve);
  switch (node.type) {
    case 'BinaryExpression':
    case 'LogicalExpression':
      return {...node, left: bind(node.left), right: bind(node.right)};
    case 'UnaryExpression':
      return {...node, argument: bind(node.argument)};
    case 'CallExpression':
      return {...node, arguments: node.arguments.map(bind)};
    default:
      return node;
  }
}

const aggregateOperations = new Set<ArrowAggregate['operation']>([
  'COUNT',
  'SUM',
  'MIN',
  'MAX',
  'AVG',
  'EVERY',
  'BOOL_AND',
  'BOOL_OR',
  'BIT_AND',
  'BIT_OR',
  'BIT_XOR'
]);

function planAggregate(
  node: Expression,
  bind: (expression: Expression) => Expression
): ArrowAggregate | undefined {
  if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier' || !node.sqlFunction)
    return undefined;
  const operation = String(node.callee['name']).toUpperCase() as ArrowAggregate['operation'];
  if (!aggregateOperations.has(operation)) return undefined;
  if (node.arguments.length !== 1) throw new Error(`Arrow SQL ${operation} requires one argument`);
  const argument = node.arguments[0] as Expression & {sqlWildcard?: boolean};
  return operation === 'COUNT' && argument.sqlWildcard
    ? {operation}
    : {operation, expression: bind(argument)};
}
