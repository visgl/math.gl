---
slug: /modules/projection/support
---

# Projection API support and migration

`@math.gl/projection` uses the math.gl projection engine by default. `Projection` supplies
all projection plugins and WKT/PROJJSON readers behind the existing wrapper API.
`ProjectionTransform` exposes per-instance configuration for smaller bundles.
The former `/classic` wrapper and proj4js-specific CRS helpers are removed.
Applications needing the upstream runtime can install `proj4` directly.

The old `native` and `experimental` subpaths remain compatibility aliases for the
configurable engine; use the root, `core`, `projections/*`, `parsers/*` and `grids/*`
paths in new code. This API is available in releases containing these exports.

## Named datum catalogue migration

The default `ProjectionTransform`, `LazyProjection`, and `normalizeCRS` retain only
WGS84 and NAD83 as named datums. Register regional definitions explicitly:

```typescript
import {ProjectionTransform} from '@math.gl/projection/core';
import {datumCatalog} from '@math.gl/projection/datums';

const projection = new ProjectionTransform({
  from: '+proj=longlat +datum=nad27',
  to: 'WGS84',
  datumCatalogs: [datumCatalog]
});
```

Supply required datum-grid data separately; the catalogue contains definitions,
not grids. The option also applies to WKT/PROJJSON readers and capability checks.
Explicit ellipsoid and operation parameters remain available without named datum
registration. The `Projection` convenience wrapper includes the catalogue
internally and preserves its existing behavior. See the
[datum registration guide](projection-engine.md#register-regional-datums).

API compatibility does not imply identical numerical results or accepted inputs.
The documented corrections and strict-input exceptions below still apply. The engine never silently falls back to proj4js.

## Renamed configurable API

`ProjectionTransform` replaces `TypeScriptProjection` during the alpha release cycle;
the former name is no longer exported. Update imports and constructors, and use
`ProjectionTransformOptions`, `ProjectionTransformCreateOptions`, `ProjectionCompatibility`
and `checkProjectionCompatibility` in place of the former TypeScript-prefixed names.
`Projection` provides the ready-to-use API, and `LazyProjection` loads built-in
algorithms on demand.

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
and **87 real-grid points in NTv2 and GeoTIFF**. See [independent validation](../independent-validation.md)
for domains, accuracy budgets, source versions and the grid-edge policy.

These counts and the complete reviewed exception list are maintained in
`test/fixtures/release-qualification.json` and checked in CI. Inventory entries remain
partial relative to unrestricted upstream behavior; that distinction is deliberate.

## API guarantees

Eager construction is synchronous and resolves plugins, parsers, aliases and prepared grids.
With projection descriptors, construction reads definitions but algorithms load on the
first asynchronous coordinate call. `projectSync`/`unprojectSync` and their flat variants
require preloading; they never start an import. See the [loading guide](projection-engine.md#load-less-used-projections-on-demand).
The eager engine and default wrapper perform no network requests. Descriptor imports
can fetch application chunks through the bundler runtime. The configurable `ProjectionTransform` keeps plugin registration per instance and
shares only the descriptor implementation cache. The convenience `Projection` preserves the classic static registration
API: aliases and NTv2 grids affect subsequently constructed wrappers of that backend.
Existing instances retain their compiled configuration. These registries are independent of the configurable engine
and of any separately installed proj4js runtime.
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
import {Projection} from '@math.gl/projection';
const projection = new Projection({to: 'EPSG:3857'});
const projected = projection.project([12, 55]);
```

The package was renamed from `@math.gl/proj4` during the v5 alpha release cycle.
Update the dependency and every import prefix to `@math.gl/projection`, then use
`Projection`, `ProjectionOptions` and `DatumGridOptions` in place of the removed
`Proj4Projection`, `Proj4ProjectionOptions` and `Proj4DatumGridOptions` names.

The `/classic` subpath and `checkProj4CRSCompatibility`, `toProj4CRSDefinition` and
`Proj4CRSCompatibilityError` helpers are removed. Install and import `proj4`
directly if the application needs upstream behavior. Use
`checkProjectionCompatibility` with explicit plugins/readers to check the math.gl
engine; this is a different capability check, not a replacement for upstream
runtime validation.

For selective bundles, register algorithms required by **both** ends:

```typescript
import {ProjectionTransform} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';
import {universalTransverseMercator} from '@math.gl/projection/projections/utm';

const projection = new ProjectionTransform({
  from: 'EPSG:3857',
  to: 'EPSG:32631',
  projections: [mercator, universalTransverseMercator]
});
const coordinates = new Float64Array([333958.4723798207, 5621521.486192066]);
projection.projectFlat(coordinates, 2);
```

For WKT/PROJJSON, register the matching optional reader. For grids, load and prepare
all required data before constructing the instance. The [engine guide](projection-engine.md)
shows dynamic imports, grid loading and minimal bundles.

Use `checkProjectionCompatibility` on each definition with the same plugin/parser
options as construction. A supported result establishes construction support; it does
not prove grid coverage, coordinate-domain validity or application-specific accuracy.
Compare representative production coordinates in both directions before switching.
Pay particular attention to computed heights, strict errors, Cassini/Robinson/CEA/EQDC
corrections and inverse grid boundaries. Use a separately installed proj4js runtime where its behavior is required.

Explicit `+geoidgrids` height conversion supports prepared grids, GTX snapshots, the validated vertical GeoTIFF subset and a
structural `@math.gl/geoid` adapter. See [vertical heights](projection-engine.md#convert-geoid-heights)
for the supported domain and grid loading contract. This does not add compound/vertical
CRS execution or implicit model selection.

## Default backend and future work

The package has no runtime dependency on proj4js. The pinned development dependency
remains for compatibility tests and benchmarks. This rename and wrapper removal
are breaking alpha API changes; no release is published by this work.

Broader derived/compound CRS execution, arbitrary axis rotations, uncommon GeoTIFF
band conventions, dynamic datums and automatic EPSG operation lookup
are outside this profile. More datasets and denser sampling can expand the profile
without representing unfinished work in the four qualification tranches. Exact
allocation counts and guarantees about every browser/device are also not claimed;
the recorded performance baselines are measurements, not service-level promises.
