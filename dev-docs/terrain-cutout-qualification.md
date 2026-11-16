# Incremental and geographic terrain cutout qualification

The incremental API clips only changed tile revisions and reconciles cached
exposed edges. It uses exact XYZ matching; mixed-level source edges must first
be reconciled by the existing stitchers. It retains nodata gaps and rejects
nonconforming source neighbors. It does not incrementally maintain skirts or
clip arbitrary concave polygons.

## Independent checks

- Compare both pieces' exact triangle-coordinate multisets and directed cut
  edges with the monolithic `splitTerrainMeshTiles` result after every update.
- Independently sum triangle area and reconstruct positions from original source
  triangle barycentric weights.
- Exercise four coarse/fine combinations, oblique cuts, seam-coincident cuts,
  missing tiles, revision edits, arrival/eviction, budget exhaustion and failure
  atomicity. Neighbor wall metadata can change without rebuilding its geometry.
- Compare geographic projection with independent Cartesian unit-sphere ray /
  tangent-plane intersections, not just inverse round trips. Cover the
  antimeridian and both poles, negative heights, exact longitude aliases,
  out-of-cap rejection and polar fan cutting.
- Exercise the incremental controls and all three geographic scenes in the
  terrain sampling browser regression.

## Pacific and Sierra replay

Run `yarn build` then `node scripts/benchmark-terrain-cutouts.mjs`.
The script checks pinned TIFF SHA-256 values against the existing streaming
fixtures and uses a 32-tile layout of 9x9 vertex meshes. Pacific uses raster
origin (96,96); Sierra uses (48,80), where both substantial valid terrain and
nodata boundaries are present. The script rejects a qualification domain with
fewer than 1000 source triangles and only edits used interior vertices.

Each run has five warmup and twenty measured updates. Alternate execution order
between incremental and monolithic operations. Interleave interior height edits
with eviction/arrival of one tile. Validation is outside timed regions and
compares exact triangle geometry and cut boundaries at every step, plus total
coverage area. The JSON report records source hashes, crop origins, input
triangle counts, platform, Node version and timings.

Timings are local CPU wall-clock samples, not browser-worker or end-to-end
rendering latency. Twenty samples do not support robust tail claims. No global
scheduling default changes follow from this benchmark. The retained
`terrain-cutout-benchmark.json` records one local run; repeat on target hardware.

## Remaining limits

The resident-pair broad phase remains quadratic and is explicitly bounded.
Boundary reconciliation still scans all cached exposed edges. Large resident
sets could benefit from a persistent spatial index and dirty-boundary updates,
subject to independent full-rebuild parity. Geographic charts use spherical
great-circle edges and projected piecewise-linear heights; ellipsoidal or
continuous geographic error certificates are not implied. Concave rings and
holes remain a separate terrain cutout tranche.
