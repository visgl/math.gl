# Discontinuous map API

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The discontinuous map API, presets, and layout helpers are experimental and may change.

For a shared rendering pipeline across ordinary, interrupted, inset, and hinged maps, start with [MapEngine](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/map-engine.md) and its [rendering guide](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/map-engine.md). The factories below remain useful when only the lower-level static map is needed.

Project geographic points, lines, and polygons into a map with cuts. Import this API separately from scalar CRS transforms:

## Feature support[​](#feature-support "Direct link to Feature support")

A map-engine checklist for interrupted, inset, polyhedral and other multi-chart projections.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature                                               | math.gl support    | Notes                                                                                                                                                                                                                     |
| ----------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Point projection and inverse candidates               | ✅ Implemented     | Region-aware forward/inverse results retain chart identity; overlaps can produce multiple inverse candidates.                                                                                                             |
| Seam-aware lines and polygons                         | ✅ Implemented     | Supported clipping/sampling preserves region IDs and source-coordinate provenance; render each returned part separately.                                                                                                  |
| Interrupted, inset and polyhedral presets             | ✅ Implemented     | [Projection families](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md) include interrupted maps, Albers USA, polyhedral nets, quincuncial and star layouts. |
| Continuous spherical world-map formulas               | ✅ Implemented     | The catalogue exposes ordinary world projections through the same MapEngine contracts and documented parameter limits.                                                                                                    |
| Custom regions, layout and viewport fitting           | ✅ Implemented     | Explicit regions, fitted chart layouts and region-aware picking remain independent of a renderer.                                                                                                                         |
| Global spherical filled-side topology                 | ✅ Implemented     | [Global polygon adapters](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/global-geographic-cuts.md) support explicit directed fills within their chart/profile constraints.      |
| Reusable preparation and worker transport             | ✅ Implemented     | MapEngine preparation can be transported using the [task runtime](https://visgl.github.io/math.gl/next/docs/modules/core/tasks.md); same-version snapshots are not a durable file format.                    |
| Arbitrary invalid-polygon repair                      | ❌ Not implemented | Malformed topology and unsupported chart/edge configurations are rejected; this is not a universal geometry repair engine.                                                                                                |
| Ellipsoidal datum/epoch transformations               | ❌ Not implemented | These are spherical map/layout operations; use the separate [CRS projection engine](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection.md) for datum and epoch operations.              |
| Certified continuous error and arbitrary cut networks | ◐ Partial          | Sampling and cut adapters have explicit supported profiles; approximation targets do not certify every callback, seam network or singular boundary.                                                                       |

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

For the complete named preset list and regional configuration, see the [projection families and presets](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md).

## World maps[​](#world-maps "Direct link to World maps")

From v5.0 · Experimental

`createWorldMap(options)` and `MapEngine`'s `{type: 'world', projection, parameters?, centralMeridian?}` definition expose ordinary world formulas through the same point, inverse, line, polygon, layout and globe-transition pipeline. The lower-level factory also accepts `radius` (default 1); `MapDescription.radius` sets the engine's scale. Longitude/latitude and angular parameters are in degrees. Output has north-positive y. `WORLD_PROJECTIONS` is a frozen array of supported `WorldProjection` names.

```
const engine = new MapEngine({

  version: 1,

  id: 'bonne-45',

  definition: {type: 'world', projection: 'bonne', parameters: {parallel: 45}}

});
```

`WorldMapOptions`, `WorldProjection`, and `WorldProjectionParameters` describe these inputs. Unsupported parameter keys, non-finite values and invalid ranges throw. Default parameters follow d3-geo-projection 4.0.0. Bertin 1953 and Sinu-Mollweide include their native oblique aspects; `centralMeridian` shifts their geographic longitude. D3's pixel scale, screen-y reflection, translation and display center are presentation choices; use `fitViewport` instead.

The 64 names are:

* `aitoff`, `august`, `baker`, `bertin1953`, `boggs`, `bonne`, `bottomley`, `bromley`.
* `collignon`, `craster`, `cylindrical-equal-area`, `cylindrical-stereographic`.
* `eckert1` through `eckert6`, `eisenlohr`, `fahey`, `foucaut`, `foucaut-sinusoidal`.
* `gilbert`, `gringorten` (rectangular), `ginzburg4`, `ginzburg5`, `ginzburg6`, `ginzburg8`, `ginzburg9`, `hammer`, `hill`, `homolosine`, `hufnagel`, `hyperelliptical`, `kavrayskiy7`, `lagrange`, `larrivee`, `laskowski`, `loximuthal`, `miller`, `mollweide`.
* `mt-flat-polar-parabolic`, `mt-flat-polar-quartic`, `mt-flat-polar-sinusoidal`, `natural-earth2`, `nell-hammer`, `nicolosi`, `patterson`, `polyconic`, `quartic-authalic`, `rectangular-polyconic`, `robinson`, `sinu-mollweide`, `sinusoidal`, `times`.
* `van-der-grinten`, `van-der-grinten2`, `van-der-grinten3`, `van-der-grinten4`, `wagner`, `wagner4`, `wagner6`, `wagner7`, `winkel3`.

| Formula                                | Parameters (defaults)                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Bonne                                  | `parallel: 45`                                                                                       |
| Bottomley                              | `fraction: 0.5`                                                                                      |
| Cylindrical equal-area / stereographic | `parallel: 38.58` / `parallel: 0`; polar parallels are excluded                                      |
| Foucaut sinusoidal                     | `alpha: 0.5`                                                                                         |
| Hammer                                 | `coefficient: 2`, strictly greater than 1; use `quartic-authalic` for the infinite-coefficient limit |
| Hill                                   | `ratio: 1`                                                                                           |
| Hufnagel                               | `a: 1`, `b: 0`, `psiMax: 45`, `ratio: 2`                                                             |
| Hyperelliptical                        | `alpha: 0`, `k: 2.5`, `gamma: 1.183136`                                                              |
| Lagrange                               | `spacing: 0.5`, strictly less than 1                                                                 |
| Loximuthal                             | `parallel: 40`                                                                                       |
| Rectangular polyconic                  | `parallel: 0`, strictly between −90° and 90°                                                         |
| Wagner                                 | `poleline: 65`, `parallels: 60`, `inflation: 20`, `ratio: 200`                                       |

These formulas are spherical maps, not ellipsoidal CRS transforms. Their eight computational charts cover the globe and split geometry at the antimeridian. Continuous chart joins should not be rendered as outlines. Some formulas stretch a pole into an edge: incoming and outgoing meridians then have different limiting positions. Returned source coordinates retain that directional longitude; a renderer must use the returned geometry rather than collapsing all polar vertices together.

The numeric kernels are adapted from [D3's ISC-licensed sources](https://github.com/d3/d3-geo-projection/tree/v4.0.0/src); see the [provenance inventory](https://github.com/visgl/math.gl/blob/master/modules/geospatial/src/discontinuous/world-kernels/README.md). The [projection families and presets](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md) groups presets by geometry and coverage: continuous world maps, regional domains, interrupted lobes, segmented layouts, and polyhedral nets. It describes each family's configuration and limits.

## Presets[​](#presets "Direct link to Presets")

From v5.0 · Experimental

`createGoodeMap({radius = 1})` provides Goode's land-oriented homolosine layout: northern lobes centered at −100° and 30°, and southern lobes centered at −160°, −60°, 20°, and 140°. Northern interruptions are at −40°; southern interruptions are at −100°, −20°, and 80°, in addition to the antimeridian. The wide Eurasian lobe uses two convex charts with a continuous join at 30°. Use `{type: 'goode'}` with `MapEngine` for the same layout. The lobe parameters follow [D3's published homolosine definition](https://github.com/d3/d3-geo-projection/blob/main/src/interrupted/homolosine.js); the projection and clipping implementation are independent.

`createMyriahedralMap(options)` builds independently generated graticule or polyhedral nets with optional unfolding. See the [myriahedral API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/myriahedral.md) for presets, custom mesh/weight callbacks, and inverse-ambiguity handling.

`createAirOceanMap({radius = 1})` provides 24 panels and the AirOcean cut arrangement. Its local maps are radial/gnomonic projections onto planar facets. It does **not** implement Gray-Fuller projection and is not equal-area. Topology and orientation come from the ISC-licensed d3-geo-polygon preset; placement and clipping are independently implemented. It is static and does not require a `HingeTree`.

`createInterruptedSinusoidalMap({radius = 1})` provides six lobes, with northern longitude breaks at -180, -60, 60, 180 degrees and southern breaks at -180, -100, 20, 180 degrees. The equatorial edges join continuously. This is an independent arrangement, not a named historical preset. Within each lobe, the local formula is `x = radius * (center + (longitude - center) * cos(latitude))`, `y = radius * latitude`, with angles in radians and longitude relative to the lobe.

`createInterruptedMollweideMap({radius = 1})` and `createInterruptedHomolosineMap({radius = 1})` use the same six-lobe cut arrangement. Mollweide uses its equal-area elliptical formula; homolosine combines sinusoidal at low latitudes with Mollweide above approximately 40°44′, solving for matching horizontal scale and shifting the polar portions to meet continuously. These are independent layouts, **not the historical/PROJ IGH cut arrangement**. See [PROJ's homolosine description](https://proj.org/en/stable/operations/projections/igh.html) for the distinction between the local formula and its interruption layout.

### HEALPix, Gingery, and custom interruptions[​](#healpix-gingery-and-custom-interruptions "Direct link to HEALPix, Gingery, and custom interruptions")

From v5.0 · Experimental

* `createHealpixMap({radius = 1, centralMeridian = 0})`: spherical H=4, K=3 HEALPix. Options type: `HealpixMapOptions`.
* `createGingeryMap({radius = 1, centralMeridian = 0, lobes = 6, coreAngle = 30})`: equatorial Gingery star. Options type: `GingeryMapOptions`; `coreAngle` is in degrees and strictly between 0 and 90; `lobes` is an integer from 3 to 24.
* `createInterruptedMap({projection, lobes, radius = 1, centralMeridian = 0})`: configurable interruptions. `InterruptedMapOptions` uses an `InterruptedProjection` formula, optional `latitudes: {north: 0, south: 0}` (north in \[0, 90), south in (−90, 0]), and `InterruptedLobe` tuples in `north` and `south` arrays.

All return `DiscontinuousMap`. See the [MapEngine reference](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/map-engine.md#healpix-gingery-and-configurable-interruptions) for formulas, tuple validation, defaults, examples, limitations, and credits. These are also available in Ice Age Explorer, and HEALPix/Gingery appear in the inline segmented-map comparison.

### U.S. composite with insets[​](#us-composite-with-insets "Direct link to U.S. composite with insets")

```
import {createAlbersUsaMap} from '@math.gl/geospatial/discontinuous';

const usa = createAlbersUsaMap();

const anchorage = usa.projectPoint([-149.9, 61.2]); // regionId: 'alaska'

const honolulu = usa.projectPoint([-157.8, 21.3]); // regionId: 'hawaii'

const candidates = usa.unprojectPoint(honolulu!.position);
```

`createAlbersUsaMap({radius = 1, includeTerritories = false})` combines three spherical Albers equal-area projections. Alaska is scaled to 0.35 of the linear scale (0.1225 of the area scale); Hawaii retains the lower-48 scale. Insets use the familiar lower-left composition, with Alaska to the left of Hawaii and Y up. The composite as a whole therefore does not preserve relative area between states. Points outside all three geographic masks return `null`; inverse queries in gaps return no candidates. Lines and polygons use the same region clipping as other maps. Set `includeTerritories: true` to add insets for Puerto Rico, the U.S. Virgin Islands, Guam, the Northern Mariana Islands, and American Samoa. These five regions use independent spherical Albers projections and enlarged local scales so their island outlines remain visible. Frames are available as layout metadata but need not be drawn. The composite does not preserve area between the lower 48 and these islands. The [dedicated example](https://visgl.github.io/math.gl/next/examples/albers-usa) enables them and renders pinned, public-domain Natural Earth polygons. Minor outlying islands are not included.

| Region ID | Center   | Standard parallels | Offset         | Linear scale |
| --------- | -------- | ------------------ | -------------- | ------------ |
| `lower48` | -96, 38  | 29.5, 45.5         | 0, 0           | 1            |
| `alaska`  | -154, 60 | 55, 65             | -0.307, -0.201 | 0.35         |
| `hawaii`  | -157, 21 | 8, 18              | -0.15, -0.2    | 1            |

The lower-48 mask connects corners (-127, 20), (-65, 20), (-65, 51), and (-127, 51) with great-circle edges. Inset masks are constructed by inversely projecting the corners of these unit-radius XY boxes, then joining them with great-circle edges: Alaska `[-0.425, -0.234, -0.22, -0.12]`, Hawaii `[-0.215, -0.245, -0.1, -0.155]` (left, bottom, right, top). Their sides are therefore not exact projected straight lines.

The compact arrangement follows the convention illustrated by [D3's Albers USA composite](https://d3js.org/d3-geo/conic#geoAlbersUsa), but is an independent preset, **not D3 clip-extent compatibility**. Cropping focuses on the main islands and mainland Alaska; distant islands can fall outside the inset masks. Territories are opt-in. These masks include neighboring land and ocean: filter input features if only U.S. states should appear. Insets overlap the main map's ocean background in placed XY; draw them above it and use the visible region ID for picking. Use custom regions for full island coverage, different inset placements, or additional territories.

Radius must be finite and positive. Output is in units of that radius; the default is unit-sphere coordinates. There is no ellipsoid or datum conversion.

## Layout metadata and viewport fitting[​](#layout-metadata-and-viewport-fitting "Direct link to Layout metadata and viewport fitting")

Regions may supply `layout: {label, kind, parentId, relativeScale, drawOrder, frame}`. `kind` is `main`, `inset`, or `panel`. `relativeScale` is an explicitly declared linear scale relative to the parent; it is not inferred from arbitrary local projection formulas. `drawOrder` increases from back to front, with definition order breaking ties. `frame` is `[minX, minY, maxX, maxY]` in placed map units: it describes a visual frame, **not an additional clipping mask**. Metadata and frame arrays are snapshotted and frozen. Parent IDs must exist and form an acyclic hierarchy. Scale must be positive and finite, and frame bounds must increase.

```
import {createAlbersUsaMap, getMapLayout, fitMapLayout, pickMapLayout}

  from '@math.gl/geospatial/discontinuous';



const map = createAlbersUsaMap();

const layout = getMapLayout(map, {maxAngularStep: 1, tolerance: 1e-5});

const fit = fitMapLayout(layout, {

  width: 900, height: 600,

  padding: {left: 24, right: 24, top: 40, bottom: 24}

});

const honolulu = map.projectPoint([-157.8, 21.3])!;

const pixel = fit.project(honolulu.position);

const candidates = pickMapLayout(map, fit, pixel);
```

`getMapLayout` returns `{bounds, regions}`. Regions are sorted back-to-front and include IDs, labels (defaulting to IDs), kinds (default `panel`), parent IDs, optional relative scales, draw order (default `0`), canonical affine placements, projected `bounds`, optional frames, and sampled coverage `outlines`. Overall bounds include both coverage and visual frames. Bounds sample curved projected edges using the same criteria as `projectLine`; they are approximate, not analytic or guaranteed conservative bounds. Choose tolerance in your map's output units. Cache this result while the map is unchanged.

`fitMapLayout` returns a uniform `scale`, forward `project` and inverse `unproject` functions, fitted `bounds`, and fitted `regions`. Region bounds, frames, and outlines are now in viewport pixels; `placement` remains the canonical map-space transform. Each region also has a sequential `layer` index for rendering. Higher layers should cover lower layers. Use the same order for picking overlapping insets. `pickMapLayout(map, fit, pixel)` converts a viewport pixel to map space and returns inverse candidates in top-to-bottom layer order, each with a `layer`. It resolves layout overlap, but a renderer should still reject candidates hidden by its own feature geometry. See the [interactive Albers USA example](https://visgl.github.io/math.gl/next/examples/albers-usa) for a complete SVG rendering and pointer readout.

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

## Quincuncial and star factories[​](#quincuncial-and-star-factories "Direct link to Quincuncial and star factories")

From v5.0 · Experimental

`createPeirceQuincuncialMap(options?: QuincuncialMapOptions)` and `createBerghausMap(options?: BerghausMapOptions)` return `DiscontinuousMap` instances. Both accept `radius` (positive, default 1) and `centralMeridian` (finite degrees, default 0). Berghaus additionally accepts `lobes` (integer 3–24, default 5). The exported option types have the same defaults as the corresponding [MapEngine definitions](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/map-engine.md#quincuncial-and-star-definitions).

Use `MapEngine` when you also need serializable descriptions, fitting, picking, capabilities and transition planning. Consult the [support table](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md#supported-map-families) for the distinction between these presets and other quincuncial/star variants.

## Additional segmented-map factories[​](#additional-segmented-map-factories "Direct link to Additional segmented-map factories")

From v5.0 · Experimental

Each factory returns a `DiscontinuousMap` and accepts an optional positive `radius` (default 1). `MapEngine` is the recommended rendering entry point; these factories expose the lower-level map object.

| Factory                                    | Options type / extra options                                 |
| ------------------------------------------ | ------------------------------------------------------------ |
| `createGuyouMap`                           | `QuincuncialMapOptions`: finite `centralMeridian`, default 0 |
| `createGringortenQuincuncialMap`           | `QuincuncialMapOptions`: finite `centralMeridian`, default 0 |
| `createButterflyMap`                       | `PolyhedralMapOptions`: `radius` only                        |
| `createCollignonButterflyMap`              | `PolyhedralMapOptions`: `radius` only                        |
| `createWatermanMap`                        | `PolyhedralMapOptions`: `radius` only                        |
| `createGoodeOceanMap`                      | `{radius?: number}`                                          |
| `createInterruptedBoggsMap`                | `{radius?: number}`                                          |
| `createInterruptedSinuMollweideMap`        | `{radius?: number}`                                          |
| `createInterruptedQuarticAuthalicMap`      | `{radius?: number}`                                          |
| `createInterruptedMollweideHemispheresMap` | `{radius?: number}`                                          |

`PolyhedralMapOptions` is exported from `@math.gl/geospatial/discontinuous`. See the [MapEngine definitions](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/map-engine.md#additional-segmented-and-interrupted-definitions) for each preset's aspect, cuts, coordinate conventions, and limitations.

## Gray–Fuller, Petroff, and Snyder equal-area maps[​](#grayfuller-petroff-and-snyder-equal-area-maps "Direct link to Gray–Fuller, Petroff, and Snyder equal-area maps")

From v5.0 · Experimental

| Factory                       | Options                                                                | Result                                                                              |
| ----------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `createGrayFullerMap`         | `{radius?: number}`                                                    | Exact Gray–Fuller face equations on the 24-panel AirOcean arrangement               |
| `createPetroffMap`            | `QuincuncialMapOptions`: `{radius?: number, centralMeridian?: number}` | Petroff's polar equal-area square; north pole at center, south pole at four corners |
| `createIcosahedralSnyderMap`  | `SnyderMapOptions`: `{radius?: number}`                                | Spherical ISEA; 20 triangular faces, Snyder strip net                               |
| `createDodecahedralSnyderMap` | `SnyderMapOptions`: `{radius?: number}`                                | Spherical DSEA; 12 pentagonal faces, Snyder two-row net                             |

All return `DiscontinuousMap`, with region-aware forward/inverse points and seam-split lines and polygons. `radius` defaults to 1 and must be finite and positive. Petroff's `centralMeridian` defaults to 0 and must be finite, in degrees. `SnyderMapOptions` is exported from the same entry point.

See [MapEngine's reference](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/map-engine.md#grayfuller-petroff-and-snyder-maps) for definitions, aspects, units, numerical behavior, and implementation credits.
