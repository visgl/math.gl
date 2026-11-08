# Task execution and workers

Use [`TaskRunner`](./task-runner.md) to execute work in
browser or Node workers. The runner owns execution capacity and task lifetimes;
applications do not construct public worker pools or farms.

- [Running tasks and controlling execution](./task-runner.md#controlling-task-execution)
- [Writing a task and its worker module](./custom-workers.md)
- [Retaining state](./persistent-resources.md)
- [Migration from removed worker APIs](./migration.md)

For large producers, pass a lazy iterable to `runTasks` and select concurrency.
Do not enqueue an unbounded number of `runTask` promises: runner concurrency
limits active work, not the memory retained by queued application inputs.
