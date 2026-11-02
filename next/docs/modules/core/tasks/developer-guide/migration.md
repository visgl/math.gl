# Migrating to TaskRunner

This is a breaking API change. `@math.gl/core/worker-utils`, `@math.gl/geospatial/workers`, and `@math.gl/geospatial/workers/operations` are no longer exported. The task entry no longer re-exports transport internals. There is no compatibility entry or forwarding shim. Applications pinned to an older package version are unaffected; upgrading requires migrating imports and calls.

## Replace calls and definitions[​](#replace-calls-and-definitions "Direct link to Replace calls and definitions")

| Removed API                                   | Replacement                                             |
| --------------------------------------------- | ------------------------------------------------------- |
| Top-level `runTask`                           | `runner.runTask`                                        |
| Top-level `runTaskInBatches`                  | `runner.runTasks` (independent atomic inputs)           |
| `processOnWorker`                             | `runner.runTask` with `execution: 'worker'`             |
| `processOnWorkerInBatches`                    | `runner.runTaskInBatches` (one streaming processor)     |
| `WorkerObject`, `TaskDescriptor`              | `Task<Types>`                                           |
| `createWorker`, `createResourceWorker`        | `initializeTaskWorker(task)`                            |
| `createWorkerResource`                        | `runner.initializeTask`                                 |
| Resource `run`, `destroy`                     | Handle `runTask`, `close`                               |
| Resource `dispose` hook                       | Task `destroy` hook                                     |
| `WorkerPool`, `WorkerFarm`                    | Application-owned `TaskRunner`                          |
| `BulkProjectionWorker`, `projectBulkInWorker` | `ProjectCoordinatesTask`, result `{coordinates}`        |
| `MapSetupWorker`, `setupMapInWorker`          | `PrepareMapTask`, input `{description}`, result `{map}` |

`WorkerThread`, `WorkerJob`, `WorkerBody`, transport message types, URL/version helpers, shared-control helpers, transfer-list utilities, and library/queue helpers are no longer application APIs. Internal transport tests still exercise the underlying implementation. Do not replace removed imports with package deep imports.

`TaskOptions`, `TaskExecution`, `MainThreadPolicy`, worker/resource option types, and pool types are also removed. Use `TaskRunOptions<typeof task>`, `TaskBatchRunOptions<typeof task>`, `TaskRunsOptions<typeof task>`, `TaskRunControls`, and `TaskRunnerOptions` as appropriate.

## Run a provided task[​](#run-a-provided-task "Direct link to Run a provided task")

```
import {TaskRunner} from '@math.gl/core/tasks';

import {ProjectCoordinatesTask} from '@math.gl/geospatial/tasks';



const runner = new TaskRunner();

try {

  const {coordinates} = await runner.runTask(ProjectCoordinatesTask, {

    coordinates: new Float64Array([10, 20]),

    projection: {from: 'EPSG:4326', to: 'EPSG:3857'}

  });

  console.log(coordinates);

} finally {

  await runner.close();

}
```

For custom tasks, wrap bare arrays/scalars in named input and output fields. Application options belong under `request.options`; move application metadata from the old job context into the input. Execution, ownership, cancellation, and progress stay in the request. A worker target uses `{url, capabilities}` in Node or `{create, capabilities}` in a browser; choose one target form.

## Behavior changes that need review[​](#behavior-changes-that-need-review "Direct link to Behavior changes that need review")

* **Batching:** old top-level `runTaskInBatches` ran independent atomic inputs. Migrate to `runner.runTasks`, not the similarly named streaming method.
* **Ownership:** input copying is now the default. Select `inputOwnership: 'transfer'` deliberately; all aliases detach. Options and automatic initialization data are copied separately by default. Automatic calls can choose initialization ownership independently with `initializationOwnership`; reusable `runTasks` templates allow copy/share only. Shared buffers stay shared.
* **Lifetime:** automatic operations release temporary state and workers. Global code preloading does not retain workers or task state. For warm workers or cached projections, explicitly initialize a handle and close it in `finally`. Handles are serial and occupy runner capacity when idle.
* **Cancellation:** worker abort hard-terminates the worker and invalidates its handle. Reinitialize before retrying. There is no rollback or automatic retry. Local code must observe its signal and yield; local cleanup waits for it to settle.
* **Routing:** `auto` selects a declared worker, otherwise local processing. It does not inspect input size. Replace `mainThread.maxSize/getSize` with an explicit application decision between `'main-thread'` and `'worker'`.
* **Cleanup:** `close()` drains accepted work; finish or return iterators first. `terminate()` cancels owned work, including blocked top-level input reads. There is no built-in shutdown deadline.

## Intentionally removed advanced controls[​](#intentionally-removed-advanced-controls "Direct link to Intentionally removed advanced controls")

These are removals, not renamed settings. Passing old fields does not enable them.

| Old capability                                                 | Migration                                                                                                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared/global worker farm configuration                        | Own and share an explicit runner in the application                                                                                             |
| Byte budgets, reservations, queue priorities, admission tokens | Bound production before calling the runner; use lazy `runTasks` inputs for count-bounded work. Implement byte accounting upstream when required |
| `preloadWorker` and automatic worker reuse                     | Global `preloadTasks([task])` loads code only; `initializeTask` retains a live worker and application state                                     |
| Cooperative worker abort and shared progress counters          | Use hard cancellation and `onProgress`; custom shared-data coordination belongs to the task                                                     |
| Built-in job/pool metrics                                      | Measure application timings around calls and use task progress events                                                                           |
| Shutdown timeouts                                              | Set an application timer that calls `terminate`; forced stop cannot promise task cleanup                                                        |
| Custom transport/protocol extensions                           | Integrate custom infrastructure outside this API; transport internals are not supported extension points                                        |
| Library-loading helpers                                        | Use standard module imports, `fetch`, or application-owned loading code                                                                         |

For byte-bounded workloads or cooperative worker cancellation, upgrading requires application changes; the runner does not reproduce these guarantees automatically. See the [API reference](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/api-reference/task-runner.md) for supported controls.
