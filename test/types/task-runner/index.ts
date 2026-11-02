// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  TaskRunner,
  preloadTasks,
  createTypedTaskDispatcher,
  type Task,
  type TaskOperation
} from '@math.gl/core/tasks';
type SceneOperations = {
  count: TaskOperation<{source: string}, number>;
  find: TaskOperation<{id: number}, {name: string} | null>;
};
const dispatch = createTypedTaskDispatcher<SceneOperations>(async request =>
  request.operation === 'count' ? request.input.source.length : {name: String(request.input.id)}
);
const countResult: Promise<number> = dispatch({operation: 'count', input: {source: 'roads'}});
const findResult: Promise<{name: string} | null> = dispatch({operation: 'find', input: {id: 1}});
// @ts-expect-error Each operation requires its own input.
dispatch({operation: 'count', input: {id: 1}});
// @ts-expect-error Unknown operations are rejected.
dispatch({operation: 'missing', input: {}});
declare const operation: keyof SceneOperations;
// @ts-expect-error A union-valued operation cannot be paired with just one operation's payload.
dispatch({operation, input: {source: 'roads'}});
// @ts-expect-error The result is specific to the operation.
const wrongResult: Promise<string> = dispatch({operation: 'count', input: {source: 'roads'}});
void countResult;
void findResult;
void wrongResult;
const runner = new TaskRunner();
const scale = {
  id: 'scale',
  process({values}, {factor}) {
    return {values: values.map(value => value * factor)};
  }
} satisfies Task<{
  input: {values: Float64Array};
  output: {values: Float64Array};
  options: {factor: number};
}>;
const result: Promise<{values: Float64Array}> = runner.runTask(
  scale,
  {values: new Float64Array()},
  {options: {factor: 2}}
);
void result;
// @ts-expect-error application options are required
runner.runTask(scale, {values: new Float64Array()});
runner.runTask(
  scale,
  {values: new Float64Array()},
  // @ts-expect-error factor must be numeric
  {options: {factor: 'two'}}
);
// @ts-expect-error payload must use named fields
runner.runTask(scale, new Float64Array(), {options: {factor: 2}});
// @ts-expect-error input fields remain checked
runner.runTask(scale, {other: 1}, {options: {factor: 2}});
const plain = {
  id: 'plain',
  process({value}: {value: number}) {
    return {value};
  }
};
runner.runTask(plain, {value: 1});
const initialized = {
  id: 'initialized',
  initialize({offset}) {
    return offset;
  },
  destroy(state) {
    const number: number = state;
    void number;
  },
  process({value}, _options, {state}) {
    return {value: value + state};
  }
} satisfies Task<{
  input: {value: number};
  output: {value: number};
  initialization: {offset: number};
  state: number;
}>;
// @ts-expect-error initialization is required
runner.runTask(initialized, {value: 1});
runner.runTask(initialized, {value: 1}, {initialization: {offset: 2}});
const handle = await runner.initializeTask(initialized, {offset: 2});
const initializedResult: Promise<{value: number}> = handle.runTask({
  value: 3
});
void initializedResult;
// @ts-expect-error initialization fields remain checked
runner.initializeTask(initialized, {wrong: 1});
const streaming = {
  id: 'streaming',
  async *processInBatches(inputs, _options, context) {
    for await (const {text} of inputs) {
      context.throwIfAborted();
      yield {length: text.length};
    }
  }
} satisfies Task<{
  input: {buffer: ArrayBuffer};
  output: {count: number};
  batchInput: {text: string};
  batchOutput: {length: number};
}>;
const batches: AsyncIterable<{length: number}> = runner.runTaskInBatches(streaming, [
  {text: 'hello'}
]);
void batches;
// @ts-expect-error streaming batch input differs from atomic input
runner.runTaskInBatches(streaming, [{buffer: new ArrayBuffer(1)}]);
const invalid: Task<{input: number[]; output: {value: number}}> = {
  id: 'invalid',
  process(input) {
    // @ts-expect-error direct array payload is not usable
    return {value: input.length};
  }
};
void invalid;

const remote: Task<{
  input: {value: number};
  output: {value: number};
  options: {factor: number};
  initialization: {offset: number};
  state: number;
}> = {
  id: 'remote',
  worker: {url: 'worker.js', capabilities: {atomic: true, streaming: false}}
};
const remoteResult: Promise<{value: number}> = runner.runTask(
  remote,
  {value: 1},
  {
    initialization: {offset: 2},
    options: {factor: 3}
  }
);
void remoteResult;
// @ts-expect-error annotated worker-only tasks retain required initialization
runner.runTask(remote, {value: 1}, {options: {factor: 2}});
const noInput = {
  id: 'no-input',
  initialize() {
    return {};
  },
  process() {
    return {value: 1};
  }
};
runner.initializeTask(noInput, {});
runner.runTask(noInput, {});
const optionalOptions = {
  id: 'optional',
  process(input: {value: number}, options: {factor?: number} = {}) {
    return {value: input.value * (options.factor ?? 1)};
  }
};
runner.runTask(optionalOptions, {value: 1});
// @ts-expect-error optional application fields remain typed
runner.runTask(optionalOptions, {value: 1}, {options: {factor: 'bad'}});

// Provided tasks support the short form and optional explicit initialization.
import {ProjectCoordinatesTask, PrepareMapTask} from '@math.gl/geospatial/tasks';
const providedRunner = new TaskRunner();
const projected = await providedRunner.runTask(ProjectCoordinatesTask, {
  coordinates: new Float64Array([0, 0]),
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'}
});
const projectedCoordinates: Float32Array | Float64Array = projected.coordinates;
void projectedCoordinates;
const preparedProjection = await providedRunner.initializeTask(ProjectCoordinatesTask, {
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'}
});
await preparedProjection.runTask({coordinates: new Float64Array([0, 0])});
await preparedProjection.close();
await providedRunner.runTask(PrepareMapTask, {
  description: {version: 1, id: 'world', definition: {type: 'mercator'}}
});
await providedRunner.close();

const mixedProcessors = {
  id: 'mixed-processors',
  process({value}) {
    return {value};
  },
  async *processInBatches(inputs, {factor}) {
    for await (const {value} of inputs) yield {value: value * factor};
  }
} satisfies Task<{input: {value: number}; output: {value: number}; options: {factor: number}}>;
runner.runTask(mixedProcessors, {value: 1});
runner.runTasks(mixedProcessors, [{value: 1}]);
runner.runTaskInBatches(mixedProcessors, [{value: 1}], {options: {factor: 2}});
// @ts-expect-error streaming options are inferred from the streaming hook
runner.runTaskInBatches(mixedProcessors, [{value: 1}]);
// @ts-expect-error streaming factor is required even though atomic calls need no options
runner.runTaskInBatches(mixedProcessors, [{value: 1}], {});
const mixedHandle = await runner.initializeTask(mixedProcessors, {});
mixedHandle.runTask({value: 1});
mixedHandle.runTaskInBatches([{value: 1}], {options: {factor: 2}});
// @ts-expect-error retained streaming calls also require streaming options
mixedHandle.runTaskInBatches([{value: 1}]);
// @ts-expect-error retained streaming options retain their value types
mixedHandle.runTaskInBatches([{value: 1}], {options: {factor: 'two'}});
await mixedHandle.close();

const atomicOptionsOnly = {
  id: 'atomic-options-only',
  process({value}, {factor}) {
    return {value: value * factor};
  },
  async *processInBatches(inputs) {
    yield* inputs;
  }
} satisfies Task<{input: {value: number}; output: {value: number}; options: {factor: number}}>;
runner.runTaskInBatches(atomicOptionsOnly, [{value: 1}]);
// @ts-expect-error atomic options remain required independently of streaming
runner.runTask(atomicOptionsOnly, {value: 1});

// Removed API families fail at the public package boundary.
// @ts-expect-error removed public API
import {runTask} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {runTaskInBatches} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {TaskDescriptor} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {TaskOptions} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {TaskExecution} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {MainThreadPolicy} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {WorkerPool} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {WorkerFarm} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {WorkerBody} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {WorkerObject} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {createWorker} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {createWorkerResource} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {processOnWorker} from '@math.gl/core/tasks';
// @ts-expect-error removed public API
import {getTransferList} from '@math.gl/core/tasks';
// @ts-expect-error the old package entry is removed
import * as removedWorkers from '@math.gl/core/worker-utils';
void removedWorkers;
// @ts-expect-error the old geospatial worker entry is removed
import * as removedGeospatialWorkers from '@math.gl/geospatial/workers';
void removedGeospatialWorkers;
// @ts-expect-error operations are not a public package entry
import * as removedOperations from '@math.gl/geospatial/workers/operations';
void removedOperations;
// @ts-expect-error package exports block deep imports to private transport
import * as privateTransport from '@math.gl/core/dist/worker-utils/index.js';
void privateTransport;

void [
  runTask,
  runTaskInBatches,
  TaskDescriptor,
  TaskOptions,
  TaskExecution,
  MainThreadPolicy,
  WorkerPool,
  WorkerFarm,
  WorkerBody,
  WorkerObject,
  createWorker,
  createWorkerResource,
  processOnWorker,
  getTransferList
];

const synchronousResult: {values: Float64Array} = runner.runTaskSync(
  scale,
  {values: new Float64Array()},
  {options: {factor: 2}}
);
void synchronousResult;
runner.runTaskSync(initialized, {value: 1}, {initialization: {offset: 2}});
// @ts-expect-error synchronous processing still requires application options
runner.runTaskSync(scale, {values: new Float64Array()});
// @ts-expect-error synchronous initialization is required
runner.runTaskSync(initialized, {value: 1});
// @ts-expect-error synchronous calls cannot route to a worker
runner.runTaskSync(plain, {value: 1}, {execution: 'worker'});
runner.runTaskSync(
  // @ts-expect-error an asynchronous processor cannot run synchronously
  {
    ...plain,
    async process() {
      return {value: 1};
    }
  },
  {value: 1}
);
runner.runTaskSync(
  // @ts-expect-error asynchronous initialization cannot run synchronously
  {
    ...plain,
    async initialize() {
      return {};
    }
  },
  {value: 1}
);
// @ts-expect-error asynchronous destruction cannot run synchronously
runner.runTaskSync({...plain, async destroy() {}}, {value: 1});
runner.runTaskSync(
  // @ts-expect-error promise-returning ordinary functions cannot run synchronously
  {
    ...plain,
    process() {
      return Promise.resolve({value: 1});
    }
  },
  {value: 1}
);
// @ts-expect-error tasks with optional/potentially async hooks are not statically synchronous
runner.runTaskSync(plain as Task<{input: {value: number}; output: {value: number}}>, {value: 1});
const preload: Promise<void> = preloadTasks([scale], {signal: new AbortController().signal});
void preload;

// @ts-expect-error code preloading has no runner lifetime or pool controls
runner.preloadTasks([plain]);
