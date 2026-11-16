// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Table, Schema, Utf8, Bool, vectorFromArray, tableFromArrays} from 'apache-arrow';
import {isArrowTable, validateArrowTableSchema} from '@math.gl/arrow';
import {
  parseSQLSelectCompound,
  skipSQLLineComments,
  type SQLSelectCompound,
  type SQLTableBinding
} from './sql/parse-sql-statement';
import {SQLQueryReader} from './sql/parse-sql-select';
import {executeArrowSQL, queryArrowSQL} from './arrow/query-arrow-sql';

/** Experimental structured SQL name. A string is a literal table name in the default schema. */
export type SQLTableName = string | Readonly<{schema: string; name: string}>;

/** Experimental asynchronous source; loaders and renderers retain connection and cache ownership. */
export interface SQLTableSource {
  /** Materializes one query's Arrow input. Cancellation is cooperative. */
  read(options: {signal?: AbortSignal}): Promise<Table>;
  /** Inspects types without loading rows. Omit when this is unavailable. */
  getSchema?(options: {signal?: AbortSignal}): Promise<Schema>;
}

/** Experimental framework-independent registration supplied by applications, loaders.gl or deck.gl adapters. */
export interface SQLTableDefinition {
  /** Literal table name; dots are not namespace separators. */
  name: string;
  /** SQL namespace, defaulting to the catalog's default schema (initially data). */
  schema?: string;
  /** Resident Arrow data or a lazy materializer owned by the caller. */
  source: Table | SQLTableSource;
  /** Optional declared physical types, validated when rows are read. */
  arrowSchema?: Schema;
  /** Human-readable description for catalog consumers. */
  description?: string;
}

/** Experimental synchronous metadata snapshot; inspection never materializes rows. */
export interface SQLTableInfo {
  /** Literal table name. */
  name: string;
  /** SQL namespace. */
  schema: string;
  /** Physical Arrow type schema, when known. */
  arrowSchema?: Schema;
  /** Caller-supplied description. */
  description?: string;
  /** Whether the source requires asynchronous materialization. */
  external: boolean;
  /** Whether omitted FROM selects this table. */
  primary: boolean;
  /** Row count for resident data only. */
  numRows?: number;
}

/** Experimental catalog construction options. */
export interface SQLCatalogOptions {
  /** Definitions, or literal table names mapped to resident/lazy sources. */
  tables?:
    | readonly SQLTableDefinition[]
    | ReadonlyMap<string, Table | SQLTableSource>
    | Readonly<Record<string, Table | SQLTableSource>>;
  /** Unqualified SQL names resolve here; defaults to data. */
  defaultSchema?: string;
  /** Explicit fallback for omitted FROM; never inferred from registration order. */
  primaryTable?: SQLTableName;
}

/** Existing SQL execution and parameter hooks, excluding the catalog-owned implicit binding. */
export type SQLCatalogQueryOptions = Omit<
  NonNullable<Parameters<typeof queryArrowSQL>[2]>,
  'defaultFrom'
>;

/** A captured catalog entry; query resolution retains it across registration changes. */
type Entry = Readonly<SQLTableDefinition & {schema: string}>;
/** Parsed metadata command, independent of materialization. */
type Discovery =
  | {kind: 'schemas'}
  | {kind: 'tables'; schema: string}
  | {kind: 'describe'; table: SQLTableName};

/**
 * Experimental named Arrow catalog for application, loaders.gl and deck.gl integrations.
 * APIs may change. No persistent data cache or cross-source transaction is implied.
 */
export class SQLCatalog {
  /** Namespace used for unqualified names. */
  readonly defaultSchema: string;
  /** Registered namespaces, including empty namespaces. */
  private readonly schemas = new Set<string>(['data']);
  /** Definitions keyed by an unambiguous serialized pair. */
  private readonly entries = new Map<string, Entry>();
  /** Explicit default input, stored as a structural identity. */
  private primary?: string;
  /** Subscribers to definition/primary changes; loading state belongs to callers. */
  private readonly listeners = new Set<() => void>();

  /** Registers initial definitions without loading external sources. */
  constructor(options: SQLCatalogOptions = {}) {
    this.defaultSchema = validName(options.defaultSchema ?? 'data');
    this.schemas.add(this.defaultSchema);
    const tables = options.tables;
    if (Array.isArray(tables)) {
      for (const definition of tables) this.registerTable(definition);
    } else if (tables) {
      const pairs = tables instanceof Map ? tables : Object.entries(tables);
      for (const [name, source] of pairs) this.registerTable({name, source});
    }
    if (options.primaryTable !== undefined) this.setPrimaryTable(options.primaryTable);
  }

  /** Adds an empty namespace. Existing namespaces are unchanged. */
  registerSchema(schema: string): void {
    validName(schema);
    if (!this.schemas.has(schema)) {
      this.schemas.add(schema);
      this.notify();
    }
  }

  /** Registers a copied definition; replacing an existing identity requires explicit opt-in. */
  registerTable(definition: SQLTableDefinition, options: {replace?: boolean} = {}): void {
    const entry = Object.freeze({
      ...definition,
      name: validName(definition.name),
      schema: validName(definition.schema ?? this.defaultSchema)
    });
    rejectForeignTable(entry.source);
    if (!(entry.source instanceof Table) && typeof entry.source?.read !== 'function')
      throw new Error('SQL table source requires an Arrow Table or read()');
    const key = this.key(entry);
    if (this.entries.has(key) && !options.replace)
      throw new Error(`SQL table already registered: ${label(entry)}`);
    if (entry.source instanceof Table && entry.arrowSchema)
      validate(entry.source, entry.arrowSchema, entry);
    this.entries.set(key, entry);
    this.schemas.add(entry.schema);
    this.notify();
  }

  /** Removes a definition and clears its primary designation; does not close caller-owned sources. */
  removeTable(name: SQLTableName): boolean {
    const key = this.key(name);
    if (!this.entries.delete(key)) return false;
    if (this.primary === key) this.primary = undefined;
    this.notify();
    return true;
  }

  /** Selects the fallback input, or clears it with undefined. */
  setPrimaryTable(name?: SQLTableName): void {
    const next = name === undefined ? undefined : this.key(this.require(name));
    if (this.primary !== next) {
      this.primary = next;
      this.notify();
    }
  }

  /** Subscribes to registration/removal/primary changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Lists registered SQL namespaces in registration order. */
  listSchemas(): string[] {
    return [...this.schemas];
  }

  /** Lists metadata without calling read() or getSchema(). Omission lists all schemas. */
  listTables(options: {schema?: string} = {}): SQLTableInfo[] {
    if (options.schema !== undefined) this.requireSchema(options.schema);
    return [...this.entries.values()]
      .filter(entry => options.schema === undefined || entry.schema === options.schema)
      .map(entry => this.info(entry));
  }

  /** Returns known physical types without I/O; arrowSchema may be undefined. */
  describeTable(name: SQLTableName): SQLTableInfo {
    return this.info(this.require(name));
  }

  /** Explicitly inspects external types when available; never loads table rows or persists a cache. */
  async describeTableAsync(
    name: SQLTableName,
    options: {signal?: AbortSignal} = {}
  ): Promise<SQLTableInfo> {
    const entry = this.require(name);
    const info = this.info(entry);
    options.signal?.throwIfAborted();
    if (info.arrowSchema || entry.source instanceof Table || !entry.source.getSchema) return info;
    try {
      const arrowSchema = await entry.source.getSchema(options);
      options.signal?.throwIfAborted();
      return {...info, arrowSchema};
    } catch (cause) {
      throw sourceError(entry, cause, options.signal);
    }
  }

  /** Executes resident queries or metadata commands; external reads require queryAsync(). */
  query(sql: string, options: SQLCatalogQueryOptions = {}): Table {
    options.signal?.throwIfAborted();
    const discovery = parseDiscovery(sql, this.defaultSchema);
    if (discovery) return this.discovery(discovery);
    const {plan, entries, tables} = this.prepare(sql, options);
    for (const [key, entry] of entries) {
      if (!(entry.source instanceof Table))
        throw new Error(`SQL table ${label(entry)} is external; use queryAsync()`);
      tables.set(key, entry.source);
    }
    return executeArrowSQL(plan, tables, options);
  }

  /** Resolves only referenced sources once per query, then uses the synchronous execution engine. */
  async queryAsync(sql: string, options: SQLCatalogQueryOptions = {}): Promise<Table> {
    options.signal?.throwIfAborted();
    const discovery = parseDiscovery(sql, this.defaultSchema);
    if (discovery) {
      if (discovery.kind === 'describe')
        return describeResult(await this.describeTableAsync(discovery.table, options));
      return this.discovery(discovery);
    }
    const {plan, entries, tables} = this.prepare(sql, options);
    for (const [key, entry] of entries) {
      options.signal?.throwIfAborted();
      try {
        const source = entry.source;
        const expected =
          entry.arrowSchema ??
          (source instanceof Table
            ? source.schema
            : await source.getSchema?.({signal: options.signal}));
        options.signal?.throwIfAborted();
        const table =
          source instanceof Table ? source : await source.read({signal: options.signal});
        options.signal?.throwIfAborted();
        rejectForeignTable(table);
        if (!(table instanceof Table)) throw new Error('read() must return an Arrow Table');
        if (expected) validate(table, expected, entry);
        tables.set(key, table);
      } catch (cause) {
        throw sourceError(entry, cause, options.signal);
      }
    }
    return executeArrowSQL(plan, tables, options);
  }

  /** Captures bindings and assigns private source keys without changing SQL alias resolution. */
  private prepare(sql: string, options: SQLCatalogQueryOptions) {
    const primary = this.primary && this.entries.get(this.primary);
    const implicit = primary ? {schema: primary.schema, name: primary.name} : {name: ''};
    const parsed = parseSQLSelectCompound(sql, {
      ...options,
      defaultFrom: implicit
    });
    const entries = new Map<string, Entry>();
    const tables = new Map<string, Table>();
    const bind = (binding: SQLTableBinding): SQLTableBinding => {
      if (binding === implicit) {
        if (!primary) {
          // A hidden cardinality carrier enables constant expressions without exposing a column.
          tables.set('', tableFromArrays({'': [0]}));
          return {name: '', alias: ''};
        }
      }
      const entry = this.require({
        schema: binding.schema ?? this.defaultSchema,
        name: binding.name
      });
      const key = this.key(entry);
      entries.set(key, entry);
      return {name: key, alias: binding.alias ?? binding.name};
    };
    const inputs = parsed.inputs.map(input => {
      if (input.from === implicit && !primary) {
        if (!input.select) throw new Error('SELECT * without FROM requires a primary table');
        rejectConstantColumns(input);
      }
      return {
        ...input,
        from: bind(input.from),
        joins: input.joins.map(join => ({
          ...join,
          table: bind(join.table)
        }))
      };
    });
    return {
      plan: {...parsed, inputs} as SQLSelectCompound,
      entries,
      tables
    };
  }

  /** Evaluates metadata commands using stable, explicitly typed Arrow columns. */
  private discovery(command: Discovery): Table {
    if (command.kind === 'schemas') return strings({schema_name: this.listSchemas()});
    if (command.kind === 'tables') {
      const tables = this.listTables({schema: command.schema});
      return strings({
        schema_name: tables.map(t => t.schema),
        table_name: tables.map(t => t.name)
      });
    }
    return describeResult(this.describeTable(command.table));
  }

  /** Builds a detached metadata envelope while retaining native Arrow schema objects. */
  private info(entry: Entry): SQLTableInfo {
    const resident = entry.source instanceof Table;
    return {
      name: entry.name,
      schema: entry.schema,
      description: entry.description,
      arrowSchema: entry.arrowSchema ?? (resident ? (entry.source as Table).schema : undefined),
      external: !resident,
      primary: this.primary === this.key(entry),
      ...(resident ? {numRows: (entry.source as Table).numRows} : {})
    };
  }

  /** Resolves a registered identity with a source-specific error. */
  private require(name: SQLTableName): Entry {
    const key = this.key(name);
    const entry = this.entries.get(key);
    if (!entry)
      throw new Error(`Unknown SQL table: ${typeof name === 'string' ? name : label(name)}`);
    return entry;
  }

  /** Rejects misspelled namespaces instead of silently listing no tables. */
  private requireSchema(schema: string): void {
    if (!this.schemas.has(schema)) throw new Error(`Unknown SQL schema: ${schema}`);
  }

  /** Encodes literal names without ambiguity between dots and namespace separators. */
  private key(name: SQLTableName): string {
    return JSON.stringify(
      typeof name === 'string'
        ? [this.defaultSchema, validName(name)]
        : [validName(name.schema), validName(name.name)]
    );
  }

  /** Emits after a completed definition mutation. Subscribers should not throw. */
  private notify(): void {
    for (const listener of [...this.listeners]) listener();
  }
}

/** Validates non-empty literal names while preserving case and punctuation. */
function validName(name: string): string {
  if (typeof name !== 'string' || !name.trim())
    throw new Error('SQL names must be non-empty strings');
  return name;
}

/** Formats a name for errors without implying unquoted SQL syntax. */
function label(entry: {schema: string; name: string}): string {
  return `${entry.schema}.${entry.name}`;
}

/** Validates a materialized source against its declared physical schema. */
function validate(table: Table, schema: Schema, entry: Entry): void {
  validateArrowTableSchema(table, schema, {
    rejectExtraFields: true,
    schemaName: label(entry)
  });
}

/** Adds source context while preserving abort identity and the original error. */
function sourceError(entry: Entry, cause: unknown, signal?: AbortSignal): Error {
  signal?.throwIfAborted();
  const error = new Error(
    `SQL source ${label(entry)} failed: ${cause instanceof Error ? cause.message : String(cause)}`
  );
  Object.defineProperty(error, 'cause', {value: cause});
  return error;
}

/** Builds UTF-8 metadata columns with identical types for empty and nonempty results. */
function strings(columns: Record<string, string[]>): Table {
  return new Table(
    Object.fromEntries(
      Object.entries(columns).map(([name, values]) => [name, vectorFromArray(values, new Utf8())])
    )
  );
}

/** Produces top-level fields; the structured API retains nested fields and Arrow metadata. */
function describeResult(info: SQLTableInfo): Table {
  if (!info.arrowSchema)
    throw new Error(
      `Schema unavailable for ${label(info)}; provide arrowSchema or getSchema() and use queryAsync()`
    );
  const fields = info.arrowSchema.fields;
  return new Table({
    column_name: vectorFromArray(
      fields.map(f => f.name),
      new Utf8()
    ),
    data_type: vectorFromArray(
      fields.map(f => f.type.toString()),
      new Utf8()
    ),
    is_nullable: vectorFromArray(
      fields.map(f => f.nullable),
      new Bool()
    )
  });
}

/** Reads bounded discovery syntax with the same quoted identifier rules as SELECT. */
function parseDiscovery(sql: string, defaultSchema: string): Discovery | undefined {
  const reader = new CatalogQueryReader(sql);
  if (reader.takeKeyword('SHOW')) {
    if (reader.takeKeyword('SCHEMAS')) {
      reader.end();
      return {kind: 'schemas'};
    }
    reader.expectKeyword('TABLES');
    const schema = reader.takeKeyword('FROM') ? reader.identifier() : defaultSchema;
    reader.end();
    return {kind: 'tables', schema};
  }
  if (reader.takeKeyword('DESCRIBE')) {
    const first = reader.identifier();
    const table = reader.takeSymbol('.') ? {schema: first, name: reader.identifier()} : first;
    reader.end();
    return {kind: 'describe', table};
  }
  return undefined;
}

/** Rejects all column references in a no-source query, including the internal row carrier. */
function rejectConstantColumns(input: SQLSelectCompound['inputs'][number]): void {
  const visit = (value: unknown, key?: string): void => {
    if (!value || typeof value !== 'object') return;
    const node = value as Record<string, unknown>;
    if (node['type'] === 'Identifier' && key !== 'callee' && !node['sqlWildcard'])
      throw new Error('Column references without FROM require a primary table');
    for (const [childKey, child] of Object.entries(node)) visit(child, childKey);
  };
  visit(input.select);
  visit(input.where);
  visit(input.groupBy);
}

/** Rejects incompatible runtime instances before Arrow constructors can misinterpret their batches. */
function rejectForeignTable(value: unknown): void {
  if (isArrowTable(value) && !(value instanceof Table)) {
    throw new Error(
      "Arrow Table belongs to a different runtime; use the producer's tableToIPC() and this runtime's tableFromIPC() in the source adapter"
    );
  }
}

/** Uses the relational parser's line-comment rules for catalog discovery commands. */
class CatalogQueryReader extends SQLQueryReader {
  /** Skips comments before handing a literal name to the shared identifier reader. */
  override identifier(): string {
    this.skipWhitespace();
    return super.identifier();
  }

  /** Advances whitespace/comments without rewriting the SQL or its diagnostic positions. */
  protected override skipWhitespace(): void {
    this.position = skipSQLLineComments(this.sql, this.position);
  }
}
