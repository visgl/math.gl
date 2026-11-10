# Get started with Tasks

When a calculation takes long enough to interrupt scrolling, interaction, or
rendering, run it in a worker. `TaskRunner` gives you a way to send data to that
worker and await a result without managing worker messages yourself.

You need two things: a task that describes the work and a runner that executes it.
This guide starts with a task already provided by math.gl. You can create your
own tasks later.

## Install

Install the runner and the geospatial module used in these examples:

```sh
npm install @math.gl/tasks @math.gl/geospatial
```

Other tasks can use `@math.gl/tasks` on its own.

## Running a task

`ProjectCoordinatesTask` converts coordinates between coordinate reference
systems. Here it converts longitude and latitude in degrees to Web Mercator
coordinates in meters:

```ts
import {TaskRunner} from '@math.gl/tasks';
import {ProjectCoordinatesTask} from '@math.gl/geospatial/tasks';

const runner = new TaskRunner();
try {
  const {coordinates} = await runner.runTask(ProjectCoordinatesTask, {
    coordinates: new Float64Array([0, 0, 10, 20]),
    projection: {from: 'EPSG:4326', to: 'EPSG:3857'}
  });

  console.log([...coordinates]);
  // Approximately [0, 0, 1113194.91, 2273030.93]
} finally {
  await runner.close();
}
```

The task includes its worker implementation. The runner starts that worker,
sends the input, and resolves the promise with the result. The small array keeps
the example readable; the same call can process a much larger coordinate array.

Inputs and results use objects with named fields, such as `{coordinates}`. Input
arrays are copied by default, so the original data remains available to your
application.

Create a runner for the work your application needs, and close it when that work
is finished—for example, when a view is removed. `close()` waits for accepted work
and releases its resources. The `try`/`finally` pattern above also closes the runner
if a task throws an error.

## Process multiple inputs

Use `runTasks` when you have several independent pieces of work. It yields results
in input order, even if workers finish in a different order. Using the imports
from the first example:

```ts
const runner = new TaskRunner({maxConcurrency: 2});
const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};

try {
  const inputs = [
    {coordinates: new Float64Array([0, 0, 10, 20]), projection},
    {coordinates: new Float64Array([-74, 40.7, 139.7, 35.7]), projection}
  ];

  for await (const {coordinates} of runner.runTasks(
    ProjectCoordinatesTask,
    inputs,
    {concurrency: 2}
  )) {
    console.log(coordinates);
  }
} finally {
  await runner.close();
}
```

`maxConcurrency` limits how many operations the runner can keep active.
The call's `concurrency` chooses how many of those slots this group may use.
More slots can allow more workers to calculate at once, but also use more memory.
Start small and measure before increasing them.

For data that arrives over time, pass an async iterable instead of an array. The
runner requests inputs as it has room for them. This is preferable to creating
thousands of `runTask` promises at once: a concurrency limit bounds active work,
not the memory occupied by all queued inputs.

## Process a stream

Use `runTaskInBatches` when chunks should pass through one processing session.
For example, the projection task can keep one projection ready while coordinates
arrive:

```ts
const runner = new TaskRunner();
const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};

async function* coordinateBatches() {
  yield {coordinates: new Float64Array([0, 0, 10, 20]), projection};
  yield {coordinates: new Float64Array([-74, 40.7]), projection};
}

try {
  for await (const {coordinates} of runner.runTaskInBatches(
    ProjectCoordinatesTask,
    coordinateBatches()
  )) {
    console.log(coordinates); // Consume each result as it arrives.
  }
} finally {
  await runner.close();
}
```

Choose `runTasks` for independent inputs; choose `runTaskInBatches` for a task
that processes a stream as a whole. A streaming task can combine or split chunks,
so one input chunk does not have to produce exactly one output chunk.

A slow consumer slows the stream rather than accumulating all its results.
Consume results with `for await`; an early `break` also closes the output iterator.

## Controlling task execution

The defaults are a useful starting point: use the task's worker if it has one,
copy input buffers, and run one operation at a time. Add controls when your
application needs them.

### Cancel work and observe progress

Pass an `AbortSignal` to let a UI action cancel work. An optional progress callback
can update a loading indicator when the task reports progress:

```ts
const controller = new AbortController();
const runner = new TaskRunner();

try {
  const result = await runner.runTask(ProjectCoordinatesTask, {
    coordinates: new Float64Array([10, 20]),
    projection: {from: 'EPSG:4326', to: 'EPSG:3857'}
  }, {
    signal: controller.signal,
    onProgress({completed, total}) {
      console.log(completed, total);
    }
  });
  console.log(result.coordinates);
} finally {
  await runner.close();
}
// While the call is running, a UI event can call controller.abort().
```

Cancelling worker work stops its worker. Local work needs to check the signal and
yield during a long calculation; synchronous JavaScript cannot be interrupted by
a UI event. See [execution controls](./execution.md) for the details.

### Choose buffer ownership

Copying is the safest starting point. If you no longer need an input array, you can
transfer its buffer to avoid copying it:

```ts
await runner.runTask(ProjectCoordinatesTask, {coordinates, projection}, {
  inputOwnership: 'transfer'
});
// Do not use coordinates after transferring it: its buffer is detached.
```

Transfer affects every view of the same buffer. Keep the default copy mode if your
application still needs that data. [Buffers and shared memory](./shared-memory.md)
explains output buffers, sharing, and the remaining ownership options.

## Reuse initialized state

If several calls need the same projection or dataset, keep the setup ready with
`initializeTask`. The returned handle lets you call that task repeatedly without
starting from scratch. Close the handle when finished; it occupies one runner
slot even between calls.

See [reusing initialized state](./persistent-resources.md) for a complete example.
You do not need an explicit handle for ordinary one-off calls.

## Prepare a map

Tasks can return prepared data as well as arrays. `PrepareMapTask` does the map
preparation in a worker; `MapEngine.fromPrepared` turns its result into a local
engine:

```ts
import {mapPresets, mapGeometry, mapTransitions} from '@math.gl/geospatial/maps';
import {TaskRunner} from '@math.gl/tasks';
import {PrepareMapTask} from '@math.gl/geospatial/tasks';
import {MapEngine} from '@math.gl/geospatial/maps';

const runner = new TaskRunner();
try {
  const {map} = await runner.runTask(PrepareMapTask, {
    description: {
      version: 1,
      id: 'world',
      definition: {type: 'mercator'}
    }
  });

  const engine = MapEngine.fromPrepared(map, {presets: mapPresets, geometry: mapGeometry, transitions: mapTransitions});
  console.log(engine.getLayout());
} finally {
  await runner.close();
}
```

Prepared snapshots move data between the worker and application using the same
package version. They are not a permanent storage format.

## Create your own task

A task can wrap your own computation, too. Start with a `process` function that
accepts an input object and returns a result object, then add a worker entry point
to run it in the background. A function without a worker target runs locally.

Follow [creating tasks](./custom-workers.md) for a complete example, including
TypeScript types and worker setup.

## Next steps

- [Worker basics](./workers.md): understand the main thread, workers, and data movement.
- [Choosing where tasks run](./execution.md): local calls, preloading, and concurrency.
- [Reusing initialized state](./persistent-resources.md): keep expensive setup ready.
- [Runnable examples](https://github.com/visgl/math.gl/tree/master/examples/tasks/task-runner).
- [TaskRunner API](../api-reference/task-runner.md): look up exact signatures and behavior.
