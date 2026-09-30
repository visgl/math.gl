# TypeScriptProjection

The configurable TypeScript engine underlying the default `Projection`; see the [support and migration contract](../typescript-support.md).
Import it from `@math.gl/proj4` or the isolated `@math.gl/proj4/core` entry point. The original wrapper is available from `@math.gl/proj4/classic`.

```typescript
import {TypeScriptProjection, mercator} from '@math.gl/proj4';

const projection = new TypeScriptProjection({
  from: 'EPSG:4326',
  to: 'EPSG:3857',
  projections: [mercator]
});

projection.project([-74, 40.7]);
projection.unproject([-8237642.318702244, 4968191.930188206]);
```

The TypeScript entry point has no runtime dependency on proj4js. Projection plugins
are explicitly supplied per instance, with no global registration or automatically
included projected coordinate systems. ESM bundlers can remove unused plugins.
See the support contract for compatibility guarantees and numerical limits.

See the [engine guide](../typescript-engine.md) for pluggability, lazy loading, bundle
size comparisons, and application integration.

## Isolated entry points

Use `@math.gl/proj4/core` for the class, normalization, capability checks
and shared contracts. Import a plugin from `@math.gl/proj4/projections/<id>`
using its canonical PROJ name, for example `merc`, `utm`, `etmerc`, `geocent` or
`ob_tran`. Export names are identical to the barrel's names. Geographic coordinates
need no plugin or `longlat` subpath; the internal `gauss` helper is not public.

Readers are available from `parsers/wkt`, `parsers/projjson`,
`grids/ntv2` and `grids/geotiff`, with the package name prefix.
All subpaths support ESM, CommonJS and TypeScript. ESM code splitting is required for
browser lazy downloads; CommonJS subpaths select APIs but do not promise shared bundles.
See the [lazy-loading guide](../typescript-engine.md#load-less-used-projections-on-demand).

## Constructor

`new TypeScriptProjection({from, to, projections, aliases, parsers, datumGrids, enforceAxis, mode})`

All options are optional. Omitted `from` and `to` default to WGS84.
Both accept `ReadonlyCRSDefinition`, `CRSReference`, or `SpatialReference` from
`@math.gl/crs`. Definitions can be PROJ strings, built-in or instance-local aliases,
and supported WKT/PROJJSON when their readers are registered.

`projections` registers algorithms per instance. `parsers` registers optional
`wktCRSParser` and `projJSONCRSParser` adapters. Unused readers and projections are
removed by ESM bundlers. `aliases` maps names to readonly definitions or other aliases;
cycles and duplicate plugin names/aliases are rejected.

Built-ins include WGS84/EPSG:4326, EPSG:4269 (NAD83), EPSG:4979 (WGS84 3D),
EPSG:3857 and its legacy aliases, all WGS84 UTM zones, and UPS north/south.
EPSG:4978 requires `geocentric`, EPSG:3857 requires `mercator`, UTM requires
`universalTransverseMercator`, and UPS requires `stereographic`.
Aliases never register algorithms automatically. This is not an EPSG database lookup.

`enforceAxis` defaults to false, matching proj4js. Set it to honor declared CRS axis
order and signs. A SpatialReference's explicit `coordinateOrder` describes stored
coordinates and takes precedence independently of this option.

`mode` defaults to `strict`. Use `horizontal` to explicitly extract the sole horizontal
component of a CompoundCRS or discard separately declared vertical metadata. The
instance's readonly `lossy` flag reports this extraction. Extracted horizontal transforms
use zero height internally and preserve supplied vertical ordinates without interpreting
or transforming them; combining this extraction with geocentric coordinates is rejected.
VerticalCRS alone, dynamic
datums, coordinate epochs, and vertical grid transformations are rejected.

## Integration with @math.gl/crs

Syntax parsing, lossless AST encoding, readonly CRS definitions, and source metadata
belong to `@math.gl/crs`. The TypeScript backend interprets those definitions into
execution parameters without adding projection dependencies to the CRS module.

`SpatialReference.crs` must be explicit or default; absent/unknown states are errors,
never implicit WGS84. The preferred definition is used without discarding or rewriting
provenance and alternatives. Stored coordinate order is honored; declared units and
coordinate frame must agree with the executable definition. Inputs are not mutated.

```typescript
import {createSpatialReference} from '@math.gl/crs';
import {TypeScriptProjection, mercator} from '@math.gl/proj4';

const source = createSpatialReference({
  crs: {
    state: 'explicit', definition: 'EPSG:4326', representation: 'identifier',
    provenance: 'metadata'
  },
  coordinateFrame: 'geographic',
  coordinateOrder: ['latitude', 'longitude', 'height'],
  units: ['degree', 'degree', 'metre']
});
const projection = new TypeScriptProjection({
  from: source, to: 'EPSG:3857', projections: [mercator]
});
projection.project([40.7, -74, 100]);
```

Use `parsers: [wktCRSParser, projJSONCRSParser]` for WKT1, WKT2, ESRI WKT, and
GeographicCRS/GeodeticCRS/ProjectedCRS objects. Projection methods must map to supported
plugins; unknown methods and conversion parameters fail explicitly. BoundCRS supports
three-parameter translations and seven-parameter position-vector/coordinate-frame
operations to WGS84. WKT1 TOWGS84 is also supported. Polar stereographic axis meridians
that align with signed cardinal axes relative to the central meridian are supported,
including WKT2 angular units, PROJJSON meridians and legacy WKT direction spellings.
WKT UNKNOWN directions are inferred only from explicit Easting/Northing/Westing/Southing
axis names. Other UNKNOWN directions reject. Non-cardinal or non-polar axis-meridian
operations, vertical-first structured axes, derived CRSs, and time-dependent operations remain
outside this subset. PROJ axis permutations support vertical-first ordering.

`normalizeCRS(input, options)` produces an immutable execution model with distinct
projection and datum ellipsoids, units, prime meridian, axes, and datum parameters.
Normalization alone does not verify a projection plugin's parameter support.
`checkTypeScriptCRSCompatibility(input, options)` checks construction with the selected
readers/plugins and reports `supported`, `unsupported`, or `unknown`, with reasons
`unknown-syntax`, `missing-parser`, `missing-plugin`, `missing-transform-stage`, or
`invalid-definition`. It does not assess accuracy or a particular coordinate's domain.
The existing `checkProj4CRSCompatibility` remains scoped to proj4js.

## Methods and dimensions

`project(coordinate)` transforms source to target; `unproject(coordinate)` reverses it.
Both are bound methods accepting readonly arrays and returning new arrays.

Geographic x/y use degrees for PROJ definitions, or the angular units declared by
structured CRSs. Projected x/y use the CRS's linear units. A third ordinate is
ellipsoidal height (meters unless vertical units are specified); datum operations
transform it. Fourth and later ordinates are copied unchanged.

Two-dimensional inputs use height zero internally and return two ordinates, except
that geocentric output always includes X/Y/Z. Geocentric input requires three ordinates;
all three Cartesian components use the CRS's linear units. Axis permutations placing
height before a horizontal component require three input ordinates. Non-finite x/y/z,
invalid latitudes, singularities, and the undefined geocentric Earth center throw.

This deliberately differs from proj4js's default array API, which restores the input
height for many datum operations. Differential height tests use its enforced-axis
mode to compare the computed values. Geocentric units also apply consistently to Z.

## Flat typed arrays (in place)

`projectFlat(coordinates, dimension = 2)` and
`unprojectFlat(coordinates, dimension = 2)` transform a `Float64Array` or
`Float32Array` and return that same typed-array view. Records are interleaved:

```typescript
const coordinates = new Float64Array([-74, 40.7, -122.4, 37.8]);
projection.projectFlat(coordinates, 2);
projection.unprojectFlat(coordinates, 2);

// XYZM: transforms XYZ as required by the CRS, preserves M.
const vertices = new Float32Array([-74, 40.7, 120, 1, -122.4, 37.8, 200, 2]);
projection.projectFlat(vertices, 4);
```

- `dimension` is the record width: an integer at least 2 that divides the view's
  length. Width 2 uses an internal zero height. Width 3 adds height or geocentric Z;
  width 4 and above preserve every ordinate after the third, including non-finite M values.
- Geocentric input **or output**, and axes placing height before a horizontal
  component, require width 3 or greater. The batch API cannot append a missing Z.
- Empty arrays are accepted with a valid layout. Use `subarray` to transform a
  selected range; values outside the view are untouched.
- Layout errors throw before mutation. Coordinate errors stop at the failing record:
  earlier records remain transformed, and the failing and subsequent records are unchanged.
  X/Y/Z must be finite; Float32 output overflow throws before committing that record.
- Float32 output rounds to Float32 precision. Use Float64 for precision-sensitive
  work; transforming back cannot recover precision lost during storage.

The engine compiles axis, datum and projection dispatch at construction. Each batch
call reuses one mutable point through the built-in projection, Helmert and prepared-grid
stages, without temporary JavaScript coordinate arrays per record. Some numerical
kernels and the JavaScript runtime can still allocate objects; this is not a promise
of zero heap allocation. Legacy custom plugins/grids remain supported through their
scalar methods and may allocate arrays. See [benchmarks](../benchmarks.md) for measurements.

## Current coverage

| Projection | Plugin | Parameters |
| --- | --- | --- |
| Geographic (`longlat`, `latlong`, `latlon`, `lonlat`) | Built into the core | CRS angular units |
| Raw geographic radians (`identity`) | Built into the core | Optional unit factor |
| Geocentric (`geocent`) | `geocentric` | Three Cartesian components |
| Mercator (`merc`), spherical or ellipsoidal | `mercator` | `lon_0`, `lat_ts`, `k`, `k_0`, `x_0`, `y_0` |
| Equidistant cylindrical (`eqc`), spherical equations | `equidistantCylindrical` | `lon_0`, `lat_0`, `lat_ts`, `x_0`, `y_0` |
| Transverse Mercator (`tmerc`) | `transverseMercator` | Origin, scale, `approx` |
| Extended Transverse Mercator (`etmerc`) | `extendedTransverseMercator` | Origin, scale, `approx` |
| UTM (`utm`) | `universalTransverseMercator` | `zone`, `south`, `approx` |
| Lambert conformal conic (`lcc`) | `lambertConformalConic` | Origin, scale, `lat_1`, `lat_2` |
| Albers equal area (`aea`) | `albersEqualArea` | Origin, `lat_1`, `lat_2` |
| Equidistant conic (`eqdc`) | `equidistantConic` | Origin, `lat_1`, `lat_2` |
| Lambert azimuthal equal area (`laea`) | `lambertAzimuthalEqualArea` | Origin |
| Stereographic (`stere`) | `stereographic` | Origin, scale, `lat_ts` |
| Oblique stereographic (`sterea`) | `obliqueStereographic` | Origin, scale |
| Azimuthal equidistant (`aeqd`) | `azimuthalEquidistant` | Origin |

For these common projections, **origin** means `lon_0`, `lat_0`, `x_0`, and `y_0`;
**scale** means `k` or `k_0`. All support spherical and ellipsoidal forms, except
that TM/UTM require `+approx` for a sphere. The default TM algorithm is the extended
series, matching proj4js's registration of the name `tmerc`.

Conics require `lat_1`; `lat_2` defaults to `lat_1`. Opposite standard parallels
and parallels at the poles are rejected. An explicit equatorial `lat_2=0` is retained
for LCC and EQDC, correcting an upstream truthiness fallback. `sterea` requires a non-polar origin;
use `stere` for polar projections. UTM requires an integer `zone` from 1 through 60;
`south` and `approx` are flags without values. UTM fixes its origin, scale, and false
offsets according to its zone/hemisphere. Use `tmerc` for custom TM parameters.

```typescript
import {TypeScriptProjection, universalTransverseMercator} from '@math.gl/proj4';

const utm = new TypeScriptProjection({
  to: 'EPSG:32756',
  projections: [universalTransverseMercator]
});
utm.project([151.2, -33.9]);
```

The implementation deliberately fixes two upstream 2.22.0 behaviors: equatorial
ellipsoidal `stere` includes false northing, and spherical `tmerc +approx` uses the
correct inverse latitude sign with a nonzero `lat_0`. It also initializes omitted
origins/offsets and throws at singularities instead of returning upstream sentinels.
The parity inventory records these differences and outstanding coverage gaps.

PROJ angles accept finite decimal degrees, radians suffixed with `r`, or DMS such as
`12d30'0"E`. The shared `@math.gl/crs` parser preserves DMS tokens losslessly.
DMS/radian interpretation is an intentional extension beyond proj4js 2.22.0.
False easting/northing are meters. Named units use the pinned upstream unit table;
`to_meter` overrides named units regardless of parameter order. `vunits`/`vto_meter`
set height units. `k_0` overrides `k`; Mercator's `lat_ts` overrides scale.

Geometry defaults to WGS84 and accepts upstream ellipsoid names, `a`, `b`, `rf`, `f`,
and spherical `R`. Named datum ellipsoids take precedence over `ellps`; explicit
numeric dimensions override those defaults. Explicit `f=0` or `rf=0` selects a sphere
unless `b` is supplied. The WGS 72 lookup uses the standard `WGS72` name, correcting
the upstream `WGS7` typo. `b` overrides flattening, and `R`
selects a sphere. Invalid dimensions are rejected even when overridden.

Named datum tables and `towgs84` implement translations (meters) or seven-parameter
Helmert operations (meters, arcseconds, ppm). Nonzero operations chain through WGS84.
No declared operation, or explicit `datum=none`, leaves the datum unchanged.
`nadgrids=@null` uses WGS84 datum geometry separately from projection geometry,
including Web Mercator's sphere. Other horizontal grid lists use the prepared grids described below.

`pm` accepts named or numeric prime meridians. `over` disables projection longitude
wrapping, and geographic `lon_wrap` chooses the center of the output longitude interval.
`axis` accepts each east/west, north/south, up/down component exactly once.
Unknown or duplicate parameters throw. `no_defs`, `title`, and `type=crs` are metadata.
Use `Proj4Projection` from `@math.gl/proj4/classic` where its broader behavior is needed; there is no implicit fallback.


### Remaining projection catalogue

Each export is an opt-in plugin. All accept `lon_0`, `x_0`, and `y_0`,
with additional parameters listed below. Geometry and unit parameters use the shared
CRS pipeline.

| Export | PROJ name | Additional parameters |
| --- | --- | --- |
| `bonne` | bonne | required nonzero lat_1 |
| `cassiniSoldner` | cass | lat_0 |
| `cylindricalEqualArea` | cea | lat_ts |
| `eckertVI`, `equalEarth` | eck6, eqearth | — |
| `equirectangular` | equi | lat_0 (true-scale parallel; use eqc for the usual latitude-origin convention) |
| `millerCylindrical`, `mollweide`, `robinson` | mill, moll, robin | — |
| `sinusoidal`, `vanDerGrinten` | sinu, vandg | — |
| `gaussSchreiberTransverseMercator` | gstmerc | lat_0, k/k_0 |
| `krovak` | krovak | lat_0, k/k_0, czech flag; fixed alpha and lat_ts values only |
| `newZealandMapGrid` | nzmg | required lat_0/lon_0, iterations (integer 0–10; default 1) |
| `obliqueMercator` | omerc | lat_0, k/k_0; alpha/gamma + lonc, or lon_1/lat_1/lon_2/lat_2; no_off/no_uoff/no_rot flags |
| `polyconic`, `swissObliqueMercator` | poly, somerc | lat_0; somerc also k/k_0 |
| `gnomonic`, `orthographic` | gnom, ortho | lat_0 |
| `geostationary` | geos | required positive h, sweep=x/y |
| `tiltedPerspective` | tpers | lat_0, positive h (default 100000 m), tilt, azi (degrees) |
| `quadrilateralizedSphericalCube` | qsc | lat_0 |

Structured readers map Hotine variants A/B and legacy aliases, Krovak/North Orientated,
QSC, Cassini, and spherical equidistant cylindrical methods to these plugins. Hotine
variant A sets `no_uoff`; variant B uses the projection-centre offset. Angular and
linear parameter units are converted before kernel construction. The legacy
`Stereographic_North_Pole` method uses `sterea` away from a pole and `stere` at a pole.
Krovak accepts only its fixed pseudo standard parallel (`lat_ts=78.5`) and the legacy
PROJ/EPSG spellings of its fixed cone-axis co-latitude (`alpha=30.28813972222222`
or `30.28813975277778`, with 1e-10-degree rounding tolerance). Custom values reject
instead of being silently ignored by the fixed kernel.

`obliqueTransformation` is a factory with an explicit dependency:

```typescript
import {TypeScriptProjection, obliqueTransformation, mollweide} from '@math.gl/proj4';

const rotated = new TypeScriptProjection({
  to: '+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90',
  projections: [obliqueTransformation(mollweide)]
});
```

The wrapped plugin is included directly and need not be separately registered.
Use `obliqueTransformation('longlat')` for rotated geographic degrees.
If supplied, `o_proj` must match the dependency. Rotation accepts one complete
set: `o_alpha/o_lon_c/o_lat_c`, `o_lat_p/o_lon_p`, or
`o_lon_1/o_lat_1/o_lon_2/o_lat_2`. Nested oblique and geocentric
dependencies are rejected. Wrapped projection parameters remain available.

Krovak retains upstream defaults (49.5° latitude, 24.8333333333° longitude,
0.9999 scale); geometry must still be supplied for the intended CRS. Perspective
plugins reject invisible points. Exhaustive structured method variants and domain
coverage remain tracked gaps; see the parity inventory.


## Horizontal datum grids

Grid decoding/loading is separate from synchronous coordinate transformation.
Register prepared grids per instance through `datumGrids`; the TypeScript engine has no
global registry. This replaces the global registration pattern of the existing
`Projection.registerDatumGrid` wrapper.

```typescript
import {TypeScriptProjection, parseNTv2Grid} from '@math.gl/proj4';

const grid = parseNTv2Grid(ntv2ArrayBuffer);
const projection = new TypeScriptProjection({
  from: '+proj=longlat +ellps=clrk66 +nadgrids=local.gsb',
  to: 'EPSG:4326',
  datumGrids: {'local.gsb': grid}
});
```

`parseNTv2Grid(buffer, {includeErrorFields})` supports both byte orders and
NTv2 SECONDS grids. The default reads 16-byte node records, including unused accuracy
fields. Set `includeErrorFields: false` only for compact files with 8-byte records;
it does not simply discard accuracy fields from a standard file. Invalid headers,
dimensions, unsupported units and truncated data throw at preparation time.

`loadGeoTIFFGrid(decodedTIFF)` asynchronously prepares a decoded geotiff.js v2/v3
object. Callers load the file or URL with their chosen GeoTIFF library and await the
result before construction:

```typescript
import {loadGeoTIFFGrid, TypeScriptProjection} from '@math.gl/proj4';

const grid = await loadGeoTIFFGrid(decodedTIFF);
const projection = new TypeScriptProjection({
  from: '+proj=longlat +ellps=GRS80 +nadgrids=local.tif',
  datumGrids: {'local.tif': grid}
});
```

This adapter follows the pinned upstream horizontal convention: geographic degree
coordinates, positive ModelPixelScale, latitude offsets in band 0 and east-positive
longitude offsets in band 1, both in arcseconds. It recognizes GDAL nodata.
It does not infer arbitrary band units, rotated rasters, vertical grids or other PROJ
grid metadata. It imports no GeoTIFF library and performs no network requests.
Unused grid readers and interpolation code are removed from core-only ESM bundles.

Prepared readers own their decoded data; buffers/rasters can be changed or released
after preparation completes. Each projection captures its registration map at
construction. Replacing a map entry affects subsequently constructed instances.
The existing wrapper's global grid registry is independent.

Lists such as `+nadgrids=@regional.gsb,required.gsb,@null` are tried in order.
All required entries before a null fallback must be registered at construction;
missing `@optional` entries are skipped. A registered grid outside coverage or
with unusable interpolation nodes falls through to the next entry. The reserved
`null`/`@null` entry is an explicit identity fallback. Exhausting a list
without a match throws. Optional does not mean an implicit identity transform.

NTv2 subgrids retain file order, matching proj4js; place a child before its parent
when it should take precedence. GeoTIFF images are tried last-to-first, matching
upstream child-before-parent ordering. Bilinear interpolation includes the final
rows and columns. Inverse shifts solve both ordinates within a bounded iteration;
they must converge inside the source grid and never return an approximate edge fix.

Source grids shift into the WGS84 datum frame; destination grids apply the inverse.
They take precedence over Helmert parameters on the same CRS and compose with
the other CRS's Helmert/geocentric stage. Grid shifts themselves preserve height;
later geocentric/Helmert stages can change it. `datum=none` disables grid operations.
Capability checks verify required registrations but cannot guarantee coordinate
coverage. Named NAD27's optional grid list likewise requires usable data at execution.

Synthetic analytic and upstream differential fixtures cover the implemented subset.
Licensed real-world grids and independent reference coordinates remain a release
acceptance gate in tranche 7.

## Custom plugins

A plugin declares its PROJ name and additional accepted parameters, optionally lists
value-free parameters in `flags`, then creates a
forward/inverse implementation. The engine supplies an immutable parameter map,
semi-major axis, and eccentricity squared. The plugin validates its own parameter
values and domain. Forward input and inverse output are longitude/latitude in radians;
forward output and inverse input are projected meters, including any false offsets.
The engine handles CRS units, axes, prime meridians, datum transformations, and heights.
Geocentric plugins additionally implement `forward3D`/`inverse3D` over three-element tuples.

```typescript
import type {ProjectionPlugin} from '@math.gl/proj4';

const simpleCylindrical: ProjectionPlugin = {
  name: 'simple_cylindrical',
  parameters: [],
  create({semiMajorAxis: radius}) {
    return {
      forward: (longitude, latitude) => [radius * longitude, radius * latitude],
      inverse: (x, y) => [x / radius, y / radius]
    };
  }
};
```

Plugins can additionally supply `forwardInPlace(point)` and
`inverseInPlace(point)`. These hooks update a `ProjectionPoint` containing numeric
`x`, `y`, and `z` fields synchronously. They use the same units as the scalar methods
and must preserve `z` for horizontal projections. Geocentric hooks transform all
three fields. Both scalar and batch calls prefer these hooks when present; the
existing scalar methods remain part of the plugin contract for compatibility.
Do not retain the point or use it asynchronously: it is reused for the next record.
Scratch points belong to each call, so reentrant calls do not overwrite an outer call's point.

Custom prepared grids can similarly provide `shiftInPlace(point, inverse): boolean`.
Return true for a successful horizontal shift. On false, leave x/y unchanged so
later grids can be tried; always preserve height. Built-in grid readers provide this hook.

## Projection descriptors and synchronous variants

The `projections` option also accepts `ProjectionDescriptor` descriptors. With any
descriptor in the list, coordinate methods return promises and load only the
algorithms used by the CRS pair on first use. Eager-only instances keep their
synchronous return types. Imports and constructors do not preload algorithms.

`await instance.preload()` prepares required implementations ahead of time.
`projectSync`, `unprojectSync`, `projectFlatSync` and `unprojectFlatSync` never import
algorithms: preload first, or these methods throw. Preloading a descriptor directly
also enables sync methods on any instance that uses it. The default `Projection`
wrapper contains eager plugins and preserves its synchronous API.

See [descriptor loading and cache behavior](../typescript-engine.md#load-less-used-projections-on-demand)
for examples, shared caching, retry behavior and custom descriptors.

## Expansion path

The [parity roadmap](../roadmap.md) defines tranches and acceptance gates against
the pinned proj4js 2.22.0 reference.

Add projection plugins with forward/inverse parity tests against proj4js, then extend
CRS normalization, ellipsoid/datum handling, and grid support independently.
The default wrapper uses this engine; the explicit `classic` subpath retains proj4js.
Its `checkProj4CRSCompatibility` utility checks that backend.

Mercator equations follow the [PROJ Mercator documentation](https://proj.org/en/stable/operations/projections/merc.html).

Numerical kernel headers identify direct TypeScript ports of proj4js 2.22.0; original
adapters and inspired equation implementations are identified separately. Distributed
notices include the upstream MIT license and Equal Earth's retained Apache-2.0 license.

## LazyProjection

Import `LazyProjection` and `LazyProjectionOptions` from
`@math.gl/proj4/projections/lazy`. Its constructor takes the same options except
`projections`: the full built-in descriptor catalogue is supplied automatically.
Readers, aliases and grids remain explicit options. Coordinate methods return
promises; `preload()` and the sync variants follow the descriptor contract above.
`LazyProjection.create(options)` optionally resolves the catalogue into a prepared
synchronous `TypeScriptProjection` instance. See the [loading guide](../typescript-engine.md#load-less-used-projections-on-demand).
