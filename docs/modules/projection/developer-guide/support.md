---
slug: /modules/projection/support
---

# Projection API support and migration

`@math.gl/projection` uses the math.gl projection engine by default. `projectionEngine` supplies
all projection plugins and WKT/PROJJSON readers through its factory API.
`ProjectionTransform` exposes per-instance configuration for smaller bundles.
The former `/classic` wrapper and proj4js-specific CRS helpers are removed.
Applications needing the upstream runtime can install `proj4` directly.

The old `native` and `experimental` subpaths remain compatibility aliases for the
configurable engine; use the root, `core`, `projections/*`, `parsers/*` and `grids/*`
paths in new code. This API is available in releases containing these exports.

## Named datum catalogue migration

The default `ProjectionTransform`, `LazyProjectionEngine`, and `normalizeCRS` retain only
WGS84 and NAD83 as named datums. Register regional definitions explicitly:

```typescript
import { ProjectionTransform } from "@math.gl/projection/core";
import { datumCatalog } from "@math.gl/projection/datums";

const projection = new ProjectionTransform({
  from: "+proj=longlat +datum=nad27",
  to: "WGS84",
  datumCatalogs: [datumCatalog],
});
```

Supply required datum-grid data separately; the catalogue contains definitions,
not grids. The option also applies to WKT/PROJJSON readers and capability checks.
Explicit ellipsoid and operation parameters remain available without named datum
registration. The default `projectionEngine` includes the catalogue
internally and preserves its existing behavior. See the
[datum registration guide](projection-engine.md#register-regional-datums).

API compatibility does not imply identical numerical results or accepted inputs.
The documented corrections and strict-input exceptions below still apply. The engine never silently falls back to proj4js.

## Renamed configurable API

`ProjectionTransform` replaces `TypeScriptProjection` during the alpha release cycle;
the former name is no longer exported. Update imports and constructors, and use
`ProjectionTransformOptions`, `ProjectionTransformCreateOptions`, `ProjectionCompatibility`
and `checkProjectionCompatibility` in place of the former TypeScript-prefixed names.
`projectionEngine` provides the ready-to-use API, and `LazyProjectionEngine` loads built-in
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
The eager engine perform no network requests. Descriptor imports
can fetch application chunks through the bundler runtime. The configurable `ProjectionTransform` keeps plugin registration per instance and
shares only the descriptor implementation cache. Engines snapshot aliases and prepared grid maps at construction. Each factory call
creates an independent transform. Existing instances retain their configuration;
other engines and any separately installed proj4js runtime remain independent.
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

`Projection` and `ProjectionEngine` are type contracts exported from `/types`.
Replace the former `new Projection({from, to})` with
`projectionEngine.createProjection({from, to})`. Replace `new LazyProjection(options)`
with `lazyProjectionEngine.createProjection(options)` and `LazyProjection.create(options)`
with `lazyProjectionEngine.createProjectionAsync(options)`.

The configurable, full and lazy engine classes are named `ConfigurableProjectionEngine`,
`FullProjectionEngine` and `LazyProjectionEngine`. Registrations belong to engines:
use `new FullProjectionEngine({aliases, datumGrids, verticalGrids})` instead of static
registration methods. Prepare NTv2 grids with `parseNTv2Grid(bytes, {includeErrorFields})`.
Direct construction of `ProjectionTransform` remains available for explicit configuration.
No deprecated class aliases are exported during the alpha cycle.

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
