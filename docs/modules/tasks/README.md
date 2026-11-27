# @math.gl/tasks

`@math.gl/tasks` provides generic task infrastructure for browsers and Node.js.
It defines the task contract and provides a runner for local or worker execution.
The runner manages worker startup, messages, and cleanup.

Applications and other math.gl packages import `@math.gl/tasks` to define and run
their own operations. Each package owns its task implementations. The task
runtime has no dependencies on other math.gl packages.

## Package entry points

`@math.gl/tasks` exposes the task API through its root import.

| Export | Use it to |
| --- | --- |
| `TaskRunner` and `InitializedTask` | [Run tasks and manage reusable sessions](./api-reference/task-runner.md). |
| `preloadTasks` | [Prepare tasks before first use](./api-reference/task-runner.md#preloadtasks). |
| `Task`, `TaskTypes`, and `TaskContext` | [Define a calculation and its input, result, and progress types](./api-reference/task-runner.md#task-type-map). |
| `createTypedTaskDispatcher` | [Route typed operations through a persistent task](./developer-guide/persistent-resources.md). |
| `initializeTaskWorker` | [Start a custom task implementation inside a worker](./developer-guide/custom-workers.md). |

Import ready-made tasks from their owning package. For example,
`@math.gl/geospatial/tasks` exports `ProjectCoordinatesTask`.

## Run a task

This example combines the generic runner with a projection task implemented by
`@math.gl/geospatial`.

```ts
import {TaskRunner} from '@math.gl/tasks';
import {ProjectCoordinatesTask} from '@math.gl/geospatial/tasks';

const runner = new TaskRunner();
try {
  const {coordinates} = await runner.runTask(ProjectCoordinatesTask, {
    coordinates: new Float64Array([0, 0, 10, 20]),
    projection: {from: 'EPSG:4326', to: 'EPSG:3857'}
  });
  console.log(coordinates);
} finally {
  await runner.close();
}
```

`ProjectCoordinatesTask` includes a worker implementation. You send coordinates
and a projection, then await the converted coordinates. Inputs are copied by
default, so your application can keep using the original arrays.

Start with the [getting-started guide](./developer-guide/task-runner.md) for setup
and examples, or [write a task](./developer-guide/custom-workers.md) for your own computation.

## Features

| Feature | Support | Description |
| --- | --- | --- |
| Browser and Node.js workers | ✅ | Move computations off the main thread |
| Typed inputs and results | ✅ | Describe a task with ordinary TypeScript objects |
| Multiple inputs and streams | ✅ | Process a dataset in manageable pieces |
| Reusable setup | ✅ | Keep a prepared projection, index, or other state for later calls |
| Cancellation and progress | ✅ | Stop worker work and report progress to your application |
| Buffer transfer and shared memory | ✅ | Choose how large arrays move between threads |
| Local execution | ✅ | Run small operations on the calling thread when a worker would add overhead |

Workers are useful when computation would otherwise block your application.
Small operations may run faster locally because starting a worker and sending
its data takes time. See [choosing where tasks run](./developer-guide/execution.md).

## Learn more

- [Worker basics](./developer-guide/workers.md): what runs where and how data moves.
- [Creating tasks](./developer-guide/custom-workers.md): add your own calculation and worker.
- [Reusing setup](./developer-guide/persistent-resources.md): avoid rebuilding expensive state.
- [API reference](./api-reference/task-runner.md): methods, options, and detailed behavior.
- [Migration](./developer-guide/migration.md): update applications using earlier worker APIs.
