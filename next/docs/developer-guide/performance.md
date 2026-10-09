# Performance

Reuse math objects and output buffers in repeated calculations. Core methods use standalone numeric kernels; allocation, validation, and application data layout can affect the cost of a loop.

## Reuse objects[​](#reuse-objects "Direct link to Reuse objects")

Allocate scratch objects outside the loop and update their components:

```
import {Vector3} from '@math.gl/core';



const scratch = new Vector3();

for (const position of positions) {

  scratch.copy(position).normalize();

  // Consume scratch here; its values change on the next iteration.

}
```

Store a clone or copy the components when a result must outlive the current iteration. A shared scratch object is unsuitable when callers need independent results.

## Supply output buffers[​](#supply-output-buffers "Direct link to Supply output buffers")

Matrix transforms allocate an array when no result is supplied. Pass a reusable result to avoid that allocation:

```
import {Matrix4, Vector3} from '@math.gl/core';



const matrix = new Matrix4().translate([10, 0, 0]);

const result = new Vector3();

for (const position of positions) {

  matrix.transformAsPoint(position, result);

  // Consume result before the next transform.

}
```

For large CRS coordinate buffers, use the [projection buffer APIs](https://visgl.github.io/math.gl/next/docs/modules/projection/bulk-layouts.md) instead of constructing an object for each coordinate.

## Measure your workload[​](#measure-your-workload "Direct link to Measure your workload")

Disable optional core validation with `configure({debug: false})` before measuring production performance. Compare the same inputs, output ownership, and numeric precision, and include any copying your application requires.

The [browser benchmarks](https://visgl.github.io/math.gl/next/examples/benchmarks) compare representative operations. [Projection benchmarks](https://visgl.github.io/math.gl/next/docs/modules/projection/benchmarks.md) include scalar and buffer workloads. Results depend on the JavaScript engine and hardware; measure changes in the application that will use them.

See [bundling](https://visgl.github.io/math.gl/next/docs/developer-guide/bundling.md) when download size and startup cost matter more than arithmetic throughput.
