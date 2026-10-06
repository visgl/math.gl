# Imports, plugins and loading

Use the math.gl projection engine to convert coordinates between geographic,
projected and geocentric coordinate reference systems. It supports scalar coordinates,
in-place typed arrays, custom projections and loading algorithms on demand.

Choose the API that fits your application:

| API | Use it when |
| --- | --- |
| `Projection` | You want a ready-to-use converter with all built-in projections and CRS readers. |
| `ProjectionEngine` | You want to supply the projections, readers and grid data your application needs. |
| `LazyProjection` | You want built-in projection algorithms to load automatically when requested. |
| `ProjectionPipeline` | You need to specify the order of individual coordinate operations. |

All are exported by `@math.gl/projection` or its documented subpaths. Selective imports
reduce the initial bundle; reuse a converter to transform many coordinates between
the same pair of CRSs. See [supported transformations and migration](./support.md)
for input limits, and [independent validation](./independent-validation.md) for accuracy.
The package has no runtime dependency on proj4js. Applications needing the upstream
API can install `proj4` separately.

## Start with the projections you need

Use isolated subpaths to make the selected algorithms explicit:

```typescript title="mercator-projection.ts"
import {ProjectionEngine} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';

export const projection = new ProjectionEngine({
  from: 'EPSG:4326',
  to: 'EPSG:3857',
  projections: [mercator]
});

const projected = projection.project([12, 55]); // longitude, latitude → meters
const geographic = projection.unproject(projected);
```

Reuse the instance for each CRS pair. Construction resolves definitions, validates
parameters, and prepares the transformation; coordinate calls are synchronous.
`project` and `unproject` return new arrays. The input definitions are not mutated.

Both ends of a transformation need their projected algorithms registered. For
example, Web Mercator → UTM needs both `mercator` and `universalTransverseMercator`:

```typescript
import {ProjectionEngine} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';
import {universalTransverseMercator} from '@math.gl/projection/projections/utm';

const projection = new ProjectionEngine({
  from: 'EPSG:3857',
  to: 'EPSG:32631',
  projections: [mercator, universalTransverseMercator]
});
```

Geographic coordinates are built into the core. Projected algorithms, including
Mercator, are opt-in. Registration is local to an instance; there is no global
projection registry and no automatic fallback to proj4js. To change the available
algorithms, create a new instance with the new plugin set.

## What is pluggable?

| Component | Option or API | Application responsibility |
| --- | --- | --- |
| Projection algorithms | `projections` | Import and register the algorithms needed by both CRSs |
| Structured CRS execution readers | `parsers` | Register `wktCRSParser` and/or `projJSONCRSParser` when accepting those representations |
| Regional datum definitions | `datumCatalogs` | Register the catalogue plugin or application-reviewed definitions |
| Named definitions | `aliases` | Supply application-specific identifiers and their CRS definitions |
| Vertical height grids | `verticalGrids` | Prepare and register a model matching the horizontal and vertical datum |
| Horizontal datum grids | `datumGrids` | Fetch, decode, and register the correct grid data before construction |
| Custom algorithms | `ProjectionPlugin` | Implement the projection equations, accepted parameters, and domain validation |

An alias identifies a definition; it does not load an algorithm. Built-in aliases
include WGS84, Web Mercator, WGS84 UTM zones, and UPS, but there is no general EPSG
lookup service or automatic network access. `EPSG:32631` expands to a UTM definition
and requires `universalTransverseMercator`. A WKT definition named “UTM zone 31N”
usually declares the **Transverse Mercator** method and requires `transverseMercator`.
The [API reference](./api-reference/projection-engine.md#current-coverage) lists
plugin exports and their accepted parameters.

Composition is explicit too. `obliqueTransformation(mollweide)` creates a rotated
Mollweide plugin with its dependency supplied directly; it does not search a global
catalogue for an algorithm named in the CRS.

## Register regional datums

`ProjectionEngine`, `LazyProjection`, and `normalizeCRS` include only WGS84 and NAD83
and their existing aliases. Projection algorithms and datums are independent:
WGS84 → Web Mercator or WGS84 UTM needs no regional datum catalogue. Converting
coordinates in another named datum requires explicit per-instance registration:

```typescript
import {ProjectionEngine} from '@math.gl/projection/core';
import {datumCatalog} from '@math.gl/projection/datums';

const projection = new ProjectionEngine({
  from: '+proj=longlat +datum=OSGB36',
  to: 'WGS84',
  datumCatalogs: [datumCatalog]
});
```

The plugin provides all 452 regional names and aliases from the previous built-in
catalogue. It supplies ellipsoid names, Helmert parameters, and grid registration
names; it supplies no grid files and performs no fetching. Importing it does not
register it globally. Pass the same option to `LazyProjection`, `normalizeCRS`, or
`checkProjectionCompatibility`. Applications may dynamically import the plugin
before construction, or provide a small custom `DatumCatalogPlugin` with a `name`
and `datums` map. Explicit `+ellps`, `+towgs84`, and grid parameters remain supported
without the catalogue when no unavailable named datum is requested.

This changes the configurable engine's default supported inputs. WKT/PROJJSON
readers also require registration for regional names; unknown names fail explicitly
unless an explicit WKT `TOWGS84` or supported `BoundCRS` operation supplies the shift.
The `Projection` convenience wrapper registers the full catalogue internally and
retains its historical ellipsoid-only handling of unmatched structured datum labels.

## Load less-used projections on demand

For automatic selection, use `LazyProjection`. It supplies all built-in projection
descriptors and imports only the algorithms needed by the source and destination CRS:

```typescript
import {LazyProjection} from '@math.gl/projection/projections/lazy';

const projection = new LazyProjection({to: 'EPSG:32631'});
const xy = await projection.project([3, 45]);

await projection.preload();
projection.projectFlatSync(new Float64Array([3, 45]));
```

Use this isolated entry point to keep the algorithms deferred; the package root
exports eager implementations. Construction starts no imports. Coordinate methods always return promises; the
explicit sync methods use the shared implementation cache after preloading.
Rotated projections automatically resolve their wrapped algorithms, including
different children at the two endpoints. Aliases, readers and prepared grids use
the same options as `ProjectionEngine`; WKT/PROJJSON readers remain opt-in.

The full descriptor catalogue adds metadata to the initial bundle and lets a
splitting bundler emit chunks for every built-in algorithm. Only requested
algorithms are fetched at runtime. For a smaller set or custom algorithms, use
`ProjectionEngine` with an explicit list:

Import lightweight descriptors and pass them in the same `projections` list as
eager plugins. Descriptor imports and instance construction do not import algorithm
implementations. The first coordinate operation selects the required source and
destination algorithms and loads them internally:

```typescript title="projection-descriptor.ts"
import {ProjectionEngine} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';
import {lazyUniversalTransverseMercator} from '@math.gl/projection/projections/lazy/utm';

export const webMercator = new ProjectionEngine({
  to: 'EPSG:3857', projections: [mercator]
});
export const utm31 = new ProjectionEngine({
  to: 'EPSG:32631', projections: [mercator, lazyUniversalTransverseMercator]
});

const xy = await utm31.project([3, 45]); // Loads UTM automatically; no manual import.
const lonLat = await utm31.unproject(xy);
```

Instances configured only with eager plugins retain synchronous coordinate methods.
Instances configured with descriptors return promises from `project`, `unproject`,
`projectFlat` and `unprojectFlat`, including after loading. TypeScript infers the return
shape from the supplied list. Await a batch operation before reading, changing or
reusing its typed-array buffer. Scalar inputs are captured when the method is called.

Explicit synchronous methods never start imports. Preload the descriptor or instance
before using them; they throw a clear error if a required algorithm is not cached:

```typescript
await lazyUniversalTransverseMercator.preload(); // Optional application warm-up.
const xySync = utm31.projectSync([3, 45]);
utm31.projectFlatSync(new Float64Array([3, 45]));
// Alternatively: await utm31.preload() loads and prepares both ends of this CRS pair.
```

A shared cache, keyed by descriptor identity, holds pending imports and loaded
implementations across instances and ESM/CommonJS entry points. Concurrent requests
share a load. Failures propagate to the coordinate call and can be retried. Unused
descriptors are not loaded. Separate descriptors with the same name are not conflated.
`preloadProjection(descriptor)` also warms the cache, and `getLoadedProjection` reads
it without loading anything. `ProjectionEngine.create(options)` is an optional
async factory returning a fully prepared instance with synchronous coordinate methods.

Every named projection has a descriptor at `projections/lazy/<id>` (for example,
`lazyMercator` and `lazyUniversalTransverseMercator`). The `projections/lazy` barrel exports
them all. Composite projections use
`lazyObliqueTransformation(lazyMollweide)` or `lazyObliqueTransformation('longlat')`.
Custom descriptors can use `createProjectionDescriptor({name, aliases}, async () => plugin)`.
These descriptors defer algorithm code; CRS definitions and grid files remain application inputs.

Optional WKT interpretation can also be deferred. The adapter uses isolated
`@math.gl/crs` syntax entry points so its parser stays on the lazy side:

```typescript
import {ProjectionEngine} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';

export async function loadMercatorWKT(to: string) {
  const {wktCRSParser} = await import('@math.gl/projection/parsers/wkt');
  return new ProjectionEngine({to, projections: [mercator], parsers: [wktCRSParser]});
}
```

The definition must select an algorithm supplied in `projections`. The WKT reader
does not download plugins, definitions or grids for an arbitrary EPSG code.
Register the optional readers for the CRS representations your application accepts.

### Public subpaths

All paths below have the `@math.gl/projection/` prefix and support ESM, CommonJS and types.
The `native` and `experimental` paths remain legacy aliases; new code can use the
shorter paths below. The former `classic` subpath is removed.

| Subpath | Exports |
| --- | --- |
| `temporal` | `createTemporalDeformationModel` and explicit field/rate/event types; no datasets |
| `deformation` | `createDeformationModel` for prepared static velocity fields |
| Package root (`@math.gl/projection`) | `Projection`, the configurable engine, eager algorithms, readers and helpers |
| `grids/velocity` | `createVelocityGrid` |
| `grids/velocity-geotiff` | `loadVelocityGeoTIFFGrid`; excludes a TIFF decoder |
| `grids/vertical` | `createVerticalGrid`, `createGeoidGrid` and vertical-grid contracts |
| `grids/gtx` | `parseGTXGrid` |
| `grids/vertical-geotiff` | `loadVerticalGeoTIFFGrid`; excludes a TIFF decoder |
| `operations` | Optional `OperationCatalog` and selection metadata/diagnostics; no database or execution code |
| `analysis` | `ProjectionAnalysis`, reusable factors/Jacobians and explicit mathematical domain enforcement |
| `bulk` | `ProjectionBuffer` for separate, strided, column and chunked buffers; no projection algorithms/readers |
| `datums` | Regional `datumCatalog` plugin; register through `datumCatalogs` |
| `pipeline` | `ProjectionPipeline` and typed explicit operation contracts; no catalogue/readers |
| `core` | Engine, normalization, capability checks, descriptor/cache utilities, shared types and errors |
| `projections/lazy/<id>` | Lightweight projection descriptors; defer algorithm imports |
| `projections/lazy` | `LazyProjection`, descriptors and the oblique descriptor factory |
| `projections/<id>` | One plugin or factory, using its existing export name |
| `parsers/wkt` | `wktCRSParser` |
| `parsers/projjson` | `projJSONCRSParser` |
| `grids/ntv2` | `parseNTv2Grid` and its options type |
| `grids/geotiff` | `loadGeoTIFFGrid` and adapter types; excludes a TIFF decoder |

Projection IDs follow their canonical PROJ names:

```text
aea, aeqd, bonne, cass, cea, eck6, eqc, eqearth, equi, eqdc, etmerc,
geocent, geos, gnom, gstmerc, krovak, laea, lcc, merc, mill, moll,
nzmg, ob_tran, omerc, ortho, poly, qsc, robin, sinu, somerc, stere,
sterea, tmerc, tpers, utm, vandg
```

For example, `merc` exports `mercator`, `utm` exports
`universalTransverseMercator`, and `ob_tran` exports the
`obliqueTransformation(wrappedPlugin)` factory. Supply a wrapped projection
explicitly, including when both plugins are dynamically imported. Geographic
coordinates need no plugin; the internal Gauss helper is not a public projection.
Import public subpaths rather than private `src` or `dist` files.

## Work with @math.gl/crs

`@math.gl/crs` owns CRS definitions, WKT syntax parsing, PROJJSON types, and
`SpatialReference` metadata. The optional execution readers turn supported definitions
into parameters for this engine. Being valid WKT or PROJJSON does not guarantee that
its coordinate operation is implemented.

```typescript
import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import {
  ProjectionEngine,
  mercator,
  transverseMercator,
  wktCRSParser,
  projJSONCRSParser
} from '@math.gl/projection';

export function createMapProjection(from: ReadonlyCRSDefinition) {
  return new ProjectionEngine({
    from,
    to: 'EPSG:3857',
    projections: [mercator, transverseMercator],
    parsers: [wktCRSParser, projJSONCRSParser]
  });
}
```

This example accepts supported geographic/Mercator/Transverse Mercator definitions;
other projected methods need their corresponding plugins. Pass PROJJSON as an object,
not serialized JSON text. `CRSReference` and `SpatialReference` are also accepted by
the constructor. Stored coordinate order is honored; declared axis order is optional
through `enforceAxis`. See the [CRS integration reference](./api-reference/projection-engine.md#integration-with-mathglcrs)
for height, units, provenance, compound CRSs, and horizontal extraction.

`checkProjectionCompatibility(definition, options)` reports whether a CRS can be
constructed with the exact plugins, readers, and grids supplied. A successful check
is not an accuracy certificate or a guarantee that every coordinate is inside the
projection's domain or a grid's coverage. Validate the CRS and coordinate region
that your application actually uses.

<span id="convert-geoid-heights" />
<span id="vertical-geotiff-geoid-models" />

## Load grid readers and data separately

Projection algorithms and grid data have separate lifecycles. Import the decoder or
adapter only where needed, fetch the model chosen by your application, and register
its prepared data before construction. Grid files, TIFF decoders and workers have
costs beyond the bundle measurements below.

See [datum and height grids](./api-reference/datum-grids.md) for NTv2, horizontal
GeoTIFF, GTX, vertical GeoTIFF and the structural `@math.gl/geoid` adapter. Readers
can be dynamically imported; the engine never fetches models or selects them implicitly.

## Add a custom projection

Implement `ProjectionPlugin` and register it like a built-in plugin. The following
minimal spherical cylindrical example illustrates the contract; it intentionally
supports no origin, scale, or offset parameters:

```typescript title="custom-projection.ts"
import type {ProjectionPlugin} from '@math.gl/projection';

export const simpleCylindrical: ProjectionPlugin = {
  name: 'simple_cylindrical',
  parameters: [],
  create({semiMajorAxis: radius, eccentricitySquared}) {
    if (eccentricitySquared !== 0) throw new Error('This plugin requires a sphere');
    return {
      forward: (longitude, latitude) => [radius * longitude, radius * latitude],
      inverse: (x, y) => [x / radius, y / radius],
      forwardInPlace(point) {
        point.x *= radius;
        point.y *= radius;
      },
      inverseInPlace(point) {
        point.x /= radius;
        point.y /= radius;
      }
    };
  }
};
```

Use it with `projections: [simpleCylindrical]` and, for example,
`to: '+proj=simple_cylindrical +R=6371000 +datum=none'`. The plugin receives
longitude/latitude in radians and produces projected meters. The engine handles
external CRS units, axis order, datum operations, and height. A plugin handles its
own declared projection parameters, including any false offsets it chooses to
support, and must reject unsupported values and singularities.

Mutable hooks must preserve Z for horizontal projections, update synchronously,
and never retain the caller's scratch point. Scalar methods remain required for
compatibility. Duplicate names or aliases are rejected; importing or constructing
a plugin does not register it globally. See the
[plugin API](./api-reference/projection-engine.md#custom-plugins) for the full contract.

## Tree shaking and bundle size

The lean default engine in this change measures 32,744 minified bytes / 11,859 gzip
bytes, down from 52,183 / 18,824: **37.3% / 37.0%** smaller. The table below retains
the published alpha.12 baseline; current measurements are recorded in
`modules/projection/test/fixtures/bundle-budgets.json` under `leanDatumBaseline`.

Use named ESM imports and register a small, explicit list. The package declares
`sideEffects: false`, and its ESM build preserves module boundaries. A bundler can
remove unused projection kernels and optional readers. Type-only imports add no
runtime code.

The package has no runtime dependency on proj4js; it is installed only for repository
benchmarks and compatibility tests. Installing `proj4` separately and importing it
elsewhere in an application can retain both implementations. CommonJS consumers
are supported, but the measurements below use ESM with tree shaking.

The core has a fixed cost: CRS normalization, unit/axis/datum transformation support,
and the shared ellipsoid table. WGS84 and NAD83 are built in; regional datum
definitions are retained only when registered or when using the compatibility wrapper. Adding WKT pulls in syntax parsing and structured-CRS interpretation;
PROJJSON objects already provide structured input and need less reader code.

Measured **math.gl 5.0.0-alpha.12**, source commit [`17976524`](https://github.com/visgl/math.gl/tree/17976524ff710076a508ec6211518b332b7a35b7),
on October 6, 2026 with Node 24.5.0 and esbuild 0.28.1: browser ESM,
ES2020, minification and gzip level 9. These measurements use a workspace build,
rather than an installed npm tarball. Each row is a separate retained bundle,
not an increment or an application-wide download estimate. **KiB = 1,024 bytes.**

| Retained functionality (math.gl 5.0.0-alpha.12) | Minified KiB | Gzip KiB |
| --- | ---: | ---: |
| Engine core | 51.0 | 18.4 |
| Engine + Mercator | 53.4 | 19.2 |
| Engine + UTM | 60.1 | 21.8 |
| Engine + Mercator + WKT reader | 76.8 | 26.8 |
| Engine + Mercator + PROJJSON reader | 64.3 | 22.9 |
| Engine + Mercator + NTv2 decoder | 56.5 | 20.4 |
| Engine + Mercator + GeoTIFF grid adapter | 56.5 | 20.4 |
| Engine + Mercator + GTX decoder | 54.9 | 19.8 |
| Engine + Mercator + vertical GeoTIFF adapter | 58.4 | 21.0 |
| Default Projection (all plugins and readers) | 149.5 | 51.0 |
| Explicit operation pipeline | 62.6 | 22.3 |
| Optional operation selector | 6.3 | 2.2 |
| Optional projection analysis | 4.2 | 1.4 |
| Optional reusable buffer adapter | 5.3 | 1.7 |
| Optional deformation model + regular velocity grid | 7.2 | 2.9 |
| Optional deformation model + velocity GeoTIFF adapter | 12.2 | 4.7 |
| Optional temporal deformation model | 9.0 | 3.5 |
| Every root export | 180.0 | 60.9 |

Grid readers, [operation pipelines](./operation-pipelines.md),
[operation selection](./operation-selection.md), [projection analysis](./projection-analysis.md),
[bulk adapters](./bulk-layouts.md) and [deformation models](./deformation-models.md)
are optional. Import their isolated subpaths to retain only the capabilities needed.

All GeoTIFF rows exclude an external TIFF decoder, workers, and grid files. No row
includes downloaded datum-grid data. Different bundlers, targets, compression,
shared dependencies, and import patterns change these totals. The size benefit comes from selecting a subset of algorithms and optional readers.
Avoid a runtime lookup such as `projectionExports[name]` over the entire module namespace
when you want the bundler to discard unused algorithms.

To reproduce the byte counts after building the repository:

```sh
node modules/projection/scripts/check-bundle-budget.mjs --measure
```

Omit `--measure` to enforce the checked-in size limits. Package checks also verify
that selected bundles exclude unrelated kernels and the upstream runtime. See
[Performance](./benchmarks.md) for runtime measurements. Packed-package checks use
`node modules/projection/scripts/check-packed-package.mjs` to verify installed ESM,
CommonJS and TypeScript consumers.

The [raw bundle measurements](https://github.com/visgl/math.gl/blob/master/dev-docs/projection-bundle-measurements.json)
retain exact byte counts, package version, source commit and tool settings.

## Measured split bundles

Enable ESM code splitting in the bundler. CI verifies the transitive initial static
graph contains neither the deferred algorithms nor optional WKT syntax, then executes
the emitted chunks. The measurements below start with an eager core and Mercator.
Sizes are sums across the relevant emitted files, with gzip applied to each file.

The same **math.gl 5.0.0-alpha.12** source commit and tool versions as the static
table were measured on October 6, 2026.

| Deferred feature (math.gl 5.0.0-alpha.12) | Initial minified / gzip KiB | Additional minified / gzip KiB |
| --- | ---: | ---: |
| Automatic catalogue (`LazyProjection`) | 60.9 / 22.7 | 77.5 / 36.5 |
| UTM descriptor | 53.9 / 19.8 | 7.9 / 3.4 |
| WKT reader and syntax | 53.8 / 19.2 | 23.4 / 8.1 |
| Rotated Mollweide (factory plus wrapped plugin) | 53.8 / 19.7 | 5.3 / 2.5 |

The catalogue row sums all available deferred algorithm chunks, not the download
for its first UTM operation. Other rows retain only their selected feature.

These are esbuild browser/ES2020 measurements, not universal chunk sizes. Bundlers
may extract shared helpers, so one plugin does not necessarily mean one file. Loading
all features eventually pays for all retained code and chunk overhead. CommonJS
subpaths select APIs but do not provide this browser download guarantee.

Reproduce the split-bundle measurements after building:

```sh
node modules/projection/scripts/check-lazy-package.mjs --measure
```

Omit `--measure` to enforce the checked-in split-bundle budgets.

Keep imports on the isolated subpaths throughout the eager and lazy features.
Mixing in eager imports from the full `@math.gl/projection` or `@math.gl/crs` barrels
can cause a bundler to hoist otherwise lazy code. A direct
`await import('@math.gl/projection')` can retain the entire catalogue;
it does not mean “only UTM.” Inspect the application's chunk graph, not just the
presence of an `import()` expression. Tree shaking and deferred loading remain
distinct: the former removes unused code, while the latter postpones code that is used.


<span id="transform-flat-buffers-in-place" />
<span id="projection-specific-batch-execution" />

## Coordinate performance

Use [Performance](./benchmarks.md) to choose scalar, flat or reusable buffers and
run live benchmarks. The [`ProjectionEngine` reference](./api-reference/projection-engine.md)
defines coordinate methods, plugin contracts, readers and failure behavior.
