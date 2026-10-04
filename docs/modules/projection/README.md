# Overview

`@math.gl/projection` converts coordinates between geographic, projected and
geocentric coordinate reference systems. Use it for map coordinates, in-place
coordinate buffers, explicit datum transformations and coordinate propagation
between epochs.

```typescript
import {Projection} from '@math.gl/projection';

const projection = new Projection({from: 'EPSG:4326', to: 'EPSG:3857'});
const meters = projection.project([12, 55]);
const longitudeLatitude = projection.unproject(meters);

const positions = new Float64Array([12, 55, 13, 56]);
projection.projectFlat(positions, 2); // transforms the same buffer
```

Geographic arrays normally use longitude, latitude, then optional height.
Projected arrays use easting, northing, then optional height. A fourth component
is a measure and is preserved; time is supplied separately when using an explicit
operation pipeline.

## Learn about projections

Start with [coordinate systems, ellipsoids, datums and epochs](./coordinate-systems.md)
for the concepts behind a transformation. The [projection catalogue](./projections.md)
explains the built-in algorithms, their distortion tradeoffs and their sphere or
ellipsoid support. It includes examples for regional, global and polar maps.

| Guide | What you will learn |
| --- | --- |
| [Projection engine](./projection-engine.md) | Select plugins, load algorithms on demand, transform typed arrays and control bundle size |
| [Coordinate systems](./coordinate-systems.md) | Distinguish projection, ellipsoid, datum, height and coordinate epoch |
| [Projection catalogue](./projections.md) | Choose an algorithm and understand its useful domain |
| [Reusable coordinate buffers](./bulk-layouts.md) | Transform separate, strided and column buffers with reusable scratch and explicit ownership |
| [Operation pipelines](./operation-pipelines.md) | Order units, axes, projections, datum shifts and time-dependent operations explicitly |
| [Operation selection](./operation-selection.md) | Select application-reviewed operations by area, epoch, accuracy and prepared grids |
| [Deformation models](./deformation-models.md) | Propagate coordinates between epochs with prepared velocity grids |
| [Support and migration](./support.md) | Understand accepted definitions and differences from proj4js |
| [Benchmarks](./benchmarks.md#live-benchmarks) | Compare math.gl flat and scalar transforms with proj4js in your browser |
| [Independent validation](./independent-validation.md) | Inspect numerical references and qualification limits |

## Choose an API

| API | Use it when |
| --- | --- |
| [`Projection`](./api-reference/projection.md) | You want a ready-to-use converter with all built-in algorithms and WKT/PROJJSON readers |
| [`ProjectionEngine`](./api-reference/projection-engine.md) | You want an explicit list of plugins, readers and grids for a smaller bundle |
| `LazyProjection` (`/projections/lazy`) | You want built-in algorithms to load automatically when requested |
| `ProjectionPipeline` (`/pipeline`) | You need explicit operation order or coordinate epochs |
| `OperationCatalog` (`/operations`) | You need to select among application-reviewed transformations |

The package root exports the convenience class and configurable engine. `/core`
contains the engine without the catalogue. `/projections/<id>` contains an
individual algorithm; `/projections/lazy/<id>` contains its deferred descriptor.
Readers, grids, pipelines, operation selection and deformation models have optional subpaths. See the
[entry-point reference](./projection-engine.md#public-subpaths).

[`@math.gl/crs`](../crs/README.md) provides CRS definitions, syntax readers and spatial
reference metadata. This module executes supported coordinate operations. Reading
a CRS definition successfully does not establish that its coordinates can be
transformed: use `checkProjectionCompatibility` with the same plugins and readers
as construction, then verify your coordinate domain and grid coverage.

### Named coordinate systems

These definitions are built in. Selective engines still require the corresponding
projection algorithm; an alias does not load it.

| Coordinate system | Aliases | Algorithm |
| --- | --- | --- |
| WGS84 longitude/latitude | `EPSG:4326`, `WGS84` | Core geographic coordinates |
| NAD83 longitude/latitude | `EPSG:4269` | Core geographic coordinates |
| WGS84 longitude/latitude/ellipsoidal height | `EPSG:4979` | Core geographic coordinates |
| WGS84 geocentric | `EPSG:4978` | `geocentric` |
| Web Mercator | `EPSG:3857`, `EPSG:3785`, `GOOGLE`, `EPSG:900913`, `EPSG:102113` | `mercator` |
| WGS84 UTM north | `EPSG:32601` through `EPSG:32660` | `universalTransverseMercator` |
| WGS84 UTM south | `EPSG:32701` through `EPSG:32760` | `universalTransverseMercator` |
| WGS84 UPS north/south | `EPSG:5041`, `EPSG:5042` | `stereographic` |

There is no automatic EPSG database lookup or network access. Supply other named
definitions through aliases or pass an explicit PROJ string, WKT or supported
PROJJSON object. A CRS identifier describes much more than a projection algorithm;
check its datum, units, axes and area of use.

## Migration from @math.gl/proj4

The v5 alpha package is renamed to `@math.gl/projection`. Update the dependency
name and import prefix, and use `Projection` instead of the removed
`Proj4Projection` alias. The `/classic` wrapper and its proj4js-specific CRS helpers
are removed. Applications needing proj4js behavior can install and import `proj4`
directly. The math.gl package has no runtime dependency on proj4js.

## Attribution

The math.gl projection engine is **derived from proj4js, with an independently
designed modular runtime and additional coordinate operations**. Many numerical
kernels, shared mathematical helpers and datum equations are direct ports or
adaptations of [proj4js](https://proj4js.org/). Selected algorithms and numerical
corrections also draw on [PROJ](https://proj.org/). These contributions are an
important part of the implementation; the engine is not a clean-room rewrite.

The plugin architecture, execution and loading system, bulk coordinate APIs and
much of the newer pipeline and epoch functionality are original math.gl work.
Source headers distinguish direct ports, adaptations and implementations inspired
by upstream work. Distributed license files and
[third-party notices](https://github.com/visgl/math.gl/blob/master/modules/projection/THIRD-PARTY-NOTICES.md)
retain the applicable upstream credits and terms. Engine source headers use
`SPDX-License-Identifier` for licenses, `SPDX-FileCopyrightText` for copyright
holders and `SPDX-FileComment` for provenance and modifications. Equal Earth
retains its Apache-2.0 license and original authorship. Removing the proj4js runtime
dependency does not remove attribution for derived code. The shared spheroid
arithmetic in `@math.gl/core/spheroid` retains the existing proj4js MIT attribution
and full notice in the core package. Geospatial's retained three-radius/interior
kernels preserve their CesiumJS/Apache-2.0 provenance.

The implementation has diverged through selective imports, deferred algorithms,
in-place buffers and additional explicit operations. Performance advantages depend
on the workload; numerical improvements and supported features are qualified
individually. This is not a claim of unrestricted proj4js or PROJ parity. See the
[parity audit](./parity-audit.md), [independent validation](./independent-validation.md)
and [roadmap](./roadmap.md) for the measured scope and remaining work.
