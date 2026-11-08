# @math.gl/tasks

Tasks lets you move heavy operations, such as computations on large datasets, to worker threads. The main thread can keep responding to input and drawing your application while the computation runs in the background.

A **task** describes a calculation. A **TaskRunner** runs it and returns the result. The runner handles worker startup, messages, and cleanup, so you do not have to write that plumbing yourself. It works in browsers and Node.js.

## Run a task[​](#run-a-task "Direct link to Run a task")

For example, project a set of coordinates in a worker:

```
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

`ProjectCoordinatesTask` includes a worker implementation. You send coordinates and a projection, then await the converted coordinates. Inputs are copied by default, so your application can keep using the original arrays.

Start with the [getting-started guide](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/task-runner.md) for setup and examples. You can use tasks provided by a math.gl module or [write a task](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/custom-workers.md) for your own computation. `@math.gl/tasks` itself has no runtime dependencies and can be used without the other math.gl packages.

## Features[​](#features "Direct link to Features")

| Feature                           | Support | Description                                                                 |
| --------------------------------- | ------- | --------------------------------------------------------------------------- |
| Browser and Node.js workers       | ✅      | Move computations off the main thread                                       |
| Typed inputs and results          | ✅      | Describe a task with ordinary TypeScript objects                            |
| Multiple inputs and streams       | ✅      | Process a dataset in manageable pieces                                      |
| Reusable setup                    | ✅      | Keep a prepared projection, index, or other state for later calls           |
| Cancellation and progress         | ✅      | Stop worker work and report progress to your application                    |
| Buffer transfer and shared memory | ✅      | Choose how large arrays move between threads                                |
| Local execution                   | ✅      | Run small operations on the calling thread when a worker would add overhead |

Workers are useful when computation would otherwise block your application. Small operations may run faster locally because starting a worker and sending its data takes time. See [choosing where tasks run](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/execution.md).

## Learn more[​](#learn-more "Direct link to Learn more")

* [Worker basics](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/workers.md): what runs where and how data moves.
* [Creating tasks](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/custom-workers.md): add your own calculation and worker.
* [Reusing setup](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/persistent-resources.md): avoid rebuilding expensive state.
* [API reference](https://visgl.github.io/math.gl/next/docs/modules/tasks/api-reference/task-runner.md): methods, options, and detailed behavior.
* [Migration](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/migration.md): update applications using earlier worker APIs.
