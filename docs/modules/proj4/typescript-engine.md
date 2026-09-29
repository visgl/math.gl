# TypeScript projection engine

`@math.gl/proj4/experimental` is a TypeScript coordinate transformation engine with
explicit projection plugins, optional CRS readers, and in-place typed-array transforms.
Applications choose the algorithms and data they need, and can load them on demand.
It is an entry point of **`@math.gl/proj4`**, not a separately installed package.

The engine is experimental. The current upstream coordinate corpus passes **228/242**
cases in both directions, with 14 explicit construction rejections and no silent
mismatches in the accepted cases. This is not a measure of complete geodetic accuracy.
See the [parity audit](./parity-audit.md) for remaining coverage and qualification work.
The existing `Proj4Projection` remains available from `@math.gl/proj4` and uses proj4js.

## Start with the projections you need

Use a package build of `@math.gl/proj4` that includes the experimental entry point;
these examples describe the current source-tree API. Import named exports from that
entry point:

```typescript title="mercator-projection.ts"
import {TypeScriptProjection, mercator} from '@math.gl/proj4/experimental';

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
} from '@math.gl/proj4/experimental';

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

The experimental entry point does not import the proj4js runtime. The npm package
still depends on proj4js for the existing wrapper, so **installation size and browser
bundle size are different measurements**. Importing the wrapper elsewhere in the
same application can retain both engines. CommonJS consumers are supported, but the
size measurements below rely on an ESM bundler with tree shaking.

The core has a fixed cost: CRS normalization, unit/axis/datum transformation support,
and shared ellipsoid and datum tables. Selecting one projection does not remove
those tables. Adding WKT pulls in syntax parsing and structured-CRS interpretation;
PROJJSON objects already provide structured input and need less reader code.

Measured September 29, 2026 for the structured-method follow-up, with esbuild,
browser ESM, ES2020, minification, and gzip level 9. Each row is a separate retained
bundle, not an increment or an application-wide download estimate. **KiB = 1,024 bytes.**

| Retained functionality | Minified KiB | Gzip KiB |
| --- | ---: | ---: |
| Engine core | 41.3 | 15.2 |
| Engine + Mercator | 42.6 | 15.7 |
| Engine + UTM | 49.3 | 18.4 |
| Engine + Mercator + WKT reader | 64.5 | 22.9 |
| Engine + Mercator + PROJJSON reader | 52.4 | 19.0 |
| Engine + Mercator + NTv2 decoder | 45.7 | 16.9 |
| Engine + Mercator + GeoTIFF grid adapter | 45.7 | 16.9 |
| Every native export, including readers and grid adapters | 137.5 | 47.2 |
| Existing proj4js-backed wrapper | 128.8 | 42.4 |

The GeoTIFF row excludes an external TIFF decoder, workers, and grid files. No row
includes downloaded datum-grid data. Different bundlers, targets, compression,
shared dependencies, and import patterns change these totals. Keeping every native
export can cost more than the wrapper; the size benefit comes from selecting a subset.
Avoid a runtime lookup such as `nativeExports[name]` over the entire module namespace
when you want the bundler to discard unused algorithms.

To reproduce the byte counts after building the repository:

```sh
node modules/proj4/scripts/check-bundle-budget.mjs --measure
```

Omit `--measure` to enforce the checked-in size limits. Package checks also verify
that selected bundles exclude unrelated kernels and the upstream runtime. See
[benchmarks and packaging checks](./benchmarks.md) for methodology and performance data.

## Load less-used projections on demand

Tree shaking removes unused code at build time. Dynamic imports defer code that an
application may use later. They solve different parts of the loading problem.
The projection constructor is synchronous; await the necessary modules first.

For a small lazy feature, put **static named imports in an application-owned module**,
then dynamically import that module. This gives the bundler a narrow set of exports
at the lazy boundary. The following two files defer a UTM feature, including its engine, until requested.
This example assumes the initial application entry does not otherwise import the
experimental runtime:

```typescript title="projection-loader.ts"
export async function loadUTM31Projection() {
  const {createUTM31Projection} = await import('./utm31-projection');
  return createUTM31Projection();
}
```

```typescript title="utm31-projection.ts"
import {TypeScriptProjection, universalTransverseMercator} from '@math.gl/proj4/experimental';

export function createUTM31Projection() {
  return new TypeScriptProjection({
    to: 'EPSG:32631',
    projections: [universalTransverseMercator]
  });
}
```

Call `await loadUTM31Projection()` when the feature is needed, then reuse the
returned instance. JavaScript caches a successfully loaded module; cache projection
instances separately if construction is frequent. Handle rejected imports in your
application's loading/error UI.

Enable ESM code splitting in your bundler. It may extract common engine code into
shared chunks; inspect its output to see which chunks belong to the initial load
and which are deferred. Loading both features eventually still incurs the cost of
both, plus any chunk overhead. This pattern does not promise one independent file
per projection or a particular chunk size.

**Watch for eager imports of the same package entry point.** With the current
package layout, an esbuild test that eagerly imports Mercator and lazily imports
the UTM wrapper above puts both algorithms in an initially loaded shared chunk;
the lazy chunk then contains only the small factory. Named imports still remove
unreferenced algorithms, but this arrangement does not defer UTM's kernel. The
fully deferred feature example above avoids that eager import and was verified
with code splitting. If your application already uses the engine, check its chunk
graph rather than assuming another dynamic import reduces the initial download.
Dedicated public projection subpaths remain a packaging follow-up.

A direct `await import('@math.gl/proj4/experimental')` can be convenient, but depending
on how its namespace is used and the bundler's analysis, it can retain the whole
catalogue in the lazy chunk. It does not itself request “only UTM.” The package
currently exposes `.` and `./experimental`, not supported per-projection subpaths;
avoid importing private `src` or `dist` paths to create smaller chunks.

The same application-module pattern can defer WKT support or grid decoding. Prefer
explicit loader choices for features or known CRS families; an arbitrary EPSG code
does not tell the engine where to download definitions, plugins, or grids.

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
} from '@math.gl/proj4/experimental';

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
import {TypeScriptProjection, parseNTv2Grid} from '@math.gl/proj4/experimental';

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
for band conventions, ownership, coverage, and inverse-edge behavior. Vertical grids
and general time-dependent transformations remain unsupported.

## Transform flat buffers in place

Use `projectFlat` and `unprojectFlat` for interleaved coordinate buffers:

```typescript
import {TypeScriptProjection, mercator} from '@math.gl/proj4/experimental';

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

## Add a custom projection

Implement `ProjectionPlugin` and register it like a built-in plugin. The following
minimal spherical cylindrical example illustrates the contract; it intentionally
supports no origin, scale, or offset parameters:

```typescript title="custom-projection.ts"
import type {ProjectionPlugin} from '@math.gl/proj4/experimental';

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

Remaining upstream-corpus differences include five structured axis-orientation cases
and nine deliberate strict-input rejections. Broader grid coverage, independent
accuracy references, and regional projection validity limits still need qualification.
Keep any fallback to `Proj4Projection` an explicit application decision: it adds the
upstream runtime and has some different dimension and validation behavior. The
[roadmap](./roadmap.md), [audit](./parity-audit.md), and
[API reference](./api-reference/typescript-projection.md) describe those boundaries.
