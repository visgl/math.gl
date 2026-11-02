# Reusing initialized state

Use `runner.initializeTask(task, initialization)` when multiple operations should
share a projection, dataset, spatial index, or WebAssembly instance. Ordinary
runner calls initialize automatically and release their state after the operation.

```ts
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

The handle is bound to its task and execution location. Its calls are serial;
atomic, multiple-input, and streaming methods share state. Each handle retains
one runner slot, including while idle. Close it before awaiting another operation
on a runner with capacity one.

Tasks construct state in `initialize` and release it in `destroy`. Processors
receive it as `context.state`. Worker failure, cancellation, or early worker-stream
return invalidates the handle; initialize a new one to continue. Successful stream
completion preserves state. See [lifecycle semantics](../api-reference/task-runner.md).

## Separate setup and processing ownership

For automatic atomic or streaming calls, use `initializationOwnership` when setup
resources need different ownership from processing data. For example, transfer a
callback `MessagePort` while copying input buffers:

```ts
await runner.runTask(task, {values}, {
  initialization: {port: channel.port2},
  initializationOwnership: 'transfer',
  inputOwnership: 'copy'
});
```

Transferring initialization detaches its caller-owned resources; do not reuse them
in processing payloads or another task. Shared initialization may contain shared
storage but cannot contain transferable ports. For `runTasks`, initialization is
a reusable template: use copy or share; transfer is rejected before input consumption.
For an explicit retained handle, `initializeTask` already has independent setup
controls: pass `inputOwnership: 'transfer'` there, then choose input ownership again
for each `handle.runTask` or `handle.runTaskInBatches` call.
