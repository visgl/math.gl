# Explicit domain adapters

The general projection interface is projection-engine agnostic. Domain geometry is a separate
backend responsibility; a point converter or rendering bounds cannot identify arbitrary validity.
`createHorizonDomain` is an example-owned adapter for known unit-sphere orthographic and tilted
perspective operations (h=1, tilt=20). It accepts an engine implementing that operation contract,
uses projection parameters to build the limb, and adaptively samples midpoint chord error. Returned
identity includes the definition and sampling policy, so a center change invalidates derived state
even when the outline remains circular. Add backend execution provenance to any application cache.

The returned polygon is sampled slightly inside the tangent, not an exact validity predicate.
Tolerance uses unit-sphere target coordinates and is distinct from mesh/texture tolerance. The
angular step, recursion depth and initial sample count are bounded. Unsupported families must
supply a different adapter; do not extend this formula by relabeling an ellipsoidal operation.

`createMapChartDomains` bridges existing native map charts into CRS domain snapshots and retains
chart-specific point/inverse functions. It uses outlines rather than rectangular layout bounds.
Only simple single-outline regions are accepted; more complex topology needs explicit handling.
These recipes introduce no new public export paths or mandatory external projection engines.

[Feedback section 2](https://github.com/mdsumner/sidebyside/blob/main/article/2026-10-13_custom-projections-deckgl.md#2-domain-is-geometry-not-a-lonlat-box).

Perspective callers may supply `height` (in unit-sphere radii), `tilt` and `azimuth`
(in degrees). Defaults remain 1, 20 and 0. Qualified heights are 0.1–10; absolute
 tilt must stay at least one degree below `atan(sqrt(height * (height + 2)))`.
At the limiting tilt the horizon crosses infinity, so this bounded-polygon recipe
rejects it instead of returning a misleading closed domain. The spherical limb
radius is `acos(1 / (1 + height))`; all parameters enter the operation definition
and identity. Independent offline PROJ fixtures cover both exact poles, an oblique
center, multiple heights, signed tilts and nonzero azimuths. Regenerate with
`qualification/generate-horizons.py`; no Python or PROJ runtime dependency ships.
