# Polygon terrain cutout qualification

`prepareTerrainCutoutPolygons` supplies an immutable, reusable input to the mesh,
resident-tile and incremental splitters. Raw convex imports do not include the
polygon preparation/classification module. Preparation supports simple concave
rings, strictly contained holes and disjoint polygon domains, including islands
inside holes. Touching/overlapping regions and nested hole rings are rejected.

## Correctness

Analytical fixtures independently establish L-shaped area/perimeter, donut and
island areas, per-region coverage, and oblique affine transforms. A 512-point
coverage comparison uses closed-form domain predicates rather than the polygon
classifier. Tests reconstruct plane heights, check exact paired boundary XYZ and
polygon IDs, and require every cut edge to lie on a finite input ring segment.
Feeding the split surfaces back through the mesh topology validator checks that
artificial supporting-line subdivisions remain conforming.

Mixed-level 2:1 tile fixtures compare independent clips with a monolithic rebuild,
including exact triangle geometry, boundary lengths, polygon IDs, cache reuse,
resident reordering and eviction. Missing-domain tests ensure a hole that crosses
nodata does not create a wall along the absent terrain boundary. Winding,
collinear points, input snapshots, invalid rings and explicit budgets are tested.

The shared terrain lab includes concave, lake and island-in-lake scenarios in
local, antimeridian and both polar charts. Browser checks exercise these scenarios
and confirm zero reclipping on eviction. Package probes exercise prepared shapes
across both entry points and mixed ESM/CommonJS bundles.

## Pacific and Sierra replay

After `yarn build`, run:

```sh
node scripts/benchmark-terrain-cutouts.mjs --polygons
```

This extends the pinned 32-tile benchmark from the incremental cutout tranche.
The polygon consists of a concave outer boundary, a hole and a separate island
inside the hole. Input TIFF hashes and nonempty source domains are checked.
Each dataset has five warmup and twenty measured edit/arrival/eviction updates;
execution order alternates between incremental and monolithic calls. Every step
compares exact triangle geometry, directed boundary geometry/IDs and area. These
full-rebuild comparisons qualify incremental equivalence; independent analytical
fixtures above qualify the partition geometry itself.

Preparation is performed once outside update timings and reported separately.
Retained local results are in `terrain-polygon-cutout-benchmark.json`. They measure
CPU calls, not worker transport or rendering. The small timing sample is not a
robust tail-latency claim. Both the convex default and polygon mode remain
available for repeatable comparisons.

## Limits

Supporting-line arrangements can grow quadratically in edge count. Preparation
bounds total edges and validation work; each split has separate work, fragment,
vertex and triangle budgets. Unrepresentable positive-area fragments are rejected,
never silently discarded. Polygon IDs identify regions, not original ring edge
indices. Every patch region receives the same lift in skirt composition; separate
per-region transforms, touching-region partitions and general overlapping-polygon
boolean operations are outside this tranche.
