# Shared memory and ownership

Inputs copy by default. Use `inputOwnership: 'transfer'` to move ordinary buffers
or `inputOwnership: 'share'` to require shared storage. A `SharedArrayBuffer`
remains shared even in copy mode; copying does not provide isolation for it.
Browser shared memory requires the appropriate cross-origin isolation headers.

Custom tasks may accept shared arrays inside named input fields. The application
and task must define synchronization with `Atomics` and data ownership rules.
The provided `ProjectCoordinatesTask` accepts ordinary floating-point buffers,
not shared storage.

The public API no longer exposes shared cancellation/progress control blocks.
Use `signal` and `onProgress` on task calls. Worker abort terminates the worker;
shared input support does not imply cooperative worker cancellation.
See [ownership controls](./task-runner.md#choose-buffer-ownership) and
[migration](./migration.md) for details.
