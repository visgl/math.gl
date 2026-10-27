# subdivideGeodesicPolyline

Adaptively samples geographic geodesic edges through a supplied continuous transform. It
reuses [GeodesicPath](./geodesic-path.md) and the shared
[subdividePolyline](../../geometry/polygon/api-reference/subdivide-polyline.md) engine.

```typescript
import {Ellipsoid} from '@math.gl/geospatial';
import {subdivideGeodesicPolyline} from '@math.gl/geospatial';

const result = subdivideGeodesicPolyline([170, 20, 100, -170, 40, 500], {
  size: 3,
  targetSize: 3,
  transform: position => Ellipsoid.WGS84.cartographicToCartesian(Array.from(position)),
  tolerance: 10,             // ECEF metres for this transform
  maxSurfaceDistance: 50000  // surface metres; excludes height
});
```

Also exported from `@math.gl/geospatial`. No camera, renderer, CRS lookup or network access
is required. The transform may instead call a projection or map to application coordinates.

## Options

`subdivideGeodesicPolyline(input, options)` accepts packed longitude/latitude(/height) positions.

| Option | Default | Meaning |
| --- | --- | --- |
| `transform` | Required | Deterministic source-to-target function returning exactly `targetSize` finite components. Receives a fresh coordinate array. |
| `tolerance` | Required | Positive finite sampled Euclidean target error, including every target component, in the transform's output units. |
| `size` | `2` | Source dimension: 2 or 3. Angles are degrees; height is linear. |
| `targetSize` | `size` | Target dimension: 2 or 3. Select 3 for an ECEF transform of XY source data. |
| `geodesic` | WGS84 solver | Optional `EllipsoidGeodesic`; surface distances use its axis units. |
| `maxSurfaceDistance` | `Infinity` | Positive maximum surface-distance span of an output edge. Height is excluded. Can force refinement even where error probes see a straight target path. |
| `maxDepth` | `16` | Maximum bisection depth per original edge, 0 through 30. |
| `maxVertices` | `65536` | Positive integer output limit, including original vertices, at most `2^32 - 1`. |

Source positions must be finite and latitude must lie in [-90, 90]. Input storage remains
unchanged. Empty input yields empty buffers; a singleton is transformed once. Options and
transform rejection, malformed samples and exhausted limits throw instead of returning
partial geometry. Exceptions from caller callbacks propagate unchanged.

## Results and provenance

The result is `SubdividedPolyline`, with `Float64Array` source/target positions,
`Uint32Array` original edge indices and `Float64Array` original edge fractions. The first
vertex uses edge 0/fraction 0; each shared endpoint is emitted once and belongs to the
preceding edge at fraction 1.

Fractions measure **surface distance along the original geodesic**, even after recursive
subdivision. Heights interpolate by that fraction. Applications can use the same
`segmentIndices` and `segmentFractions` to interpolate original colors, timestamps and other
attributes. No index in these arrays refers to an intermediate recursive edge.

Source longitudes are unrolled across successive edges. A wrapped input can therefore
produce source longitudes outside [-180, 180]. An explicitly closed geographic path can
finish on another longitude sheet after circling the world; a periodic target transform
can still map it to the original physical endpoint. Closing XY values are not forced to
hide winding. Coincident surface positions retain the path's start representation.

## Error and domain contract

Each candidate output edge evaluates the **original source geodesic** at quarter, midpoint
and three-quarter fractions. The engine compares transformed samples with same-fraction
linear interpolation of its target endpoints. It bisects if any sampled deviation exceeds
`tolerance` or the surface-distance span exceeds `maxSurfaceDistance`.

This is a sampled criterion, not a certified maximum curve-error bound. It can miss narrow
oscillations or discontinuities in an arbitrary transform. A suitable surface-distance cap
provides additional sampling but does not prove a transform is continuous. The supplied
surface length is not terrain distance or the length of a varying-height 3D route.

Split projection seams and clip to valid domains before calling. Longitude unrolling is not
seam splitting. A transform that wraps longitudes can still introduce a discontinuity and
exhaust the depth/vertex limit; a pole-crossing geographic path may require a different
coordinate chart. An ECEF transform is useful for continuous globe paths. Use the [geographic seam splitters](./geographic-seams.md) for the declared periodic-meridian profile.
[RhumbPath and subdivideRhumbPolyline](./rhumb-path.md) provide constant-bearing sampling
without introducing another solver. Arbitrary interrupted-chart and projection-domain clipping remain separate.

Qualification includes native PROJ path controls, independent spherical dense-error and
surface-distance checks, multi-edge height/attribute provenance, dateline/polar/antipodal
cases, caller mutation isolation and resource-limit failures. No new universal geodesic,
projection-error, allocation-free or performance claim is made.
