# Choosing where tasks run

`TaskRunner` accepts `execution: 'auto' | 'main-thread' | 'worker'`. `auto` uses the task's worker when declared, otherwise its local processor. Select the route explicitly when the application knows the cost of a request.

```
const {coordinates: projected} = await runner.runTask(ProjectCoordinatesTask,

  {coordinates, projection},

  {execution: coordinates.length < 1000 ? 'main-thread' : 'worker'}

);
```

The threshold is an application policy, not a library recommendation. Measure the computation and transport costs for your workload. Local calls preserve clone/transfer ownership boundaries; they do not make synchronous computation CPU-parallel. Worker load failures reject instead of silently falling back.

See [getting started](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/task-runner.md) for imports and complete examples, and [migration](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/migration.md) for the removed adaptive routing policy.
