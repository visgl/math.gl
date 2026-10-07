# Performance

Reuse math objects and output buffers in repeated calculations. Core methods use standalone numeric kernels; allocation, validation, and application data layout can affect the cost of a loop.

## Reuse objects

Allocate scratch objects outside the loop and update their components:

```js
import {Vector3} from '@math.gl/core';

const scratch = new Vector3();
for (const position of positions) {
  scratch.copy(position).normalize();
  // Consume scratch here; its values change on the next iteration.
}
```

Store a clone or copy the components when a result must outlive the current iteration. A shared scratch object is unsuitable when callers need independent results.

## Supply output buffers

Matrix transforms allocate an array when no result is supplied. Pass a reusable result to avoid that allocation:

```js
import {Matrix4, Vector3} from '@math.gl/core';

const matrix = new Matrix4().translate([10, 0, 0]);
const result = new Vector3();
for (const position of positions) {
  matrix.transformAsPoint(position, result);
  // Consume result before the next transform.
}
```

For large CRS coordinate buffers, use the [projection buffer APIs](../modules/projection/api-reference/projection-buffer.md) instead of constructing an object for each coordinate.

## Measure your workload

Disable optional core validation with `configure({debug: false})` before measuring production performance. Compare the same inputs, output ownership, and numeric precision, and include any copying your application requires.

The [browser benchmarks](/examples/benchmarks) compare representative operations. [Projection benchmarks](../modules/projection/benchmarks.md) include scalar and buffer workloads. Results depend on the JavaScript engine and hardware; measure changes in the application that will use them.

See [bundling](./bundling.md) when download size and startup cost matter more than arithmetic throughput.
