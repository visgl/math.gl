# Reusing initialized state

Use `runner.initializeTask(task, initialization)` when multiple operations should share a projection, dataset, spatial index, or WebAssembly instance. Ordinary runner calls initialize automatically and release their state after the operation.

```
const projectionTask = await runner.initializeTask(ProjectCoordinatesTask, {

  projection: {from: 'EPSG:4326', to: 'EPSG:3857'}

});

try {

  const {coordinates} = await projectionTask.runTask({

    coordinates: new Float64Array([10, 20])

  });

  console.log(coordinates);

} finally {

  await projectionTask.close();

}
```

The handle is bound to its task and execution location. Its calls are serial; atomic, multiple-input, and streaming methods share state. Each handle retains one runner slot, including while idle. Close it before awaiting another operation on a runner with capacity one.

Tasks construct state in `initialize` and release it in `destroy`. Processors receive it as `context.state`. Worker failure, cancellation, or early worker-stream return invalidates the handle; initialize a new one to continue. Successful stream completion preserves state. See [lifecycle semantics](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/api-reference/task-runner.md).

## Typed operation dispatch[​](#typed-operation-dispatch "Direct link to Typed operation dispatch")

For a task accepting multiple operations, define the input and output of each operation and wrap its initialized handle. The task's `process` hook must return an object whose `value` corresponds to the request's operation.

```
import {createTypedTaskDispatcher, type TaskOperation} from '@math.gl/core/tasks';



type Operations = {

  count: TaskOperation<{source: string}, number>;

  lookup: TaskOperation<{id: number}, {name: string} | null>;

};

// handle.runTask accepts the union of requests and returns {value: result}.

const dispatch = createTypedTaskDispatcher<Operations>(async request =>

  (await handle.runTask(request)).value

);

const count = await dispatch({operation: 'count', input: {source: 'roads'}}); // number

const feature = await dispatch({operation: 'lookup', input: {id: 1}}); // {name: string} | null
```

The adapter does not validate results or change scheduling, cancellation or ownership. The task must return the right result for each operation. Initialized handles remain serialized.

## Separate setup and processing ownership[​](#separate-setup-and-processing-ownership "Direct link to Separate setup and processing ownership")

For automatic atomic or streaming calls, use `initializationOwnership` when setup resources need different ownership from processing data. For example, transfer a callback `MessagePort` while copying input buffers:

```
await runner.runTask(task, {values}, {

  initialization: {port: channel.port2},

  initializationOwnership: 'transfer',

  inputOwnership: 'copy'

});
```

Transferring initialization detaches its caller-owned resources; do not reuse them in processing payloads or another task. Shared initialization may contain shared storage but cannot contain transferable ports. For `runTasks`, initialization is a reusable template: use copy or share; transfer is rejected before input consumption. For an explicit retained handle, `initializeTask` already has independent setup controls: pass `inputOwnership: 'transfer'` there, then choose input ownership again for each `handle.runTask` or `handle.runTaskInBatches` call.
