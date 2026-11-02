// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Named payload types for a task. Batch types default to the atomic types. */
export type TaskTypes = {
  input: object;
  output: object;
  options?: object;
  initialization?: object;
  state?: unknown;
  batchInput?: object;
  batchOutput?: object;
};
type Field<T, K extends PropertyKey, Default> = K extends keyof T ? T[K] : Default;
type Payload<T> = T extends readonly unknown[] | ArrayBufferView | ArrayBuffer | Function
  ? never
  : T;

/** Services supplied for each invocation; application parameters belong in options. */
export type TaskContext<State = undefined> = {
  state: State;
  signal: AbortSignal;
  throwIfAborted(): void;
  reportProgress(progress: TaskProgress): void;
  /** Request host services; payloads and responses cross a copy boundary. */
  requestHost(
    operation: string,
    payload: object,
    controls?: Pick<TaskRunControls, 'inputOwnership' | 'outputOwnership'>
  ): Promise<unknown>;
  /** Send a copied notification to the host. */
  emitHost(operation: string, payload: object): void;
};
export type TaskProgress = {
  completed: number;
  total?: number;
  phase?: string;
  unit?: string;
};
export type TaskInitializationContext = Omit<TaskContext, 'state'>;

/** A module-worker target, not a registry entry. Factories must return fresh workers. */
export type TaskWorker = {
  url?: URL | string;
  create?: () => Worker;
  capabilities: {atomic: boolean; streaming: boolean};
};

/**
 * A plain task definition. Use `satisfies Task<MyTypes>` for contextual typing.
 * State is private to an initialized instance and may be any application value.
 */
export type Task<T extends TaskTypes> = {
  id: string;
  /** Opt-in scheduling for atomic calls sharing one initialized state. */
  concurrency?: {
    /** Maximum simultaneous calls allowed by this task. */
    maxConcurrency: number;
    /** Exclusive calls run as barriers; omitted means exclusive. */
    getSchedulingMode?: (input: Payload<T['input']>) => 'parallel' | 'exclusive';
  };
  /** Load code dependencies without creating instance state. Cached per definition/realm. */
  preload?: () => void | Promise<void>;
  initialize?: (
    input: Payload<Field<T, 'initialization', object>>,
    context: TaskInitializationContext
  ) => Field<T, 'state', undefined> | Promise<Field<T, 'state', undefined>>;
  destroy?: (state: Field<T, 'state', undefined>) => void | Promise<void>;
  process?: (
    input: Payload<T['input']>,
    options: Field<T, 'options', object>,
    context: TaskContext<Field<T, 'state', undefined>>
  ) => Payload<T['output']> | Promise<Payload<T['output']>>;
  processInBatches?: (
    inputs: AsyncIterable<Payload<Field<T, 'batchInput', T['input']>>>,
    options: Field<T, 'options', object>,
    context: TaskContext<Field<T, 'state', undefined>>
  ) => AsyncIterable<Payload<Field<T, 'batchOutput', T['output']>>>;
  worker?: TaskWorker;
};

// Infer from concrete hooks so `satisfies` preserves inference without a factory.
export type AnyTask = Task<any>;
type Processor<D extends AnyTask> = NonNullable<D['process']>;
type StreamProcessor<D extends AnyTask> = NonNullable<D['processInBatches']>;
type Argument<
  F extends (...args: any[]) => any,
  N extends number
> = Parameters<F>[N] extends undefined ? object : NonNullable<Parameters<F>[N]>;
export type TaskInput<D extends AnyTask> = Argument<Processor<D>, 0>;
export type TaskOutput<D extends AnyTask> = Awaited<ReturnType<Processor<D>>>;
export type TaskBatchInput<D extends AnyTask> =
  Parameters<StreamProcessor<D>>[0] extends AsyncIterable<infer I> ? I : never;
export type TaskBatchOutput<D extends AnyTask> =
  ReturnType<StreamProcessor<D>> extends AsyncIterable<infer O> ? O : never;
type ProcessorOptions<F extends (...args: any[]) => any> = Argument<F, 1>;
export type Initialization<D extends AnyTask> = Argument<NonNullable<D['initialize']>, 0>;
type OptionsField<O> = {} extends O ? {options?: O} : {options: O};
type InitializationField<D extends AnyTask> = 'initialize' extends keyof D
  ? {} extends Initialization<D>
    ? {initialization?: Initialization<D>}
    : {initialization: Initialization<D>}
  : {initialization?: never};

/** Per-invocation controls. Application options are never mixed into this object. */
export type TaskRunControls = {
  execution?: 'auto' | 'main-thread' | 'worker';
  signal?: AbortSignal;
  inputOwnership?: 'copy' | 'transfer' | 'share';
  outputOwnership?: 'copy' | 'transfer';
  onProgress?: (progress: TaskProgress) => void;
};
/** Controls for initializing a retained task instance. */
export type TaskInitializeControls = TaskRunControls & {
  /** Opt in to overlapping calls, capped by the task's declared capability. */
  operationConcurrency?: number;
  /** Handle requests from the task, with cancellation scoped to that request. */
  onRequest?: (operation: string, payload: unknown, signal: AbortSignal) => Promise<unknown>;
  /** Handle one-way task notifications. */
  onEvent?: (operation: string, payload: unknown) => void;
};
/** Controls setup resources independently from per-operation payload ownership. */
export type TaskInitializationControls = {
  /** Ownership of automatic initialization data; defaults to copying. */
  initializationOwnership?: 'copy' | 'transfer' | 'share';
};
export type TaskRunOptions<D extends AnyTask> = TaskRunControls &
  TaskInitializationControls &
  OptionsField<ProcessorOptions<Processor<D>>> &
  InitializationField<D>;
export type TaskBatchRunOptions<D extends AnyTask> = TaskRunControls &
  TaskInitializationControls &
  OptionsField<ProcessorOptions<StreamProcessor<D>>> &
  InitializationField<D>;
export type TaskRunsOptions<D extends AnyTask> = Omit<
  TaskRunOptions<D>,
  'initializationOwnership'
> & {
  /** Reusable initialization templates may copy or share, but cannot transfer into multiple slots. */
  initializationOwnership?: 'copy' | 'share';
  concurrency?: number;
};
export type InitializedTaskOptions<D extends AnyTask> = Omit<TaskRunControls, 'execution'> &
  OptionsField<ProcessorOptions<Processor<D>>>;
/** Atomic call controls, including time spent waiting for an execution slot. */
export type InitializedTaskCallOptions<D extends AnyTask> = InitializedTaskOptions<D> & {
  /** Deadline in milliseconds. */
  timeout?: number;
};
export type InitializedTaskBatchOptions<D extends AnyTask> = Omit<TaskRunControls, 'execution'> &
  OptionsField<ProcessorOptions<StreamProcessor<D>>>;
export type RequestArgs<O> = {} extends O ? [options?: O] : [options: O];
/** Synchronous calls never select a worker. */
export type TaskSyncRunOptions<D extends AnyTask> = Omit<TaskRunOptions<D>, 'execution'>;
type SyncHook<D, K extends PropertyKey> = K extends keyof D
  ? NonNullable<D[K]> extends (...args: any[]) => infer R
    ? Extract<R, PromiseLike<unknown>> extends never
      ? unknown
      : never
    : never
  : unknown;
/** Preserve concrete hook inference with `satisfies Task<Types>`. */
export type SynchronousTask<D extends AnyTask> = D extends {process: (...args: any[]) => any}
  ? SyncHook<D, 'process'> & SyncHook<D, 'initialize'> & SyncHook<D, 'destroy'>
  : never;
export type TaskPreloadOptions = Pick<TaskRunControls, 'execution' | 'signal'>;
export type TaskRunnerOptions = {maxConcurrency?: number};
