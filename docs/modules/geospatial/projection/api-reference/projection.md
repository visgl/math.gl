# Projection

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`Projection` is the backend-independent type for a coordinate transformation between
one source and target CRS. Create instances through a [ProjectionEngine](./projection-engine.md).
It is a type, not a constructor.

```typescript
import type { Projection, ProjectionEngine } from "@math.gl/geospatial/projection/types";
import { projectionEngine } from "@math.gl/geospatial/projection";

const engine: ProjectionEngine = projectionEngine;
const projection: Projection = engine.createProjection({ to: "EPSG:3857" });
const meters = await projection.project([12, 55]);
const longitudeLatitude = await projection.unproject(meters);
```

The `/types` entry point exports only types and adds no runtime code when used with
`import type`. Applications can accept this contract without depending on a particular engine.

## Coordinate methods

| Method                                      | Behavior                                                 |
| ------------------------------------------- | -------------------------------------------------------- |
| `project(coordinate)`                       | Convert from source to target; return a new number array |
| `unproject(coordinate)`                     | Convert from target to source; return a new number array |
| `projectTo(coordinate, output)`             | Convert into caller-owned storage and return that output |
| `unprojectTo(coordinate, output)`           | Inverse conversion into caller-owned storage             |
| `projectFlat(coordinates, dimension = 2)`   | Convert a Float32Array or Float64Array in place          |
| `unprojectFlat(coordinates, dimension = 2)` | Inverse conversion of the same flat buffer               |

Each method also has a `Sync` variant, for example `projectSync` and `projectFlatSync`.
Those variants never initiate loading. Call `await projection.preload()` first when using
lazy algorithms; an unprepared synchronous call throws.

Ordinary methods may return promises for deferred transforms. Awaiting them works with
both eager and lazy engines. `await engine.createProjectionAsync(options)` returns a
`PreparedProjection`, whose ordinary methods are synchronous as well.

```typescript
const ready = await engine.createProjectionAsync({ to: "EPSG:3857" });
const positions = new Float64Array([12, 55, 100, 7, 13, 56, 200, 8]);
ready.projectFlat(positions, 4);
const output = new Float64Array(4);
ready.projectTo([12, 55, 100, 7], output);
```

Coordinates use canonical longitude/latitude or easting/northing order unless the
selected engine supports and is configured to enforce declared axes. Z carries height
or geocentric Z where applicable; extra ordinates such as M are preserved. The flat
buffer length must be divisible by its dimension. A failing record is not committed,
although earlier records may already be transformed.

`lossy`, when supplied by an implementation, indicates deliberate horizontal extraction.
See [ProjectionTransform](./projection-transform.md) for configurable implementation options,
validation, height conventions and CRS support limits.

## Resolved transform description

`projection.description?: ProjectionTransformDescription` describes the **prepared
execution**, without reconstructing the original CRS strings. This optional contract
allows another backend, such as a GPU graph executor, to assess whether it implements
the same transform. It adds no GPU dependency. Other engines may omit it.

```typescript
import {projectionEngine} from '@math.gl/geospatial/projection';

const projection = await projectionEngine.createProjectionAsync({to: 'EPSG:3857'});
const description = projection.description;
if (description?.version === 1 && description.complete) {
  // Pass to an application-owned matcher that checks every stage, parameter,
  // supported domain and precision requirement before choosing a GPU kernel.
  console.log(description.target.algorithm, description.forward.stages);
}
// The prepared CPU transform remains available as a fallback.
const positions = projection.projectFlat(new Float64Array([12, 55]), 2);
```

Math.gl exposes a deeply frozen, detached snapshot on eager transforms and on deferred
transforms after `preload()` or a successful coordinate call. Reading the property
never loads an algorithm. `createProjectionAsync()` returns it already prepared.
The same snapshot object is reused. Grid callbacks and projection objects are excluded.

| Field | Meaning |
| --- | --- |
| `version` | Version of math.gl's pipeline semantics and this description schema; currently `1`. Reject unknown versions. |
| `source`, `target` | Resolved CRS kind, projection parameters, algorithm identity, ellipsoid, datum, units, axes, prime meridian, longitude wrap, optional area of use, and lossy status. |
| `forward`, `inverse` | Effective input/output axes, whether three input ordinates are required, whether output is geocentric, and execution stages in order. `forward` describes `project`; `inverse` describes `unproject`. |
| `lossy` | Whether horizontal extraction discarded vertical CRS information. |
| `complete` | All algorithm identities are supplied and no grid resource requires opaque behavior. This is necessary, **not sufficient**, for selecting another backend. |
| `opaqueReasons` | `source-algorithm`, `target-algorithm`, or `grid-resource`. Consumers should fall back when they cannot establish equivalence. |

CRS units retain the normalization contract: `angularUnit` converts geographic input
to radians; `toMeter` converts horizontal projected/geocentric input to metres;
`verticalUnit` converts height to metres. `primeMeridian` and `longitudeWrap` are radians.
Projection-specific `parameters` retain PROJ textual units and defaults are interpreted
by the identified algorithm version. Flags such as `+over` have `null` values, so their
presence survives JSON serialization. Parameters are resolved definitions, not a
canonical equivalence key: different definitions can describe equivalent mathematics.
Datum `towgs84` uses metres, arcseconds and ppm. `undefined` disables datum conversion.
Grid entries contain only ordered names, optional status and whether a payload was loaded;
matching names never establish equivalent grid contents or interpolation.

The version-1 scalar pipeline executes the following order, omitting inactive stages
from each direction's `stages` list. Flat kernels implement the same coordinate semantics.

```text
input axis -> discard height if lossy -> input scale -> source inverse
    -> input height scale -> geographic domain check -> source prime meridian
    -> source vertical grid -> datum conversion -> target vertical grid
    -> target prime meridian -> longitude wrap -> target forward
    -> output scale -> output height scale -> restore height if lossy -> output axis
```

Input scale also scales geocentric Z. Source vertical correction adds geoid undulation;
target correction subtracts it. The datum stage identifies math.gl's version-1 grid,
ellipsoid and Helmert chain; it does not imply an identity datum transform. Prime-meridian
steps add the source offset and subtract the target offset. Output scales divide.
Third ordinates are height or geocentric Z; absent optional height starts at zero,
additional ordinates are preserved, and lossy transforms preserve the original third
ordinate around horizontal processing. Coordinate methods validate finite input/output;
the geographic domain check rejects latitude outside ±π/2. `areaOfUse` is advisory
coverage metadata, not a promise that all coordinates in it are valid for an algorithm.
Algorithm-specific singularities, wrapping and convergence behavior still apply.

### Algorithm identities and safe matching

`ProjectionPlugin.semantics?: {id: string, version: number}` is an explicit promise
by an algorithm publisher. Its `id` is a namespaced semantic identifier; `version`
changes when equations, defaults, domain, wrapping or height behavior change.
A replacement plugin must omit this field unless its publisher can make that promise.
Copying a built-in plugin's `semantics` while replacing `create()` asserts equivalence;
math.gl does not verify third-party equations. Names and aliases alone never opt in.

The initial built-in identities are `@math.gl/geospatial/geographic`,
`@math.gl/geospatial/identity`, `@math.gl/geospatial/merc` and `@math.gl/geospatial/eqc`,
all version `1`. Other algorithms remain opaque until explicitly identified, including
composite algorithms with nested plugin dependencies. Custom plugins may supply their
own identities. A grid-backed transform remains incomplete even when its algorithms
are identified, because this API does not fingerprint resource contents.

Consumers must recognize the schema and both algorithm versions, then inspect **both
CRSs and every executed stage**, including datum conversion, axis policy, height units,
lossy behavior and wrapping. They must also qualify their numeric precision and supported
domain against the CPU implementation. `complete` is neither `gpuSupported` nor an
accuracy certificate. Unknown metadata, opaque resources or unsupported behavior should
select the CPU fallback, without speculative uploads or readbacks.
