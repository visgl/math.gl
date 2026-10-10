# ProjectionAnalysis

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

The optional `@math.gl/projection/analysis` entry evaluates a single map projection inside an explicit application domain. It provides scales, convergence, distortion and coordinate derivatives without importing projection algorithms. Supply the same projection plugin and geometry used by your map.

```
import {normalizeCRS} from '@math.gl/projection/core';

import {mercator} from '@math.gl/projection/projections/merc';

import {ProjectionAnalysis, createProjectionFactors} from '@math.gl/projection/analysis';



const crs = normalizeCRS('+proj=merc +ellps=WGS84');

const analysis = new ProjectionAnalysis({

  projection: mercator,

  context: {...crs.ellipsoid, parameters: crs.parameters},

  domain: {west: -Math.PI, east: Math.PI, south: -1.4, north: 1.4}

});

const factors = createProjectionFactors(); // Allocate once and reuse.

if (analysis.factors(0.2, 0.6, factors)) {

  console.log(factors.parallelScale, factors.meridianConvergence);

}
```

All input angles, domain bounds and output angles use **radians**. Projection coordinates use the plugin's physical axis units, normally metres. The Jacobian uses physical output units per input radian. It does not include CRS angular/linear unit conversions, axis ordering, prime meridians, datum shifts, grids or deformation. For compound coordinate operations, these map factors alone do not describe the complete operation derivative.

## Domain and reusable coordinate outputs[​](#domain-and-reusable-coordinate-outputs "Direct link to Domain and reusable coordinate outputs")

`domain` is required: a closed rectangle with increasing west/east and south/north bounds. It is captured at construction. Rectangles do not cross the antimeridian; split such applications into separate regions. The [accuracy scorecard](https://visgl.github.io/math.gl/next/docs/modules/projection/accuracy-domains.md) supplies tested configurations and regions, not automatic global validity declarations.

`contains(longitude, latitude)` checks the declared rectangle and finite input. `projectTo(longitude, latitude, result)` and `unprojectTo(x, y, result)` also execute the plugin and validate the result. Both return `false` for a domain violation, plugin rejection or nonfinite coordinate. Forward and inverse write only `result.x` and `result.y`; existing Z remains untouched. An inverse result must lie inside the geographic rectangle. Failure leaves the reusable result untouched.

This is a single-projection mathematical interface; normal CRS transformations continue to use `Projection` or `ProjectionTransform`. Plugins must implement both mutable horizontal hooks. Pass a loaded plugin when using lazy descriptors.

## Jacobians and factors[​](#jacobians-and-factors "Direct link to Jacobians and factors")

`jacobian(longitude, latitude, result)` fills a caller-owned `ProjectionJacobian`, created with `createProjectionJacobian()`:

| Field                          | Meaning                             |
| ------------------------------ | ----------------------------------- |
| `dxDLongitude`, `dyDLongitude` | Partial derivatives along longitude |
| `dxDLatitude`, `dyDLatitude`   | Partial derivatives along latitude  |

`factors(longitude, latitude, result)` fills a caller-owned `ProjectionFactors`, created with `createProjectionFactors()`. It includes the Jacobian and:

| Field                              | Meaning                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `meridionalScale`, `parallelScale` | Projected length divided by the ellipsoid's local north/east distance                                |
| `arealScale`                       | Signed local area determinant; a negative value indicates reflected orientation                      |
| `meridianConvergence`              | Signed angle from projected north to the projected meridian, following PROJ's convergence convention |
| `meridianParallelAngle`            | Acute angle between the meridian and parallel, as reported by PROJ                                   |
| `angularDistortion`                | Maximum angular distortion of an infinitesimal circle                                                |
| `maximumScale`, `minimumScale`     | Principal scales of the local distortion ellipse                                                     |

The radius of curvature uses the supplied eccentricity and semi-major axis. For example, spherical Mercator's two length scales are `1 / cos(latitude)` at unit scale; an equal-area projection's area factor approaches one.

## Ground metric ellipsoid[​](#ground-metric-ellipsoid "Direct link to Ground metric ellipsoid")

`groundEllipsoid` optionally supplies `semiMajorAxis` and `eccentricitySquared` for the local ground-distance metric. It defaults to `context` geometry. It affects all factors derived from ground distances, including area, principal scales and angular distortion; forward/inverse coordinates and raw Jacobians continue to use the projection context. The ground semi-major axis must use the same physical units as the kernel output.

For example, spherical Web Mercator coordinates can be measured against WGS84 ground distances without changing the spherical kernel:

```
const webMercator = normalizeCRS('EPSG:3857');

const wgs84 = normalizeCRS('EPSG:4326');

const analysis = new ProjectionAnalysis({

  projection: mercator,

  context: {...webMercator.ellipsoid, parameters: webMercator.parameters},

  groundEllipsoid: wgs84.ellipsoid,

  domain: {west: -Math.PI, east: Math.PI, south: -1.4, north: 1.4}

});
```

This selects a metric, not a datum transformation. It does not add CRS unit conversions, axis normalization, grid shifts or vertical operations. Derivative agreement remains scaled by the projection context's semi-major axis, independently of the ground metric.

## Numerical and failure contracts[​](#numerical-and-failure-contracts "Direct link to Numerical and failure contracts")

Derivatives use fourth-order central differences at `step` and `step/2`, followed by Richardson extrapolation. The default step is `1e-4` radians; the complete stencil must fit inside the declared rectangle. The two estimates must agree within `derivativeTolerance * max(a, absolute half-step derivatives)`; the default tolerance is `1e-6`. This is an agreement test, not a universal derivative error estimate. There are sixteen forward samples per derivative evaluation.

Boundary stencils, poles, rank-deficient maps, plugin exceptions and unresolved estimates return `false` without changing the supplied output. Seams and piecewise knots should be excluded from the domain; stencil agreement cannot prove differentiability. Very large false offsets can lose small differences in binary64 arithmetic. Select a step appropriate to the application's scale and independently qualify it.

One mutable point and one derivative record are owned by each analysis instance. Successful calls create no coordinate arrays, point objects or callbacks. Recursive calls from a plugin fail while that scratch is in use. Values are captured before writing public output setters, so setters may safely invoke another analysis call. Application-owned throwing setters retain normal JavaScript behavior; they are not transactional storage.

The optional entry stays outside the root and `/core` bundles. Its independent checks include **450 PROJ 9.5.1 factor/derivative comparisons** across eighteen configurations, analytic spherical Mercator checks and domain, singularity, output ownership and reentry tests. This qualifies the sampled configurations; it does not claim analytical derivatives or full-domain projection accuracy. See [PROJ's factor definitions](https://proj.org/en/stable/development/reference/datatypes.html#projection-derivatives).

## Complete CRS transform analysis[​](#complete-crs-transform-analysis "Direct link to Complete CRS transform analysis")

The optional `@math.gl/projection/analysis/transform` entry exports `createProjectionTransformAnalysis`. It prepares a geographic-anchor-to-source transform and the requested source-to-target transform, then reuses the same numerical differentiation and factor calculations. Unlike single-kernel analysis, the sampled coordinates execute datum, prime-meridian, axis, unit, grid and vertical stages supported by the selected engine options.

```
import {createProjectionTransformAnalysis} from '@math.gl/projection/analysis/transform';

import {createProjectionFactors} from '@math.gl/projection/analysis';

import {universalTransverseMercator} from '@math.gl/projection/projections/utm';

import {mercator} from '@math.gl/projection/projections/merc';



const analysis = await createProjectionTransformAnalysis({

  from: 'EPSG:32610',

  to: 'EPSG:3857',

  geographicFrom: 'EPSG:4326',

  projections: [universalTransverseMercator, mercator],

  domain: {west: -2.2, east: -2.1, south: 0.6, north: 0.7}

});

const factors = createProjectionFactors();

analysis.factors(-2.15, 0.65, factors);
```

Options otherwise follow `ProjectionTransform.create`, with axis enforcement enabled. `geographicFrom` is required for a projected or geocentric source; for a geographic source it defaults to `from`. Inputs and bounds use canonical longitude/latitude radians relative to that reference's prime meridian. `height` is held fixed, defaults to zero, and is in meters in that reference's vertical CRS. Explicit grids and parsers must be supplied when required. Lossy horizontal-only pipelines reject rather than silently discard height.

The returned interface has `domain`, `contains`, `jacobian` and `factors`. Jacobians measure physical east/north meters per anchor radian, after normalizing target stored axes and units. Factors default to the anchor ellipsoid; `groundEllipsoid` selects a different physical ground metric. The adapter uses that metric for numerical derivative agreement as well. Source planar units are not treated as ground meters. This interface exposes no 2D coordinate inverse: datum and vertical stages can couple horizontal coordinates to height.

All loading finishes before the factory resolves; derivative methods are synchronous and reuse coordinate storage. Seams, knots and invalid grid regions must still be excluded from the application domain. Sampling agreement does not certify differentiability or accuracy. The separate entry keeps the original `/analysis`, `/core` and root imports unchanged.
