# Periodic cells with shared boundary preparation

This example composes the projection-engine agnostic path contract with mesh
clipping and attribute interpolation. It is a recipe for qualified cells, not
arbitrary spherical polygon repair.

Create one `createPeriodicEdgeCache` per immutable transform, source coordinate
system and sampling policy. Pass exactly identical source endpoints for shared
edges; the cache prepares a canonical orientation and reverses copies for the
neighbor. Recreate it when the engine, operation, resources or policy changes.
Coordinates are global source coordinates, not separate tile-local pixels.

`preparePeriodicCell` lifts the prepared boundary continuously and preserves every
boundary sample in a center fan. Periodic target clipping duplicates seam vertices;
math.gl provenance interpolates source pixels into UVs. `sourceBounds` defines the
UV rectangle, so neighboring tiles may use different UV bounds while sharing
geometry. Source-row identity and periodic-copy attribution survive clipping.
Supported cells have a consistently oriented center fan; partition more complex
cells into explicit charts. This sampled piecewise-linear mesh does not certify
interior projection error: callers must qualify cell density separately.

A nonzero winding boundary (including the Antarctic pole fixture) cannot be closed
as one planar fan. It rejects unless the caller supplies `inverseCharts`; those
explicit domains use the existing inverse-UV refinement recipe instead. This does
not infer chart topology, holes or inverse branches from point conversion. The
fallback charts describe the entire desired output and are supplied by the caller,
not derived from `sourceBounds`.

Tests cover reversed shared edges, seam cuts, UV continuity, rotated Fiji, source
row identity and a pole-containing EPSG:3031 raster with explicit inverse charts.
The recipe adds no public export path or mandatory projection engine dependency.

[Feedback section 2](https://github.com/mdsumner/sidebyside/blob/main/article/2026-10-13_custom-projections-deckgl.md#2-domain-is-geometry-not-a-lonlat-box).
