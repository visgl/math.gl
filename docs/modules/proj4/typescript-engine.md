# TypeScript projection engine

`@math.gl/proj4` is a TypeScript coordinate transformation engine with
explicit projection plugins, optional CRS readers, and in-place typed-array transforms.
Applications choose the algorithms and data they need, and can load them on demand.
It is an entry point of **`@math.gl/proj4`**, not a separately installed package.
Existing `@math.gl/proj4/experimental` paths remain compatibility aliases.

The TypeScript engine supports the [documented API and transformation profile](./typescript-support.md). The upstream coordinate corpus has **232 original numeric matches, one reviewed
Robinson correction, and nine intentional input rejections out of 242**. This is not a measure of complete geodetic accuracy.
An independent PROJ corpus also checks all 37 named algorithms across 2,386 points,
with additional structured CRS, datum-chain and real NTv2/GeoTIFF checks, with explicit accuracy limits. See [independent validation](./independent-validation.md)
and the [parity audit](./parity-audit.md) for coverage and remaining qualification work.
The root `Projection` uses this engine with all plugins/readers configured.
Import `Proj4Projection` from `@math.gl/proj4/classic` to use proj4js.
The convenience wrapper includes the full catalogue; use `TypeScriptProjection`
and selective subpaths for smaller bundles.

## Start with the projections you need

These examples use the configurable engine exported by the package root:

```typescript title="mercator-projection.ts"
import {TypeScriptProjection, mercator} from '@math.gl/proj4';

export const projection = new TypeScriptProjection({
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
import {
  TypeScriptProjection,
  mercator,
  universalTransverseMercator
} from '@math.gl/proj4';

const projection = new TypeScriptProjection({
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
| Named definitions | `aliases` | Supply application-specific identifiers and their CRS definitions |
| Horizontal datum grids | `datumGrids` | Fetch, decode, and register the correct grid data before construction |
| Custom algorithms | `ProjectionPlugin` | Implement the projection equations, accepted parameters, and domain validation |

An alias identifies a definition; it does not load an algorithm. Built-in aliases
include WGS84, Web Mercator, WGS84 UTM zones, and UPS, but there is no general EPSG
lookup service or automatic network access. `EPSG:32631` expands to a UTM definition
and requires `universalTransverseMercator`. A WKT definition named “UTM zone 31N”
usually declares the **Transverse Mercator** method and requires `transverseMercator`.
The [API reference](./api-reference/typescript-projection.md#current-coverage) lists
plugin exports and their accepted parameters.

Composition is explicit too. `obliqueTransformation(mollweide)` creates a rotated
Mollweide plugin with its dependency supplied directly; it does not search a global
catalogue for an algorithm named in the CRS.

## Tree shaking and bundle size

Use named ESM imports and register a small, explicit list. The package declares
`sideEffects: false`, and its ESM build preserves module boundaries. A bundler can
remove unused projection kernels and optional readers. Type-only imports add no
runtime code.

The TypeScript entry points do not import the proj4js runtime. The npm package
still depends on proj4js for the classic wrapper, so **installation size and browser
bundle size are different measurements**. Importing the classic wrapper elsewhere in the
same application can retain both engines. CommonJS consumers are supported, but the
size measurements below rely on an ESM bundler with tree shaking.

The core has a fixed cost: CRS normalization, unit/axis/datum transformation support,
and shared ellipsoid and datum tables. Selecting one projection does not remove
those tables. Adding WKT pulls in syntax parsing and structured-CRS interpretation;
PROJJSON objects already provide structured input and need less reader code.

Measured September 30, 2026 including tranche 12B1 vertical GeoTIFF support, with Node 24.14.0, esbuild,
browser ESM, ES2020, minification, and gzip level 9. Each row is a separate retained
bundle, not an increment or an application-wide download estimate. **KiB = 1,024 bytes.**

| Retained functionality | Minified KiB | Gzip KiB |
| --- | ---: | ---: |
| Engine core | 45.5 | 16.7 |
| Engine + Mercator | 47.9 | 17.4 |
| Engine + UTM | 54.6 | 20.2 |
| Engine + Mercator + WKT reader | 71.3 | 25.1 |
| Engine + Mercator + PROJJSON reader | 58.8 | 21.2 |
| Engine + Mercator + NTv2 decoder | 51.0 | 18.7 |
| Engine + Mercator + GeoTIFF grid adapter | 51.0 | 18.6 |
| Engine + Mercator + GTX decoder | 49.4 | 18.1 |
| Engine + Mercator + vertical GeoTIFF adapter | 52.4 | 19.2 |
| Default TypeScript wrapper (all plugins and readers) | 143.9 | 49.3 |
| Every root export, including wrapper, readers and grid adapters | 152.0 | 52.1 |
| Classic proj4js-backed wrapper | 128.8 | 42.8 |

Tranche 12A adds about 1.1 KiB minified / 0.3 KiB gzip to the core stage machinery.
The grid readers and bilinear interpolation remain optional, retained only in the
corresponding reader rows and all-exports row. The vertical GeoTIFF adapter adds no
bytes to the core or ordinary projection bundles.

Both GeoTIFF rows exclude an external TIFF decoder, workers, and grid files. No row
includes downloaded datum-grid data. Different bundlers, targets, compression,
shared dependencies, and import patterns change these totals. The full TypeScript wrapper and root export set cost more than the classic wrapper; the size benefit comes from selecting a subset.
Avoid a runtime lookup such as `projectionExports[name]` over the entire module namespace
when you want the bundler to discard unused algorithms.

To reproduce the byte counts after building the repository:

```sh
node modules/proj4/scripts/check-bundle-budget.mjs --measure
```

Omit `--measure` to enforce the checked-in size limits. Package checks also verify
that selected bundles exclude unrelated kernels and the upstream runtime. See
[benchmarks and packaging checks](./benchmarks.md) for methodology and performance data.

## Load less-used projections on demand

For automatic selection, use `LazyProjection`. It supplies all built-in projection
descriptors and imports only the algorithms needed by the source and destination CRS:

```typescript
import {LazyProjection} from '@math.gl/proj4/projections/lazy';

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
the same options as `TypeScriptProjection`; WKT/PROJJSON readers remain opt-in.

The full descriptor catalogue adds metadata to the initial bundle and lets a
splitting bundler emit chunks for every built-in algorithm. Only requested
algorithms are fetched at runtime. For a smaller set or custom algorithms, use
`TypeScriptProjection` with an explicit list:

Import lightweight descriptors and pass them in the same `projections` list as
eager plugins. Descriptor imports and instance construction do not import algorithm
implementations. The first coordinate operation selects the required source and
destination algorithms and loads them internally:

```typescript title="projection-descriptor.ts"
import {TypeScriptProjection} from '@math.gl/proj4/core';
import {mercator} from '@math.gl/proj4/projections/merc';
import {lazyUniversalTransverseMercator} from '@math.gl/proj4/projections/lazy/utm';

export const webMercator = new TypeScriptProjection({
  to: 'EPSG:3857', projections: [mercator]
});
export const utm31 = new TypeScriptProjection({
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
it without loading anything. `TypeScriptProjection.create(options)` is an optional
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
import {TypeScriptProjection} from '@math.gl/proj4/core';
import {mercator} from '@math.gl/proj4/projections/merc';

export async function loadMercatorWKT(to: string) {
  const {wktCRSParser} = await import('@math.gl/proj4/parsers/wkt');
  return new TypeScriptProjection({to, projections: [mercator], parsers: [wktCRSParser]});
}
```

The definition must select an algorithm supplied in `projections`. The WKT reader
does not download plugins, definitions or grids for an arbitrary EPSG code.
Register the optional readers for the CRS representations your application accepts.

### Public subpaths

All paths below have the `@math.gl/proj4/` prefix and support ESM, CommonJS and types.
The `classic` subpath exports the original wrapper. `native` and `experimental`
paths remain legacy aliases; new code can use the shorter paths below.

| Subpath | Exports |
| --- | --- |
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

### Measured split bundles

Enable ESM code splitting in the bundler. CI verifies the transitive initial static
graph contains neither the deferred algorithms nor optional WKT syntax, then executes
the emitted chunks. The measurements below start with an eager core and Mercator.
Sizes are sums across the relevant emitted files, with gzip applied to each file.

| Deferred feature | Initial minified / gzip KiB | Additional minified / gzip KiB |
| --- | ---: | ---: |
| Automatic catalogue (`LazyProjection`) | 55.5 / 21.0 | 77.7 / 36.8 |
| UTM descriptor | 48.4 / 18.0 | 7.9 / 3.5 |
| WKT reader and syntax | 48.3 / 17.4 | 23.4 / 8.1 |
| Rotated Mollweide (factory plus wrapped plugin) | 48.3 / 18.0 | 5.3 / 2.5 |

The catalogue row sums all available deferred algorithm chunks, not the download
for its first UTM operation. Other rows retain only their selected feature.

These are esbuild browser/ES2020 measurements, not universal chunk sizes. Bundlers
may extract shared helpers, so one plugin does not necessarily mean one file. Loading
all features eventually pays for all retained code and chunk overhead. CommonJS
subpaths select APIs but do not provide this browser download guarantee.

Reproduce and enforce the split-bundle budgets after building:

```sh
node modules/proj4/scripts/check-lazy-package.mjs
```

Keep imports on the isolated subpaths throughout the eager and lazy features.
Mixing in eager imports from the full `@math.gl/proj4` or `@math.gl/crs` barrels
can cause a bundler to hoist otherwise lazy code. A direct
`await import('@math.gl/proj4')` can retain the entire catalogue;
it does not mean “only UTM.” Inspect the application's chunk graph, not just the
presence of an `import()` expression. Tree shaking and deferred loading remain
distinct: the former removes unused code, while the latter postpones code that is used.

## Work with @math.gl/crs

`@math.gl/crs` owns CRS definitions, WKT syntax parsing, PROJJSON types, and
`SpatialReference` metadata. The optional execution readers turn supported definitions
into parameters for this engine. Being valid WKT or PROJJSON does not guarantee that
its coordinate operation is implemented.

```typescript
import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import {
  TypeScriptProjection,
  mercator,
  transverseMercator,
  wktCRSParser,
  projJSONCRSParser
} from '@math.gl/proj4';

export function createMapProjection(from: ReadonlyCRSDefinition) {
  return new TypeScriptProjection({
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
through `enforceAxis`. See the [CRS integration reference](./api-reference/typescript-projection.md#integration-with-mathglcrs)
for height, units, provenance, compound CRSs, and horizontal extraction.

`checkTypeScriptCRSCompatibility(definition, options)` reports whether a CRS can be
constructed with the exact plugins, readers, and grids supplied. A successful check
is not an accuracy certificate or a guarantee that every coordinate is inside the
projection's domain or a grid's coverage. Validate the CRS and coordinate region
that your application actually uses.

## Load datum-grid data separately

Projection code and datum-grid data have separate lifecycles. Fetch grid files and
decode them before creating an instance; coordinate transforms then stay synchronous.
The application chooses the grid source, caching, and error handling.

```typescript title="grid-projection.ts"
import {TypeScriptProjection, parseNTv2Grid} from '@math.gl/proj4';

export async function createGridProjection(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not load datum grid: ' + response.status);
  const grid = parseNTv2Grid(await response.arrayBuffer());
  return new TypeScriptProjection({
    from: '+proj=longlat +ellps=clrk66 +nadgrids=regional.gsb',
    to: 'EPSG:4326',
    datumGrids: {'regional.gsb': grid}
  });
}
```

Use a grid intended for the declared source ellipsoid and datum transformation;
`regional.gsb` is a registration key, not a built-in dataset. The engine performs no
implicit fetches. Reuse prepared grids and projection instances for multiple batches.

For supported horizontal GeoTIFF grids, `loadGeoTIFFGrid(decodedTIFF)` prepares the
object returned by a separately chosen TIFF reader. The adapter imports no TIFF
library. That reader and its workers have their own bundle costs and can also be
loaded on demand. See [datum grids](./api-reference/typescript-projection.md#horizontal-datum-grids)
for band conventions, ownership, coverage, and inverse-edge behavior. Explicit vertical
height conversion is described below; general time-dependent transformations remain unsupported.

## Convert geoid heights

Register a prepared `VerticalGrid` under the name used by `+geoidgrids`. A source grid
converts gravity-related height **H** to ellipsoidal height **h** using **h = H + N**;
a destination grid applies **H = h - N**. The supplied offsets **N** are geoid undulations
in metres. Source conversion runs before the horizontal datum transformation; destination
conversion runs after it. Each grid is sampled in its own CRS's horizontal datum, at
Greenwich longitude and geographic latitude. These are explicit stages following
[PROJ's vertical-grid convention](https://proj.org/en/stable/operations/transformations/vgridshift.html).

```typescript
import {TypeScriptProjection} from '@math.gl/proj4/core';
import {parseGTXGrid} from '@math.gl/proj4/grids/gtx';

const response = await fetch('/grids/local.gtx');
if (!response.ok) throw new Error('Could not load vertical grid');
const local = parseGTXGrid(await response.arrayBuffer());
const projection = new TypeScriptProjection({
  from: '+proj=longlat +datum=WGS84 +geoidgrids=local',
  to: 'EPSG:4979',
  verticalGrids: {local}
});
const positions = new Float64Array([12, 41, 100, 7]);
projection.projectFlat(positions, 4); // height changes; measure 7 is preserved
```

Choose a model whose horizontal datum, vertical datum, tide convention and area of use
match your data. The key `local` is an application registration name, not an EPSG vertical
CRS or an automatically selected model. An ellipsoid alone does not enable a horizontal
datum shift: declare the datum or explicit `+towgs84` parameters when a shift is needed.

`Projection`, `TypeScriptProjection` and `LazyProjection` accept the same per-instance
`verticalGrids` map. Load grid data before constructing the projection. Lazy projection
algorithms can still preload separately. No file, network request, TIFF decoder or geoid
model is imported implicitly. The optional readers can themselves be dynamically imported.

For an already loaded `@math.gl/geoid` model, use the structural adapter:

```typescript
import {createGeoidGrid} from '@math.gl/proj4/grids/vertical';

// geoid is a previously prepared @math.gl/geoid Geoid instance.
const verticalGrids = {local: createGeoidGrid(geoid)};
```

The adapter calls `getHeight(latitudeDegrees, longitudeDegrees)` and retains the model's
interpolation and ownership rules. It adds no runtime dependency on `@math.gl/geoid`.
`createVerticalGrid({origin, step, size, offsets, noData})` instead snapshots a regular
bilinear grid. Origin and positive spacing are degrees; rows run south to north and
columns west to east. `parseGTXGrid(ArrayBuffer)` snapshots big-endian float32 metre
offsets from the [GTX format](https://gdal.org/en/stable/drivers/raster/gtx.html).
Its conventional -88.8888 sentinel, non-finite nodes, and values outside ±1000 metres
are treated as nodata, consistent with PROJ's GTX reader.

Both snapshot readers include the outer nodes and do not extrapolate. Longitudes can
be expressed in equivalent 360-degree turns, including bounded grids crossing the
antimeridian. A missing global seam cell is not synthesized; the grid must cover the
requested coordinate. A nodata corner with nonzero interpolation weight makes that
sample uncovered. Ordered `+geoidgrids=regional,global` lists try the first covering
grid. Prefix an optional registration with `@`; use an explicit final `null` for a
zero-offset fallback. Missing required registrations fail construction; uncovered
coordinates and non-finite custom offsets throw during transformation.

Vertical transformations require XYZ or XYZM, including flat arrays; M and later
ordinates remain measures. `+vunits`/`+vto_meter` and requested axes are applied around
the metre-based height stage. A failing flat record is left unchanged along with all
later records; earlier records may have completed. A vertical grid cannot be attached
to a geocentric or identity CRS or combined with lossy horizontal extraction.

This is the explicit vertical-grid subset (tranches 12A/12B1).
Compound/vertical WKT or PROJJSON execution, arbitrary operation pipelines, epochs,
dynamic datums and automatic operation selection remain future work.

### Vertical GeoTIFF geoid models

`loadVerticalGeoTIFFGrid` prepares the geoid subset of
[PROJ Geodetic TIFF Grids](https://proj.org/en/stable/specifications/geodetictiffgrids.html).
Use it for modern GeoTIFF geoid models; `loadGeoTIFFGrid` remains the separate adapter
for horizontal latitude/longitude shifts. Both receive a decoded TIFF object and import
no TIFF decoder. Fetching, compression and worker choices belong to the application.

```typescript
import {TypeScriptProjection} from '@math.gl/proj4/core';
import {loadVerticalGeoTIFFGrid} from '@math.gl/proj4/grids/vertical-geotiff';
import {fromArrayBuffer} from 'geotiff'; // separately installed, application-owned decoder

const response = await fetch('/grids/local-geoid.tif');
if (!response.ok) throw new Error('Could not load geoid grid');
const geoid = await loadVerticalGeoTIFFGrid(
  await fromArrayBuffer(await response.arrayBuffer())
);
const projection = new TypeScriptProjection({
  from: '+proj=longlat +datum=WGS84 +geoidgrids=geoid',
  to: 'EPSG:4979',
  verticalGrids: {geoid}
});
projection.project([12, 41, 100]); // synchronous after grid preparation
```

The adapter requires geographic degree coordinates, explicit PixelIsPoint or PixelIsArea,
positive north-up pixel spacing, and one tiepoint. PixelIsArea is shifted to cell centres;
nonzero tiepoint pixel indices are honored. Explicit non-Greenwich prime meridians,
rotated/projected rasters, overviews and masks are rejected. It does not transform or
resolve the interpolation CRS: the application must verify the file's geographic datum
and longitude reference match the CRS supplied to the projection.

Dataset metadata must declare `TYPE=VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL`, and band
zero must declare `DESCRIPTION=geoid_undulation`. Its unit must be `metre` (also the
default if absent). Raw nodata is compared in the decoded band precision (including float32 rounding)
before `raw * SCALE + OFFSET`; absent scale
and offset default to 1 and 0. Only band zero is decoded, so optional uncertainty bands
are excluded. Horizontal, velocity, ellipsoidal-height-offset and vertical-to-vertical
grids are rejected, as are requested non-bilinear interpolation and non-metre bands.

Prepared offsets are copied. TIFF objects and decoded arrays can be released after
loading. Multiple images must be ordered parent before nested child, or have disjoint
interiors; later images take precedence, including on a shared edge. A child's uncovered
or nodata sample falls back to an earlier covering image. This is an explicit fallback
policy, not a promise of matching every PROJ subgrid-selection edge case. Bounded
antimeridian grids use equivalent longitudes; no missing seam cells are synthesized.

Independent tests decode seven small authored files using `geotiff` and compare with
PROJ 9.5.1: point/area registration, Deflate, big-endian scaled int16, nonzero tiepoints,
nested grids, nodata and antimeridian sampling. See [validation](./independent-validation.md#vertical-geotiff-format-qualification)
for scope. The adapter and decoder can both be dynamically imported; normal core and
projection bundles do not retain this reader.

## Transform flat buffers in place

Use `projectFlat` and `unprojectFlat` for interleaved coordinate buffers:

```typescript
import {TypeScriptProjection, mercator} from '@math.gl/proj4';

const projection = new TypeScriptProjection({to: 'EPSG:3857', projections: [mercator]});
const positions = new Float64Array([12, 55, 13, 56]);
projection.projectFlat(positions, 2); // returns the same view
projection.unprojectFlat(positions, 2);

const vertices = new Float64Array([12, 55, 100, 7, 13, 56, 200, 8]);
projection.projectFlat(vertices, 4); // XYZM: transforms XYZ, preserves M
```

The record width must be an integer at least 2 that divides the view length.
`Float32Array` is supported, with Float32 storage precision; Float64 is preferable
when large projected coordinates must retain small differences. Use a `subarray`
view to transform a selected range. Geocentric transformations require at least
three components per record.

Built-in batch operations reuse a mutable point instead of making temporary
JavaScript coordinate arrays for every record. This does not guarantee zero heap
allocation, and custom scalar plugins can allocate. Calls are synchronous and do
not yield to the UI; schedule large jobs in a worker if the application needs that.
A coordinate error stops the batch after any earlier records have been transformed.
Copy the input first if the operation must be atomic. See the
[flat-array contract](./api-reference/typescript-projection.md#flat-typed-arrays-in-place)
for exact failure and dimension behavior.

### Projection-specific batch execution

Mercator, transverse Mercator/UTM, Lambert conformal conic, Albers and equidistant
conic supply prepared whole-buffer operations. For eligible geographic/projected
pairs, these fuse unit conversion, validation and the projection equation into one
traversal, bypassing per-coordinate dispatch through the general transformation pipeline.
The numerical equations are shared with the scalar API; there is no reduced-accuracy mode.
Z and every trailing ordinate remain in storage, including the sign of zero and NaN measures.

Selection happens at construction. Datum/grid operations, axis permutations, nonzero
prime meridians, vertical unit conversions, longitude wrapping, lossy horizontal
extraction, geocentric coordinates and projected-to-projected chains use the general
pipeline. Scalar calls and plugins without batch hooks retain their existing behavior.
Lazy-loaded plugins gain the same specialization once loaded; no additional imports or
application configuration are needed.

Advanced plugins can implement optional `createForwardFlat(context)` and
`createInverseFlat(context)` methods on `ProjectionImplementation`. They receive a frozen
`ProjectionFlatContext` with `inputScale` and `outputScale`, and return a synchronous
`ProjectionFlatOperation` or `undefined` to decline specialization. These types are
exported from `@math.gl/proj4/core`. Factories run once per direction at construction;
operations receive the entire view and stride, after the engine validates both.

A custom operation must multiply input XY by `inputScale`, apply the forward/inverse
equations, then divide XY by `outputScale`. It must enforce the geographic domain and
finite XYZ contract, preserve Z/trailing ordinates, check Float32 representability before
writing, and leave the failing and subsequent records untouched. Scratch belongs to each
call; retaining it or the buffer breaks reentrancy. Use the ordinary mutable hooks unless
you need and can uphold this whole-buffer contract. Built-in factories decline when a
decorator replaces their corresponding mutable hook, preserving custom behavior.

## Add a custom projection

Implement `ProjectionPlugin` and register it like a built-in plugin. The following
minimal spherical cylindrical example illustrates the contract; it intentionally
supports no origin, scale, or offset parameters:

```typescript title="custom-projection.ts"
import type {ProjectionPlugin} from '@math.gl/proj4';

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
[plugin API](./api-reference/typescript-projection.md#custom-plugins) for the full contract.

## Compatibility and provenance

The numerical kernels are predominantly direct TypeScript ports of proj4js 2.22.0;
the execution and plugin architecture is math.gl code. Source comments and distributed
notices distinguish ports from original code. The package includes MIT attribution
and the Apache-2.0 notice retained by Equal Earth.

The nine remaining upstream-corpus differences are deliberate strict-input rejections,
[dispositioned individually](./parity-audit.md#strict-input-policy). Cardinal polar-axis
mappings are supported; arbitrary axis rotations remain outside the subset. Broader grid coverage, independent
accuracy references, and regional projection validity limits still need qualification.
Keep any fallback to `Proj4Projection` from `@math.gl/proj4/classic` an explicit application decision: it adds the
upstream runtime and has some different dimension and validation behavior. The
[roadmap](./roadmap.md), [audit](./parity-audit.md), and
[API reference](./api-reference/typescript-projection.md) describe those boundaries.
