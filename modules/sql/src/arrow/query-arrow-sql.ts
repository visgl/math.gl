// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import {getExpressionColumns, type Expression} from '../expressions';
import {
  parseSQLSelectCompound,
  type SQLSelectStatement,
  type SQLSelectStatementOptions,
  type SQLSort,
  type SQLTableBinding
} from '../parser/parse-sql-statement';
import {
  executeArrowProjection,
  executeArrowTableQuery as queryArrowTable,
  type ArrowTableQuery
} from './query-arrow-table';
import type {ArrowAggregate} from './aggregates';
import {
  getProjectionOperations,
  mapArrowExpressionChildren,
  prepareArrowColumn
} from './create-arrow-columns';
import {parseSQLExpression} from '../parser/parse-sql-expression';
import type {
  AggregateFunction,
  ArrowFunctionPackage,
  PreparedScalarFunction,
  TableFunction
} from './types';
import {groupArrowTable, type BoundRelationAggregate} from './relational-query';
import {spatialJoinCall, spatialJoinRadius, sqlSpatialJoin} from './sql-spatial-join';
import {
  bindSQLAggregate,
  getSQLAggregateCall,
  getSQLAggregateFunctions,
  rejectSQLAggregates
} from './sql-aggregate-functions';
import {
  getSQLTableFunctions,
  joinLateralTable,
  validateSQLTableResult
} from './sql-table-function-packages';

/** Metadata emitted by declarations in a nested package. */
type PackageMetadata<F, Depth extends readonly unknown[] = []> = F extends
  | PreparedScalarFunction<infer M>
  | AggregateFunction<infer M>
  | TableFunction<infer M>
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

/** A synchronous catalog-table transform. Prefer a flat TableFunction for schema binding. */
export type ArrowSQLTableFunction = (input: Table) => Table;

/** Supported registrations and parser options for relational Arrow SQL. */
export type ArrowSQLQueryOptions = Execution &
  SQLSelectStatementOptions & {
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
  const operations = getProjectionOperations(options.functions);
  const aggregateFunctions = getSQLAggregateFunctions(execution.functions);
  const tableFunctions = getSQLTableFunctions(execution.functions);
  const resolveTable = (binding: SQLTableBinding) =>
    resolveSQLTable(binding, tables, tableFunctions, options.tableFunctions, execution.signal);
  /** Single SELECT ordering can reference source expressions before final projection. */
  const localOrder = inputs.length === 1 && orderBy ? {orderBy, offset, limit} : undefined;
  const results = inputs.map(input =>
    executeSelect(
      input,
      resolveTable,
      execution,
      operations,
      aggregateFunctions,
      tableFunctions,
      localOrder
    )
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
    orderBy: rest.length ? planOrder(orderBy, first) : undefined,
    offset: localOrder ? undefined : offset,
    limit: localOrder ? undefined : limit
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

function planOrder(orderBy: readonly SQLSort[] | undefined, table: Table) {
  return orderBy?.map(({expression, direction, nulls}) => {
    /** Qualified projected output name, including UNNEST aliases. */
    const column = qualifiedColumn(expression);
    return {
      column:
        expression.type === 'Literal' && typeof expression.value === 'number'
          ? selectPosition(table, expression.value)
          : column?.qualifier
            ? column.qualifier + '.' + column.name
            : requireColumn(expression),
      direction,
      nulls
    };
  });
}

function executeSelect(
  statement: SQLSelectStatement,
  resolveTable: (binding: SQLTableBinding) => ArrowSQLMetadataResult<unknown>,
  execution: Execution,
  operations: ReturnType<typeof getProjectionOperations>,
  aggregateFunctions: ReturnType<typeof getSQLAggregateFunctions>,
  tableFunctions: ReturnType<typeof getSQLTableFunctions>,
  ordering?: {orderBy: readonly SQLSort[]; offset?: number; limit?: number}
): ArrowSQLMetadataResult<unknown> {
  const left = resolveTable(statement.from);
  let source = left.table;
  const relationMetadata = new Map(Object.entries(left.columnMetadata));
  const leftAlias = statement.from.alias ?? statement.from.name;
  const [first, second] = statement.joins;
  const lateral = first?.unnest ? first : undefined;
  const right = lateral ? second : first;
  const lateralAlias = lateral?.table.alias;
  if (statement.joins.length > (lateral ? 2 : 1) || right?.unnest) {
    throw new Error('Arrow SQL supports one lateral expansion followed by one JOIN');
  }
  let join: ArrowTableQuery['join'];
  let rightAlias: string | undefined;
  let rightTable: Table | undefined;
  if (lateral?.unnest && lateralAlias) {
    const {expression, columns, ordinality, functionName = 'UNNEST'} = lateral.unnest;
    const column = qualifiedColumn(expression);
    if (!column || (column.qualifier && column.qualifier !== leftAlias))
      throw new Error(`${functionName} requires a column of its parent table`);
    const field = source.schema.fields.find(field => field.name === column.name);
    if (!field) throw new Error(`Unknown ${functionName} column: ${column.name}`);
    const descriptor = tableFunctions.get(functionName.toUpperCase());
    if (!descriptor?.bindLateral)
      throw new Error(`Unknown Arrow SQL lateral table function: ${functionName}`);
    if (lateralAlias === leftAlias) throw new Error('Duplicate Arrow SQL table alias');
    const bound = descriptor.bindLateral({
      inputSchema: source.schema,
      argument: field,
      ordinality
    });
    source = joinLateralTable(
      source,
      bound,
      lateralAlias,
      columns,
      lateral.type === 'left',
      execution.signal
    );
    bound.outputSchema.fields.forEach((field, index) =>
      relationMetadata.set(lateralAlias + '.' + columns[index], bound.columnMetadata?.[field.name])
    );
  }
  if (right) {
    if (right.type === 'cross') throw new Error('Arrow SQL CROSS JOIN requires a lateral input');
    rightAlias = right.table.alias ?? right.table.name;
    const resolved = resolveTable(right.table);
    rightTable = resolved.table;
    for (const [name, metadata] of Object.entries(resolved.columnMetadata))
      relationMetadata.set(rightAlias + '.' + name, metadata);
    if (leftAlias === rightAlias || lateralAlias === rightAlias) {
      throw new Error('Duplicate Arrow SQL table alias');
    }
    const {on} = right;
    const spatial = spatialJoinCall(on);
    if (!spatial && (on.type !== 'BinaryExpression' || on.operator !== '=='))
      throw new Error(
        'Arrow SQL JOIN requires equality between two columns or a supported spatial predicate'
      );
    const operands = spatial ?? [
      (on as {left: Expression}).left,
      (on as {right: Expression}).right
    ];
    /** Bind an unqualified ON operand only when exactly one side supplies the name. */
    const sides = operands.slice(0, 2).map(operand => {
      const column = qualifiedColumn(operand);
      if (!column || column.qualifier) return column;
      const onLeft = source.schema.fields.some(field => field.name === column.name);
      const onRight = rightTable!.schema.fields.some(field => field.name === column.name);
      if (onLeft === onRight) return undefined;
      return {...column, qualifier: onLeft ? leftAlias : rightAlias};
    });
    const left = sides.find(
      column =>
        column &&
        (column.qualifier === leftAlias || (lateralAlias && column.qualifier === lateralAlias))
    );
    const rightColumn = sides.find(column => column?.qualifier === rightAlias);
    if (!left || !rightColumn) throw new Error('Qualify both Arrow SQL JOIN keys when ambiguous');
    const leftKey = left.qualifier === lateralAlias ? lateralAlias + '.' + left.name : left.name;
    const rightPrefix = rightAlias + '.';
    if (spatial) {
      if (right.type === 'semi' || right.type === 'anti')
        throw new Error('Arrow SQL spatial joins require INNER or LEFT JOIN');
      const predicate = bindColumns(on, column =>
        column.qualifier === rightAlias || (lateralAlias && column.qualifier === lateralAlias)
          ? column.qualifier + '.' + column.name
          : column.name
      );
      source = sqlSpatialJoin(
        source,
        rightTable,
        leftKey,
        rightColumn.name,
        rightPrefix,
        predicate,
        spatialJoinRadius(spatial[2]),
        right.type === 'left',
        execution.functions,
        execution.signal
      );
    } else {
      join = {
        type: right.type,
        table: rightTable,
        left: leftKey,
        right: rightColumn.name,
        rightPrefix
      };
    }
  }

  /** Existence joins expose only the left-side schema to subsequent clauses. */
  const projectsRight = right?.type !== 'semi' && right?.type !== 'anti';
  const bind = (node: Expression): Expression =>
    bindColumns(node, column => {
      if (column.qualifier === leftAlias) return column.name;
      if (
        column.qualifier &&
        ((projectsRight && column.qualifier === rightAlias) || column.qualifier === lateralAlias)
      )
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
      const onRight =
        projectsRight && rightTable?.schema.fields.some(field => field.name === column.name);
      if (!onRight) return column.name;
      if (source.schema.fields.some(field => field.name === column.name))
        throw new Error(`Ambiguous Arrow SQL column: ${column.name}`);
      return rightAlias + '.' + column.name;
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
  /** Lowered computed keys, evaluated before grouping and removed from the final projection. */
  const computedKeys = new Map<string, {expression: Expression; as: string}>();
  /** Resolves GROUP BY positions and aliases against the original SELECT expressions. */
  const resolvedGroupKeys = statement.groupBy?.map(expression => {
    const selected =
      expression.type === 'Literal' && typeof expression.value === 'number'
        ? statement.select?.[expression.value - 1]
        : expression.type === 'Identifier' &&
            !source.schema.fields.some(field => field.name === expression.name) &&
            !(
              projectsRight &&
              rightTable?.schema.fields.some(field => field.name === expression.name)
            )
          ? statement.select?.find(item => item.alias === expression.name)
          : undefined;
    if (expression.type === 'Literal' && typeof expression.value === 'number' && !selected)
      throw new Error('Arrow SQL GROUP BY position must refer to a SELECT item');
    const bound = bind(selected?.expression ?? expression);
    rejectSQLAggregates(bound, aggregateFunctions, 'GROUP BY');
    if (bound.type === 'Identifier') return bound.name;
    const key = expressionKey(bound);
    const existing = computedKeys.get(key);
    if (existing) return existing.as;
    const name = reserveInternalName(names, '__group_key');
    computedKeys.set(key, {expression: bound, as: name});
    return name;
  });
  /** Equivalent names, aliases, and positions define a single key. */
  const groupBy = resolvedGroupKeys && [...new Set(resolvedGroupKeys)];
  /** Replaces a matching expression with the materialized key after grouping. */
  const rewriteGroupKeys = (node: Expression): Expression => {
    if (!computedKeys.size) return node;
    const key = computedKeys.get(expressionKey(node));
    return key
      ? {type: 'Identifier', name: key.as}
      : mapArrowExpressionChildren(node, rewriteGroupKeys);
  };
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
  /** Lowered projections before assigning default names to computed fields. */
  const projections = statement.select?.map(({expression, alias}, index) => {
    const topLevel = getSQLAggregateCall(expression, aggregateFunctions);
    const original = bind(expression);
    const bound = rewriteGroupKeys(rewrite(original));
    if (bound.type === 'Identifier' && (topLevel || original.type === 'Identifier'))
      return {column: bound.name, as: alias ?? (topLevel ? `aggregate_${index + 1}` : undefined)};
    return {expression: bound, as: alias};
  });
  /** Reserve explicitly named columns before naming any computed projections. */
  const projectionNames = new Set<string>();
  for (const item of projections ?? []) {
    const name = item.as ?? ('column' in item ? item.column : undefined);
    if (name !== undefined) projectionNames.add(name);
  }
  /** Assign the same default names as the Arrow projection binder before resolving ORDER BY. */
  const select = projections?.map((item, index) =>
    item.as === undefined && 'expression' in item
      ? {...item, as: reserveInternalName(projectionNames, `expression_${index + 1}`)}
      : item
  );
  for (const name of projectionNames) names.add(name);
  /** Expands output aliases outside aggregate arguments in post-group clauses. */
  function rewriteOutputReferences(node: Expression): Expression {
    if (getSQLAggregateCall(node, aggregateFunctions)) return rewrite(bind(node));
    if (node.type === 'CallExpression')
      return {
        ...node,
        arguments: node.arguments.map(argument => rewriteOutputReferences(argument as Expression))
      };
    if (node.type === 'Identifier') {
      /** SQL output aliases take precedence for unqualified references in this clause. */
      const selection = select?.find(item => item.as === node.name);
      if (selection)
        return 'column' in selection
          ? {type: 'Identifier', name: selection.column}
          : selection.expression;
      return bind(node);
    }
    if (qualifiedColumn(node)) return bind(node);
    return mapArrowExpressionChildren(node, rewriteOutputReferences);
  }
  /** Post-group filtering resolves output aliases and binds hidden aggregate calls. */
  const having = statement.having && rewriteGroupKeys(rewriteOutputReferences(statement.having));
  /** Sort expressions that are not already exposed as projected names or positions. */
  const sortKeys = ordering?.orderBy.map(
    (sort): SQLSort & {column?: string; position?: number; bound?: Expression} => {
      const {expression} = sort;
      if (expression.type === 'Literal' && typeof expression.value === 'number')
        return {...sort, position: expression.value};
      const column = qualifiedColumn(expression);
      const name =
        column && (column.qualifier ? column.qualifier + '.' + column.name : column.name);
      if (
        name &&
        select?.some(
          item => item.as === name || (!item.as && 'column' in item && item.column === name)
        )
      )
        return {...sort, column: name};
      const bound = rewriteGroupKeys(rewriteOutputReferences(expression));
      if (
        !select &&
        bound.type === 'Identifier' &&
        !builtins.has(bound.name) &&
        !customCalls.has(bound.name)
      )
        return {...sort, column: bound.name, bound};
      return {...sort, column: reserveInternalName(names, '__sort_key'), bound};
    }
  );
  const grouped = Boolean(groupBy?.length || builtins.size || customCalls.size);
  if (having && !grouped) throw new Error('Arrow SQL HAVING requires grouping or an aggregate');
  if (grouped) {
    const valid = new Set([...(groupBy ?? []), ...builtins.keys(), ...customCalls.keys()]);
    for (const selection of [
      ...(select ?? []),
      ...(having ? [{expression: having}] : []),
      ...(sortKeys?.flatMap(key => (key.bound ? [{expression: key.bound}] : [])) ?? [])
    ]) {
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
  /** Attaches inherited table metadata only to direct field projections. */
  const result = (table: Table): ArrowSQLMetadataResult<unknown> => {
    table.schema.fields.forEach(({name}, index) => {
      const item = select?.[index];
      const from = !item ? name : 'column' in item ? item.column : undefined;
      const metadata = from && relationMetadata.get(from);
      if (metadata?.length) columnMetadata[name] = [...metadata, ...(columnMetadata[name] ?? [])];
    });
    return {table, columnMetadata};
  };
  if (!grouped && !sortKeys?.length && (!operations.length || !select)) {
    return result(queryArrowTable(source, {...query, select}));
  }
  let input = queryArrowTable(source, query);
  const custom = new Map<string, BoundRelationAggregate & {metadata?: unknown}>();
  if (grouped) {
    if (computedKeys.size) {
      input = queryArrowTable(input, {
        ...execution,
        select: [...input.schema.fields.map(field => field.name), ...computedKeys.values()]
      });
    }
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
    if (having) input = queryArrowTable(input, {...execution, where: {expression: having}});
  }
  /** Working projections for hidden sort keys, stripped before publishing the result. */
  const hidden =
    sortKeys?.flatMap(key =>
      key.bound && (key.bound.type !== 'Identifier' || key.column !== key.bound.name)
        ? [{expression: key.bound, as: key.column}]
        : []
    ) ?? [];
  /** SQL wildcard projects source fields ahead of any hidden sort expressions. */
  const visible = select ?? (grouped ? (groupBy?.map(column => ({column})) ?? []) : undefined);
  const output = hidden.length
    ? [...(visible ?? input.schema.fields.map(field => ({column: field.name}))), ...hidden]
    : visible;
  let table = executeArrowProjection(
    input,
    {select: output, ...execution},
    operations.length || custom.size
      ? (expression, name) => {
          const result = prepareArrowColumn(
            input,
            typeof expression === 'string' ? parseSQLExpression(expression) : expression,
            operations,
            execution.functions,
            node => (node.type === 'Identifier' ? custom.get(node.name)?.metadata : undefined)
          );
          columnMetadata[name] = result.metadata;
          return result.compiled;
        }
      : undefined
  );
  if (sortKeys?.length) {
    const visibleCount = table.numCols - hidden.length;
    table = queryArrowTable(table, {
      ...execution,
      offset: ordering?.offset,
      limit: ordering?.limit,
      orderBy: sortKeys.map(({column, position, direction, nulls}) => ({
        column: position === undefined ? column! : selectPosition(table, position, visibleCount),
        direction,
        nulls
      }))
    });
    if (hidden.length)
      table = table.selectAt(Array.from({length: visibleCount}, (_, index) => index));
  }
  if (custom.size) {
    table.schema.fields.forEach((field, index) => {
      const selection = select?.[index];
      const reference = selection
        ? 'column' in selection
          ? selection.column
          : undefined
        : field.name;
      const entry = reference === undefined ? undefined : custom.get(reference)?.metadata;
      if (entry !== undefined) columnMetadata[field.name] = [entry];
    });
  }
  return result(table);
}

/** Resolves a catalog table or a registered standalone table function. */
function resolveSQLTable(
  binding: SQLTableBinding,
  tables: ReadonlyMap<string, Table>,
  functions: ReturnType<typeof getSQLTableFunctions>,
  legacy: Readonly<Record<string, ArrowSQLTableFunction>> = {},
  signal?: AbortSignal
): ArrowSQLMetadataResult<unknown> {
  if (binding.inputTable === undefined)
    return {table: getTable(tables, binding.name), columnMetadata: {}};
  const input = getTable(tables, binding.inputTable);
  const name = binding.name.toUpperCase();
  const descriptor = functions.get(name);
  const legacyKey = Object.keys(legacy).find(key => key.toUpperCase() === name);
  signal?.throwIfAborted();
  if (descriptor?.bind) {
    if (legacyKey !== undefined) throw new Error(`Duplicate Arrow SQL table function: ${name}`);
    const bound = descriptor.bind(input.schema);
    const table = bound.evaluate(input, {signal});
    signal?.throwIfAborted();
    validateSQLTableResult(table, bound.outputSchema);
    return {table, columnMetadata: bound.columnMetadata ?? {}};
  }
  if (legacyKey !== undefined) return {table: legacy[legacyKey]!(input), columnMetadata: {}};
  throw new Error(`Unknown Arrow SQL table function: ${binding.name}`);
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

/** Resolves a one-based position in the visible SELECT output. */
function selectPosition(table: Table, position: number, visibleCount = table.numCols): string {
  if (!Number.isInteger(position) || position < 1 || position > visibleCount)
    throw new Error('Arrow SQL ORDER BY position must refer to a SELECT item');
  return table.schema.fields[position - 1]!.name;
}

/** Identifies equivalent bound SQL expressions independently of literal spelling. */
function expressionKey(node: Expression): string {
  return JSON.stringify(node, (name, value) => {
    if (name === 'raw') return undefined;
    if (typeof value === 'bigint') return {bigint: value.toString()};
    if (typeof value === 'number' && (!Number.isFinite(value) || Object.is(value, -0)))
      return {number: Object.is(value, -0) ? '-0' : String(value)};
    return value;
  });
}

/** Reserves a temporary column name without shadowing a source or SELECT field. */
function reserveInternalName(names: Set<string>, prefix: string): string {
  let name = prefix;
  while (names.has(name)) name += '_';
  names.add(name);
  return name;
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
