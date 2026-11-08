# @math.gl/tasks

Typed task scheduling and worker execution for browsers and Node.js.

```sh
npm install @math.gl/tasks
```

```typescript
import {TaskRunner} from '@math.gl/tasks';

const runner = new TaskRunner();
try {
  const result = await runner.runTask({id: 'double', process: ({value}: {value: number}) => ({value: value * 2})}, {value: 3});
} finally {
  await runner.close();
}
```

The public package root provides `TaskRunner`, task preloading, typed operation dispatch,
and custom worker initialization. Worker transport internals are private. The package
has no runtime dependencies and does not require math.gl core, Arrow, or geospatial.

- [Getting started](https://math.gl/docs/modules/tasks)
- [API reference](https://math.gl/docs/modules/tasks/api-reference/task-runner)
- [Task runner example](../../examples/tasks/task-runner/README.md)
- Domain tasks remain in `@math.gl/geospatial/tasks` and depend on this scheduler.
