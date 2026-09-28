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

`new TypeScriptProjection({from, to, projections, aliases})`

All options are optional. `from` and `to` default to `'WGS84'`. Definitions can be
the built-in aliases `WGS84`, `EPSG:4326`, and `EPSG:3857`, instance-local aliases,
or PROJ strings beginning with `+proj=` (the leading `+` is optional).
`EPSG:3857` requires the `mercator` plugin. `EPSG:32601`–`EPSG:32660` and
`EPSG:32701`–`EPSG:32760` require `universalTransverseMercator`; `EPSG:5041` and
`EPSG:5042` require `stereographic`. Aliases never register plugins automatically.

`projections` is an array of `ProjectionPlugin` objects. Duplicate names and names
reserved for geographic coordinates are rejected. `aliases` maps names to definitions
or other aliases; cyclic aliases are rejected. Neither option changes other instances
or the proj4js-backed implementation.

## Methods

`project(coordinate)` transforms from the source CRS to the target CRS.
`unproject(coordinate)` transforms in the opposite direction. Both methods are bound
to the instance, accept readonly number arrays, and return new arrays.

Geographic coordinates are `[longitude, latitude]` in degrees. Projected coordinates
are `[easting, northing]` in the specified linear units. Any trailing ordinates are
copied unchanged; heights and measures are not transformed. Non-finite x/y values,
invalid geographic latitudes, and singularities such as Mercator's poles throw errors.

## Current coverage

| Projection | Plugin | Parameters |
| --- | --- | --- |
| Geographic (`longlat`, `latlong`, `latlon`, `lonlat`) | Built into the core | Degrees only |
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
and parallels at the poles are rejected. `sterea` requires a non-polar origin;
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

Angles in PROJ parameters must be finite decimal degrees. False easting and northing
are in meters. Projected output units can be `m`, `km`, `ft`, or `us-ft`, or a positive
`to_meter` factor. `to_meter` overrides named units. Mercator's `lat_ts` overrides the
scale factor; `k_0` overrides `k`.

The default ellipsoid is WGS84. Geometry parameters include `ellps=WGS84`,
`ellps=sphere` (radius 6370997 meters), `a`, `b`, `rf`, and `R`. `b` overrides `rf`;
`R` selects a sphere. Dimensions must be valid even when overridden. A custom
non-WGS84 ellipsoid requires `datum=none` to explicitly opt out of datum shifts.
`eqc` uses the semi-major axis as its spherical radius, matching proj4js's formulation.

This first version converts through shared geographic longitude/latitude. It **does
not perform datum transformations**. It accepts `datum=WGS84` or `datum=none`, and
rejects other named datums, grid shifts, Helmert parameters, prime meridians, axis
changes, pipelines, WKT, and PROJJSON. Unknown or duplicate parameters throw instead
of being silently ignored. `no_defs` and `type=crs` are accepted as metadata.
Use `Proj4Projection` for definitions outside this subset; there is no implicit fallback.

## Custom plugins

A plugin declares its PROJ name and additional accepted parameters, optionally lists
value-free parameters in `flags`, then creates a
forward/inverse implementation. The engine supplies an immutable parameter map,
semi-major axis, and eccentricity squared. The plugin validates its own parameter
values and domain. Forward input and inverse output are longitude/latitude in radians;
forward output and inverse input are projected meters, including any false offsets.
The engine handles geographic degrees, output units, and trailing ordinates.

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
