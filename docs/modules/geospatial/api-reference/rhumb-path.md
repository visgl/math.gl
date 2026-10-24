# RhumbPath and subdivideRhumbPolyline

A rhumb path maintains a constant compass bearing. It generally travels farther
than a shortest geodesic. `RhumbPath` adapts the existing
[ellipsoidal rhumb solver](./ellipsoid-rhumb.md) to the same surface-distance
sampling interface as [GeodesicPath](./geodesic-path.md).

```ts
import {RhumbPath} from '@math.gl/geospatial/ellipsoid';
import {subdivideRhumbPolyline} from '@math.gl/geospatial/globe';

const route = new RhumbPath([170, 30, 10], [-170, 30, 30]);
const halfway = route.sample(0.5); // [180, 30, 20]
const reusableOutput = new Float64Array(3);
route.sampleByDistance(route.length / 2, reusableOutput);

const sampled = subdivideRhumbPolyline([170, 30, -170, 30], {
  transform: ([longitude, latitude]) => [longitude, latitude],
  tolerance: 0.01,
  maxSurfaceDistance: 100000
});
```

## Coordinates, winding and ownership

Positions are `[longitude, latitude]` or `[longitude, latitude, height]` in explicit
degrees, independent of global configuration. Default axes are WGS84; supply an
`EllipsoidRhumb` through `rhumb` to use another supported revolution ellipsoid.
Distance and height use the supplied axis units. Height interpolates linearly in
surface-distance fraction and is excluded from `length`.

The default uses the shortest longitude difference. `longitudeTurns` adds an
integer number of whole turns to that interval. Alternatively,
`longitudeMode: 'unrolled'` preserves the supplied endpoint interval, including
full-world edges such as `[-180, 30]` to `[180, 30]`. Do not combine unrolled mode
with explicit turns. A 180-degree tie follows the sign of the input difference.

`start` and `end` return copies; the constructor snapshots input coordinates and
options. The ending longitude is unrolled relative to the start. Fractions must
be in `[0,1]` and distances in `[0,length]`; extrapolation is rejected. For a
zero-length horizontal path, `sample` still interpolates height, while
`sampleByDistance(0)` selects the start height.

Caller outputs must be number arrays, `Float32Array`, or `Float64Array`, with the
matching dimension. Invalid requests and nonfinite/unrepresentable output fail
before writes. Float32 results have Float32 rounding; no float64 accuracy claim
applies to that storage. Exact poles propagate `RhumbDomainError`, preserving the
scalar solver's pole policy.

## Adaptive subdivision

`subdivideRhumbPolyline` accepts the existing generic subdivision options,
including `transform`, `tolerance`, `size`, `targetSize`, `maxDepth` and
`maxVertices`. `maxSurfaceDistance` bounds each emitted edge's surface distance.
`longitudeTurns`, when supplied, contains one integer per original input edge;
`longitudeMode: 'unrolled'` instead preserves each supplied interval.

The result has `sourcePositions`, transformed `positions`, `segmentIndices` and
`segmentFractions`, just like the geodesic adapter. Longitudes remain unrolled
across successive edges, and fractions refer to original edges. The tolerance is
checked at quarter/mid/three-quarter samples; it is not a certified maximum error
for arbitrary transforms. Discontinuities and exhausted limits throw atomically.

Split [longitude seams](./geographic-seams.md) before adaptive projection. When
resampling a continuous rhumb seam fragment, use `longitudeMode: 'unrolled'` so a
full-width interval retains its winding. Keep the returned original-edge
provenance when composing fragment-local subdivision fractions.

## Qualification

The original offline driver produces 100 stored GeographicLib C++ 2.7 path
samples spanning sphere, oblate and prolate axes. Independent sphere tests use
constant-bearing isometric-latitude equations, parallel circumference and
meridian distance. Tests also cover winding, height, ownership, output failure,
source provenance and work/depth limits. Existing G5 accuracy ceilings remain in
force. The shared [seam qualification](./geographic-seams.md)
matrix runs the stored native adapter controls in Node, Chromium, Firefox and
WebKit. Native generation remains offline; ordinary CI verifies stored provenance.

The adapter is original MIT math.gl code. Existing GeographicLib acknowledgements
and packaged licenses remain with the underlying solver. No dependency is added.
