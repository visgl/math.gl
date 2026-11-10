# Arrow expressions in a worker

Run `yarn build` at the repository root, then
`yarn workspace math.gl-arrow-expressions-worker start`.

The example compiles an expression inside a retained worker and evaluates a two-batch table.
TaskRunner copies input buffers by default and transfers output buffers back. The host table remains
usable. Close the initialized task and runner to release workers.

For a browser bundler, replace the task's `worker.url` with
`worker.create: () => new Worker(new URL('./worker.mjs', import.meta.url), {type: 'module'})`.
The worker implementation and table transport are identical. Register custom functions, including
Turf wrappers, inside `worker.mjs` and pass the registry to `createArrowExpressionTask({registry})`.
