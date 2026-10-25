# Triaxial geometry and geodesics

`TriaxialEllipsoid` supplies surface coordinate and direction conversions and
initial-value geodesic trajectories for three unequal axes. A geodesic is the
surface path whose acceleration has no tangential component. Unlike a revolution
ellipsoid, a triaxial surface has no single axis of rotational symmetry.

```ts
import {TriaxialEllipsoid} from '@math.gl/geospatial/triaxial';

const surface = new TriaxialEllipsoid({radii: [3, 2, 1]});
const start = surface.toCartesian(30, 40, 'geodetic');
const tangent = surface.directionToCartesian(start, 50);
const line = surface.line(start, tangent);
const {position, direction} = line.position(2);
const coordinates = surface.fromCartesian(position, 'parametric');
```

Axes, points and distances share units. Latitude, longitude and azimuth use
**degrees**, with latitude before longitude. Cartesian directions are unit
vectors tangent to the surface. The ellipsoid and line snapshot their inputs;
each line result owns its position/direction arrays. Calls evaluate from the
original start, so sampling order does not accumulate trajectory state.

## Surface coordinate systems

`toCartesian(latitude, longitude, system?)` and `fromCartesian(position, system?)`
support three explicitly different systems:

| System | What latitude/longitude describe |
| --- | --- |
| `geodetic` (default) | The outward ellipsoid normal. |
| `parametric` | The unit vector obtained by dividing each Cartesian component by its corresponding radius. |
| `geocentric` | The outward radial direction from the center. |

For a triaxial ellipsoid, even the longitudes can differ between these systems.
These conversions operate on the surface; they do not infer a height, datum or
CRS. The existing `Ellipsoid` APIs retain their separate nearest-point/height
contracts. Exact-pole longitude is canonicalized to zero. Jacobi ellipsoidal
charts, conformal coordinates and uniform surface sampling are separate work.

`directionToCartesian(position, azimuth)` maps a bearing to a unit tangent.
`directionFromCartesian(position, direction)` performs the inverse. Bearings turn
clockwise from coordinate north, the tangent along the constant-longitude
meridian toward increasing latitude. The three supported coordinate systems
share that geometric north. At a pole the Cartesian-only convention uses the
zero-longitude meridian. A supplied direction must be finite, nonzero and tangent;
its magnitude is normalized, including very large or subnormal inputs.

## Direct geodesics

`line(position, direction).position(distance)` integrates the constrained
Cartesian geodesic equation with adaptive, bounded Dormand–Prince steps. It
returns `{position, direction, distance}`. The direction is forward along the
original geodesic even when sampling a negative distance. `direct(position,
direction, distance)` is the equivalent one-shot operation.

The Cartesian formulation avoids a latitude/longitude chart singularity during
pole or umbilic crossings. Surface/tangency and unit-speed constraints are
restored at accepted steps. Independent checks additionally test the Joachimsthal
integral, which is **not** enforced by the integrator.

Axes are positive snapshots in `[1e-60,1e60]`, with minimum/maximum ratio at least
`0.25`. Axis ordering is not required. A trajectory is limited to signed distance
`2π × maximum radius`, with an explicit integration work limit. Non-surface
positions, non-tangent directions, nonfinite or out-of-profile inputs and failed
convergence throw `RangeError`; uncertain trajectories are not returned.

This is a **direct** solver. There is no global triaxial inverse, closest-route or
route-uniqueness guarantee. It does not add parallel transport, inertial dynamics,
terrain following or a renderer coordinate system.

## Qualification

The [G8/G9 matrix](./geodesic-g89-qualification.md) compares these original
Cartesian trajectories against GeographicLib 2.7's distinct Jacobi solution,
including equal-axis limits, three-axis shapes, signed distances and sampled
extreme scales. Independent sphere and principal-ellipse identities, speed,
surface and Joachimsthal checks supplement native comparisons.

No upstream triaxial implementation is copied or loaded at runtime, and no new
dependency or mandatory model data is required. The existing GeographicLib MIT
notices identify its role as the offline comparator.
