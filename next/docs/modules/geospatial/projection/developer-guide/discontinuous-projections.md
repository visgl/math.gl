# Discontinuous maps

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

A discontinuous map places neighboring parts of the Earth in separate parts of a plane. A line that crosses a cut must end on one side and resume on the other; a polygon must become separate, closed pieces. Projecting only the original vertices does not produce a correct map: the renderer may draw a line or triangle across the empty space between pieces.

<!-- -->

The interactive Albers USA map shows this with Alaska, Hawaii, and five U.S. territory insets. Move over a region to inspect its coordinates, or use **View globe** to see its features unfold into the composite map. The mouse wheel and zoom buttons magnify every region together; drag to pan. The [full example](https://visgl.github.io/math.gl/next/examples/albers-usa) includes more explanation.

The discontinuous map API, presets, and layout helpers are experimental and may change.

## Projection formulas and map layouts[​](#projection-formulas-and-map-layouts "Direct link to Projection formulas and map layouts")

Interruption is a choice about a map's domain and seams. It can be applied to several mathematical projection families: for example, interrupted sinusoidal and Mollweide maps use pseudocylindrical equal-area formulas, while Albers USA combines regional conic projections. Polyhedral maps choose a face projection and a net independently. Neither a cut nor a square or star-shaped outline implies that a projection preserves area or angles.

See [map projection families](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md#mathematical-families) for the equations, geometric constructions, and distortion properties. This page focuses on the additional topology needed to render their cuts and joins.

## Segmented, connected, or detached?[​](#segmented-connected-or-detached "Direct link to Segmented, connected, or detached?")

A map assembled from several charts is not necessarily detached or visibly interrupted at every chart boundary. **Segmentation** describes how the map is constructed; **continuity** describes what happens across each seam; and **connectivity** describes whether the placed pieces remain joined together.

| Arrangement                          | Example            | Meaning                                                                                                                                                                    |
| ------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Joined charts forming one filled map | Peirce quincuncial | The hemisphere pieces meet at continuous joins to form a square. Cuts between the outer pieces lie on the square's perimeter; a line crossing one resumes at another edge. |
| Connected map with open cuts         | Berghaus star      | The lobes join the central hemisphere, while cuts open between their outer edges. The map is connected despite those interruptions.                                        |
| Detached components                  | Albers USA         | Alaska, Hawaii and territory insets are placed separately from the mainland.                                                                                               |

`MapEngine` represents these properties separately: `seams[].kind` distinguishes `join`, `cut`, and `boundary`; `capabilities.hasCuts` reports cuts, while `capabilities.disjoint` reports multiple components in the continuous-join graph. A map can therefore have cuts without being disjoint. `capabilities.hinged` is another independent property: joined charts do not imply physical hinges or unfolding motion. Seam classification is sampled metadata, not a mathematical proof of continuity for arbitrary custom projection callbacks.

The renderer still receives geometry split by chart, including at continuous joins. It should not draw every computational chart edge as a visible map cut.

## Supported map families[​](#supported-map-families "Direct link to Supported map families")

“Built in” means a `MapEngine` definition with region-aware points, inverse candidates, and seam-split lines and polygons. It does **not** mean automatic compatibility with deck.gl geographic layers. Custom charts require projection callbacks and convex spherical boundaries; they are not verified presets.

| Family                             | Built-in `MapEngine` support                                                                                                                                                                                                                                                                | Remaining gaps                                                                                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary continuous maps           | Spherical `mercator` and 64 `world` formulas, including Robinson, Mollweide, Eckert I–VI, Hammer, Wagner and Winkel Tripel                                                                                                                                                                  | The [projection families and presets](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md) describes the continuous and regional families. Scalar ellipsoidal CRS operations are separate                           |
| Interrupted pseudocylindrical maps | `goode` (land-oriented); `interrupted-sinusoidal`, `interrupted-mollweide`, `interrupted-homolosine` (independent six-lobe cuts); additional presets: `goode-ocean`, `interrupted-boggs`, `interrupted-sinu-mollweide`, `interrupted-quartic-authalic`, `interrupted-mollweide-hemispheres` | Configurable equatorial lobes are available through `interrupted`; catalog presets include native oblique Sinu-Mollweide cuts; configurable north/south interruption latitudes are supported. Arbitrary per-lobe latitudes and bitwise PROJ/D3 compatibility are not promised |
| Regional projection caps           | Airy, Craig, Littrow, Satellite, modified stereographic, Chamberlin and two-point maps; Armadillo, Hammer retroazimuthal and Wiechel domains                                                                                                                                                | See [catalog configuration and inverse limits](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md); no ellipsoidal regional CRS transforms                                                                         |
| Regional composites / insets       | `albers-usa`, including optional PR, VI, GU, MP and AS                                                                                                                                                                                                                                      | Other national composites need custom charts; no responsive inset reflow or exact projected rectangular clipping                                                                                                                                                              |
| Quincuncial square-world maps      | `peirce-quincuncial`, `gringorten-quincuncial`, and `guyou` in equatorial aspects; polar equal-area `petroff`                                                                                                                                                                               | Arbitrary aspect rotation beyond the central meridian                                                                                                                                                                                                                         |
| Star maps                          | `berghaus` and `gingery`, with 3–24 lobes; Gingery has a configurable central cap                                                                                                                                                                                                           | Other star formulas and arbitrary aspect rotation                                                                                                                                                                                                                             |
| HEALPix                            | Spherical `healpix` (H=4, K=3), equal-area, with four polar lobes per hemisphere                                                                                                                                                                                                            | rHEALPix polar rearrangement, other H/K values, and pixel indexing                                                                                                                                                                                                            |
| Classical polyhedral maps          | `air-ocean` (24-panel radial/gnomonic), exact `gray-fuller`, `butterfly`, `collignon-butterfly`, `waterman` (W5)                                                                                                                                                                            | Arbitrary polyhedral nets                                                                                                                                                                                                                                                     |
| Snyder equal-area polyhedral maps  | Spherical `isea` (20 triangular faces) and `dsea` (12 pentagonal faces), in vertex-polar aspects                                                                                                                                                                                            | Ellipsoidal authalic conversion, other polyhedra/nets, and configurable aspect rotation                                                                                                                                                                                       |
| Myriahedral maps                   | `myriahedral`: six named cut strategies, five Platonic solids, subdivisions, custom meshes and hinge motion                                                                                                                                                                                 | Guaranteed overlap-free nets, collision-free unfolding, and guaranteed continent connectivity                                                                                                                                                                                 |
| DGGS-derived unfolding             | Custom myriahedral meshes; H3, A5 and S2 adapters in examples                                                                                                                                                                                                                               | These adapters are not built-in MapEngine definitions or exact DGGS cartographic projection kernels                                                                                                                                                                           |

### Quincuncial, star, and HEALPix examples[​](#quincuncial-star-and-healpix-examples "Direct link to Quincuncial, star, and HEALPix examples")

<!-- -->

Peirce places one hemisphere in the central diamond and splits the opposite hemisphere among four corners. Berghaus retains an azimuthal-equidistant front hemisphere and opens the back into star lobes. Both are static charts: transitions to different layouts use the globe strategy, not hinge motion. Both default to longitude/latitude `[0, 0]` at the center; this differs from D3's default Peirce rotation. `centralMeridian` rotates longitude only.

The example separates `map.js` (geographic preparation), `scene.js` (Canvas rendering and picking), and `main.js` (controls). Blue indicates chart coverage; coastlines come from public-domain Natural Earth. The orange polygon shows seam splitting. See the [full example](https://visgl.github.io/math.gl/next/examples/quincuncial-star).

Peirce's elliptic kernel is adapted from [D3's ISC-licensed implementation](https://github.com/d3/d3-geo-projection); the packaged `src/discontinuous/D3-LICENSE.txt` retains the license. Berghaus uses the published formula, with chart-specific boundary limits and bounded inverse solving. Neither implementation uses Nico Belmonte's code.

For new renderers, use [MapEngine](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/map-engine.md) to construct these layouts, fit the insets, pick coordinates, and evaluate optional hinge motion through one interface. A serializable `MapDescription` selects the map; the [reference](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/map-engine.md) documents its fields and methods.

math.gl provides the experimental `@math.gl/geospatial/discontinuous` entrypoint for this geometry processing. It combines geographic regions, local projections, and planar placements. It supports forward point projection, inverse candidates, seam-aware lines, and hemisphere-bounded polygons.

## Three kinds of layout[​](#three-kinds-of-layout "Direct link to Three kinds of layout")

| Layout                | What changes at a boundary                                                                                  | Example                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Interrupted world map | Adjacent lobes use different central meridians and separate away from their joins                           | Interrupted sinusoidal, Mollweide, homolosine |
| Regional composite    | Selected regions use independent projections, translations, and possibly scales; other geography is omitted | Albers USA with Alaska and Hawaii insets      |
| Polyhedral map        | The sphere is divided into panels, each projected onto a face and placed in a flat net                      | AirOcean with gnomonic face mapping           |

These layouts share a geometry contract, but have different cartographic properties. An interruption does not make a projection equal-area. Moving an inset does not change its area, but shrinking it does. A polyhedron's cut arrangement does not determine the formula used within each face.

## Topology, projection, and placement[​](#topology-projection-and-placement "Direct link to Topology, projection, and placement")

A `DiscontinuousMap` contains `MapRegion` definitions. Each region supplies:

1. A convex spherical boundary and a point strictly inside it.
2. A local forward projection and inverse projection.
3. An optional invertible affine placement in the final map.

The boundary decides **where a point belongs**. The local projection decides **how that region is distorted**. The placement decides **where it appears**. Keeping these concerns separate makes it possible to reuse a cut arrangement with another local formula, or move an inset without changing its geographic membership.

Boundaries consist of minor great-circle arcs. They are not arbitrary curved lines, constant-latitude rectangles, or projected clip rectangles. Regions may leave gaps, overlap, or repeat the same source domain. Their order determines default point ownership when more than one region contains a point.

`map.seams` describes shared region edges as `join`, `cut`, or `boundary`. A join appears continuous after placement; a cut separates the two sides. Classification samples endpoints and midpoints, so it is descriptive metadata, not a proof of continuity for arbitrary callbacks. Geometry is split by region even at joins. Shared edges must have matching subdivisions to be recognized.

## Choose a preset[​](#choose-a-preset "Direct link to Choose a preset")

```
import {

  createAlbersUsaMap,

  createAirOceanMap,

  createInterruptedSinusoidalMap,

  createInterruptedMollweideMap,

  createInterruptedHomolosineMap

} from '@math.gl/geospatial/discontinuous';



const usa = createAlbersUsaMap();

const world = createInterruptedHomolosineMap();
```

| Factory                          | Coverage and local formula                                                          | Important qualification                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `createAlbersUsaMap`             | Lower 48, Alaska, and Hawaii; spherical Albers equal-area                           | Alaska has 0.35 linear scale; masks are broad geographic regions, not U.S. borders |
| `createInterruptedSinusoidalMap` | Six lobes covering the sphere; sinusoidal                                           | Independent cut arrangement                                                        |
| `createInterruptedMollweideMap`  | The same six lobes; Mollweide                                                       | Independent cut arrangement                                                        |
| `createInterruptedHomolosineMap` | The same six lobes; sinusoidal near the equator, shifted Mollweide toward the poles | Goode's local formula, not the historical PROJ IGH cut arrangement                 |
| `createAirOceanMap`              | 24 panels; radial/gnomonic projection                                               | AirOcean arrangement, not Gray-Fuller; not equal-area                              |

All factories accept `{radius: number}`, defaulting to `1`. Coordinates are in units of that radius, with Y increasing upward. The API operates on a sphere; it performs no ellipsoid or datum conversion. Supplying an Earth radius scales the output but does not turn a layout into an EPSG coordinate reference system.

The U.S. preset uses compact lower-left insets: Alaska on the left, Hawaii beside it. With `includeTerritories: true`, it also adds Puerto Rico, the U.S. Virgin Islands, Guam, the Northern Mariana Islands, and American Samoa. The Alaska and Hawaii masks focus on mainland Alaska and the main Hawaiian islands; distant islands may be cropped. The masks also include neighboring land and ocean. Filter features before projection when only U.S. geography should be drawn. Minor outlying islands are not included. The independent masks and placements are not a reproduction of D3 `geoAlbersUsa`'s projected rectangular clips.

See the [API reference](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md) for exact preset parameters.

## Project points and pick a region[​](#project-points-and-pick-a-region "Direct link to Project points and pick a region")

```
const honolulu = usa.projectPoint([-157.8, 21.3]);

// {regionId: 'hawaii', position: [x, y]}



const outside = usa.projectPoint([0, 0]); // null



// Specify a region when ownership at a cut or overlap matters.

const explicit = usa.projectPoint([-157.8, 21.3], 'hawaii');
```

Inputs are `[longitude, latitude]` in degrees. Longitude wraps; latitude must lie within \[-90, 90]. `findRegions(position)` returns all containing region IDs, including both sides of a boundary. Without an explicit region, `projectPoint` selects the first containing region.

Inverse projection returns **candidates**, not a single unconditional result:

```
const candidates = usa.unprojectPoint(honolulu!.position);

// [{regionId: 'hawaii', position: [longitude, latitude]}]



const picked = usa.unprojectPoint(honolulu!.position, 'hawaii');
```

An empty area of the layout has no inverse. Overlapping placed regions may have multiple inverses. Inset backgrounds can overlap the main map in placed XY. If the renderer already knows the visible region ID, pass it when picking. Convert screen pixels back to the layout's XY coordinates first: the map does not know the camera, zoom, viewport, or depth ordering.

## Split lines before rendering[​](#split-lines-before-rendering "Direct link to Split lines before rendering")

```
const parts = world.projectLine([

  [-70, 30],

  [-50, 30]

]);



for (const part of parts) {

  drawPath(part.coordinates, part.regionId);

}
```

`drawPath` represents your renderer. Draw each returned part independently; do not concatenate them. Every part includes geographic `sourceCoordinates` matching its projected vertices, including newly created boundary and sampling vertices. Preserve feature identity alongside each part in your application.

Edges represent minor great-circle arcs. Supply intermediate vertices for a rhumb line, a latitude parallel, or a particular route. Antipodal endpoints are ambiguous and rejected. A path exactly on a shared boundary can appear on both regions; a point tangent produces no zero-length line part.

## Clip polygons, then triangulate each piece[​](#clip-polygons-then-triangulate-each-piece "Direct link to Clip polygons, then triangulate each piece")

```
const pieces = world.projectPolygon([

  [[-70, 20], [-50, 20], [-50, 40], [-70, 40]],

  [[-66, 25], [-64, 25], [-64, 30], [-66, 30]] // hole

]);



for (const piece of pieces) {

  // Pass this piece's exterior and holes to a polygon renderer or triangulator.

  drawPolygon(piece.coordinates, piece.regionId);

}
```

The first ring is the exterior and subsequent rings are holes. Input winding is unrestricted, and rings may be open or closed. Output rings are closed, with counterclockwise exteriors and clockwise holes. Clipping may split one feature into several pieces, or open a hole into an indentation on the exterior.

**Each input polygon must fit within an open hemisphere.** The implementation uses a gnomonic chart for spherical clipping and planar ring reconstruction. An optional `chartCenter: [longitude, latitude]` can select a suitable chart when the default mean direction is unsuitable. It cannot make a globe-spanning polygon or spherical complement fit into a hemisphere. Split such input using a topology-aware preprocessing step; do not silently discard the failing part.

Triangulate each returned polygon separately, including its holes. Never reuse source triangle indices across a cut or connect vertices from different regions. The map API returns polygon rings, not triangle indices or a ready-to-render mesh.

## Sampling and data attributes[​](#sampling-and-data-attributes "Direct link to Sampling and data attributes")

Both geometry methods accept `maxAngularStep` and `tolerance`. The former defaults to 2 degrees; the latter defaults to `1e-4` in final placed XY units. Sampling adapts to projected midpoint chord error. It is an approximation criterion rather than a certified maximum error for arbitrary projection callbacks. Recursion and sample-count limits throw instead of silently accepting an unresolved curve.

For output scaled to meters, choose a corresponding tolerance:

```
const earth = createInterruptedMollweideMap({radius: 6371008.8});

const lines = earth.projectLine([[-70, 30], [-50, 30]], {tolerance: 100});
```

Clipping creates vertices. Positions alone are insufficient for a colored mesh, texture, or scientific field: compute attributes for new vertices from their returned source coordinates. Longitude interpolation must respect the antimeridian. Sampling a periodic geographic raster is often simpler than interpolating already projected attributes across a cut.

Cache the clipped topology when the layout and source geometry stay fixed. Changing a time-dependent field can then update colors or values without repeating clipping. Changing a cut layout generally changes vertex identity and triangle connectivity, so a vertex-by-vertex morph is not automatically valid.

## Ice Age Explorer integration[​](#ice-age-explorer-integration "Direct link to Ice Age Explorer integration")

The [Glaciation Explorer](https://visgl.github.io/math.gl/next/examples/alpine-ice-age) offers these layouts in its projection selector and projection cycle. Its discontinuous rendering path:

1. Clips the geographic display cells into region-local polygons.
2. Triangulates small cell fragments independently and caches their topology.
3. Samples bed elevation and ice values at the resulting geographic vertices.
4. Splits graticules with `projectLine` so they do not bridge cuts or inset gaps.

Static segmented layouts transition through the globe, rebuilding destination geometry with its own cuts. Myriahedral views use hinge motion through the globe. The continuous world projections retain their animated transitions. U.S. inset selection changes the displayed coverage; statistics remain global. Geographic masks are not political borders, and the display interpolation adds no new reconstruction data.

This integration uses Cartesian rendering of preprojected geometry. It does not add general discontinuous-projection support to existing deck.gl geographic layers. The [unfolding Earth example](https://visgl.github.io/math.gl/next/docs/modules/geometry/unfolding-earth.md) explores a separate animated hinge-and-texture pipeline.

## What remains unsupported[​](#what-remains-unsupported "Direct link to What remains unsupported")

* Polygons spanning a hemisphere or representing spherical complements.
* Arbitrary user-defined curved chart boundaries and exact projected rectangular clip semantics. Built-in regional caps and Armadillo coverage are supported.
* The missing presets and layout variants listed in the support table above. Land-oriented Goode is supported.
* Ellipsoidal projection/datum conversion within this API.
* GeoJSON wrappers, automatic property interpolation, packed mesh output, and spatial indexing for large region sets.

A local projection kernel and a discontinuous layout solve different problems. Use the scalar [projection API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md) for ordinary CRS transforms; use the [discontinuous map API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md) when region membership, cuts, and geometry reconstruction are part of the operation.

## Placement and spacing metadata[​](#placement-and-spacing-metadata "Direct link to Placement and spacing metadata")

`MapRegion.layout` supplies optional labels, kinds, parent IDs, relative scales, back-to-front draw order, and visual frame bounds. Albers USA declares Alaska, Hawaii and optional territory insets as children of the main map. Presentation frames do not change geographic coverage.

Use `getMapLayout(map)` to obtain sampled bounds and coverage outlines, then `fitMapLayout(layout, {width, height, padding})` to place the complete map into a viewport. The result includes forward/inverse pixel transforms and sorted region layers, plus frame and outline coordinates suitable for drawing inset borders. `pickMapLayout(map, fitted, pixel)` returns inverse candidates in front-to-back order for a viewport pixel. The [Albers USA example](https://visgl.github.io/math.gl/next/examples/albers-usa) shows these helpers with clipped state polygons and coordinate inspection. Bounds follow projected curves instead of measuring only region corners. They remain sampling approximations, so choose a tolerance appropriate to your scale.

```
import {getMapLayout, fitMapLayout} from '@math.gl/geospatial/discontinuous';

const layout = getMapLayout(usa);

const fitted = fitMapLayout(layout, {width: 800, height: 500, padding: 24});

for (const region of fitted.regions) {

  // Render back to front; region.layer gives a stable ordering index.

  // Draw region.frame and label it with region.label when kind === 'inset'.

}
```

Canonical placements and frames use map units. The fitting helper uniformly scales that arrangement and applies pixel padding, preserving relative scales and spacing. It does not yet reflow individual insets responsively. Source coordinates and map-region membership stay unchanged by fitting. Convert pointer pixels using `fitted.unproject`, then pass the visible region ID to `map.unprojectPoint`.

The Explorer uses this metadata for fitting, draw order, inset frames, and labels. Hawaii also has a finer **modern island reference** from public-domain Natural Earth 1:10m polygons. The one-degree bed grid reports ocean-depth elevations at sampled locations on the main islands; increasing display mesh density would not recover the missing terrain. The reference layer makes the islands visible without changing the ice reconstruction or global statistics. It does not describe past shorelines or local Hawaiian glaciation.

## References and implementation credits[​](#references-and-implementation-credits "Direct link to References and implementation credits")

The projection authors, numerical implementations, and illustration authors are distinct contributions. The following sources explain the mathematics and record the implementations used for comparison or adaptation. Prefer the free primary sources below when a journal's landing page requires payment.

* **Charles Sanders Peirce**, *A Quincuncial Projection of the Sphere* (1879): [freely available scan](https://www.unav.es/gep/Quincuncial1879.pdf). Peirce's conformal construction underlies the square-world family.
* **John P. Snyder and Philip M. Voxland**, *An Album of Map Projections*, USGS Professional Paper 1453: [free USGS publication](https://pubs.usgs.gov/pp/1453/report.pdf). A broader reference for Guyou, Gringorten, Berghaus, Boggs, Collignon and other projection families; historical names do not imply their authors wrote math.gl code.
* **John Paul Goode**, *The Homolosine Projection: A New Device for Portraying the Earth's Surface Entire* (1925), [publication record](https://doi.org/10.1080/00045602509356949). Free implementation documentation is available from PROJ for [land-oriented Goode](https://proj.org/en/stable/operations/projections/igh.html) and [ocean-oriented Goode](https://proj.org/en/stable/operations/projections/igh_o.html).
* **Mike Bostock and d3-geo-projection contributors**, [D3 projection catalogue](https://github.com/d3/d3-geo-projection/tree/v4.0.0). math.gl adapts the ISC-licensed Guyou/elliptic and Gringorten numerical kernels, quincuncial rearrangement, Berghaus formula, and octahedral/Waterman W5 face construction and parent tree. See the pinned [quincuncial](https://github.com/d3/d3-geo-projection/tree/v4.0.0/src/quincuncial), [polyhedral](https://github.com/d3/d3-geo-projection/tree/v4.0.0/src/polyhedral), and [interrupted](https://github.com/d3/d3-geo-projection/tree/v4.0.0/src/interrupted) sources. The Boggs, Sinu-Mollweide and quartic-authalic formulas and lobe arrangements were checked against these sources. math.gl uses its own chart, clipping, inverse-validation, layout and transition pipeline; it has no D3 runtime dependency.
* **Steve Waterman** is credited for the Waterman projection; our W5 construction follows [D3's Waterman implementation](https://github.com/d3/d3-geo-projection/blob/v4.0.0/src/polyhedral/waterman.js). This preset is not a generic implementation of all Waterman polyhedra.
* **d3-geo-polygon contributors** supply the ISC-licensed [AirOcean topology](https://github.com/d3/d3-geo-polygon). math.gl's `air-ocean` remains radial/gnomonic; `gray-fuller` implements Gray's exact face equations independently, with reference tests against D3.
* **Nicolas “Nico” Belmonte** inspired the interactive myriahedral demonstrations. See [our myriahedral background and credits](https://visgl.github.io/math.gl/next/docs/modules/geospatial/myriahedral-maps.md). The hinge mechanics and myriahedral implementation were developed independently; no permission to copy Nico's application code is implied by this credit.

Complete redistribution notices ship in `@math.gl/geospatial` under `src/discontinuous/D3-LICENSE.txt` and `src/discontinuous/AIR-OCEAN-LICENSE.txt`. Source headers identify adaptations. Checked-in reference fixtures use D3 4.0.0; the adjacent generator scripts record normalization and can regenerate them from an independently installed D3 source tree. A matching picture alone is not a numerical validation.

* **Matthew A. Petroff**, [A Square Equal-Area Map Projection with Low Angular Distortion, Minimal Cusps, and Closed-Form Solutions](https://arxiv.org/abs/2008.13670) (2021). The `petroff` equations are adapted from his [CC0 supplement](https://doi.org/10.5281/zenodo.4661351); see also his [introductory article](https://mpetroff.net/2021/08/square-equal-area-map-projection/).
* **John P. Snyder**, *An Equal-Area Map Projection for Polyhedral Globes* (1992). `isea` and `dsea` use the [vector formulation explained by BRSR](https://brsr.github.io/2021/08/31/snyder-equal-area.html). Their mesh and net tables follow **Felix Palmer / PROJ**; [PROJ's polyhedral documentation](https://proj.org/en/stable/operations/projections/polyhedral.html) explains the face/subtriangle construction. math.gl implements the projection equations independently and retains PROJ's MIT-style notice for the tables.
