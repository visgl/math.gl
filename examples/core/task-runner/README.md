# TaskRunner: one task, four execution patterns

After `yarn install` and `yarn build` from the repository root, run from this directory:

```sh
yarn start
```

The example runs real Node workers and checks its results with assertions:

```text
One call: [ 11, 21, 31 ]
Independent slots: [ 1, 1, 2 ]
One streaming session: [ 1, 2 ]
Explicit lifetime: [ 1, 2 ]
```

- `task.mjs` defines named input/output fields, lifecycle hooks, and both processors.
- `worker.mjs` installs the task inside the worker.
- `main.mjs` compares automatic and explicit state lifetimes and closes its runner.

The `calls` output reveals state reuse: two parallel slots each start at one;
streaming and explicit handles increment the same state instance.

See the [get-started guide](../../../docs/modules/core/tasks/developer-guide/task-runner.md)
for the TypeScript version, browser setup, ownership, and prototype limitations.

Run the provided geospatial tasks used in the guide:

```sh
yarn geospatial
```

This verifies coordinate projection, ordered multiple inputs, streaming, retained
projection state, and a portable map snapshot using the package's worker targets.
