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
export type TaskInput<D extends AnyTask> = Parameters<Processor<D>>[0];
export type TaskOutput<D extends AnyTask> = Awaited<ReturnType<Processor<D>>>;
export type TaskBatchInput<D extends AnyTask> =
  Parameters<StreamProcessor<D>>[0] extends AsyncIterable<infer I> ? I : never;
export type TaskBatchOutput<D extends AnyTask> =
  ReturnType<StreamProcessor<D>> extends AsyncIterable<infer O> ? O : never;
type ProcessorOptions<F extends (...args: any[]) => any> =
  Parameters<F> extends [any, infer O, ...any[]] ? O : object;
type Options<D extends AnyTask> = D extends {process: (...args: any[]) => any}
  ? ProcessorOptions<Processor<D>>
  : ProcessorOptions<StreamProcessor<D>>;
export type Initialization<D extends AnyTask> = Parameters<NonNullable<D['initialize']>>[0];
type OptionsField<D extends AnyTask> =
  {} extends Options<D> ? {options?: Options<D>} : {options: Options<D>};
type InitializationField<D extends AnyTask> = D extends {
  initialize: (...args: any[]) => any;
}
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
export type TaskRunOptions<D extends AnyTask> = TaskRunControls &
  OptionsField<D> &
  InitializationField<D>;
export type TaskRunsOptions<D extends AnyTask> = TaskRunOptions<D> & {
  concurrency?: number;
};
export type InitializedTaskOptions<D extends AnyTask> = Omit<TaskRunControls, 'execution'> &
  OptionsField<D>;
export type RequestArgs<O> = {} extends O ? [options?: O] : [options: O];
export type TaskRunnerOptions = {maxConcurrency?: number};
