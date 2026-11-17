# EllipsoidGeodesicExact

`EllipsoidGeodesicExact` solves direct and inverse geodesics on oblate and prolate ellipsoids using elliptic-integral evaluations rather than a flattening series. It also creates reusable lines with distance and auxiliary-sphere arc sampling. Select it explicitly through its optional entry point:

```
import {EllipsoidGeodesicExact} from '@math.gl/geospatial';



const geodesic = new EllipsoidGeodesicExact({

  semiMajorAxis: 6378137,        // equatorial radius a

  semiMinorAxis: 6378137 / 2   // polar radius b; b > a is also supported

});

const route = geodesic.inverse(30, 20, -20, 150);

const line = geodesic.line(30, 20, route.azi1, {unrollLongitude: true});

const midpoint = line.position(route.s12 / 2);

const afterOneAuxiliaryCircuit = line.arcPosition(360);
```

Angles and azimuths are **degrees**, with latitude before longitude. Distances and reduced lengths use the axes' units; `surfaceArea` uses squared units. Results include `lat1`, `lon1`, `azi1`, `lat2`, `lon2`, `azi2`, `s12`, `a12`, `m12`, `M12` and `M21`, with the same field meanings as `EllipsoidGeodesic`. `{area: true}` additionally returns signed edge area `S12` in squared axis units. The axes and line options are snapshots. Returned results are independently owned.

## Choosing the solver[​](#choosing-the-solver "Direct link to Choosing the solver")

The existing `EllipsoidGeodesic` remains the series implementation and retains its existing behavior and qualification. The Exact class is separately imported; it does not change global prototypes or automatically replace that solver. Adaptive quadrature is more expensive than series evaluation and is intended for the wider shape domain. “Exact” identifies the elliptic formulation, not zero floating-point error or a claim about arbitrary shapes or path lengths.

## Methods[​](#methods "Direct link to Methods")

* `inverse(lat1, lon1, lat2, lon2, options?)`: a shortest-path candidate from the attributed bracketed inverse framework, checked and refined with direct endpoint residuals. At a cut locus, several equally short routes can exist; a returned bearing does not imply uniqueness.
* `direct(latitude, longitude, azimuth, distance, options?)`: a signed distance along the starting geodesic.
* `line(latitude, longitude, azimuth, options?)`: an immutable starting line. `position(distance)` and `arcPosition(arcDegrees)` evaluate from its start, independently of previous calls.
* `surfaceArea`: total ellipsoid area.
* `semiMajorAxis` / `semiMinorAxis`: read-only input geometry. These names mean equatorial/polar radius even when the polar radius is larger.

`unrollLongitude: true` preserves winding. Otherwise longitudes are normalized. Signed distances and arcs support backward sampling. The line profile covers `±720` auxiliary-sphere degrees; the distance limit is the corresponding two auxiliary circuits on that line. Out-of-profile or nonfinite inputs, failed quadrature and failed inverse convergence throw `RangeError`.

Axes must lie in `[1e-60, 1e60]`, with `0.25 ≤ b/a ≤ 4`. Input longitude magnitude is limited to `1e6` degrees. This is a declared, sampled profile, not certification of every binary64 input in that box. Arbitrarily long lines remain outside this profile. Existing series-area APIs keep their separate domains.

## Exact edge areas and polygons[​](#exact-edge-areas-and-polygons "Direct link to Exact edge areas and polygons")

Use `{area: true}` with `inverse`, `direct` or `line` to request `S12`, the signed area between the edge and the equator, closed by endpoint meridians. It is an algebraic edge contribution, not the area of an arbitrary polygon on its own. Area is omitted by default. At exact poles the endpoint longitude specifies the terminal meridian convention.

```
import {GeodesicPolygonExact} from '@math.gl/geospatial';

const polygon = new GeodesicPolygonExact({semiMajorAxis: 1, semiMinorAxis: 2});

polygon.addPoint(0, 0).addPoint(0, 10).addPoint(90, 0);

const {perimeter, area} = polygon.compute();
```

The accumulator supports `addPoint(latitude, longitude)`, signed `addEdge(azimuth, distance)`, `compute({reverse?, unsigned?})`, nonmutating `testPoint`/`testEdge`, `number` and `clear()`. Construction with `{polyline: true}` accumulates an open signed perimeter and omits area. It retains compensated sums, not vertices. Internal longitude labels are reduced modulo 720 degrees so generated edges preserve crossing parity without exhausting the external input limit. Point insertion selects the inverse solver’s shortest candidate; use direct edges for winding routes. `longitudeTurns` on point insertion is rejected when nonzero.

Counterclockwise algebraic area is positive by default; `reverse` flips its sign. Signed results lie in `(-surfaceArea/2, surfaceArea/2]`, unsigned results in `[0, surfaceArea)`. Self-intersections contribute algebraically. Tiny cancellation at zero can select either side of the unsigned modulo boundary. Multi-circuit edges retain the line’s existing two-auxiliary-circuit limit.

See [exact area qualification](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/geodesic-exact-area-qualification.md) for native and independent controls, existing tiny-area budgets and remaining conditioning limits. The smooth elliptic correction is integrated directly; its divided difference uses a derivative integral to avoid subtracting nearly equal values.

## Accuracy and sources[​](#accuracy-and-sources "Direct link to Accuracy and sources")

The [G8/G9 qualification](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/geodesic-g89-qualification.md) retains the existing physical/angle budgets and describes native controls, independent elliptic series, singular cases and a pinned-native inverse limitation.

The inverse-search framework and auxiliary-sphere/Jacobi/Cayley formulae credit [GeographicLib 2.7](https://github.com/geographiclib/geographiclib/tree/r2.7). Original math.gl adaptive quadrature evaluates the elliptic integrals; a bounded endpoint refinement prevents an accurate-looking bearing from hiding an inaccurate distance. SPDX credits and GeographicLib's MIT terms ship with the module. No runtime dependency or native compilation is added.
