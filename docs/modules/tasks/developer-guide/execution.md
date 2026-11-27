# Choosing where tasks run

Use a worker for calculations that would otherwise block your application. For a
small input, starting a worker and sending data may cost more than doing the work
locally. Measure the whole operation—including startup and data movement—before
tuning it.

## Choose an execution location

The default, `auto`, uses the task's worker if it has one and otherwise runs locally.
You can make the choice explicit on a call:

```ts
await runner.runTask(ProjectCoordinatesTask, {coordinates, projection}, {
  execution: 'worker'
});
```

| Value | Behavior |
| --- | --- |
| `'auto'` | Use a declared worker; otherwise run locally |
| `'worker'` | Require a worker |
| `'main-thread'` | Run on the calling thread |

`auto` does not inspect the input size. Your application can choose a route based
on measurements, but there is no universal size threshold. A failed worker call
reports its error rather than unexpectedly retrying a large calculation on the
main thread.

Awaiting local work does not make synchronous calculations run in the background.
For a small task whose hooks are all synchronous, `runTaskSync` can return the
result directly. It blocks the calling thread; see the
[synchronous API](../api-reference/task-runner.md#synchronous-execution).

## Load code before it is needed

If the first call spends noticeable time loading code, preload it before the user
starts the operation:

```ts
import {preloadTasks} from '@math.gl/tasks';
import {ProjectCoordinatesTask} from '@math.gl/geospatial/tasks';

await preloadTasks([ProjectCoordinatesTask]);
// Later, use runner.runTask(ProjectCoordinatesTask, input) as usual.
```

Preloading downloads worker code and runs any optional task `preload` hook. Its
temporary worker then stops. A later call still starts a worker and initializes
the task, but the browser may reuse the downloaded code according to its cache
policy. Node workers do not share a JavaScript module cache.

Use [an initialized handle](./persistent-resources.md) if you want to keep the
worker and its setup ready, rather than just load its code. For local execution,
`preloadTasks([task], {execution: 'main-thread'})` loads code on the calling thread.
Ordinary asynchronous calls also await the task's preload hook automatically.

## Set concurrency

A runner starts with capacity for one active operation. Increase `maxConcurrency`
when independent work can benefit from several workers:

```ts
const runner = new TaskRunner({maxConcurrency: 4});
```

`runTasks(..., {concurrency: 2})` uses at most two of those slots. Other work on the
same runner may leave fewer slots available. Streams occupy their slot until they
end; initialized handles occupy a slot even while idle.

More concurrency uses more resources. It does not make CPU-heavy JavaScript run
in parallel on a single thread, and it does not bound the memory retained by
queued inputs. Prefer lazy inputs to `runTasks` over an unbounded list of promises.

## Cancellation and cleanup

Pass a `signal` to cancel a call and `onProgress` to receive progress reported by
the task. The [getting-started guide](./task-runner.md#cancel-work-and-observe-progress)
shows these controls together.

Cancelling worker work stops its worker and invalidates any retained state. There
is no automatic retry. Local calculations need to check their signal and yield
so cancellation events can run; synchronous local code cannot be forcibly stopped.

When finished, `await runner.close()` waits for accepted work and releases its
resources. Finish or close result iterators first. Use `terminate(reason)` when you
need to stop owned work instead of waiting for it to finish; forced termination
cannot guarantee the task's cleanup hook runs. See the
[API reference](../api-reference/task-runner.md) for exact shutdown behavior.
