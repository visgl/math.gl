# Get Started

Install the modules your application needs. Start with core for vectors, matrices, and rotations:

```
npm install @math.gl/core
```

```
import {Vector3} from '@math.gl/core';



const position = new Vector3(1, 2, 3);

position.add([4, 0, 0]); // Mutates position to [5, 2, 3]

const copy = position.clone();
```

Core classes extend JavaScript `Array`. Most arithmetic methods modify the receiver and return it for chaining; use `clone()` when the original must be preserved. See the [core overview](https://visgl.github.io/math.gl/next/docs/modules/core.md) for classes and conventions.

## Choose a module[​](#choose-a-module "Direct link to Choose a module")

Each module has its own package and installation instructions. Use [projection](https://visgl.github.io/math.gl/next/docs/modules/projection.md) for CRS conversion, [web-mercator](https://visgl.github.io/math.gl/next/docs/modules/web-mercator.md) for map cameras, and [geospatial](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md) for ellipsoid and globe math. The [module list](https://visgl.github.io/math.gl/next/docs.md#modules) covers the full toolbox.

## TypeScript[​](#typescript "Direct link to TypeScript")

Types ship with each package; no separate types package is needed. math.gl v5 declarations require TypeScript 6.0 or later for `Float16Array` types. Runtime `Float16Array` support remains optional. See [array types](https://visgl.github.io/math.gl/next/docs/modules/types/api-reference/array-types.md) for detection and fallback helpers.

## Module formats[​](#module-formats "Direct link to Module formats")

Packages provide ES module and CommonJS entry points. Use named imports from the package root, or documented subpaths for optional functionality. See [bundling](https://visgl.github.io/math.gl/next/docs/developer-guide/bundling.md) for selective imports and bundle measurements.
