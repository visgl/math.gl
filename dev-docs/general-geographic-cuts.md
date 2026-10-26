# General geographic cuts: remaining C5 scope

A projection can be mathematically accurate at every evaluated point and still
produce a wrong map of a line or polygon. A continuous surface edge may cross a
chart boundary, an interruption or an invisible hemisphere. Connecting projected
endpoints across that boundary can draw a line across the map or fill an entire
lobe that was never part of the input polygon.

## What is delivered

`splitGeographicPolyline` / `splitGeographicPolygon` handle a configurable
360-degree meridian chart with explicit linear/geodesic/rhumb edges, source
fractions, attributes, components, holes and declared polar caps. Changing
`seamLongitude` supports a shifted single longitude seam. Existing general planar
clipping and projection-layout utilities remain useful; they do not by themselves
establish topology for arbitrary curved geographic edges and surface cuts.

## What we miss without general cuts

| Workflow | Missing capability / visible failure | Current safe scope |
| --- | --- | --- |
| Interrupted world maps | Multiple seams ending or joining inside the globe need lobe assignment and shared-boundary ownership. A route may bridge lobes; land/hole fragments may fill the interruption. | Single-meridian charts, or data already correctly partitioned by the application. |
| Polyhedral/faceted maps | Classify faces and intersect their spherical/ellipsoidal boundaries; preserve shared-edge identity across vertices where several faces meet. Missing cuts can connect distant faces or duplicate/drop boundary pieces. | Project points, or externally prepared face fragments with a declared edge model. |
| Orthographic/other limited domains | Clip edges at the actual visible horizon or valid-domain boundary, inserting boundary arcs to close polygon fragments. Dropping invalid vertices loses visible portions and can join unrelated endpoints. | Points with visibility tests; application-owned clipping of full edges/polygons. |
| Arbitrary regional or oblique surface windows | Intersect curved source edges with non-meridian boundaries and reconstruct holes/components. Planar lon/lat chords can select the wrong intersection or side. | Explicitly qualified planar operations or externally clipped geographic data. |
| Shared borders across charts | Canonical intersection identities and boundary ownership keep adjacent polygons watertight, including tangencies and cut junctions. Independent per-feature rounding can create cracks or overlapping slivers. | Existing meridian-profile contracts; applications own broader shared topology. |

These gaps affect whole-feature clipping/topology, not the accuracy of the
existing scalar projection formulas. Adding more vertices or longitude unrolling
cannot repair a discontinuity. Screen-space clipping after projection also cannot
recover a geographic intersection that was never constructed. The projected
boundary may require generated arcs, not just straight connectors. General cuts
would not automatically repair invalid/self-intersecting input polygons, certify
adaptive tessellation error, follow terrain or provide renderer precision.

## A bounded implementation sequence

1. **Domain clipping for one real consumer.** Choose one concrete chart, such as
   orthographic visibility on a declared sphere/ellipsoid. Define the boundary's
   geometry and filled side, find all source-edge intersections, classify tangency
   versus crossing, and retain original source intervals. Return explicit failure
   for unsupported ambiguity or exhausted work limits.
2. **Polygon reconstruction.** Add correctly oriented boundary arcs, reconstruct
   connected components and holes, and preserve pole/complement conventions.
   Retain a distinct provenance type for generated boundary edges, rather than
   pretending they came from an input edge. Subdivide through the chart only
   after topology is established.
3. **Cut graph / chart atlas.** Generalize to a finite graph of oriented boundaries
   with chart identifiers and adjacency. Qualify junctions, coincident edges,
   repeated crossings, multi-chart ownership and shared-vertex deduplication.
   An interrupted or faceted map should be the acceptance consumer.

Use original analytic sphere constructions and independently computed surface
intersections/filled-set checks. Test reversal, area conservation where applicable,
holes, polar regions, tangencies, coincident boundaries and boundary junctions.
Preserve attributes and fraction composition through cut → resample → project;
never silently replace geodesics with lon/lat chords. Set bounded numeric/iteration
profiles before promising arbitrary ellipsoids or cut networks. Reuse existing
intersection solvers where their domain matches the chosen cuts, but do not
assume geodesic/geodesic intersections solve small-circle or horizon boundaries.

## Priority recommendation

Bring a bounded domain-clipping consumer ahead of speculative full cut-graph work.
For ordinary continuous maps with one longitude seam, the current profile is
sufficient. For interrupted maps, faceted maps or whole polygons on a visible
hemisphere, general cuts become a real feature dependency. G11 Earth fields are
independent: implementing gravity or magnetic models does not close these gaps.
