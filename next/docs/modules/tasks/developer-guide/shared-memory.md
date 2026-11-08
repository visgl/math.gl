# Buffers and shared memory

Start with the default copying behavior. It lets your application keep using its input arrays after sending them to a task. Consider transferring buffers when copying large arrays becomes a measurable cost. Shared memory is useful only when your application and task are designed to coordinate access to the same storage.

## Copy or transfer an input[​](#copy-or-transfer-an-input "Direct link to Copy or transfer an input")

| `inputOwnership`   | What happens                                                    |
| ------------------ | --------------------------------------------------------------- |
| `'copy'` (default) | Ordinary buffers are copied; the caller keeps its data          |
| `'transfer'`       | Ordinary buffers move to the task; the caller's views detach    |
| `'share'`          | Require shared storage instead of ordinary transferable buffers |

```
const values = new Float64Array([1, 2, 3]);

await runner.runTask(scaleTask, {values}, {

  options: {factor: 10},

  inputOwnership: 'transfer'

});

// values.byteLength is now 0. Do not reuse it or another view of its buffer.
```

This uses the task from [creating tasks](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/custom-workers.md). These ownership rules also apply to local execution, so changing the execution location does not change which input buffers your application may reuse.

Options are copied separately. If an input shares a buffer with reusable options, keep copy mode: transferring it would detach the options as well. Setup data has its own [initialization ownership controls](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/persistent-resources.md#separate-setup-and-processing-ownership).

## Return buffers safely[​](#return-buffers-safely "Direct link to Return buffers safely")

Output buffers transfer to the caller by default. This suits a task that creates a fresh result. If a task returns storage it needs to keep in its own state, use `outputOwnership: 'copy'` so returning the result does not detach that storage.

## Share storage[​](#share-storage "Direct link to Share storage")

A `SharedArrayBuffer` remains shared under every ownership policy, including `'copy'`. Copy mode does not isolate its contents. Both sides must agree on when they may read or write, using `Atomics` where needed. Browser shared memory also requires cross-origin isolation headers.

A custom task may accept shared arrays in its input object. Check each task's requirements: `ProjectCoordinatesTask`, for example, accepts ordinary `Float32Array` or `Float64Array` storage, not shared buffers.

Sharing data does not change cancellation behavior. Use `signal` and `onProgress` for cancellation and progress; cancelling worker work still terminates its worker. The old shared cancellation/progress control blocks are no longer public APIs. See the [reference](https://visgl.github.io/math.gl/next/docs/modules/tasks/api-reference/task-runner.md#request-fields) for all controls.
