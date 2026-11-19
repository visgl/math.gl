// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, type Table} from 'apache-arrow';
import {unnestArrowColumn} from './unnest-arrow-column';
import {getExpressionColumns, type Expression} from '../expressions';
import {
  parseSQLSelectCompound,
  type SQLSelectStatement,
  type SQLSelectStatementOptions,
  type SQLSort,
  type SQLTableBinding
} from '../parser/parse-sql-statement';
import {executeArrowProjection, queryArrowTable, type ArrowTableQuery} from './query-arrow-table';
import type {ArrowAggregate} from './aggregates';
import {
  getProjectionOperations,
  mapArrowExpressionChildren,
  prepareArrowColumn
} from './create-arrow-columns';
import {parseSQLExpression} from '../parser/parse-sql-expression';
import type {AggregateFunction, ArrowFunctionPackage, PreparedScalarFunction} from './types';
import {groupArrowTable, type BoundRelationAggregate} from './relational-query';
import {
  bindSQLAggregate,
  getSQLAggregateCall,
  getSQLAggregateFunctions,
  rejectSQLAggregates
} from './sql-aggregate-functions';

/** Metadata emitted by declarations in a nested package. */
type PackageMetadata<F, Depth extends readonly unknown[] = []> = F extends
  | PreparedScalarFunction<infer M>
  | AggregateFunction<infer M>
  ? M
  : Depth['length'] extends 12
    ? unknown
    : F extends readonly (infer Item)[]
      ? PackageMetadata<Item, [...Depth, unknown]>
      : never;

/** An Arrow query result with metadata attributed to each projected column. */
export type ArrowSQLMetadataResult<M> = {
  /** Query output with its native Apache Arrow schema. */
  readonly table: Table;
  /** Ordered metadata grouped by final SQL output name. */
  readonly columnMetadata: Readonly<Record<string, readonly M[] | undefined>>;
};

type Execution = Pick<ArrowTableQuery, 'signal' | 'functions'>;

/** A synchronous SQL source that derives an Arrow table from one catalog table. */
export type ArrowSQLTableFunction = (input: Table) => Table;

/** Controls relational SQL execution and its function registries. */
export type ArrowSQLQueryOptions = Execution &
  SQLSelectStatementOptions & {
    /** Case-insensitive names usable in table positions as NAME(input_table). */
    tableFunctions?: Readonly<Record<string, ArrowSQLTableFunction>>;
  };

/** Executes relational SQL over a caller-supplied catalog of in-memory Arrow tables. */
export function queryArrowSQL(
  sql: string,
  tables: ReadonlyMap<string, Table>,
  options: ArrowSQLQueryOptions = {}
): Table {
  return executeSQL(sql, tables, options, false).table;
}

/** Runs an Arrow SQL query and returns typed metadata from its registered functions. */
export function queryArrowSQLWithMetadata<const F extends readonly ArrowFunctionPackage[] = []>(
  sql: string,
  tables: ReadonlyMap<string, Table>,
  options: Omit<ArrowSQLQueryOptions, 'functions'> & {functions?: F} = {}
): ArrowSQLMetadataResult<PackageMetadata<F>> {
  return executeSQL(sql, tables, options, true) as ArrowSQLMetadataResult<PackageMetadata<F>>;
}

/** Executes SELECT branches before applying the compound query's ordering and pagination. */
function executeSQL(
  sql: string,
  tables: ReadonlyMap<string, Table>,
  options: ArrowSQLQueryOptions,
  collectMetadata: boolean
): ArrowSQLMetadataResult<unknown> {
  const {inputs, orderBy, offset, limit} = parseSQLSelectCompound(sql, options);
  const execution = {signal: options.signal, functions: options.functions};
  const tableFunctions = options.tableFunctions ?? {};
  /** Resolves a catalog binding or invokes its registered table source. */
  const resolveTable = ({name, inputTable}: SQLTableBinding) => {
    if (inputTable === undefined) return getTable(tables, name);
    const key = Object.keys(tableFunctions).find(key => key.toUpperCase() === name.toUpperCase());
    if (key === undefined) throw new Error(`Unknown Arrow SQL table function: ${name}`);
    execution.signal?.throwIfAborted();
    return tableFunctions[key]!(getTable(tables, inputTable));
  };
  const operations = getProjectionOperations(options.functions);
  const aggregateFunctions = getSQLAggregateFunctions(execution.functions);
  const results = inputs.map(input =>
    executeSelect(input, resolveTable, execution, operations, aggregateFunctions)
  );
  const [first, ...rest] = results.map(result => result.table) as [Table, ...Table[]];
  // Plan the final order against the projected names, including SELECT aliases.
  const table = queryArrowTable(first, {
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
  const columnMetadata: Record<string, readonly unknown[]> = Object.create(null);
  if (collectMetadata)
    table.schema.fields.forEach((field, index) => {
      columnMetadata[field.name] = Object.freeze(
        results.flatMap(
          result => result.columnMetadata[result.table.schema.fields[index]!.name] ?? []
        )
      );
    });
  return {table, columnMetadata: Object.freeze(columnMetadata)};
}

function planOrder(orderBy?: readonly SQLSort[]) {
  return orderBy?.map(({expression, direction, nulls}) => {
    /** Qualified projected output name, including UNNEST aliases. */
    const column = qualifiedColumn(expression);
    return {
      column: column?.qualifier ? column.qualifier + '.' + column.name : requireColumn(expression),
      direction,
      nulls
    };
  });
}

function executeSelect(
  statement: SQLSelectStatement,
  resolveTable: (binding: SQLTableBinding) => Table,
  execution: Execution,
  operations: ReturnType<typeof getProjectionOperations>,
  aggregateFunctions: ReturnType<typeof getSQLAggregateFunctions>
): ArrowSQLMetadataResult<unknown> {
  let source = resolveTable(statement.from);
  const leftAlias = statement.from.alias ?? statement.from.name;
  const [right] = statement.joins;
  let join: ArrowTableQuery['join'];
  let rightAlias: string | undefined;
  let rightTable: Table | undefined;
  if (right?.unnest) {
    if (statement.joins.length !== 1)
      throw new Error('UNNEST currently supports one expansion per SELECT');
    const {expression, columns, ordinality} = right.unnest;
    const column = qualifiedColumn(expression);
    if (!column || (column.qualifier && column.qualifier !== leftAlias))
      throw new Error('UNNEST requires a column of its parent table');
    const field = source.schema.fields.find(field => field.name === column.name);
    if (!field) throw new Error(`Unknown UNNEST column: ${column.name}`);
    const map = DataType.isMap(field.type);
    if (!map && !DataType.isList(field.type) && !DataType.isFixedSizeList(field.type))
      throw new Error('SQL UNNEST requires List, FixedSizeList or Map');
    if (columns.length !== (map ? 2 : 1) + (ordinality ? 1 : 0))
      throw new Error('UNNEST column alias count does not match its output');
    rightAlias = right.table.alias!;
    if (rightAlias === leftAlias) throw new Error('Duplicate Arrow SQL table alias');
    source = unnestArrowColumn(source, column.name, {
      valueColumn: rightAlias + '.' + columns[map ? 1 : 0],
      keyColumn: map ? rightAlias + '.' + columns[0] : undefined,
      ordinalColumn: ordinality ? rightAlias + '.' + columns[map ? 2 : 1] : undefined,
      outer: right.type === 'left',
      signal: execution.signal
    });
  } else if (right) {
    if (statement.joins.length > 1 || right.type !== 'inner')
      throw new Error('Arrow SQL supports one INNER JOIN per SELECT');
    rightAlias = right.table.alias ?? right.table.name;
    rightTable = resolveTable(right.table);
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
      if (column.qualifier) {
        if (
          [source, rightTable].some(table =>
            table?.schema.fields.some(field => field.name === column.qualifier)
          )
        )
          return undefined;
        throw new Error(`Unknown Arrow SQL table alias: ${column.qualifier}`);
      }
      const onRight = rightTable?.schema.fields.some(field => field.name === column.name);
      if (!onRight) return column.name;
      if (source.schema.fields.some(field => field.name === column.name))
        throw new Error(`Ambiguous Arrow SQL column: ${column.name}`);
      return rightAlias + '.' + column.name;
    });
  const groupBy = statement.groupBy?.map(expression => {
    rejectSQLAggregates(expression, aggregateFunctions, 'GROUP BY');
    return requireColumn(bind(expression));
  });
  if (statement.where) rejectSQLAggregates(statement.where, aggregateFunctions, 'WHERE');
  const builtins = new Map<string, ArrowAggregate>();
  const customCalls = new Map<string, NonNullable<ReturnType<typeof getSQLAggregateCall>>>();
  const names = new Set(
    [...source.schema.fields, ...(rightTable?.schema.fields ?? [])].map(field => field.name)
  );
  for (const selection of statement.select ?? []) {
    if (selection.alias) names.add(selection.alias);
    for (const name of getExpressionColumns(bind(selection.expression))) names.add(name);
  }
  let nextAggregate = 0;
  const rewrite = (node: Expression): Expression => {
    const call = getSQLAggregateCall(node, aggregateFunctions);
    if (!call) return mapArrowExpressionChildren(node, rewrite);
    let name: string;
    do {
      name = '__aggregate_' + nextAggregate++;
    } while (names.has(name));
    names.add(name);
    for (const arg of call.arguments)
      rejectSQLAggregates(arg, aggregateFunctions, 'aggregate arguments');
    if (call.builtin) {
      builtins.set(
        name,
        call.arguments[0]
          ? {operation: call.builtin, expression: call.arguments[0]}
          : {operation: 'COUNT'}
      );
    } else {
      customCalls.set(name, call);
    }
    return {type: 'Identifier', name};
  };
  const select = statement.select?.map(({expression, alias}, index) => {
    const topLevel = getSQLAggregateCall(expression, aggregateFunctions);
    const bound = rewrite(bind(expression));
    if (bound.type === 'Identifier')
      return {column: bound.name, as: alias ?? (topLevel ? `aggregate_${index + 1}` : undefined)};
    return {expression: bound, as: alias};
  });
  const grouped = Boolean(groupBy?.length || builtins.size || customCalls.size);
  if (grouped) {
    const valid = new Set([...(groupBy ?? []), ...builtins.keys(), ...customCalls.keys()]);
    for (const selection of select ?? []) {
      const references =
        'column' in selection ? [selection.column] : getExpressionColumns(selection.expression);
      const ungrouped = references.find(name => !valid.has(name));
      if (ungrouped)
        throw new Error(`Arrow SQL column ${ungrouped} must appear in GROUP BY or an aggregate`);
    }
  }

  const query = {
    ...execution,
    join,
    where: statement.where && {expression: bind(statement.where)}
  };
  const columnMetadata: Record<string, readonly unknown[]> = Object.create(null);
  if (!grouped && (!operations.length || !select)) {
    return {table: queryArrowTable(source, {...query, select}), columnMetadata};
  }
  let input = queryArrowTable(source, query);
  const custom = new Map<string, BoundRelationAggregate & {metadata?: unknown}>();
  if (grouped) {
    for (const [name, call] of customCalls)
      custom.set(name, bindSQLAggregate(call, input, execution.functions, execution.signal));
    input = groupArrowTable(
      input,
      groupBy ?? [],
      Object.fromEntries(builtins),
      {
        inputSchema: input.schema,
        ...execution
      },
      custom
    );
  }
  const table = executeArrowProjection(
    input,
    {select, ...execution},
    operations.length
      ? (expression, name) => {
          const result = prepareArrowColumn(
            input,
            typeof expression === 'string' ? parseSQLExpression(expression) : expression,
            operations,
            execution.functions
          );
          columnMetadata[name] = result.metadata;
          return result.compiled;
        }
      : undefined
  );
  if (custom.size) {
    table.schema.fields.forEach((field, index) => {
      const selection = select?.[index];
      const references = selection
        ? 'column' in selection
          ? [selection.column]
          : getExpressionColumns(selection.expression)
        : [field.name];
      const metadata = references.flatMap(name => {
        const entry = custom.get(name)?.metadata;
        return entry === undefined ? [] : [entry];
      });
      if (metadata.length)
        columnMetadata[field.name] = [...metadata, ...(columnMetadata[field.name] ?? [])];
    });
  }
  return {table, columnMetadata};
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
function bindColumns(
  node: Expression,
  resolve: (column: Column) => string | undefined
): Expression {
  if (node.type === 'Identifier' && node['sqlWildcard']) return node;
  const column = qualifiedColumn(node);
  const name = column && resolve(column);
  if (name !== undefined) return {type: 'Identifier', name};
  const bind = (child: unknown) => bindColumns(child as Expression, resolve);
  switch (node.type) {
    case 'BinaryExpression':
    case 'LogicalExpression':
      return {...node, left: bind(node.left), right: bind(node.right)};
    case 'UnaryExpression':
      return {...node, argument: bind(node.argument)};
    case 'CallExpression':
      return {...node, arguments: node.arguments.map(bind)};
    case 'MemberExpression': {
      if (node.computed || node.property.type !== 'Identifier')
        throw new Error('Arrow SQL struct access requires a field identifier');
      const name = String(node.property['name']);
      return {
        type: 'CallExpression',
        callee: {type: 'Identifier', name: 'STRUCT_EXTRACT'},
        arguments: [bind(node.object), {type: 'Literal', value: name, raw: JSON.stringify(name)}]
      };
    }
    case 'ConditionalExpression':
      return {
        ...node,
        test: bind(node.test),
        consequent: bind(node.consequent),
        alternate: bind(node.alternate)
      };
    default:
      return node;
  }
}
