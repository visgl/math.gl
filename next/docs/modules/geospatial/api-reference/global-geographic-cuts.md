# Global spherical polygon cuts

An accurately projected point does not determine how to draw a whole polygon across a map interruption. Edges must be cut at chart boundaries, and fragments must retain the correct filled side and holes. Longitude unrolling alone cannot supply this topology.

The discontinuous map engine already clips minor-great-circle lines and local polygons against its lobe/face boundaries and visible spherical caps. The new explicit global profile removes its input polygon's single-open-hemisphere restriction. It handles directed global boundaries, hemispheres, polar regions, holes and complements before delegating to existing map-specific clipping.

```
import {MapEngine, cutSphericalPolygon} from '@math.gl/geospatial/discontinuous';



const map = new MapEngine({version: 1, id: 'goode', definition: {type: 'goode'}});

const northernHemisphere = [[-135, 0], [-45, 0], [45, 0], [135, 0]] as const;

const pieces = map.projectGlobalPolygon([northernHemisphere], {

  interior: 'left', tolerance: 1e-4, maxAngularStep: 2

});

const prepared = map.prepareFeatures([

  {geometry: {type: 'Polygon', coordinates: [northernHemisphere]}}

], {sphericalCuts: {interior: 'left'}});
```

## Boundary meaning[​](#boundary-meaning "Direct link to Boundary meaning")

Inputs are two-dimensional `[longitude, latitude]` degrees. Edges are directed **minor spherical great-circle arcs**, not straight longitude/latitude segments, ellipsoidal geodesics, or rhumbs. Antipodal endpoints are ambiguous and rejected; insert a meaningful intermediate point. Rings may be open or explicitly closed. Supply valid, non-self-intersecting filled boundaries. This is not polygon repair.

`interior` is required: the filled region lies on the `left` or `right` side of every boundary traversal. For a small ordinary exterior, left corresponds to counterclockwise winding and local holes traverse the opposite way. On global regions, follow the filled-side rule rather than a planar signed-area heuristic. Reversing all rings and swapping the side preserves the filled set. Changing only the side selects its complement. No latitude-sign or shortest-area guess is made. The first ring is the exterior; any additional rings must correctly bound holes in that filled set. Empty input returns no polygons, not a full sphere.

Existing `projectPolygon` and `prepareFeatures` defaults keep their local, winding-independent contract. Opt into `projectGlobalPolygon`, or pass `prepareFeatures(..., {sphericalCuts: {interior}})`. Original feature IDs and component paths remain available in prepared output. Original outlines are projected separately, so generated chart/atlas edges are not accidentally stroked.

## Reusable atlas cuts and source provenance[​](#reusable-atlas-cuts-and-source-provenance "Direct link to Reusable atlas cuts and source provenance")

`cutSphericalPolygon(rings, options)` returns polygons in an eight-octant atlas, with stable signed-axis `cellId`s. Each polygon has explicitly closed `rings` (exterior first, then holes) and one `edges` record per ring edge:

* `{kind: 'source', ringIndex, edgeIndex, startFraction, endFraction}` identifies an interval of one original great-circle edge; fractions use angular distance.
* `{kind: 'cut', axis}` identifies a generated boundary on Cartesian coordinate plane 0, 1 or 2. It does not invent source attributes or an original edge.

Returned arrays and records belong to the caller. Inputs are read and copied before processing. Adjacent atlas cells share their boundary; do not treat atlas connectors as original feature outlines. No implicit interpolation of heights or other attributes is provided. The cut-only source intervals let an application interpolate its own scalar data deliberately. Map-specific projected results keep the existing source-coordinate correspondence; they do not claim that generated horizon arcs belong to original input edges.

`projectSphericalPolygon(map, rings, options)` is the standalone adapter for any existing `MapSurface` polygon projector. `MapEngine.projectGlobalPolygon` uses this same implementation. A map's coverage gaps, overlaps, caps, projection equations and placements remain authoritative. Atlas fragments may remain separate even inside one chart; filled geometry should not stroke every fragment boundary.

## Numerical profile and limits[​](#numerical-profile-and-limits "Direct link to Numerical profile and limits")

The adapter uses the existing attributed ISC d3-geo circle clipper to obtain a 60-degree neighborhood of each octant, then exact great-circle/gnomonic planar cuts for the octant itself. A strictly positive angular margin separates the sampled neighborhood boundary from the octant: its approximate small-circle chords cannot become final atlas boundaries. Existing polygon-clipping machinery reconstructs components and holes. Original vertices are reinserted when Boolean reconstruction combines collinear source edges, retaining edge ownership.

Boundary/provenance classification uses a `2e-12` radian directional tolerance; duplicate and collinear clip vertices are normalized in bounded local charts. This is a binary64 spherical profile, not arbitrary tiny-sliver or invalid-topology certification. Default `maxVertices = 65536` counts input and intermediate atlas emissions; `maxWork = 1000000` counts adapter visits/source comparisons. Both fail with a `RangeError` on exhaustion. These counters do not represent a wall-clock budget for the existing Boolean library or the map's separate adaptive sampler. Map sampling retains its existing midpoint-error target, not a certified global error bound. Results are returned only after successful completion.

## Coverage and remaining work[​](#coverage-and-remaining-work "Direct link to Coverage and remaining work")

Independent analytic hemisphere areas, solid-angle/complement conservation and rotated hole constructions run in Node and supported browsers. Representative map-family gates cover interrupted Goode/sinusoidal/Mollweide and ocean layouts, AirOcean/Gray–Fuller/butterfly/Waterman/Snyder faces, HEALPix, Mercator, continuous world maps and limited satellite/Airy caps. Fragment coordinates must remain finite and belong to their declared chart. This is broad reuse of existing spherical map layouts, not a promise that every projection parameter/input is qualified. No new package dependency or data download is added.

General ellipsoidal/rhumb boundary intersections, arbitrary user-defined curved cut graphs, shared feature-network topology and polygon repair remain separate. An atlas does not itself add those edge models, nor does it fix renderer precision.
