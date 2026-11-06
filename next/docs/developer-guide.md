# Developer Guide

Start with a small calculation, then choose the modules your application needs. math.gl runs on the CPU; its arrays and coordinate utilities can feed a map, a renderer, or an analysis pipeline.

## Install and make a calculation[​](#install-and-make-a-calculation "Direct link to Install and make a calculation")

For vectors, matrices, and rotations, install core:

```
npm install @math.gl/core
```

```
import {Vector3} from '@math.gl/core';



const position = new Vector3(1, 2, 3);

const moved = position.clone().add([4, 0, 0]);

// position stays [1, 2, 3]; moved is [5, 2, 3].
```

Core classes extend JavaScript `Array`. Most arithmetic methods change the receiver and return it for chaining. Clone an object when you need to preserve its value; otherwise, reuse it. Plain arrays and typed arrays work with APIs that accept numeric array inputs.

Browse [Modules](https://visgl.github.io/math.gl/next/docs/modules.md) to choose the next building block. Use [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry.md) for meshes and Cartesian queries, [Geospatial](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md) for ellipsoids and coordinate transformations, [Earth](https://visgl.github.io/math.gl/next/docs/modules/earth.md) for geoid, sky, and timezone calculations, and [Web Mercator](https://visgl.github.io/math.gl/next/docs/modules/web-mercator.md) for map cameras. Each module has its own Guide and API sections.

Packages include ES module and CommonJS entry points and their TypeScript declarations. No separate types package is needed. Version 5 declarations require TypeScript 6.0 or later; runtime `Float16Array` support is optional. See [array types](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/array-types.md) for detection and fallback helpers. If you are updating an existing application, follow the [v5 upgrade guide](https://visgl.github.io/math.gl/next/docs/upgrade-guide.md#upgrading-to-v50).

## Make coordinate conventions explicit[​](#make-coordinate-conventions-explicit "Direct link to Make coordinate conventions explicit")

Before combining operations, establish what each number means: units, coordinate system, axis order, and whether a position is a point or a direction. Longitude/latitude degrees, projected metres, Earth-centered coordinates, and screen pixels are different inputs. Height may be relative to an ellipsoid or a geoid.

Check a known point before processing a whole dataset. For rotations and matrix composition, verify the angle units and operation order with a simple case, such as rotating `[1, 0, 0]` about Z by 90 degrees. A forward/inverse round trip is useful, but both operations can share the same mistaken convention. The [Core preliminaries](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/coordinate-systems.md) and [CRS guide](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs/developer-guide/coordinate-reference-systems.md) explain the underlying conventions.

## Catch mistakes during development[​](#catch-mistakes-during-development "Direct link to Catch mistakes during development")

Enable core validation to find invalid numeric results close to the operation that produced them:

```
import {configure, Vector3} from '@math.gl/core';



configure({debug: true});

const position = new Vector3(1, 2, 3);

position.scale(NaN); // Throws when the result is checked.
```

Debug checks are off by default. Mutating core methods call `check()` to validate element counts and finite values when enabled. Use `validate()` when you want a boolean instead of an exception. These checks cannot detect incorrect units or coordinate systems. Configuration is shared globally, including between copies of core.

For readable diagnostic output, use `configure({precision: 6, printTypes: true})` and `toString()`, or `formatString({precision: 3, printTypes: false})` for one call. Formatting affects strings, not stored numbers. Matrix display defaults to rows even though storage is column-major. See [core utilities](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/utilities.md) for the full options.

Test with independent expected values and a tolerance appropriate to the scale and algorithm. Include degenerate inputs, projection boundaries, and antimeridian crossings when they matter to your application.

## Reuse results in repeated work[​](#reuse-results-in-repeated-work "Direct link to Reuse results in repeated work")

Allocate scratch objects outside hot loops. Consume each result before reusing its storage, and copy it if it needs to outlive the iteration:

```
import {Matrix4, Vector3} from '@math.gl/core';



const matrix = new Matrix4().translate([10, 0, 0]);

const result = new Vector3();

for (const position of positions) {

  matrix.transformAsPoint(position, result);

  // Consume result here; the next iteration overwrites it.

}
```

For large coordinate datasets, prefer [projection buffer APIs](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/bulk-layouts.md) over constructing an object per coordinate. Disable optional debug checks before benchmarking. Compare equivalent inputs, precision, output ownership, and copying costs using your actual workload. The [browser benchmarks](https://visgl.github.io/math.gl/next/examples/benchmarks) and [projection measurements](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/benchmarks.md) provide starting points.

## Keep application bundles small[​](#keep-application-bundles-small "Direct link to Keep application bundles small")

Use named imports from documented package entry points:

```
import {Matrix4, Vector3, mat4, vec3} from '@math.gl/core';
```

Production ESM bundlers can remove unused exports. Avoid storing or passing the complete package namespace, which can make every export observable and prevent tree shaking. Native Node ESM and CommonJS load static root dependencies even when you import a single name; tree shaking is a bundler optimization.

Measure a minified production build of your application. Installed package size and development bundles do not predict download cost. Compare compressed output and bundle-analyzer results before and after an import change. Include the compression your server actually uses; gzip and Brotli produce different transfer sizes. Source maps should be assessed separately.

## Process external data and code safely[​](#process-external-data-and-code-safely "Direct link to Process external data and code safely")

Bound input size, nesting, geometry complexity, queue size, and execution time at your application boundary. Numeric validation catches malformed values; it does not make an expensive workload safe to run. Expressions can call registered functions and access their supplied context, so expose only appropriate capabilities. Expression evaluation is not a security sandbox.

Use trusted task implementations, worker scripts, and module URLs. Workers improve responsiveness but run with their environment's privileges; isolate untrusted code in a restricted process or service. Validate messages on both sides, account for transferred or shared buffers, and remember that terminating a worker cannot guarantee cleanup. A timeout cannot interrupt synchronous local work. The [Tasks guide](https://visgl.github.io/math.gl/next/docs/modules/core/tasks.md) explains execution and ownership.

Keep dependencies and lockfiles current, review advisories and build changes, and control the origins of downloaded assets. Package manifests and your application's lockfile are the source of truth for runtime and transitive dependencies. Report suspected vulnerabilities privately through the [security policy](https://github.com/visgl/math.gl/security/policy).

## Work with an AI coding agent[​](#work-with-an-ai-coding-agent "Direct link to Work with an AI coding agent")

Ask your agent to inspect the installed package versions and public declarations first. Stable and upcoming versions can expose different APIs. The [stable documentation index](https://visgl.github.io/math.gl/llms.txt) and [next index](https://visgl.github.io/math.gl/next/llms.txt) link to individual Markdown pages; an agent can read the relevant overview and API pages without loading the whole site.

You can install the repository's [mathgl skill](https://github.com/visgl/math.gl/tree/master/skills/mathgl):

```
npx skills add visgl/math.gl --skill mathgl
```

Give the agent the same numerical contract you would give a colleague: package version, input and output types, units, coordinate system, mutation rules, and one expected result. Ask it to verify cloning, aliasing, matrix order, and numerical tolerances. Repository contributors should also follow the lint, build, and test instructions in `AGENTS.md`.
