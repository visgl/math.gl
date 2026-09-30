# Native API support and migration

`@math.gl/proj4/native` is the supported, opt-in TypeScript projection API in this
source tree. It is available in package releases containing these exports. The
`@math.gl/proj4` root continues to expose the proj4js-backed `Proj4Projection`.
The `experimental` paths remain compatibility aliases to exactly the same modules,
classes and plugins; existing callers receive the numerical corrections too.

This promotes the **documented API and supported transformation profile**. It does
not claim full native-PROJ functionality, arbitrary EPSG operation selection, or
uniform accuracy everywhere that an algorithm returns a finite value.

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

Construction is synchronous and resolves the supplied plugins, parsers, aliases and
prepared grids. It performs no network requests and does not register global state.
Unsupported definitions and missing stages fail explicitly. There is no automatic
fallback to another engine. Reuse an instance for repeated transformations.

`project` and `unproject` leave the input unchanged and return a new array.
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

Choose a backend explicitly and register the algorithms required by **both** ends:

```typescript
import {TypeScriptProjection} from '@math.gl/proj4/native/core';
import {mercator} from '@math.gl/proj4/native/projections/merc';
import {universalTransverseMercator} from '@math.gl/proj4/native/projections/utm';

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
Pay particular attention to computed heights, strict errors, Cassini/Robinson
corrections and inverse grid boundaries. Keep the wrapper available where its
behavior is required.

## Promotion decision and future work

The combined qualification tranche introduces a supported native entry point while
retaining the wrapper default and experimental aliases. It does not publish a
release or remove the installed proj4 dependency. Changing the default backend,
removing that dependency, or changing the public contract requires a separate
compatibility decision and migration plan.

Broader derived/compound CRS execution, arbitrary axis rotations, uncommon GeoTIFF
band conventions, dynamic datums, vertical grids and automatic operation selection
are outside this profile. More datasets and denser sampling can expand the profile
without representing unfinished work in the four qualification tranches. Exact
allocation counts and guarantees about every browser/device are also not claimed;
the recorded performance baselines are measurements, not service-level promises.
