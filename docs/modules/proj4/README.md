# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
</p>

The `@math.gl/proj4` module provides support for conversion between major geospatial coordinate reference systems (CRS) and projections used with computer maps, such as:

- [WGS84](https://en.wikipedia.org/wiki/World_Geodetic_System) (World Geodetic System) coordinates.
- [Web Mercator Projection](https://en.wikipedia.org/wiki/Web_Mercator_projection)

## Classes

| Class             | Description        |
| ----------------- | ------------------ |
| [`Projection`](./api-reference/proj4-projection.md) | TypeScript-backed wrapper with the full catalogue and classic-compatible API |
| `LazyProjection` (`/projections/lazy`) | Full descriptor catalogue; algorithms loaded automatically on demand |
| [`TypeScriptProjection`](./api-reference/typescript-projection.md) | Configurable TypeScript engine with explicit projection plugins |

The package root uses the TypeScript implementation. `Proj4Projection` is a deprecated
alias of `Projection`; both names share the same constructor and static registrations. Import the original
proj4js-backed `Proj4Projection` from `@math.gl/proj4/classic` when its behavior
is required. Both wrappers use the same constructor and static registration API.
Start with the [TypeScript engine guide](./typescript-engine.md) for plugin selection,
dynamic loading, measured bundle sizes, CRS readers, and typed-array transforms.
The [API reference](./api-reference/typescript-projection.md) lists supported
parameters, limitations, and custom plugin contracts.

The [TypeScript parity roadmap](./roadmap.md) defines staged implementation and
acceptance gates against the pinned upstream release. See the [support and migration
contract](./typescript-support.md) for the promoted API and compatibility boundaries.

## Usage

Reproject WGS84 coordinates to another CRS

```js
import {Projection} from '@math.gl/proj4';

const nad83Proj =
  '+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees';
const projection = new Projection({from: 'WGS84', to: nad83Proj});

const wgs84Position = [21, 78, 5000];
const reprojectedPosition = projection.project(wgs84Position);
```

## Geospatial Coordinate Systems

There are an infinite number of possible coordinate systems; therefore strict syntax is required to describe the parameters of any given CRS. Standard, proj4-independent definitions are provided by [`@math.gl/crs`](../crs/README.md). This module supports authority codes, PROJ strings, WKT1 and WKT2 strings, and a subset of PROJJSON objects.

PROJJSON is an OSGeo/PROJ specification designed as a lossless JSON encoding of OGC WKT2:2019 / ISO 19162:2019; it is not independently an OGC or ISO standard. `@math.gl/crs` models the full PROJJSON v0.7 CRS union, while proj4js 2.22.0 currently transforms `GeographicCRS`, `GeodeticCRS`, `ProjectedCRS`, and `BoundCRS` objects. `Proj4CRSDefinition` exposes that narrower, deeply readonly object subset at compile time. Mutable definitions remain assignable, and frozen definitions from `SpatialReference` can be passed directly to the compatibility utilities. Valid `CompoundCRS` and `VerticalCRS` objects can still be represented with `PROJJSONCRS`, but cannot be passed to `Proj4Projection` without explicit compatible conversion.

Within WKT there exists both OGC WKT and ESRI WKT syntax; both are generally supported though some more-obscure projection keywords may not be used. WKT definitions remain strings at this API boundary. Note that PROJ strings [can be slightly more accurate](https://github.com/proj4js/proj4js/issues/222) in some circumstances than WKT strings.

### Checking classic CRS compatibility

The classic-specific compatibility helpers move to `@math.gl/proj4/classic`.
For the configurable engine, use `checkTypeScriptCRSCompatibility` with the same
plugins/readers as construction.

Use `checkProj4CRSCompatibility` when CRS metadata may be broader than proj4js's executable CRS
model. The result distinguishes a definition that proj4js constructed successfully from one that is
unsupported or has not been checked. Metadata resolution or preservation does not imply that
coordinates have been transformed.

```js
import {checkProj4CRSCompatibility, toProj4CRSDefinition} from '@math.gl/proj4/classic';

const compatibility = checkProj4CRSCompatibility(crs);
if (compatibility.status === 'supported') {
  const proj4CRS = toProj4CRSDefinition(crs);
  // Constructing a Proj4Projection and calling project/unproject are separate steps.
}
```

Serialized WKT and PROJ strings are probed by default without transforming coordinates. Applications
can use `{serialized: 'unknown'}` when they do not want to probe, or `{serialized: 'accept'}` when
they intentionally defer validation to `Proj4Projection` construction. Unsupported PROJJSON object
types are reported with a reason such as `unsupported-crs-type`.

`toProj4CRSDefinition` is strict by default and never drops CRS components. An application that
intentionally needs only the horizontal part of a `CompoundCRS` can opt into the lossy behavior:

```js
const horizontalCRS = toProj4CRSDefinition(compoundCRS, {mode: 'horizontal'});
```

Horizontal extraction rejects compounds with no horizontal CRS or more than one eligible horizontal
CRS. It does not transform, convert, or preserve the discarded vertical or temporal coordinates.

There are thousands of named "EPSG" projections. This module only includes aliases for those in the section below by default. To use a different EPSG projection, you can use https://epsg.io. For example, https://epsg.io/4326 defines standard longitude-latitude coordinates and lists multiple projection definitions. Choose an `OGC WKT`, `ESRI WKT`, `PROJ.4`, or `PROJJSON` definition.

The epsg.io website also has a public API, e.g., for WGS 84: `https://epsg.io/?q=4326&format=json`

```json
{
  "status": "ok",
  "number_result": 1,
  "results": [
    {
      "code": "4326",
      "kind": "CRS-GEOGCRS",
      "bbox": [90.0, -180.0, -90.0, 180.0],
      "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]",
      "unit": "degree (supplier to define representation)",
      "proj4": "+proj=longlat +datum=WGS84 +no_defs",
      "name": "WGS 84",
      "area": "World.",
      "default_trans": 0,
      "trans": [],
      "accuracy": ""
    }
  ]
}
```

If you already know the EPSG identifier, you can make the API request even simpler by adding the desired extension to your url:

```
// https://epsg.io/4326.wkt
GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]
```

```
// https://epsg.io/4326.proj4
+proj=longlat +datum=WGS84 +no_defs
```

### Aliases

Note that Projection allows aliases to be defined and comes with the following pre-installed aliases.

| Coordinate system    | Aliases                                                          |
| -------------------- | ---------------------------------------------------------------- |
| Lat/lon, WGS84 datum | `EPSG:4326`, `WGS84`                                             |
| Lat/lon, NAD83 datum | `EPSG:4269`                                                      |
| Web mercator         | `EPSG:3857`, `EPSG:3785`, `GOOGLE`, `EPSG:900913`, `EPSG:102113` |
| WGS84 UTM north      | `EPSG:32601` through `EPSG:32660`                                |
| WGS84 UTM south      | `EPSG:32701` through `EPSG:32760`                                |
| WGS84 UPS north      | `EPSG:5041`                                                      |
| WGS84 UPS south      | `EPSG:5042`                                                      |

### References

- [OGC WKT-CRS Specification](http://docs.opengeospatial.org/is/18-010r7/18-010r7.html) standards documentation.
- [spatialreference.org](https://spatialreference.org/) a catalog of coordinate system references.
- [espg.io](https://epsg.io/) Lets the user look up the definition of a coordinate system.

E.g. [https://epsg.io/4326](https://epsg.io/4326) provides the definition of WGS84 in WKT-CRS format:

```
GEOGCS["WGS 84",
    DATUM["WGS_1984",
        SPHEROID["WGS 84",6378137,298.257223563,
            AUTHORITY["EPSG","7030"]],
        AUTHORITY["EPSG","6326"]],
    PRIMEM["Greenwich",0,
        AUTHORITY["EPSG","8901"]],
    UNIT["degree",0.0174532925199433,
        AUTHORITY["EPSG","9122"]],
    AUTHORITY["EPSG","4326"]]
```

For explicit unit, axis, datum and grid ordering, use the optional
[typed operation pipeline](./operation-pipelines.md).

## Attribution

The TypeScript engine combines original math.gl code with numerical kernels ported
from proj4js and PROJ. Source headers distinguish ports from inspired implementations
and retain upstream notices. The package includes third-party notices and license
files. The `classic` subpath wraps [`proj4js`](https://proj4js.org/).

Run the [live browser benchmarks](./benchmarks.md#live-benchmarks) to compare TypeScript
scalar and in-place transforms with classic proj4 on your own device. The benchmark
page also documents recorded results, construction costs and bundle budgets.

The [parity audit and correctness follow-up](./parity-audit.md) now pass 233 of 242
upstream coordinate fixtures, with all 11 audited silent mismatches fixed. The full
corpus runs continuously with nine intentional strict-input construction rejections. The TypeScript engine is now the default; full proj4js behavioral parity remains
outside the supported profile. See the audit and migration contract for exceptions.
