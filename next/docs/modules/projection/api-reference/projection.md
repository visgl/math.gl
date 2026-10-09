# Projection

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`Projection` is the backend-independent type for a coordinate transformation between one source and target CRS. Create instances through a [ProjectionEngine](https://visgl.github.io/math.gl/next/docs/modules/projection/api-reference/projection-engine.md). It is a type, not a constructor.

```
import type { Projection, ProjectionEngine } from "@math.gl/projection/types";

import { projectionEngine } from "@math.gl/projection";



const engine: ProjectionEngine = projectionEngine;

const projection: Projection = engine.createProjection({ to: "EPSG:3857" });

const meters = await projection.project([12, 55]);

const longitudeLatitude = await projection.unproject(meters);
```

The `/types` entry point exports only types and adds no runtime code when used with `import type`. Applications can accept this contract without depending on a particular engine.

## Coordinate methods[​](#coordinate-methods "Direct link to Coordinate methods")

| Method                                      | Behavior                                                 |
| ------------------------------------------- | -------------------------------------------------------- |
| `project(coordinate)`                       | Convert from source to target; return a new number array |
| `unproject(coordinate)`                     | Convert from target to source; return a new number array |
| `projectTo(coordinate, output)`             | Convert into caller-owned storage and return that output |
| `unprojectTo(coordinate, output)`           | Inverse conversion into caller-owned storage             |
| `projectFlat(coordinates, dimension = 2)`   | Convert a Float32Array or Float64Array in place          |
| `unprojectFlat(coordinates, dimension = 2)` | Inverse conversion of the same flat buffer               |

Each method also has a `Sync` variant, for example `projectSync` and `projectFlatSync`. Those variants never initiate loading. Call `await projection.preload()` first when using lazy algorithms; an unprepared synchronous call throws.

Ordinary methods may return promises for deferred transforms. Awaiting them works with both eager and lazy engines. `await engine.createProjectionAsync(options)` returns a `PreparedProjection`, whose ordinary methods are synchronous as well.

```
const ready = await engine.createProjectionAsync({ to: "EPSG:3857" });

const positions = new Float64Array([12, 55, 100, 7, 13, 56, 200, 8]);

ready.projectFlat(positions, 4);

const output = new Float64Array(4);

ready.projectTo([12, 55, 100, 7], output);
```

Coordinates use canonical longitude/latitude or easting/northing order unless the selected engine supports and is configured to enforce declared axes. Z carries height or geocentric Z where applicable; extra ordinates such as M are preserved. The flat buffer length must be divisible by its dimension. A failing record is not committed, although earlier records may already be transformed.

`lossy`, when supplied by an implementation, indicates deliberate horizontal extraction. See [ProjectionTransform](https://visgl.github.io/math.gl/next/docs/modules/projection/api-reference/projection-transform.md) for configurable implementation options, validation, height conventions and CRS support limits.
