# Discontinuous maps (experimental)

Project geographic points, lines, and polygons into a map with cuts. Import this API separately from scalar CRS transforms:

```
import {

  createAirOceanMap,

  createInterruptedSinusoidalMap

} from '@math.gl/geospatial/discontinuous';



const map = createInterruptedSinusoidalMap();

const point = map.projectPoint([-90, 30]); // {regionId, position: [x, y]}

const candidates = map.unprojectPoint(point!.position);

const lines = map.projectLine([[-70, 30], [-50, 30]]); // two lobe-local parts

const polygons = map.projectPolygon([

  [[-70, 20], [-50, 20], [-50, 40], [-70, 40]]

]);
```

Render every line part and every polygon independently. Connecting parts or triangulating across region boundaries reintroduces the bridges this API removes. Results retain `regionId` and matching `sourceCoordinates` for every output vertex.

## Presets[​](#presets "Direct link to Presets")

`createAirOceanMap({radius = 1})` provides 24 panels and the AirOcean cut arrangement. Its local maps are radial/gnomonic projections onto planar facets. It does **not** implement Gray-Fuller projection and is not equal-area. Topology and orientation come from the ISC-licensed d3-geo-polygon preset; placement and clipping are independently implemented. It is static and does not require a `HingeTree`.

`createInterruptedSinusoidalMap({radius = 1})` provides six lobes, with northern longitude breaks at -180, -60, 60, 180 degrees and southern breaks at -180, -100, 20, 180 degrees. The equatorial edges join continuously. This is an independent arrangement, not a named historical preset. Within each lobe, the local formula is `x = radius * (center + (longitude - center) * cos(latitude))`, `y = radius * latitude`, with angles in radians and longitude relative to the lobe.

Radius must be finite and positive. Output is in units of that radius; the default is unit-sphere coordinates. There is no ellipsoid or datum conversion.

## Custom regions[​](#custom-regions "Direct link to Custom regions")

```
import {DiscontinuousMap, type MapRegion} from '@math.gl/geospatial/discontinuous';



const region: MapRegion = {

  id: 'octant',

  boundary: [[0, 0], [90, 0], [0, 90]],

  interior: [45, 35],

  // Supply a continuous, one-to-one local projection and its inverse.

  project: lonLat => localForward(lonLat),

  unproject: xy => localInverse(xy), // return null when there is no inverse

  placement: [1, 0, 0, 1, 0, 0]

};

const map = new DiscontinuousMap([region]);
```

Boundaries are convex spherical polygons with minor great-circle edges. The interior point must be strictly inside. Repeating the closing vertex is optional. Shared edges must use matching vertices on both regions, including subdivisions. The affine placement `[a, b, c, d, tx, ty]` applies `x' = a*x + c*y + tx`, `y' = b*x + d*y + ty`. It must be finite and numerically invertible. Singularity is checked after normalizing the linear coefficients by their largest magnitude (determinant threshold `1e-14`), so uniform changes of output units do not affect acceptance. Definitions are snapshotted; callbacks must remain stable and valid on boundaries.

The source coordinate convention is `[longitude, latitude]` in degrees on a sphere. Longitude wraps; latitude must lie within \[-90, 90]. Heights are not accepted. Regions may overlap or leave gaps. Lookup currently scans all regions.

## Points and inverse lookup[​](#points-and-inverse-lookup "Direct link to Points and inverse lookup")

* `findRegions(lonLat): string[]` returns all containing regions, boundary-inclusive.
* `projectPoint(lonLat, regionId?): MapPoint | null` returns `{regionId, position}`. Without an explicit region, the first containing region owns a boundary point. Outside the selected domain, the result is `null`.
* `unprojectPoint(xy, regionId?): MapPoint[]` returns validated geographic candidates. It reverses placement and checks domain containment and forward residual. Gaps return `[]`; joins and overlaps may return multiple candidates.

A point on a cut can have two different map positions. Supply the region ID to select a side. Static inverse candidates do not establish visibility in an animated or overlapping rendering; the renderer must resolve depth.

`regions` exposes immutable definitions. `seams` pairs complete spherical boundary edges, with one relation per pair when overlapping/inset regions share the same edge, region IDs, zero-based edge indices, and `kind`: `join`, `cut`, or `boundary`. Join classification samples placed endpoints and midpoint; it is informational, not a mathematical continuity proof for custom callbacks. All geometry is split at every region boundary regardless of this classification.

## Lines[​](#lines "Direct link to Lines")

`projectLine(positions, options?)` returns `{regionId, coordinates, sourceCoordinates}[]`.

Edges mean minor great-circle arcs. They do not mean rhumb lines or linear longitude/latitude segments. Antipodal endpoints are ambiguous and throw; insert an intermediate point to choose a route. Separate exits and reentries stay separate. Exact boundary-coincident lines appear on both incident regions. Zero-length pieces and isolated tangencies are omitted.

## Polygons[​](#polygons "Direct link to Polygons")

`projectPolygon(rings, options?)` returns `{regionId, coordinates: rings, sourceCoordinates: rings}[]`. The first ring is an exterior; subsequent rings are holes. Input rings may be open or closed and use either winding. Output rings are closed, with counterclockwise exteriors and clockwise holes. A clipped hole may become an exterior indentation; a concave polygon can produce multiple polygons in the same region.

**Each polygon must fit within one open hemisphere.** An optional `chartCenter: [longitude, latitude]` selects its gnomonic clipping chart. The default is the mean direction of exterior vertices; if that choice fails, supply a center that contains every vertex or split the polygon. Whole-globe polygons and spherical complements are not supported. The API throws for an unsuitable chart, degenerate rings, nonfinite coordinates, and antipodal edges.

The planar reconstruction uses the MIT-licensed `polygon-clipping` library. Simple exteriors with contained holes are the intended input; the boolean kernel uses nonzero winding for self-intersections and clips holes extending outside the exterior. Rings with zero signed chart area are rejected using their own translated, normalized extent; there is no fixed minimum area. Geometry is not jittered to move it away from cuts. Calculations use floating-point tolerances, including `1e-10` for spherical half-space containment and `1e-6` for the chart's horizon margin.

Process separate features or MultiPolygon members in separate calls and attach their IDs to the returned parts. The first API does not copy arbitrary properties, interpolate attributes, produce triangle indices, or accept GeoJSON wrappers.

## Sampling[​](#sampling "Direct link to Sampling")

Both geometry methods accept:

| Option           | Default | Meaning                                                 |
| ---------------- | ------- | ------------------------------------------------------- |
| `maxAngularStep` | `2`     | Maximum sampled arc interval in degrees, in (0, 90]     |
| `tolerance`      | `1e-4`  | Adaptive midpoint chord-error target in placed XY units |

Sampling happens after clipping. The criterion is an approximation target, not a certified maximum error for arbitrary user projections. Recursion is limited to 20 levels and approximately one million samples per clipped edge; exceeding limits throws. Choose a suitable distance tolerance for large radii, for example `tolerance: 10` when output units are meters. The default targets unit-sphere maps.

See the [unfolding Earth example](https://visgl.github.io/math.gl/next/docs/modules/geometry/unfolding-earth.md) for the related hinge and texture demonstration. Static vector projection and animated panel rendering currently use separate pipelines.
