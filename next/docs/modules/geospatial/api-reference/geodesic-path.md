# GeodesicPath

A reusable shortest geodesic between two geographic endpoints, sampled by surface-distance fraction or distance. It adapts the existing GeographicLib-backed `EllipsoidGeodesic` line; it does not introduce a spherical or Vincenty fallback.

```
import {GeodesicPath} from '@math.gl/geospatial';



const path = new GeodesicPath([170, 20, 100], [-170, 40, 500]);

const midpoint = path.sample(0.5);

const halfway = path.sampleByDistance(path.length / 2);

const result = new Float64Array(3);

path.sample(0.25, result);
```

Also exported from `@math.gl/geospatial`. For adaptive sampling through a coordinate transform, use [subdivideGeodesicPolyline](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/subdivide-geodesic-polyline.md).

## Coordinates and construction[​](#coordinates-and-construction "Direct link to Coordinates and construction")

`new GeodesicPath(start, end, {geodesic?})`

Both endpoints must contain exactly two or three finite components in `[longitude, latitude, optional height]` order. Angles are **degrees** and latitude must be in \[-90, 90]. Dimensions must agree. Heights use the application's linear units and interpolate linearly by the surface-distance fraction; they do not affect the selected path or its length. No vertical datum conversion is performed.

`geodesic` optionally supplies an `EllipsoidGeodesic` instance with explicit sphere or revolution axes. It defaults to WGS84. Distance uses the solver axes' units, metres for WGS84. The solver's existing series/domain accuracy qualifications apply; accepting positive axes is not an arbitrary-flattening accuracy guarantee. Triaxial geodesics are unsupported.

Endpoints are copied at construction. `start` and `end` getters return independent arrays. `size` is 2 or 3. `length` is the shortest surface distance, excluding height.

## Sampling and ownership[​](#sampling-and-ownership "Direct link to Sampling and ownership")

* `sample(fraction, result?)` accepts a finite fraction in \[0, 1]. Halfway means half the surface distance, not half the longitude change or half the 3D chord.
* `sampleByDistance(distance, result?)` accepts a finite distance in \[0, `length`].
* Without `result`, either method returns a new number array. A supplied writable numeric array or typed array must have exactly `size` components; the same object is returned.
* Invalid parameters, unresolved/nonfinite solver output and float32 overflow throw `RangeError` before writing supplied coordinate storage. Output writes through application setters retain normal JavaScript behavior and are not transactional.

If the endpoints have zero horizontal distance, fractional samples hold the start's horizontal representation while interpolating height. Distance zero selects the start's height because a zero-length horizontal path has no distance-based height parameter.

## Longitude, poles and ambiguous paths[​](#longitude-poles-and-ambiguous-paths "Direct link to Longitude, poles and ambiguous paths")

Longitude is **unrolled relative to the start**. For example, an equatorial edge from 170° to -170° ends at 190°; the reverse starts at -170° and ends at -190°. Supplying an endpoint offset by 360° does not request an extra circuit. Each path selects a shortest endpoint geodesic. Exact antipodes and other nonunique cases use the underlying solver's deterministic choice; this API does not claim a unique geographic route in those cases.

Latitude/longitude representations can be discontinuous at poles even when the 3D path is continuous. Longitude at a pole follows the solver and supplied endpoint conventions. No seam clipping, domain selection, terrain following, rhumb-line interpretation or temporal continuity policy is inferred.

## Qualification[​](#qualification "Direct link to Qualification")

The path adapter has 180 stored fractional controls generated offline from pinned native PROJ 9.9.0 C sources, covering WGS84, a sphere and a mildly prolate shape, with dateline, polar, coincident and nearly/exactly antipodal paths. The fixture records upstream source hashes and its original generator. These comparisons share the underlying geodesic algorithm family; separate analytic sphere interpolation and distance checks provide independent mathematical controls. This evidence does not extend the solver's qualified shape domain.

For constant-bearing routes, use [RhumbPath](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/rhumb-path.md). For periodic map discontinuities, [split geographic seams](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/geographic-seams.md) before adaptive projection; unrolled longitude alone does not split a chart.
