# Discontinuous maps (experimental)

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The discontinuous map API, presets, and layout helpers are experimental and may change.

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

For concepts, rendering patterns, and the Ice Age Explorer integration, see the [discontinuous projections guide](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md).

## Presets[​](#presets "Direct link to Presets")

`createMyriahedralMap(options)` builds independently generated graticule or polyhedral nets with optional unfolding. See the [myriahedral API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/myriahedral.md) for presets, custom mesh/weight callbacks, and inverse-ambiguity handling.

`createAirOceanMap({radius = 1})` provides 24 panels and the AirOcean cut arrangement. Its local maps are radial/gnomonic projections onto planar facets. It does **not** implement Gray-Fuller projection and is not equal-area. Topology and orientation come from the ISC-licensed d3-geo-polygon preset; placement and clipping are independently implemented. It is static and does not require a `HingeTree`.

`createInterruptedSinusoidalMap({radius = 1})` provides six lobes, with northern longitude breaks at -180, -60, 60, 180 degrees and southern breaks at -180, -100, 20, 180 degrees. The equatorial edges join continuously. This is an independent arrangement, not a named historical preset. Within each lobe, the local formula is `x = radius * (center + (longitude - center) * cos(latitude))`, `y = radius * latitude`, with angles in radians and longitude relative to the lobe.

`createInterruptedMollweideMap({radius = 1})` and `createInterruptedHomolosineMap({radius = 1})` use the same six-lobe cut arrangement. Mollweide uses its equal-area elliptical formula; homolosine combines sinusoidal at low latitudes with Mollweide above approximately 40°44′, solving for matching horizontal scale and shifting the polar portions to meet continuously. These are independent layouts, **not the historical/PROJ IGH cut arrangement**. See [PROJ's homolosine description](https://proj.org/en/stable/operations/projections/igh.html) for the distinction between the local formula and its interruption layout.

### U.S. composite with insets[​](#us-composite-with-insets "Direct link to U.S. composite with insets")

```
import {createAlbersUsaMap} from '@math.gl/geospatial/discontinuous';

const usa = createAlbersUsaMap();

const anchorage = usa.projectPoint([-149.9, 61.2]); // regionId: 'alaska'

const honolulu = usa.projectPoint([-157.8, 21.3]); // regionId: 'hawaii'

const candidates = usa.unprojectPoint(honolulu!.position);
```

`createAlbersUsaMap({radius = 1})` combines three spherical Albers equal-area projections. Alaska is scaled to 0.35 of the linear scale (0.1225 of the area scale); Hawaii retains the lower-48 scale. Insets use the familiar lower-left composition, with Alaska to the left of Hawaii and Y up. The composite as a whole therefore does not preserve relative area between states. Points outside all three geographic masks return `null`; inverse queries in gaps return no candidates. Lines and polygons use the same region clipping as other maps.

| Region ID | Center   | Standard parallels | Offset         | Linear scale |
| --------- | -------- | ------------------ | -------------- | ------------ |
| `lower48` | -96, 38  | 29.5, 45.5         | 0, 0           | 1            |
| `alaska`  | -154, 60 | 55, 65             | -0.307, -0.201 | 0.35         |
| `hawaii`  | -157, 21 | 8, 18              | -0.15, -0.2    | 1            |

The lower-48 mask connects corners (-127, 20), (-65, 20), (-65, 51), and (-127, 51) with great-circle edges. Inset masks are constructed by inversely projecting the corners of these unit-radius XY boxes, then joining them with great-circle edges: Alaska `[-0.425, -0.234, -0.22, -0.12]`, Hawaii `[-0.215, -0.245, -0.1, -0.155]` (left, bottom, right, top). Their sides are therefore not exact projected straight lines.

The compact arrangement follows the convention illustrated by [D3's Albers USA composite](https://d3js.org/d3-geo/conic#geoAlbersUsa), but is an independent preset, **not D3 clip-extent compatibility**. Cropping focuses on the main islands and mainland Alaska; distant islands can fall outside the inset masks. Territories such as Puerto Rico are not included. These masks include neighboring land and ocean: filter input features if only U.S. states should appear. Insets overlap the main map's ocean background in placed XY; draw them above it and use the visible region ID for picking. Use custom regions for full island coverage, different inset placements, or additional territories.

Radius must be finite and positive. Output is in units of that radius; the default is unit-sphere coordinates. There is no ellipsoid or datum conversion.

## Layout metadata and viewport fitting[​](#layout-metadata-and-viewport-fitting "Direct link to Layout metadata and viewport fitting")

Regions may supply `layout: {label, kind, parentId, relativeScale, drawOrder, frame}`. `kind` is `main`, `inset`, or `panel`. `relativeScale` is an explicitly declared linear scale relative to the parent; it is not inferred from arbitrary local projection formulas. `drawOrder` increases from back to front, with definition order breaking ties. `frame` is `[minX, minY, maxX, maxY]` in placed map units: it describes a visual frame, **not an additional clipping mask**. Metadata and frame arrays are snapshotted and frozen. Parent IDs must exist and form an acyclic hierarchy. Scale must be positive and finite, and frame bounds must increase.

```
import {createAlbersUsaMap, getMapLayout, fitMapLayout}

  from '@math.gl/geospatial/discontinuous';



const map = createAlbersUsaMap();

const layout = getMapLayout(map, {maxAngularStep: 1, tolerance: 1e-5});

const fit = fitMapLayout(layout, {

  width: 900, height: 600,

  padding: {left: 24, right: 24, top: 40, bottom: 24}

});

const honolulu = map.projectPoint([-157.8, 21.3])!;

const pixel = fit.project(honolulu.position);

const candidates = map.unprojectPoint(fit.unproject(pixel), honolulu.regionId);
```

`getMapLayout` returns `{bounds, regions}`. Regions are sorted back-to-front and include IDs, labels (defaulting to IDs), kinds (default `panel`), parent IDs, optional relative scales, draw order (default `0`), canonical affine placements, projected `bounds`, optional frames, and sampled coverage `outlines`. Overall bounds include both coverage and visual frames. Bounds sample curved projected edges using the same criteria as `projectLine`; they are approximate, not analytic or guaranteed conservative bounds. Choose tolerance in your map's output units. Cache this result while the map is unchanged.

`fitMapLayout` returns a uniform `scale`, forward `project` and inverse `unproject` functions, fitted `bounds`, and fitted `regions`. Region bounds, frames, and outlines are now in viewport pixels; `placement` remains the canonical map-space transform. Each region also has a sequential `layer` index for rendering. Higher layers should cover lower layers. Use the same order for picking overlapping insets.

The default viewport origin is top left, with Y down; `flipY: false` selects bottom left with Y up. Padding is in pixels and may be a uniform number or a per-side object (omitted sides default to zero). The helper centers the map in the remaining rectangle and preserves all inset scale ratios and gaps. It does not independently reflow insets, enlarge small islands, or convert pixel gaps into new geographic coverage. Viewport dimensions must be finite and positive, padding finite and nonnegative, and usable width and height positive.

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

Convex single rings use direct half-space clipping. Tangent numerical slivers smaller than 64 machine epsilons relative to the source chart area are omitted. Concave rings and holes use the MIT-licensed `polygon-clipping` library for planar reconstruction. Simple exteriors with contained holes are the intended input; the boolean kernel uses nonzero winding for self-intersections and clips holes extending outside the exterior. Rings with zero signed chart area are rejected using their own translated, normalized extent; there is no fixed minimum area. Geometry is not jittered to move it away from cuts. Calculations use floating-point tolerances, including `1e-10` for spherical half-space containment and `1e-6` for the chart's horizon margin.

Process separate features or MultiPolygon members in separate calls and attach their IDs to the returned parts. The first API does not copy arbitrary properties, interpolate attributes, produce triangle indices, or accept GeoJSON wrappers.

## Sampling[​](#sampling "Direct link to Sampling")

Both geometry methods accept:

| Option           | Default | Meaning                                                 |
| ---------------- | ------- | ------------------------------------------------------- |
| `maxAngularStep` | `2`     | Maximum sampled arc interval in degrees, in (0, 90]     |
| `tolerance`      | `1e-4`  | Adaptive midpoint chord-error target in placed XY units |

Sampling happens after clipping. The criterion is an approximation target, not a certified maximum error for arbitrary user projections. Recursion is limited to 20 levels and approximately one million samples per clipped edge; exceeding limits throws. Choose a suitable distance tolerance for large radii, for example `tolerance: 10` when output units are meters. The default targets unit-sphere maps.

See the [unfolding Earth example](https://visgl.github.io/math.gl/next/docs/modules/geometry/unfolding-earth.md) for the related hinge and texture demonstration. Static vector projection and animated panel rendering currently use separate pipelines.
