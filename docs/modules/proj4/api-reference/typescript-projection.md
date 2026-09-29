# TypeScriptProjection (experimental)

An independent TypeScript implementation being developed alongside `Proj4Projection`.
Import it from `@math.gl/proj4/experimental`. The existing `Proj4Projection` continues to
use proj4js and provides the broader CRS support.

```typescript
import {TypeScriptProjection, mercator} from '@math.gl/proj4/experimental';

const projection = new TypeScriptProjection({
  from: 'EPSG:4326',
  to: 'EPSG:3857',
  projections: [mercator]
});

projection.project([-74, 40.7]);
projection.unproject([-8237642.318702244, 4968191.930188206]);
```

The experimental entry point has no runtime dependency on proj4js. Projection plugins
are explicitly supplied per instance, with no global registration or automatically
included projected coordinate systems. ESM bundlers can remove unused plugins.
The API and its supported subset may change as coverage expands.

## Constructor

`new TypeScriptProjection({from, to, projections, aliases, parsers, enforceAxis, mode})`

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
datums, coordinate epochs, and grid transformations are rejected.

## Integration with @math.gl/crs

Syntax parsing, lossless AST encoding, readonly CRS definitions, and source metadata
belong to `@math.gl/crs`. The native backend interprets those definitions into
execution parameters without adding projection dependencies to the CRS module.

`SpatialReference.crs` must be explicit or default; absent/unknown states are errors,
never implicit WGS84. The preferred definition is used without discarding or rewriting
provenance and alternatives. Stored coordinate order is honored; declared units and
coordinate frame must agree with the executable definition. Inputs are not mutated.

```typescript
import {createSpatialReference} from '@math.gl/crs';
import {TypeScriptProjection, mercator} from '@math.gl/proj4/experimental';

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
operations to WGS84. WKT1 TOWGS84 is also supported. Axis-meridian operations,
vertical-first structured axes, derived CRSs, and time-dependent operations remain
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
import {TypeScriptProjection, universalTransverseMercator} from '@math.gl/proj4/experimental';

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
including Web Mercator's sphere. Other grid lists fail until the grid tranche.

`pm` accepts named or numeric prime meridians. `over` disables projection longitude
wrapping, and geographic `lon_wrap` chooses the center of the output longitude interval.
`axis` accepts each east/west, north/south, up/down component exactly once.
Unknown or duplicate parameters throw. `no_defs`, `title`, and `type=crs` are metadata.
Use `Proj4Projection` for definitions outside the native subset; there is no implicit fallback.

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
import type {ProjectionPlugin} from '@math.gl/proj4/experimental';

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

## Expansion path

The [parity roadmap](../roadmap.md) defines tranches and acceptance gates against
the pinned proj4js 2.22.0 reference.

Add projection plugins with forward/inverse parity tests against proj4js, then extend
CRS normalization, ellipsoid/datum handling, and grid support independently. Keep the
experimental engine opt-in until the required compatibility and accuracy are verified.
The existing `checkProj4CRSCompatibility` utility checks proj4js, not this engine.

Mercator equations follow the [PROJ Mercator documentation](https://proj.org/en/stable/operations/projections/merc.html).
