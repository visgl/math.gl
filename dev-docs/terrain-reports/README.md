# Terrain qualification reports

Run `node scripts/qualify-terrain-regional.mjs` after `yarn build` to reproduce the
report schema against the pinned raw inputs and independently generated GDAL
references. `regional-2026-11-09.json` records one darwin/arm64 Node run; timing and
memory vary by runtime, machine load and garbage collection.

Every mesh/fixture case uses a separate child process. Warm timing is measured
before allocation profiling. The subsequent 21 builds use V8 sampled allocation
profiling, including collected objects; samples estimate JS allocations, not exact
allocation counts, and exclude ArrayBuffer backing stores. `arrayBufferBytesBefore`
and `arrayBufferBytesAfter` are observed live backing-store totals, not allocation
traffic or a peak. `peakRSSKiB` is the OS process high-water value including runtime,
fixture loading, warmup and profiling. Output buffer bytes are exact for the final
mesh. These metrics must not be interchanged or treated as per-build peak memory.

Regular meshes use all 33×33 reference samples. Adaptive runs use the first complete
9×9 crop and a five-meter requested error. Nodata-heavy adaptive cases without a
complete crop explicitly report unsupported input; no holes are filled. Observed
nodal error does not certify between-node surface error. Fixtures qualify declared
EPSG:3857 projected metric operations, not ground-distance slopes or vertical datums.
Source provenance, public-domain provider credits, hashes and regeneration are in
`modules/geospatial/test/terrain/fixtures/README.md`.

`node scripts/benchmark-terrain-regions.mjs` measures a declared one-sample edit in a
129×129 field plus 2,000 separated contour components and 2,000 isoband patches.
`regions-2026-11-09.json` records one diagnostic run: 1/64 mesh regions rebuilt,
9 bounds leaves and 9 gradient leaves recomputed, and 286,816 topology tests for
2,000 simplified paths. These counts are regression evidence for the selected
workloads, not worst-case complexity claims. Dirty-update timing includes hierarchy
array copies and full derivative-grid generation. Dense intersecting candidate boxes
can still exhaust the bounded topology budget.
