# Discontinuous projections

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The discontinuous map API, presets, and layout helpers are experimental and may change.

A discontinuous map places neighboring parts of the Earth in separate parts of a plane. A line that crosses a cut must end on one side and resume on the other; a polygon must become separate, closed pieces. Projecting only the original vertices does not produce a correct map: the renderer may draw a line or triangle across the empty space between pieces.

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

The U.S. preset uses compact lower-left insets: Alaska on the left, Hawaii beside it. Their geographic masks focus on mainland Alaska and the main Hawaiian islands; distant islands may be cropped. The masks also include neighboring land and ocean. Filter features before projection when only U.S. states should be drawn. Puerto Rico and other territories are not included. The independent masks and placements are not a reproduction of D3 `geoAlbersUsa`'s projected rectangular clips.

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

Switches involving discontinuous layouts happen immediately because their mesh topologies differ. The continuous world projections retain their animated transitions. U.S. inset selection changes the displayed coverage; statistics remain global. Geographic masks are not political borders, and the display interpolation adds no new reconstruction data.

This integration uses Cartesian rendering of preprojected geometry. It does not add general discontinuous-projection support to existing deck.gl geographic layers. The [unfolding Earth example](https://visgl.github.io/math.gl/next/docs/modules/geometry/unfolding-earth.md) explores a separate animated hinge-and-texture pipeline.

## What remains unsupported[​](#what-remains-unsupported "Direct link to What remains unsupported")

* Polygons spanning a hemisphere or representing spherical complements.
* Curved region boundaries and exact projected rectangular clip semantics.
* Built-in historical IGH cuts and Butterfly, Collignon, or Waterman layouts.
* Ellipsoidal projection/datum conversion within this API.
* GeoJSON wrappers, automatic property interpolation, packed mesh output, and spatial indexing for large region sets.

A local projection kernel and a discontinuous layout solve different problems. Use the scalar [projection API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md) for ordinary CRS transforms; use the [discontinuous map API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md) when region membership, cuts, and geometry reconstruction are part of the operation.

## Placement and spacing metadata[​](#placement-and-spacing-metadata "Direct link to Placement and spacing metadata")

`MapRegion.layout` supplies optional labels, kinds, parent IDs, relative scales, back-to-front draw order, and visual frame bounds. Albers USA declares both insets as children of the main map. Presentation frames do not change geographic coverage.

Use `getMapLayout(map)` to obtain sampled bounds and coverage outlines, then `fitMapLayout(layout, {width, height, padding})` to place the complete map into a viewport. The result includes forward/inverse pixel transforms and sorted region layers, plus frame and outline coordinates suitable for drawing inset borders. Bounds follow projected curves instead of measuring only region corners. They remain sampling approximations, so choose a tolerance appropriate to your scale.

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
