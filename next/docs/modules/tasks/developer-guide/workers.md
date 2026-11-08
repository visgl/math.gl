# Worker basics

In a browser, the main thread handles input and draws the page. A long calculation on that thread can make the application feel frozen. A worker runs JavaScript on a separate thread, allowing the main thread to keep responding while it waits for the result. Node.js workers serve the same purpose for CPU-heavy work on a server.

`TaskRunner` handles the messages between your application and the worker. Your application calls a task with an input object and awaits a result object. A provided task already includes its worker setup; for a custom task, you supply a worker module. See [getting started](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/task-runner.md) for a runnable example.

## What runs where[​](#what-runs-where "Direct link to What runs where")

A task with a worker target uses that worker by default. Without a worker target, it runs on the calling thread. Returning a promise or adding `async` does not, by itself, move a calculation into a worker.

Workers cannot access the page's DOM. Return the data your application needs, then update the UI on the main thread. A task's functions load from its worker module; the runner does not send functions across threads.

## Moving data[​](#moving-data "Direct link to Moving data")

Inputs and results cross the worker boundary as data, not live application objects. Inputs are copied by default. Large arrays can take time and memory to copy, so workers are most useful when their computation outweighs that cost.

If the application no longer needs an input buffer, it can transfer the buffer instead. Transferring makes the original buffer unusable; shared memory is a separate, more advanced option. See [buffers and shared memory](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/shared-memory.md).

For large datasets, produce manageable chunks rather than queueing the whole collection at once. `runTasks` accepts a lazy iterable and limits outstanding work. Its concurrency limit counts active operations, not bytes in queued inputs.

## Worker lifetime[​](#worker-lifetime "Direct link to Worker lifetime")

An ordinary runner call starts a worker and releases it when the operation ends. If starting the worker or rebuilding its setup becomes expensive, keep an [initialized task](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/persistent-resources.md) for repeated calls. Close the runner and any retained handles when their work is finished.

Applications use `TaskRunner` rather than constructing worker pools or handling transport messages. See [creating tasks](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/custom-workers.md) when you are ready to add your own worker, and [execution choices](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/execution.md) for local calls and code preloading.
