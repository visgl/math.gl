# General geographic cuts: remaining C5 scope

A projection can be mathematically accurate at every evaluated point and still
produce a wrong map of a line or polygon. A continuous surface edge may cross a
chart boundary, an interruption or an invisible hemisphere. Connecting projected
endpoints across that boundary can draw a line across the map or fill an entire
lobe that was never part of the input polygon.

## What is delivered

Two existing APIs have distinct scopes. The geographic-seam API handles explicit
linear/ellipsoidal-geodesic/rhumb edges at one longitude seam, with source fractions,
attributes, components and polar caps. Separately, `@math.gl/geospatial/discontinuous`
already clips spherical minor-great-circle lines and local polygons against
interrupted lobes, polyhedral faces and visible caps. Its polygon input profile
requires one open hemisphere. Point-only projection is not its only capability.

The global spherical polygon increment in [PR #317](https://github.com/visgl/math.gl/pull/317)
addresses that global-input restriction by atlas partitioning, while retaining the
existing map-specific clippers. It is separate from general ellipsoidal/rhumb cut
networks. The earlier gap description overstated what was missing by considering
only the meridian-seam API.

## What remains beyond the existing spherical profile

| Workflow | Existing support | Remaining capability |
| --- | --- | --- |
| Interrupted world maps | Spherical lobe splitting, local polygon components/holes and placement. | Directed global boundaries/complements (PR #317); arbitrary ellipsoidal/rhumb cut networks remain separate. |
| Polyhedral/faceted maps | Convex spherical face classification/intersections and existing topology presets. | Broader global polygon input, shared feature-network identity and non-spherical edge/cut models. |
| Orthographic/limited domains | Spherical cap/horizon clipping and generated closure arcs for the existing map profile. | Qualified ellipsoidal visibility domains and explicit broader curve models, not another point-only visibility test. |
| Arbitrary regional windows | Existing convex spherical charts and explicit meridian seams. | Arbitrary user-defined curved cut graphs and robust junction ownership across those curves. |
| Shared borders across charts | Existing spherical chart boundaries and source-coordinate correspondence. | Canonical shared-feature network topology, source intervals for broader edge models and dataset-wide crack/overlap guarantees. |

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
For ordinary continuous maps, the meridian profile is often sufficient. Existing
spherical interrupted/faceted/cap maps already have their own cutters. Wider
curve/domain and shared-network requirements should drive further generalization. G11 Earth fields are
independent: implementing gravity or magnetic models does not close these gaps.

## Oblique visibility and finite atlas increment

The optional [geographic atlas](../docs/modules/geospatial/api-reference/geographic-atlas.md)
now provides arbitrary-direction orthographic ellipsoid surface visibility and a
finite graph of oriented normal-space circles. Shared boundaries/vertices, simple
outer-plus-hole reconstruction, source fractions and adaptive generated-curve
sampling support an eight-face octahedral Gauss-map consumer. Every cell has a
closed hemisphere bound, and shared separators certify disjoint chart interiors.

The 502-case Node/browser qualification retains native/independent budgets and
existing bundle limits. Arbitrary callback-defined curves, unresolved higher-order
junctions, dataset-wide feature-network reconciliation, perspective/elevated/terrain
visibility and projection-specific layouts remain separate work. This is a finite
atlas implementation, not a claim of universal geographic clipping completeness.
