# ProjectionTransform

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

The configurable math.gl projection engine used by the full, configurable and lazy engines; see the [support and migration contract](https://visgl.github.io/math.gl/next/docs/modules/projection/support.md). Import it from `@math.gl/projection` or the isolated `@math.gl/projection/core` entry point. The package has no proj4js runtime dependency. Install `proj4` separately when its upstream behavior is required.

```
import { ProjectionTransform, mercator } from "@math.gl/projection";



const projection = new ProjectionTransform({

  from: "EPSG:4326",

  to: "EPSG:3857",

  projections: [mercator],

});



projection.project([-74, 40.7]);

projection.unproject([-8237642.318702244, 4968191.930188206]);
```

The math.gl entry point has no runtime dependency on proj4js. Projection plugins are explicitly supplied per instance, with no global registration or automatically included projected coordinate systems. ESM bundlers can remove unused plugins. See the support contract for compatibility guarantees and numerical limits.

See the [engine guide](https://visgl.github.io/math.gl/next/docs/modules/projection/projection-engine.md) for pluggability, lazy loading, bundle size comparisons, and application integration.

## Isolated entry points[​](#isolated-entry-points "Direct link to Isolated entry points")

Use `@math.gl/projection/core` for the class, normalization, capability checks and shared contracts. Import a plugin from `@math.gl/projection/projections/<id>` using its canonical PROJ name, for example `merc`, `utm`, `etmerc`, `geocent` or `ob_tran`. Export names are identical to the barrel's names. Geographic coordinates need no plugin or `longlat` subpath; the internal `gauss` helper is not public.

The optional regional `datumCatalog` plugin is available from `@math.gl/projection/datums`. Its runtime export stays outside the root and `/core` entry points.

Readers are available from `parsers/wkt`, `parsers/projjson`, `grids/ntv2`, `grids/geotiff`, `grids/gtx`, `grids/vertical` and `grids/vertical-geotiff`, with the package name prefix. All subpaths support ESM, CommonJS and TypeScript. ESM code splitting is required for browser lazy downloads; CommonJS subpaths select APIs but do not promise shared bundles. See the [lazy-loading guide](https://visgl.github.io/math.gl/next/docs/modules/projection/projection-engine.md#load-less-used-projections-on-demand).

## Constructor[​](#constructor "Direct link to Constructor")

`new ProjectionTransform({from, to, projections, aliases, parsers, datumCatalogs, datumGrids, verticalGrids, enforceAxis, mode})`

All options are optional. Omitted `from` and `to` default to WGS84. Both accept `ReadonlyCRSDefinition`, `CRSReference`, or `SpatialReference` from `@math.gl/crs`. Definitions can be PROJ strings, built-in or instance-local aliases, and supported WKT/PROJJSON when their readers are registered.

`projections` registers algorithms per instance. `parsers` registers optional `wktCRSParser` and `projJSONCRSParser` adapters. Unused readers and projections are removed by ESM bundlers. `aliases` maps names to readonly definitions or other aliases; cycles and duplicate plugin names/aliases are rejected.

`datumCatalogs` registers additional named datum definitions per instance. Only WGS84 and NAD83, including their existing aliases, are built in. Use `datumCatalogs: [datumCatalog]` for the previous full named datum coverage. This option also applies to normalization, compatibility checks, lazy loading and structured readers. Unknown datum names throw a `missing-transform-stage` error with registration guidance.

```
import type {

  DatumDefinition,

  DatumCatalogPlugin,

} from "@math.gl/projection/core";



const local: DatumDefinition = { ellipse: "airy", towgs84: "1,2,3" };

const catalog: DatumCatalogPlugin = {

  name: "application-datums",

  datums: { local },

};

const projection = new ProjectionTransform({

  from: "+proj=longlat +datum=local",

  datumCatalogs: [catalog],

});
```

`DatumDefinition` has optional readonly `ellipse`, `towgs84`, and `nadgrids` strings, using the existing PROJ ellipsoid, Helmert, and ordered grid-list syntax. Names are matched case-insensitively with spaces, underscores and hyphens removed. Conflicts with built-ins or another catalogue are rejected; equivalent aliases within one catalogue are allowed. An unavailable name is never replaced by WGS84. Grid data must still be supplied separately through `datumGrids`.

Built-ins include WGS84/EPSG:4326, EPSG:4269 (NAD83), EPSG:4979 (WGS84 3D), EPSG:3857 and its legacy aliases, all WGS84 UTM zones, and UPS north/south. EPSG:4978 requires `geocentric`, EPSG:3857 requires `mercator`, UTM requires `universalTransverseMercator`, and UPS requires `stereographic`. Aliases never register algorithms automatically. This is not an EPSG database lookup.

`enforceAxis` defaults to false, matching proj4js. Set it to honor declared CRS axis order and signs. A SpatialReference's explicit `coordinateOrder` describes stored coordinates and takes precedence independently of this option.

`mode` defaults to `strict`. Use `horizontal` to explicitly extract the sole horizontal component of a CompoundCRS or discard separately declared vertical metadata. The instance's readonly `lossy` flag reports this extraction. Extracted horizontal transforms use zero height internally and preserve supplied vertical ordinates without interpreting or transforming them; combining this extraction with geocentric coordinates or vertical-grid transforms is rejected. VerticalCRS alone, dynamic datums, coordinate epochs, and vertical grid transformations are rejected.

## Integration with @math.gl/crs[​](#integration-with-mathglcrs "Direct link to Integration with @math.gl/crs")

Syntax parsing, lossless AST encoding, readonly CRS definitions, and source metadata belong to `@math.gl/crs`. The math.gl projection engine interprets those definitions into execution parameters without adding projection dependencies to the CRS module.

`SpatialReference.crs` must be explicit or default; absent/unknown states are errors, never implicit WGS84. The preferred definition is used without discarding or rewriting provenance and alternatives. Stored coordinate order is honored; declared units and coordinate frame must agree with the executable definition. Inputs are not mutated.

```
import { createSpatialReference } from "@math.gl/crs";

import { ProjectionTransform, mercator } from "@math.gl/projection";



const source = createSpatialReference({

  crs: {

    state: "explicit",

    definition: "EPSG:4326",

    representation: "identifier",

    provenance: "metadata",

  },

  coordinateFrame: "geographic",

  coordinateOrder: ["latitude", "longitude", "height"],

  units: ["degree", "degree", "metre"],

});

const projection = new ProjectionTransform({

  from: source,

  to: "EPSG:3857",

  projections: [mercator],

});

projection.project([40.7, -74, 100]);
```

Use `parsers: [wktCRSParser, projJSONCRSParser]` for WKT1, WKT2, ESRI WKT, and GeographicCRS/GeodeticCRS/ProjectedCRS objects. Projection methods must map to supported plugins; unknown methods and conversion parameters fail explicitly. BoundCRS supports three-parameter translations and seven-parameter position-vector/coordinate-frame operations to WGS84. WKT1 TOWGS84 is also supported. Polar stereographic axis meridians that align with signed cardinal axes relative to the central meridian are supported, including WKT2 angular units, PROJJSON meridians and legacy WKT direction spellings. WKT UNKNOWN directions are inferred only from explicit Easting/Northing/Westing/Southing axis names. Other UNKNOWN directions reject. Non-cardinal or non-polar axis-meridian operations, vertical-first structured axes, derived CRSs, and time-dependent operations remain outside this subset. PROJ axis permutations support vertical-first ordering.

`normalizeCRS(input, options)` produces an immutable execution model with distinct projection and datum ellipsoids, units, prime meridian, axes, and datum parameters. Normalization alone does not verify a projection plugin's parameter support. `checkProjectionCompatibility(input, options)` checks construction with the selected readers/plugins and reports `supported`, `unsupported`, or `unknown`, with reasons `unknown-syntax`, `missing-parser`, `missing-plugin`, `missing-transform-stage`, or `invalid-definition`. It does not assess accuracy or a particular coordinate's domain.

## Methods and dimensions[​](#methods-and-dimensions "Direct link to Methods and dimensions")

`project(coordinate)` transforms source to target; `unproject(coordinate)` reverses it. Both are bound methods accepting readonly arrays and returning new arrays.

Geographic x/y use degrees for PROJ definitions, or the angular units declared by structured CRSs. Projected x/y use the CRS's linear units. A third ordinate is height (ellipsoidal by default, gravity-related with `+geoidgrids`; meters unless vertical units are specified); datum operations transform it. Fourth and later ordinates are copied unchanged.

Two-dimensional inputs use height zero internally and return two ordinates, except that geocentric output always includes X/Y/Z. Geocentric input requires three ordinates; all three Cartesian components use the CRS's linear units. Axis permutations placing height before a horizontal component require three input ordinates. Non-finite x/y/z, invalid latitudes, singularities, and the undefined geocentric Earth center throw.

This deliberately differs from proj4js's default array API, which restores the input height for many datum operations. Differential height tests use its enforced-axis mode to compare the computed values. Geocentric units also apply consistently to Z.

## Reusable scalar outputs[​](#reusable-scalar-outputs "Direct link to Reusable scalar outputs")

`projectTo(coordinate, output)` and `unprojectTo(coordinate, output)` write a single coordinate into caller-owned storage and return that exact output object. Transforms created by the full, configurable and lazy engines expose these bound methods. Use them when a scalar loop should reuse its result instead of creating an array on each call:

```
const input = new Float64Array([-74, 40.7, 120, 8]);

const output = new Float64Array(4);

projection.projectTo(input, output);

projection.unprojectTo(output, output); // The same view can be used in place.
```

Inputs accept readonly number arrays, `Float32Array` or `Float64Array`; outputs accept writable number arrays or either floating-point typed array. The exported `ProjectionCoordinate` and `ProjectionOutput` types describe these choices. Preallocate at least the input length, or three ordinates for geocentric output. Spare output capacity is untouched. Height and trailing ordinates follow the scalar dimensional contract above. Float32 storage rounds every written ordinate, including M; a finite trailing value outside Float32 range is rejected instead of becoming infinity. Non-finite M values remain allowed.

Using the exact same input/output object is supported. Distinct typed views with overlapping input and written output byte ranges are rejected before execution; disjoint views are supported. Shared-backed overlapping ranges are conservatively rejected even across different buffer wrappers, including apparently separate shared buffers. Storage/layout, numerical and Float32 overflow errors leave ordinary stable output arrays/views unchanged. Supply writable storage and keep buffers, accessors and custom hooks stable during execution: resizing, detaching or mutating storage from getters, setters or hooks is outside this contract.

Eager projection lists return the output synchronously. Lists containing lazy descriptors return `Promise<output>`, snapshot the input before loading, and borrow the output until the promise settles; do not read or modify that output while the request is pending. After `preload()`, use `projectToSync(coordinate, output)` or `unprojectToSync(coordinate, output)` to avoid the deferred path's input snapshot and promise. These methods never import and throw when a required projection has not been loaded.

Successful synchronous calls reuse the engine's working point and create no public result array. Recursive hooks receive independent scratch storage, and custom plugins or JavaScript runtime behavior can still allocate. The existing `project` and `unproject` methods continue to return new, independently owned number arrays. For large buffers, the flat methods below avoid repeated scalar dispatch and validation.

## Flat typed arrays (in place)[​](#flat-typed-arrays-in-place "Direct link to Flat typed arrays (in place)")

`projectFlat(coordinates, dimension = 2)` and `unprojectFlat(coordinates, dimension = 2)` transform a `Float64Array` or `Float32Array` and return that same typed-array view. Records are interleaved:

```
const coordinates = new Float64Array([-74, 40.7, -122.4, 37.8]);

projection.projectFlat(coordinates, 2);

projection.unprojectFlat(coordinates, 2);



// XYZM: transforms XYZ as required by the CRS, preserves M.

const vertices = new Float32Array([-74, 40.7, 120, 1, -122.4, 37.8, 200, 2]);

projection.projectFlat(vertices, 4);
```

* `dimension` is the record width: an integer at least 2 that divides the view's length. Width 2 uses an internal zero height. Width 3 adds height or geocentric Z; width 4 and above preserve every ordinate after the third, including non-finite M values.
* Geocentric input **or output**, and axes placing height before a horizontal component, require width 3 or greater. The batch API cannot append a missing Z.
* Empty arrays are accepted with a valid layout. Use `subarray` to transform a selected range; values outside the view are untouched.
* Layout errors throw before mutation. Coordinate errors stop at the failing record: earlier records remain transformed, and the failing and subsequent records are unchanged. X/Y/Z must be finite; Float32 output overflow throws before committing that record.
* Float32 output rounds to Float32 precision. Use Float64 for precision-sensitive work; transforming back cannot recover precision lost during storage.

The engine compiles axis, datum and projection dispatch at construction. Each batch call borrows the same instance-owned mutable point used by scalar calls through the built-in projection, Helmert and prepared-grid stages, without temporary JavaScript coordinate arrays per record. Recursive hooks receive independent scratch, and failures release the lease. Specialized flat adapters use local numbers without borrowing that point. Some numerical kernels and the JavaScript runtime can still allocate objects; this is not a promise of zero heap allocation. Legacy custom plugins/grids remain supported through their scalar methods and may allocate arrays. See [benchmarks](https://visgl.github.io/math.gl/next/docs/modules/projection/benchmarks.md) for measurements.

## Current coverage[​](#current-coverage "Direct link to Current coverage")

See the [projection catalogue](https://visgl.github.io/math.gl/next/docs/modules/projection/projections.md) for algorithm families, distortion tradeoffs and examples, and [coordinate systems](https://visgl.github.io/math.gl/next/docs/modules/projection/coordinate-systems.md) for ellipsoid, datum and epoch concepts.

| Projection                                            | Plugin                        | Parameters                                  |
| ----------------------------------------------------- | ----------------------------- | ------------------------------------------- |
| Geographic (`longlat`, `latlong`, `latlon`, `lonlat`) | Built into the core           | CRS angular units                           |
| Raw geographic radians (`identity`)                   | Built into the core           | Optional unit factor                        |
| Geocentric (`geocent`)                                | `geocentric`                  | Three Cartesian components                  |
| Mercator (`merc`), spherical or ellipsoidal           | `mercator`                    | `lon_0`, `lat_ts`, `k`, `k_0`, `x_0`, `y_0` |
| Equidistant cylindrical (`eqc`), spherical equations  | `equidistantCylindrical`      | `lon_0`, `lat_0`, `lat_ts`, `x_0`, `y_0`    |
| Transverse Mercator (`tmerc`)                         | `transverseMercator`          | Origin, scale, `approx`                     |
| Extended Transverse Mercator (`etmerc`)               | `extendedTransverseMercator`  | Origin, scale, `approx`                     |
| UTM (`utm`)                                           | `universalTransverseMercator` | `zone`, `south`, `approx`                   |
| Lambert conformal conic (`lcc`)                       | `lambertConformalConic`       | Origin, scale, `lat_1`, `lat_2`             |
| Albers equal area (`aea`)                             | `albersEqualArea`             | Origin, `lat_1`, `lat_2`                    |
| Equidistant conic (`eqdc`)                            | `equidistantConic`            | Origin, `lat_1`, `lat_2`                    |
| Lambert azimuthal equal area (`laea`)                 | `lambertAzimuthalEqualArea`   | Origin                                      |
| Stereographic (`stere`)                               | `stereographic`               | Origin, scale, `lat_ts`                     |
| Oblique stereographic (`sterea`)                      | `obliqueStereographic`        | Origin, scale                               |
| Azimuthal equidistant (`aeqd`)                        | `azimuthalEquidistant`        | Origin                                      |

For these common projections, **origin** means `lon_0`, `lat_0`, `x_0`, and `y_0`; **scale** means `k` or `k_0`. All support spherical and ellipsoidal forms, except that TM/UTM require `+approx` for a sphere. The default TM algorithm is the extended series, matching proj4js's registration of the name `tmerc`.

Conics require `lat_1`; `lat_2` defaults to `lat_1`. Opposite standard parallels and parallels at the poles are rejected. An explicit equatorial `lat_2=0` is retained for LCC and EQDC, correcting an upstream truthiness fallback. `sterea` requires a non-polar origin; use `stere` for polar projections. UTM requires an integer `zone` from 1 through 60; `south` and `approx` are flags without values. UTM fixes its origin, scale, and false offsets according to its zone/hemisphere. Use `tmerc` for custom TM parameters.

```
import {

  ProjectionTransform,

  universalTransverseMercator,

} from "@math.gl/projection";



const utm = new ProjectionTransform({

  to: "EPSG:32756",

  projections: [universalTransverseMercator],

});

utm.project([151.2, -33.9]);
```

The implementation deliberately fixes two upstream 2.22.0 behaviors: equatorial ellipsoidal `stere` includes false northing, and spherical `tmerc +approx` uses the correct inverse latitude sign with a nonzero `lat_0`. It also initializes omitted origins/offsets and throws at singularities instead of returning upstream sentinels. The parity inventory records these differences and outstanding coverage gaps.

PROJ angles accept finite decimal degrees, radians suffixed with `r`, or DMS such as `12d30'0"E`. The shared `@math.gl/crs` parser preserves DMS tokens losslessly. DMS/radian interpretation is an intentional extension beyond proj4js 2.22.0. False easting/northing are meters. Named units use the pinned upstream unit table; `to_meter` overrides named units regardless of parameter order. `vunits`/`vto_meter` set height units. `k_0` overrides `k`; Mercator's `lat_ts` overrides scale.

Geometry defaults to WGS84 and accepts upstream ellipsoid names, `a`, `b`, `rf`, `f`, and spherical `R`. Named datum ellipsoids take precedence over `ellps`; explicit numeric dimensions override those defaults. Explicit `f=0` or `rf=0` selects a sphere unless `b` is supplied. The WGS 72 lookup uses the standard `WGS72` name, correcting the upstream `WGS7` typo. `b` overrides flattening, and `R` selects a sphere. Invalid dimensions are rejected even when overridden.

Named datum tables and `towgs84` implement translations (meters) or seven-parameter Helmert operations (meters, arcseconds, ppm). Nonzero operations chain through WGS84. No declared operation, or explicit `datum=none`, leaves the datum unchanged. `nadgrids=@null` uses WGS84 datum geometry separately from projection geometry, including Web Mercator's sphere. Other horizontal grid lists use the prepared grids described below.

`pm` accepts named or numeric prime meridians. `over` disables projection longitude wrapping, and geographic `lon_wrap` chooses the center of the output longitude interval. `axis` accepts each east/west, north/south, up/down component exactly once. Unknown or duplicate parameters throw. `no_defs`, `title`, and `type=crs` are metadata. Use a separately installed `proj4` runtime where its broader behavior is needed; there is no implicit fallback.

### Remaining projection catalogue[​](#remaining-projection-catalogue "Direct link to Remaining projection catalogue")

Each export is an opt-in plugin. All accept `lon_0`, `x_0`, and `y_0`, with additional parameters listed below. Geometry and unit parameters use the shared CRS pipeline.

| Export                                       | PROJ name         | Additional parameters                                                                              |
| -------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `bonne`                                      | bonne             | required nonzero lat\_1                                                                            |
| `cassiniSoldner`                             | cass              | lat\_0                                                                                             |
| `cylindricalEqualArea`                       | cea               | lat\_ts                                                                                            |
| `eckertVI`, `equalEarth`                     | eck6, eqearth     | —                                                                                                  |
| `equirectangular`                            | equi              | lat\_0 (true-scale parallel; use eqc for the usual latitude-origin convention)                     |
| `millerCylindrical`, `mollweide`, `robinson` | mill, moll, robin | —                                                                                                  |
| `sinusoidal`, `vanDerGrinten`                | sinu, vandg       | —                                                                                                  |
| `gaussSchreiberTransverseMercator`           | gstmerc           | lat\_0, k/k\_0                                                                                     |
| `krovak`                                     | krovak            | lat\_0, k/k\_0, czech flag; fixed alpha and lat\_ts values only                                    |
| `newZealandMapGrid`                          | nzmg              | required lat\_0/lon\_0, iterations (integer 0–10; default 1)                                       |
| `obliqueMercator`                            | omerc             | lat\_0, k/k\_0; alpha/gamma + lonc, or lon\_1/lat\_1/lon\_2/lat\_2; no\_off/no\_uoff/no\_rot flags |
| `polyconic`, `swissObliqueMercator`          | poly, somerc      | lat\_0; somerc also k/k\_0                                                                         |
| `gnomonic`, `orthographic`                   | gnom, ortho       | lat\_0                                                                                             |
| `geostationary`                              | geos              | required positive h, sweep=x/y                                                                     |
| `tiltedPerspective`                          | tpers             | lat\_0, positive h (default 100000 m), tilt, azi (degrees)                                         |
| `quadrilateralizedSphericalCube`             | qsc               | lat\_0                                                                                             |

Structured readers map Hotine variants A/B and legacy aliases, Krovak/North Orientated, QSC, Cassini, and spherical equidistant cylindrical methods to these plugins. Hotine variant A sets `no_uoff`; variant B uses the projection-centre offset. Angular and linear parameter units are converted before kernel construction. The legacy `Stereographic_North_Pole` method uses `sterea` away from a pole and `stere` at a pole. Krovak accepts only its fixed pseudo standard parallel (`lat_ts=78.5`) and the legacy PROJ/EPSG spellings of its fixed cone-axis co-latitude (`alpha=30.28813972222222` or `30.28813975277778`, with 1e-10-degree rounding tolerance). Custom values reject instead of being silently ignored by the fixed kernel.

`obliqueTransformation` is a factory with an explicit dependency:

```
import {

  ProjectionTransform,

  obliqueTransformation,

  mollweide,

} from "@math.gl/projection";



const rotated = new ProjectionTransform({

  to: "+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90",

  projections: [obliqueTransformation(mollweide)],

});
```

The wrapped plugin is included directly and need not be separately registered. Use `obliqueTransformation('longlat')` for rotated geographic degrees. If supplied, `o_proj` must match the dependency. Rotation accepts one complete set: `o_alpha/o_lon_c/o_lat_c`, `o_lat_p/o_lon_p`, or `o_lon_1/o_lat_1/o_lon_2/o_lat_2`. Nested oblique and geocentric dependencies are rejected. Wrapped projection parameters remain available.

Krovak retains upstream defaults (49.5° latitude, 24.8333333333° longitude, 0.9999 scale); geometry must still be supplied for the intended CRS. Perspective plugins reject invisible points. Exhaustive structured method variants and domain coverage remain tracked gaps; see the parity inventory.

## Horizontal datum grids[​](#horizontal-datum-grids "Direct link to Horizontal datum grids")

Grid decoding/loading is separate from synchronous coordinate transformation. Register prepared grids per instance through `datumGrids`; the math.gl projection engine has no global registry. Register shared grids on an engine to use them across its transforms.

```
import { ProjectionTransform, parseNTv2Grid } from "@math.gl/projection";



const grid = parseNTv2Grid(ntv2ArrayBuffer);

const projection = new ProjectionTransform({

  from: "+proj=longlat +ellps=clrk66 +nadgrids=local.gsb",

  to: "EPSG:4326",

  datumGrids: { "local.gsb": grid },

});
```

`parseNTv2Grid(buffer, {includeErrorFields})` supports both byte orders and NTv2 SECONDS grids. The default reads 16-byte node records, including unused accuracy fields. Set `includeErrorFields: false` only for compact files with 8-byte records; it does not simply discard accuracy fields from a standard file. Invalid headers, dimensions, unsupported units and truncated data throw at preparation time.

`loadGeoTIFFGrid(decodedTIFF)` asynchronously prepares a decoded geotiff.js v2/v3 object. Callers load the file or URL with their chosen GeoTIFF library and await the result before construction:

```
import { loadGeoTIFFGrid, ProjectionTransform } from "@math.gl/projection";



const grid = await loadGeoTIFFGrid(decodedTIFF);

const projection = new ProjectionTransform({

  from: "+proj=longlat +ellps=GRS80 +nadgrids=local.tif",

  datumGrids: { "local.tif": grid },

});
```

This adapter follows the pinned upstream horizontal convention: geographic degree coordinates, positive ModelPixelScale, latitude offsets in band 0 and east-positive longitude offsets in band 1, both in arcseconds. It recognizes GDAL nodata. It does not infer arbitrary band units, rotated rasters, vertical grids or other PROJ grid metadata. It imports no GeoTIFF library and performs no network requests. Unused grid readers and interpolation code are removed from core-only ESM bundles.

Prepared readers own their decoded data; buffers/rasters can be changed or released after preparation completes. Each projection captures its registration map at construction. Replacing a map entry affects subsequently constructed instances. The existing wrapper's global grid registry is independent.

Lists such as `+nadgrids=@regional.gsb,required.gsb,@null` are tried in order. All required entries before a null fallback must be registered at construction; missing `@optional` entries are skipped. A registered grid outside coverage or with unusable interpolation nodes falls through to the next entry. The reserved `null`/`@null` entry is an explicit identity fallback. Exhausting a list without a match throws. Optional does not mean an implicit identity transform.

NTv2 subgrids retain file order, matching proj4js; place a child before its parent when it should take precedence. GeoTIFF images are tried last-to-first, matching upstream child-before-parent ordering. Bilinear interpolation includes the final rows and columns. Inverse shifts solve both ordinates within a bounded iteration; they must converge inside the source grid and never return an approximate edge fix.

Source grids shift into the WGS84 datum frame; destination grids apply the inverse. They take precedence over Helmert parameters on the same CRS and compose with the other CRS's Helmert/geocentric stage. Grid shifts themselves preserve height; later geocentric/Helmert stages can change it. `datum=none` disables grid operations. Capability checks verify required registrations but cannot guarantee coordinate coverage. Named NAD27's optional grid list likewise requires usable data at execution.

Synthetic analytic and upstream differential fixtures cover the implemented subset. Licensed real-world grids and independent reference coordinates remain a release acceptance gate in tranche 7.

## Custom plugins[​](#custom-plugins "Direct link to Custom plugins")

A plugin declares its PROJ name and additional accepted parameters, optionally lists value-free parameters in `flags`, then creates a forward/inverse implementation. The engine supplies an immutable parameter map, semi-major axis, and eccentricity squared. The plugin validates its own parameter values and domain. Forward input and inverse output are longitude/latitude in radians; forward output and inverse input are projected meters, including any false offsets. The engine handles CRS units, axes, prime meridians, datum transformations, and heights. Geocentric plugins additionally implement `forward3D`/`inverse3D` over three-element tuples.

```
import type { ProjectionPlugin } from "@math.gl/projection";



const simpleCylindrical: ProjectionPlugin = {

  name: "simple_cylindrical",

  parameters: [],

  create({ semiMajorAxis: radius }) {

    return {

      forward: (longitude, latitude) => [radius * longitude, radius * latitude],

      inverse: (x, y) => [x / radius, y / radius],

    };

  },

};
```

Plugins can additionally supply `forwardInPlace(point)` and `inverseInPlace(point)`. These hooks update a `ProjectionPoint` containing numeric `x`, `y`, and `z` fields synchronously. They use the same units as the scalar methods and must preserve `z` for horizontal projections. Geocentric hooks transform all three fields. Both scalar and batch calls prefer these hooks when present; the existing scalar methods remain part of the plugin contract for compatibility. Do not retain the point or use it asynchronously: it is reused for the next record. Scratch points belong to each call, so reentrant calls do not overwrite an outer call's point.

Custom prepared grids can similarly provide `shiftInPlace(point, inverse): boolean`. Return true for a successful horizontal shift. On false, leave x/y unchanged so later grids can be tried; always preserve height. Built-in grid readers provide this hook.

### Whole-buffer plugin hooks[​](#whole-buffer-plugin-hooks "Direct link to Whole-buffer plugin hooks")

Advanced plugins can implement optional `createForwardFlat(context)` and `createInverseFlat(context)` methods on `ProjectionImplementation`. They receive a frozen `ProjectionFlatContext` with `inputScale` and `outputScale`, and return a synchronous `ProjectionFlatOperation` or `undefined` to decline specialization. These types are exported from `@math.gl/projection/core`. Factories run once per direction at construction; operations receive the entire view and stride, after the engine validates both.

A custom operation must multiply input XY by `inputScale`, apply the forward/inverse equations, then divide XY by `outputScale`. It must enforce the geographic domain and finite XYZ contract, preserve Z/trailing ordinates, check Float32 representability before writing, and leave the failing and subsequent records untouched. Scratch belongs to each call; retaining it or the buffer breaks reentrancy. Use the ordinary mutable hooks unless you need and can uphold this whole-buffer contract. Built-in factories decline when a decorator replaces their corresponding mutable hook, preserving custom behavior.

## Projection descriptors and synchronous variants[​](#projection-descriptors-and-synchronous-variants "Direct link to Projection descriptors and synchronous variants")

The `projections` option also accepts `ProjectionDescriptor` descriptors. With any descriptor in the list, coordinate methods return promises and load only the algorithms used by the CRS pair on first use. Eager-only instances keep their synchronous return types. Imports and constructors do not preload algorithms.

`await instance.preload()` prepares required implementations ahead of time. `projectSync`, `unprojectSync`, `projectFlatSync` and `unprojectFlatSync` never import algorithms: preload first, or these methods throw. Preloading a descriptor directly also enables sync methods on any instance that uses it. The default `projectionEngine` contains eager plugins and preserves its synchronous API.

See [descriptor loading and cache behavior](https://visgl.github.io/math.gl/next/docs/modules/projection/projection-engine.md#load-less-used-projections-on-demand) for examples, shared caching, retry behavior and custom descriptors.

## Attribution[​](#attribution "Direct link to Attribution")

Mercator equations follow the [PROJ Mercator documentation](https://proj.org/en/stable/operations/projections/merc.html). Kernel headers identify direct ports of proj4js 2.22.0; original adapters and equation implementations are identified separately. Distributed notices include the upstream MIT license and Equal Earth's retained Apache-2.0 license.

For the built-in descriptor catalogue, use `LazyProjectionEngine` from `@math.gl/projection/projections/lazy`. Create a transform with `createProjection()` or prepare a synchronous transform with `createProjectionAsync()`. Readers, aliases and grids remain explicit engine options. See the [engine reference](https://visgl.github.io/math.gl/next/docs/modules/projection/api-reference/projection-engine.md).

## Vertical height grids[​](#vertical-height-grids "Direct link to Vertical height grids")

All math.gl projection engine variants accept `verticalGrids?: VerticalGridCollection`. A `VerticalGrid` implements `getOffset(longitudeRadians, latitudeRadians): number | undefined`: return geoid undulation in metres, or `undefined` outside coverage. Longitudes are Greenwich referenced in the associated CRS's horizontal datum. Register implementations per instance and reference their names with `+geoidgrids`; scalar and flat transforms then require Z.

`parseGTXGrid` is exported from `@math.gl/projection/grids/gtx`. `createVerticalGrid`, `createGeoidGrid` and `VerticalGridOptions` are exported from `@math.gl/projection/grids/vertical`. The public root and compatibility experimental/native entry points also export these helpers; `/core` exports only the contract and engine. See [height conversion](https://visgl.github.io/math.gl/next/docs/modules/projection/projection-engine.md#convert-geoid-heights) for loading, units, axes, fallback, coverage, datum ordering and the limits of this explicit subset.

### loadVerticalGeoTIFFGrid[​](#loadverticalgeotiffgrid "Direct link to loadVerticalGeoTIFFGrid")

`loadVerticalGeoTIFFGrid(tiff: VerticalGridGeoTIFF): Promise<VerticalGrid>` prepares an owned geoid snapshot from a caller-decoded TIFF. Import it and its structural types `VerticalGridGeoTIFF` / `VerticalGridGeoTIFFImage` from `@math.gl/projection/grids/vertical-geotiff`. The root and experimental/native compatibility entry points also export it. Metadata may be synchronous (geotiff.js v2) or asynchronous (v3); numeric sample arrays must be raw, without decoder-applied scale/offset.

The accepted metadata, geometry, nesting, coverage and units are specified in the [vertical GeoTIFF guide](https://visgl.github.io/math.gl/next/docs/modules/projection/projection-engine.md#vertical-geotiff-geoid-models). The result plugs into `verticalGrids` on all math.gl projection engine variants. This function neither loads files nor selects a vertical datum operation automatically.
