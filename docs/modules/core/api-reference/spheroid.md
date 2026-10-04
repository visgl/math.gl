# Spheroid conversions

The optional `@math.gl/core/spheroid` entry provides low-level conversions between
longitude/latitude/ellipsoidal height and Cartesian XYZ for spheres and oblate
spheroids. It is also used by geospatial and the projection engine. It imports no
vector classes, global configuration, CRS definitions or model data.

For CRS units, axes, datums, grids and epochs, use
[`ProjectionEngine`](../../projection/api-reference/projection-engine.md).
For three-radius geometry, surface normals and local frames, use
[`Ellipsoid`](../../geospatial/api-reference/ellipsoid.md).

```ts
import {spheroidToCartesian, cartesianToSpheroid} from '@math.gl/core/spheroid';

const a = 6378137;
const b = 6356752.314245179;
const es = 1 - (b / a) ** 2;
const shape = {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: es};
const point = {x: 0, y: 0, z: 100}; // Allocate once and reuse.

spheroidToCartesian(point, shape); // x/y are longitude/latitude radians.
cartesianToSpheroid(point, shape);
// point is now longitude radians, latitude radians, ellipsoidal height again.
```

## Functions

### spheroidToCartesian(point, geometry, result = point)

Reads longitude/latitude/height from `point.x/y/z` and writes Cartesian XYZ into
`result.x/y/z`. Angles are in radians; axes, height and
Cartesian coordinates use the same distance unit. Latitude is not wrapped or
restricted by this low-level function; the CRS adapter enforces its own domain.

### cartesianToSpheroid(point, geometry, result = point)

Reads Cartesian XYZ from `point.x/y/z` and writes longitude radians, latitude
radians and ellipsoidal height into `result.x/y/z`. The sphere inverse is analytic. The ordinary oblate path retains
30 Hannover updates; a surface/exterior fallback uses at most 96 safeguarded
updates. Very flat spheroids use the exterior fallback directly. An ordinary
failed iteration followed by fallback therefore has a maximum of 126 updates.
Exact poles use longitude zero.

Both functions return `true` on a finite double-precision result, or `false`
without writing when numeric inputs/intermediates are unsupported. They allocate
no coordinate arrays or objects. Numeric results are captured before calling any
application output setters, allowing recursive conversion calls.

`SpheroidGeometry` extends the shared two-axis parameters with
`eccentricitySquared`. Prepare it once with finite positive `semiMajorAxis = a`,
`semiMinorAxis = b`, `b <= a` and matching `eccentricitySquared = 1 - (b / a) ** 2`.
`SpheroidPoint` has writable numeric `x`, `y` and `z` fields. Reuse a plain scratch
point; the default result transforms it in place. A separate result leaves input
unchanged. Property/setter failures and custom destination storage conversion are
application responsibilities. The projection engine separately validates its
Float32/Float64 scalar and flat storage.

## Qualified domain and boundaries

Independent normal-support anchors cover axes of 10 units and Earth size,
`b/a` from 1 through 0.000001, surface and exterior points, both hemispheres,
cardinal directions, near/exact poles, and heights through six equatorial radii.
They use 1e-9 degree inverse-angle and 10 micrometre height tolerances. Forward
allowances account for angle roundoff amplified by extreme flattening; at Earth
size the most flattened near-pole cases permit about 2.6 millimetres.
These are sampled regression allowances, not a universal error bound.

Unique sphere/oblate interiors use the bounded nearest-footpoint solve. The shifted multiplier and compensated radius/axis arithmetic address deep interiors and extreme flattening. Equatorial points below the oblate evolute cusp have two equally near normals and reject; the center also rejects. All failures leave existing outputs untouched. Exterior points retain the Hannover path and safeguarded fallback.

Geospatial shares this cartographic inverse for sphere/oblate shapes, preserving its signed-zero pole longitude and `undefined` failure convention. Projection retains its near-axis longitude convention and throws on failure. Prolate/triaxial cartographic conversion and the separate geospatial `scaleToGeodeticSurface` method retain their own kernel, including its radial approximation.

The independent [interior qualification](../../projection/ellipsoid-qualification.md) covers 434 accuracy checks, including thin spheroids and both sides of the cusp. The 128-update interior bound is a convergence limit, not a global accuracy guarantee. Squared-axis/ratio underflow and other unrepresentable intermediates can reject.

## Attribution

The forward geocentric equations and Hannover inverse retain the existing
proj4js 2.22.0-derived arithmetic, MIT terms and SPDX attribution. The core
package includes its full `PROJ4-LICENSE.md`. The safeguarded exterior/interior inverses and compensated arithmetic,
reusable scratch adapters and independent anchors are original math.gl work.
