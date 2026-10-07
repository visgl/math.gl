# Get Started

Install the modules your application needs. Start with core for vectors, matrices, and rotations:

```bash
npm install @math.gl/core
```

```js
import {Vector3} from '@math.gl/core';

const position = new Vector3(1, 2, 3);
position.add([4, 0, 0]); // Mutates position to [5, 2, 3]
const copy = position.clone();
```

Core classes extend JavaScript `Array`. Most arithmetic methods modify the receiver and return it for chaining; use `clone()` when the original must be preserved. See the [core overview](../modules/core/README.md) for classes and conventions.

## Choose a module

Each module has its own package and installation instructions. Use [projection](../modules/projection/README.md) for CRS conversion, [web-mercator](../modules/web-mercator/README.md) for map cameras, and [geospatial](../modules/geospatial/README.md) for ellipsoid and globe math. The [module list](../README.md#modules) covers the full toolbox.

## TypeScript

Types ship with each package; no separate types package is needed. math.gl v5 declarations require TypeScript 6.0 or later for `Float16Array` types. Runtime `Float16Array` support remains optional. See [array types](../modules/types/api-reference/array-types.md) for detection and fallback helpers.

## Module formats

Packages provide ES module and CommonJS entry points. Use named imports from the package root, or documented subpaths for optional functionality. See [bundling](./bundling.md) for selective imports and bundle measurements.
