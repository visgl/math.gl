# TypeScript API support and migration

`@math.gl/proj4` uses the TypeScript engine by default. `Projection` supplies
all projection plugins and WKT/PROJJSON readers behind the existing wrapper API.
`TypeScriptProjection` exposes per-instance configuration for smaller bundles.
The original proj4js-backed wrapper and its compatibility helpers are available
from `@math.gl/proj4/classic`.

The old `native` and `experimental` subpaths remain compatibility aliases for the
configurable engine; use the root, `core`, `projections/*`, `parsers/*` and `grids/*`
paths in new code. This API is available in releases containing these exports.

API compatibility does not imply identical numerical results or accepted inputs.
The documented corrections and strict-input exceptions below still apply. Neither
wrapper silently falls back to the other engine.

## Supported profile

- All 37 named projection algorithms, explicitly registered per instance. The
  geographic conversion is built into the core; Gauss is an internal helper.
- Documented PROJ parameters and aliases, with opt-in WKT1, WKT2, ESRI WKT and
  PROJJSON execution adapters using `@math.gl/crs`.
- Geographic/projected/geocentric coordinates, explicit three/seven-parameter
  static Helmert operations, ellipsoid conversion and prepared horizontal grids.
- NTv2 standard/compact node layouts and the documented two-band horizontal
  GeoTIFF convention. Applications provide grid bytes or a GeoTIFF decoder.
- Scalar arrays and interleaved Float32/Float64 buffers, including explicit axis
  enforcement and the documented horizontal-extraction mode.

The compatibility corpus has **232 original numeric matches, one reviewed numerical
correction, and nine intentional input rejections out of 242**. The correction is
Robinson's coefficient table; the original upstream coordinates remain in the repository.
Independent PROJ qualification covers **134 configurations / 2,386 projection points**,
**15 EPSG systems in four formats**, **12 three-dimensional datum chains / 144 points**,
and **87 real-grid points in NTv2 and GeoTIFF**. See [independent validation](./independent-validation.md)
for domains, accuracy budgets, source versions and the grid-edge policy.

These counts and the complete reviewed exception list are maintained in
`test/fixtures/release-qualification.json` and checked in CI. Inventory entries remain
partial relative to unrestricted upstream behavior; that distinction is deliberate.

## API guarantees

Eager construction is synchronous and resolves plugins, parsers, aliases and prepared grids.
With projection descriptors, construction reads definitions but algorithms load on the
first asynchronous coordinate call. `projectSync`/`unprojectSync` and their flat variants
require preloading; they never start an import. See the [loading guide](./typescript-engine.md#load-less-used-projections-on-demand).
The eager engine and default wrapper perform no network requests. Descriptor imports
can fetch application chunks through the bundler runtime. The configurable `TypeScriptProjection` keeps plugin registration per instance and
shares only the descriptor implementation cache. The convenience `Projection` preserves the classic static registration
API: aliases and NTv2 grids affect subsequently constructed wrappers of that backend.
Existing instances retain their compiled configuration. Registries are independent
between TypeScript and classic wrappers.
Unsupported definitions and missing stages fail explicitly. There is no automatic
fallback to another engine. Reuse an instance for repeated transformations.

`project` and `unproject` leave the input unchanged and return a new array (or a
promise for descriptor-backed instances).
`projectFlat` and `unprojectFlat` modify the supplied typed-array view and return
that same view. Dimension must be an integer of at least two and divide the view's
length. Geocentric transformations require room for three ordinates. Data outside
the view is untouched. A failing batch commits earlier records, preserves the
failing record, and leaves later records unchanged; the operation is not transactional.

Third ordinates represent height or geocentric Z and can change during datum
transforms. Fourth and later ordinates pass through. Missing geographic height
uses zero internally; this does not make a two-dimensional datum transform a
three-dimensional reversible operation. `datum=none` at either endpoint disables
the entire datum-conversion chain.

Default coordinate order remains east/north (longitude/latitude for geographic
coordinates), matching the wrapper convention. Use `enforceAxis` for declared axis
order and signs. Lossy horizontal extraction is explicit and reported on the instance.

Public entry points, option meanings, plugin/reader contracts, typed-array ownership,
and error categories form the compatibility contract. Human-readable error text is
not a stable identifier. Coordinate corrections and stricter rejection of invalid
inputs may ship as bug fixes; release notes must identify material numerical changes.
No sub-metre/global-domain guarantee follows from API stability.

## Migration

The default wrapper retains the same constructor options (`from`, `to`, `enforceAxis`),
bound `project`/`unproject` methods, `defineProjectionAliases` static method, and
`registerDatumGrid` static method, including `includeErrorFields`. It also exposes
`projectFlat`/`unprojectFlat` for typed arrays. No plugin setup is required:

```typescript
import {Projection} from '@math.gl/proj4';
const projection = new Projection({to: 'EPSG:3857'});
const projected = projection.project([12, 55]);
```

`Proj4Projection` at the root is a deprecated alias of `Projection`, with identical
constructor identity, methods and static registries. Existing imports continue to work.
New code can use `ProjectionOptions` and `DatumGridOptions`; the existing option type
names remain available.

To retain the original backend, use the classic entry point:

```typescript
import {Proj4Projection as Projection} from '@math.gl/proj4/classic';
```

The proj4js-specific `checkProj4CRSCompatibility`, `toProj4CRSDefinition` and
`Proj4CRSCompatibilityError` exports also move to `classic`. Use
`checkTypeScriptCRSCompatibility` with explicit plugins/readers to check the
configurable TypeScript engine. Legacy registry calls must use the same backend
as the instances that consume them.

For selective bundles, register algorithms required by **both** ends:

```typescript
import {TypeScriptProjection} from '@math.gl/proj4/core';
import {mercator} from '@math.gl/proj4/projections/merc';
import {universalTransverseMercator} from '@math.gl/proj4/projections/utm';

const projection = new TypeScriptProjection({
  from: 'EPSG:3857',
  to: 'EPSG:32631',
  projections: [mercator, universalTransverseMercator]
});
const coordinates = new Float64Array([333958.4723798207, 5621521.486192066]);
projection.projectFlat(coordinates, 2);
```

For WKT/PROJJSON, register the matching optional reader. For grids, load and prepare
all required data before constructing the instance. The [engine guide](./typescript-engine.md)
shows dynamic imports, grid loading and minimal bundles.

Use `checkTypeScriptCRSCompatibility` on each definition with the same plugin/parser
options as construction. A supported result establishes construction support; it does
not prove grid coverage, coordinate-domain validity or application-specific accuracy.
Compare representative production coordinates in both directions before switching.
Pay particular attention to computed heights, strict errors, Cassini/Robinson/CEA/EQDC
corrections and inverse grid boundaries. Use the classic wrapper where its behavior is required.

## Default backend and future work

The package root now selects the TypeScript backend. This is a breaking backend
change for the next package release, recorded in the changelog. The `classic`
subpath retains the former implementation; no release is published by this change
and the installed proj4 dependency remains for classic users.

Broader derived/compound CRS execution, arbitrary axis rotations, uncommon GeoTIFF
band conventions, dynamic datums, vertical grids and automatic operation selection
are outside this profile. More datasets and denser sampling can expand the profile
without representing unfinished work in the four qualification tranches. Exact
allocation counts and guarantees about every browser/device are also not claimed;
the recorded performance baselines are measurements, not service-level promises.
