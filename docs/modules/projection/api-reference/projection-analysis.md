---
slug: /modules/projection/projection-analysis
---

# ProjectionAnalysis

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

The optional `@math.gl/projection/analysis` entry evaluates a single map projection inside an explicit application domain. It provides scales, convergence, distortion and first and second coordinate derivatives without importing projection algorithms. Supply the same projection plugin and geometry used by your map.

```typescript
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

All input angles, domain bounds and output angles use **radians**. Projection coordinates use the plugin's physical axis units, normally metres. The Jacobian uses physical output units per input radian and the Hessian physical output units per input radian squared. Neither includes CRS angular/linear unit conversions, axis ordering, prime meridians, datum shifts, grids or deformation. For compound coordinate operations, these map factors and derivatives alone do not describe the complete operation derivative.

## Domain and reusable coordinate outputs

`domain` is required: a closed rectangle with increasing west/east and south/north bounds. It is captured at construction. Rectangles do not cross the antimeridian; split such applications into separate regions. The [accuracy scorecard](../accuracy-domains.md) supplies tested configurations and regions, not automatic global validity declarations.

`contains(longitude, latitude)` checks the declared rectangle and finite input. `projectTo(longitude, latitude, result)` and `unprojectTo(x, y, result)` also execute the plugin and validate the result. Both return `false` for a domain violation, plugin rejection or nonfinite coordinate. Forward and inverse write only `result.x` and `result.y`; existing Z remains untouched. An inverse result must lie inside the geographic rectangle. Failure leaves the reusable result untouched.

This is a single-projection mathematical interface; normal CRS transformations continue to use `Projection` or `ProjectionTransform`. Plugins must implement both mutable horizontal hooks. Pass a loaded plugin when using lazy descriptors.

## Jacobians, Hessians and factors

`jacobian(longitude, latitude, result)` fills a caller-owned `ProjectionJacobian`, created with `createProjectionJacobian()`:

| Field | Meaning |
| --- | --- |
| `dxDLongitude`, `dyDLongitude` | Partial derivatives along longitude |
| `dxDLatitude`, `dyDLatitude` | Partial derivatives along latitude |

`hessian(longitude, latitude, result)` fills a caller-owned `ProjectionHessian`, created with `createProjectionHessian()`, with the second partial derivatives of the projected coordinates:

| Field | Meaning |
| --- | --- |
| `d2xDLongitude2`, `d2yDLongitude2` | Second partial derivatives along longitude |
| `d2xDLongitudeDLatitude`, `d2yDLongitudeDLatitude` | Mixed partial derivatives; the order of differentiation does not matter for a smooth projection |
| `d2xDLatitude2`, `d2yDLatitude2` | Second partial derivatives along latitude |

Together with the Jacobian, the Hessian gives a second-order local approximation of the projection around a point (λ₀, φ₀). For offsets Δλ and Δφ in radians:

```text
x ≈ x₀ + dxDLongitude·Δλ + dxDLatitude·Δφ
       + ½·d2xDLongitude2·Δλ² + d2xDLongitudeDLatitude·Δλ·Δφ + ½·d2xDLatitude2·Δφ²
```

and likewise for `y`. The Hessian describes the curvature of the projection: how the Jacobian, and therefore scale, convergence and distortion, change across a region. It also supports second-order local analysis and Newton-style iteration of inverse problems. For example, spherical Mercator's only nonzero term is `d2yDLatitude2 = R·sin(φ)/cos²(φ)`. Like the Jacobian, these are sampled numerical derivatives; they do not certify approximation errors over a region.

`factors(longitude, latitude, result)` fills a caller-owned `ProjectionFactors`, created with `createProjectionFactors()`. It includes the Jacobian and:

| Field | Meaning |
| --- | --- |
| `meridionalScale`, `parallelScale` | Projected length divided by the ellipsoid's local north/east distance |
| `arealScale` | Signed local area determinant; a negative value indicates reflected orientation |
| `meridianConvergence` | Signed angle from projected north to the projected meridian, following PROJ's convergence convention |
| `meridianParallelAngle` | Acute angle between the meridian and parallel, as reported by PROJ |
| `angularDistortion` | Maximum angular distortion of an infinitesimal circle |
| `maximumScale`, `minimumScale` | Principal scales of the local distortion ellipse |

The radius of curvature uses the supplied eccentricity and semi-major axis. For example, spherical Mercator's two length scales are `1 / cos(latitude)` at unit scale; an equal-area projection's area factor approaches one.

## Numerical and failure contracts

Derivatives use fourth-order central differences at `step` and `step/2`, followed by Richardson extrapolation. The default step is `1e-4` radians; the complete stencil must fit inside the declared rectangle. The two estimates must agree within `derivativeTolerance * max(a, absolute half-step derivatives)`; the default tolerance is `1e-6`. This is an agreement test, not a universal derivative error estimate. There are sixteen forward samples per derivative evaluation.

Hessians use the same scheme with fourth-order second-difference stencils: five samples along one axis for each pure term, and the first-derivative stencil applied along both axes (sixteen samples) for the mixed term. There are fifty-two forward samples per Hessian evaluation. The step is the separate `hessianStep` option, default `1e-3` radians, so the stencil spans ±2e-3 radians and must also fit inside the declared rectangle. A second difference divides by the square of the step, so binary64 rounding in the projected coordinates is amplified far more than in a first difference. In the checked configurations, with coordinates up to about 10⁷ metres, Hessian errors are 0.01–0.04 m/rad² at the default step (about 10⁻⁹ to 10⁻⁸ of the largest term) but about 2 m/rad² at `1e-4`; the extrapolated truncation error at `1e-3` is negligible for smooth projections. The agreement test uses `derivativeTolerance` with the same bound.

Boundary stencils, poles, rank-deficient maps, plugin exceptions and unresolved estimates return `false` without changing the supplied output. Seams and piecewise knots should be excluded from the domain; stencil agreement cannot prove differentiability. Very large false offsets can lose small differences in binary64 arithmetic. Select a step appropriate to the application's scale and independently qualify it.

One mutable point and one derivative record are owned by each analysis instance. Successful calls create no coordinate arrays, point objects or callbacks. Recursive calls from a plugin fail while that scratch is in use. Values are captured before writing public output setters, so setters may safely invoke another analysis call. Application-owned throwing setters retain normal JavaScript behavior; they are not transactional storage.

The optional entry stays outside the root and `/core` bundles. Its independent checks include **450 PROJ 9.5.1 factor/derivative comparisons** across eighteen configurations, analytic spherical Mercator checks and domain, singularity, output ownership and reentry tests. Hessians are checked against closed-form second derivatives for spherical Mercator, equidistant cylindrical and sinusoidal projections, and against finite differences of `jacobian()` for northern and southern UTM, Albers equal-area and ellipsoidal sinusoidal projections. This qualifies the sampled configurations; it does not claim analytical derivatives or full-domain projection accuracy. See [PROJ's factor definitions](https://proj.org/en/stable/development/reference/datatypes.html#projection-derivatives).
