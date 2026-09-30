# TypeScript projection engine

`@math.gl/proj4/native` is a TypeScript coordinate transformation engine with
explicit projection plugins, optional CRS readers, and in-place typed-array transforms.
Applications choose the algorithms and data they need, and can load them on demand.
It is an entry point of **`@math.gl/proj4`**, not a separately installed package.
Existing `@math.gl/proj4/experimental` paths remain compatibility aliases.

The native entry point supports the [documented API and transformation profile](./native-support.md). The upstream coordinate corpus has **232 original numeric matches, one reviewed
Robinson correction, and nine intentional input rejections out of 242**. This is not a measure of complete geodetic accuracy.
An independent PROJ corpus also checks all 37 named algorithms across 2,386 points,
with additional structured CRS, datum-chain and real NTv2/GeoTIFF checks, with explicit accuracy limits. See [independent validation](./independent-validation.md)
and the [parity audit](./parity-audit.md) for coverage and remaining qualification work.
The existing `Proj4Projection` remains available from `@math.gl/proj4` and uses proj4js.

## Start with the projections you need

Use a package build of `@math.gl/proj4` that includes the experimental entry point;
these examples describe the current source-tree API. Import named exports from that
entry point:

```typescript title="mercator-projection.ts"
import {TypeScriptProjection, mercator} from '@math.gl/proj4/native';

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
} from '@math.gl/proj4/native';

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

The native entry point does not import the proj4js runtime. The npm package
still depends on proj4js for the existing wrapper, so **installation size and browser
bundle size are different measurements**. Importing the wrapper elsewhere in the
same application can retain both engines. CommonJS consumers are supported, but the
size measurements below rely on an ESM bundler with tree shaking.

The core has a fixed cost: CRS normalization, unit/axis/datum transformation support,
and shared ellipsoid and datum tables. Selecting one projection does not remove
those tables. Adding WKT pulls in syntax parsing and structured-CRS interpretation;
PROJJSON objects already provide structured input and need less reader code.

Measured September 29, 2026 for the axis and entry-point follow-up, with esbuild,
browser ESM, ES2020, minification, and gzip level 9. Each row is a separate retained
bundle, not an increment or an application-wide download estimate. **KiB = 1,024 bytes.**

| Retained functionality | Minified KiB | Gzip KiB |
| --- | ---: | ---: |
| Engine core | 41.5 | 15.4 |
| Engine + Mercator | 42.8 | 15.8 |
| Engine + UTM | 49.5 | 18.5 |
| Engine + Mercator + WKT reader | 65.7 | 23.3 |
| Engine + Mercator + PROJJSON reader | 53.2 | 19.4 |
| Engine + Mercator + NTv2 decoder | 45.9 | 17.0 |
| Engine + Mercator + GeoTIFF grid adapter | 45.9 | 17.0 |
| Every native export, including readers and grid adapters | 138.8 | 47.4 |
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

Use the core and projection subpaths when the application already uses the engine
and needs another algorithm later. The constructor is synchronous: import the
plugin first, then supply it explicitly to a new instance.

```typescript title="projection-loader.ts"
import {TypeScriptProjection} from '@math.gl/proj4/native/core';
import {mercator} from '@math.gl/proj4/native/projections/merc';

// Available in the initial application bundle.
export const webMercator = new TypeScriptProjection({
  to: 'EPSG:3857',
  projections: [mercator]
});

// UTM's algorithm is loaded only when requested.
export async function loadUTM31Projection() {
  const {universalTransverseMercator} =
    await import('@math.gl/proj4/native/projections/utm');
  return new TypeScriptProjection({
    to: 'EPSG:32631',
    projections: [universalTransverseMercator]
  });
}
```

Call `await loadUTM31Projection()` when the feature is needed, then reuse the
returned instance. JavaScript caches successful module loads; cache projection
instances separately if construction is frequent. Handle rejected imports in your
application's loading/error UI.

Optional WKT interpretation can also be deferred. The adapter uses isolated
`@math.gl/crs` syntax entry points so its parser stays on the lazy side:

```typescript
import {TypeScriptProjection} from '@math.gl/proj4/native/core';
import {mercator} from '@math.gl/proj4/native/projections/merc';

export async function loadMercatorWKT(to: string) {
  const {wktCRSParser} = await import('@math.gl/proj4/native/parsers/wkt');
  return new TypeScriptProjection({to, projections: [mercator], parsers: [wktCRSParser]});
}
```

The definition must select an algorithm supplied in `projections`. The WKT reader
does not download plugins, definitions or grids for an arbitrary EPSG code.
Use an explicit application loader map for the CRS families you support.

### Public subpaths

All paths below have the `@math.gl/proj4/` prefix and support ESM, CommonJS and types.
The existing `experimental` barrel remains compatible.

| Subpath | Exports |
| --- | --- |
| `experimental/core` | Engine, normalization, capability checks, shared types and errors |
| `experimental/projections/<id>` | One plugin or factory, using its existing export name |
| `experimental/parsers/wkt` | `wktCRSParser` |
| `experimental/parsers/projjson` | `projJSONCRSParser` |
| `experimental/grids/ntv2` | `parseNTv2Grid` and its options type |
| `experimental/grids/geotiff` | `loadGeoTIFFGrid` and adapter types; excludes a TIFF decoder |

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
| UTM | 43.1 / 16.2 | 7.8 / 3.4 |
| WKT reader and syntax | 43.2 / 16.0 | 22.9 / 7.9 |
| Rotated Mollweide (factory plus wrapped plugin) | 43.2 / 16.4 | 5.3 / 2.5 |

These are esbuild browser/ES2020 measurements, not universal chunk sizes. Bundlers
may extract shared helpers, so one plugin does not necessarily mean one file. Loading
all features eventually pays for all retained code and chunk overhead. CommonJS
subpaths select APIs but do not provide this browser download guarantee.

Reproduce and enforce the split-bundle budgets after building:

```sh
node modules/proj4/scripts/check-lazy-package.mjs
```

Keep imports on the isolated subpaths throughout the eager and lazy features.
Mixing in eager imports from the full `experimental` or `@math.gl/crs` barrels
can cause a bundler to hoist otherwise lazy code. A direct
`await import('@math.gl/proj4/native')` can retain the entire catalogue;
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
} from '@math.gl/proj4/native';

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
import {TypeScriptProjection, parseNTv2Grid} from '@math.gl/proj4/native';

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
import {TypeScriptProjection, mercator} from '@math.gl/proj4/native';

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
import type {ProjectionPlugin} from '@math.gl/proj4/native';

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
Keep any fallback to `Proj4Projection` an explicit application decision: it adds the
upstream runtime and has some different dimension and validation behavior. The
[roadmap](./roadmap.md), [audit](./parity-audit.md), and
[API reference](./api-reference/typescript-projection.md) describe those boundaries.
