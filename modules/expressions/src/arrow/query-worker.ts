// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import {dehydrateArrowTable, hydrateArrowTable, type DehydratedArrowTable} from '@math.gl/arrow';
import {TaskRunner, type Task, type TaskWorker} from '@math.gl/tasks';
import {queryArrowTable, type ArrowTableQuery} from './query-arrow-table';
import type {ArrowTableFunction} from './types';

/** Query options accepted by a worker session. Register functions inside the worker. */
export type ArrowWorkerQuery = Omit<ArrowTableQuery, 'functions'>;

type QueryPayload = Omit<ArrowWorkerQuery, 'signal' | 'union' | 'join'> & {
  union?: DehydratedArrowTable[];
  join?: Omit<NonNullable<ArrowTableQuery['join']>, 'table'> & {table: DehydratedArrowTable};
};

type QueryResult = {table: DehydratedArrowTable} | {error: {name: string; message: string}};

type QueryTask = {
  initialization: {table: DehydratedArrowTable};
  input: {operation: 'query'; query: QueryPayload} | {operation: 'get' | 'take'};
  output: QueryResult;
  state: Table;
};

/** Configuration for a retained Arrow query worker. */
export type ArrowQueryWorkerOptions = {
  /** Module worker URL or browser worker factory. */
  worker: Pick<TaskWorker, 'url' | 'create'>;
  /** Defaults to copy. Transfer relinquishes every source buffer and its aliases. */
  inputOwnership?: 'copy' | 'transfer';
  /** Cancels worker initialization. */
  signal?: AbortSignal;
};

/** Runs queries against a source table retained in a dedicated worker. */
export type ArrowQueryWorkerSession = {
  /** Executes a query. Its union and join inputs are copied for this call. */
  query(query?: ArrowWorkerQuery): Promise<Table>;
  /** Returns a snapshot and keeps the worker available. */
  getTable(): Promise<Table>;
  /** Transfers the source back and closes the session. */
  takeTable(): Promise<Table>;
  /** Drains accepted operations and releases the worker. */
  close(): Promise<void>;
};

/** Defines the shared task protocol. Custom function declarations stay in the worker. */
export function createArrowQueryTask(
  options: {functions?: readonly ArrowTableFunction[]; worker?: TaskWorker} = {}
): Task<QueryTask> {
  return {
    id: 'math.gl-arrow-query',
    worker: options.worker,
    initialize: ({table}) => hydrateArrowTable(table),
    process(input, _options, {state, signal}) {
      if (input.operation === 'take') return {table: dehydrateArrowTable(state, {copy: 'none'})};
      let result = state;
      try {
        if (input.operation === 'query') {
          const {union, join, ...query} = input.query;
          result = queryArrowTable(state, {
            ...query,
            union: union?.map(hydrateArrowTable),
            join: join && {...join, table: hydrateArrowTable(join.table)},
            functions: options.functions,
            signal
          });
        }
        return {table: dehydrateArrowTable(result, {retain: [state]})};
      } catch (error) {
        // A query error is a response, so the task runner keeps the pinned worker alive.
        return {
          error: {
            name: error instanceof Error ? error.name : 'Error',
            message: error instanceof Error ? error.message : String(error)
          }
        };
      }
    }
  };
}

/** Sends one table to a worker and retains it across queries. */
export async function createArrowQueryWorker(
  source: Table,
  {worker, inputOwnership, signal}: ArrowQueryWorkerOptions
): Promise<ArrowQueryWorkerSession> {
  signal?.throwIfAborted();
  const runner = new TaskRunner();
  try {
    const task = await runner.initializeTask(
      createArrowQueryTask({worker: {...worker, capabilities: {atomic: true, streaming: false}}}),
      {table: dehydrateArrowTable(source, {copy: 'none'})},
      {execution: 'worker', inputOwnership, signal}
    );
    let closing = false;
    function assertOpen(): void {
      if (closing) throw new Error('Arrow query worker session is closed');
    }
    return {
      async query({signal: querySignal, union, join, ...query} = {}) {
        assertOpen();
        querySignal?.throwIfAborted();
        const result = await runQueryWithSignal(
          () =>
            task.runTask({
              operation: 'query',
              query: {
                ...query,
                union: union?.map(table => dehydrateArrowTable(table, {copy: 'none'})),
                join: join && {...join, table: dehydrateArrowTable(join.table, {copy: 'none'})}
              }
            }),
          querySignal
        );
        return hydrateQueryResult(result);
      },
      async getTable() {
        assertOpen();
        return hydrateQueryResult(await task.runTask({operation: 'get'}));
      },
      async takeTable() {
        assertOpen();
        closing = true;
        try {
          return hydrateQueryResult(await task.runTask({operation: 'take'}));
        } finally {
          await runner.close();
        }
      },
      close() {
        closing = true;
        return runner.close();
      }
    };
  } catch (error) {
    await runner.close();
    throw error;
  }
}

/** Executes one query on a worker and releases the worker after it settles. */
export async function queryArrowTableInWorker(
  source: Table,
  query: ArrowWorkerQuery,
  options: ArrowQueryWorkerOptions
): Promise<Table> {
  const signal = query.signal ?? options.signal;
  const session = await createArrowQueryWorker(source, {...options, signal});
  try {
    return await session.query({...query, signal});
  } finally {
    // Cancellation stops the caller's wait. Drain the worker independently.
    if (signal?.aborted) void session.close().catch(() => {});
    else await session.close();
  }
}

/** Restores a result or propagates a query error without invalidating the session. */
function hydrateQueryResult(result: QueryResult): Table {
  if ('table' in result) return hydrateArrowTable(result.table);
  const error = new Error(result.error.message);
  error.name = result.error.name;
  throw error;
}

/** Cancels the caller's wait while leaving accepted work queued on the retained worker. */
async function runQueryWithSignal<T>(run: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return run();
  signal.throwIfAborted();
  const pending = run();
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, {once: true});
    if (signal.aborted) abort();
    void pending.then(
      result => {
        signal.removeEventListener('abort', abort);
        resolve(result);
      },
      error => {
        signal.removeEventListener('abort', abort);
        reject(error);
      }
    );
  });
}
