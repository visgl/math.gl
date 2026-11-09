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

`node scripts/qualify-terrain-streaming.mjs` runs six isolated regional cases:
Sierra/Pacific/nodata-heavy inputs and both raster derivative methods. Each case
streams sixteen 65×65 overlapping patches over a 257×257 source through 32 deterministic
arrival/edit/eviction/restoration steps. Regular mesh regions, persistent extrema and
weighted gradient hierarchies are compared with full rebuilds. Four retained snapshots'
mesh/hierarchy buffers are hashed after later steps to detect mutation.

Pipeline timing includes source/halo copies, regular mesh-region rebuilding and full
derivative grid computation; full-rebuild oracles and retained-snapshot hashing are
outside timing. Those checks still contribute to whole-process RSS and sampled memory
observations. Buffer-copy counters compare persistent block data copies with the
flat dirty-level copy baseline on replacement updates, excluding initialization, input
copies, JS directories and allocation traffic. Results expose arrival-heavy versus
local-edit costs rather than claiming all streaming operations are proportional to
changed samples. The 33×33 GDAL fixtures remain the independent derivative-accuracy
oracle; these regional cases qualify streaming equivalence and memory behavior.

`streaming-2026-11-09.json` records one six-case darwin/arm64 Node run. Each case
verified 4,656,028 hierarchy nodes, retained four immutable snapshots and rebuilt
82 mesh regions across the deterministic stream. Persistent block-buffer copies
were approximately 31.6–33.0% of the computed flat dirty-level buffer-copy baseline.
These are exact data-copy counters for this workload, not measured total allocation
traffic or a claim of the same RSS reduction. Shared block directories still copy
references, and initialization still constructs temporary flat levels. Provider
metadata and source checksums are retained in each case record.

`node scripts/qualify-terrain-coordination.mjs` evaluates 24 real-DEM transition/band
cases: three height fixtures, 2:1/4:1 layouts and four independent factor schedules.
It verifies every duplicated shared knot and compares total interval-band area with
coordinated regular-triangle coverage, including nodata. XY intentionally uses unit
sample spacing; source provenance is in the fixture documentation. Expanded sample
counts expose the cost of the bounded common-lattice reference. Single-run timings
are diagnostic, not sparse-LOD or regional-throughput claims.
