// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {TaskRunner, type Task} from '@math.gl/core/tasks';
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
