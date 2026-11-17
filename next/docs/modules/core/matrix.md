# Matrix math

Import foundational vector and matrix math from `@math.gl/core/matrix`:

```
import {Vector3, Matrix4, Quaternion} from '@math.gl/core/matrix';



const point = new Vector3(1, 2, 3);

const transform = new Matrix4().identity();

point.transformAsPoint(transform);
```

This entry point exposes the foundational core math API, including vectors, matrices, quaternions, Euler rotations, poses, coordinate conversions, numeric types, and utilities. Its constructors are the same objects exported by `@math.gl/core`. It does not initialize task workers or import Apache Arrow, SQL, color palettes, or LUTs.

See the [core API overview](https://visgl.github.io/math.gl/next/docs/modules/core.md) for class contracts and numeric conventions.
