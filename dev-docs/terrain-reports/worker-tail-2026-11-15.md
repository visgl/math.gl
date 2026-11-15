# Worker edit allocation and tail-latency qualification

This investigation follows #559's Sierra edit-to-ack p99 increase from 4.061 to
4.845 ms. It distinguishes a reproduction attempt from an optimization result.
There is no change to the default dispatch policy or to terrain sampling,
transaction, ownership, public export, or work-budget contracts.

## Method

The benchmark uses the pinned Pacific and Sierra nodata streaming fixtures,
checks their source raster hashes, and translates four copies of each 80-tile
layout into a 320-tile resident cut. Every trial applies the same 128 edits,
including interior/corner edits, repeated edits to one tile, and nodata changes.
It alternates revision order across repetitions and creates a fresh worker for
each trial. Initialization, a 16-edit warmup, reset and seed snapshot precede
measurement, matching the earlier batching replay.

The unprofiled sweeps cover singles, opportunistic batches and 2 ms bounded waits,
both sparse arrivals and eight-edit bursts, and both copy and transfer ownership.
Each revision has two trials per configuration: 96 trials in the initial historical
comparison, then 144 trials comparing all three revisions together.
The old implementation is `aeb20e6e` (before #559), and the current-master baseline
is `4f523e14` (after #560). The candidate source bundle hashes and final trial summaries are in the
[JSON report](./worker-tail-2026-11-15.json). The measured runtime was Node 24.5.0
on an 8-logical-CPU Apple M2; these are local observations, not portable guarantees.

Full rebuilds of every edit prefix are prepared before timing and retained on the
main thread. Every committed delta must contain exactly the changed halos; the
reconstructed snapshot and separately executed direct incremental update must
match the corresponding full rebuild. Qualification is outside the timed worker
loop. Reusing identical oracle prefixes avoids repeatedly paying for full rebuilds
without reducing the number of checked commits. The oracle is built from the
first, historical runtime, independently of the candidate incremental updater.

Timing attribution uses actual per-request observations:

- Scheduled arrival to dispatch includes timer wakeup, intentional batch wait and
  backlog behind preceding serialized requests.
- Dispatch to worker entry includes input serialization, task protocol and OS
  scheduling. Worker exit to acknowledgement includes output serialization or
  transfer, task protocol and OS scheduling. Neither is pure wire time.
- Worker stages separate edit application, halo update and reply preparation.
- Transport controls use the median-sized reply from each trial, cloning it in
  the worker and exercising the same task transport without terrain computation.
  Clone time and the two directional intervals are reported separately.

CPU and allocation profiling are separate diagnostic runs. The 4 KiB sampling
interval includes objects subsequently collected by minor and major GC. Sampled
JavaScript allocation bytes are estimates of allocation traffic, not counts of
all native allocations or retained bytes. Worker heap/ArrayBuffer peaks are
observed at request boundaries; process RSS includes the main-thread oracle.
Forced-GC retained-memory measurements bracket the diagnostic replay, and do not
enter the unprofiled latency measurements. Inspector sampling perturbs execution,
so profiled latency is not used as performance evidence.

## Reproduction and interpretation

The interleaved reproduction passed all 96 trials, but did **not** reproduce the
small Sierra p99 regression. Median per-run edit-to-ack p99 was 81.476 ms before
#559 and 48.880 ms afterward on Sierra (Pacific: 26.564 and 14.738 ms).
These are medians of configuration-level percentiles, not pooled edit quantiles.

This host was heavily contended: observed load averages exceeded 100, with long
inbound, outbound and queue delays. The measurements are far above the original
4–5 ms values. They do not establish that the original regression was fixed or
that a different batching policy should become the default. The new harness
retains raw samples, GC events, source hashes and, in subsequent runs, load
averages so a quieter-host reproduction can distinguish these effects.

## Allocation changes

The first profile identified per-resident-tile map tuples, frame-validation
callbacks, iterator-result objects and the duplicate-address Set as major sources
of small allocations. The implementation now:

- Retains an address-to-slot index across immutable sample-only layouts and copies
  one reference array per transaction; structural edits lazily create a private
  map. Weak snapshot keys bound index lifetime to live snapshots.
- Copies validated sample buffers once, retaining Float32/Float64 precision,
  strided-input normalization and nodata semantics. Unvalidated upserts still use
  full HeightField validation before sample edits.
- Uses scalar frame/coordinate checks and indexed hot loops, avoiding temporary
  per-sample coordinate arrays and iterator results.
- Detects duplicate addresses by adjacency in the existing canonical sort, and
  allocates sampling-index layout keys only when that layout changes.

The final diagnostic pass measured **78–81% less sampled allocation traffic**
across the four DEM/ownership combinations. Median allocation per 128-edit run
fell from 34.97 to 7.16 MB on Pacific and 34.72 to 6.96 MB on Sierra. In these
forced-GC-bracketed diagnostic runs, median GC counts fell from 23 to 7 on Pacific
and 22.5 to 8.5 on Sierra. GC counts depend on heap conditions and profiling;
unprofiled runs are retained separately.

After forced collection, ArrayBuffer totals were identical between revisions
(1,435,698 bytes Pacific; 1,405,448 bytes Sierra). Median retained JavaScript heap
increased approximately 23.5 KB and 27.7 KB respectively, consistent with trading
a retained layout index for less temporary allocation. Peak observed heap was
broadly similar. This is an allocation-rate improvement, not an 80% reduction in
retained memory. Remaining profiles include sort workspace, snapshot reference
arrays and independently owned returned buffers.

## Final timing evidence

All **144 unprofiled final trials** matched historical full rebuilds at every
commit, including direct incremental snapshots. These numbers are medians of
per-run percentiles across 24 runs per DEM and revision. They summarize the
stratified sweep, not a universal scheduling recommendation.

| Metric (ms) | Pacific master → candidate | Sierra master → candidate |
| --- | --- | --- |
| Apply edits p50 | 0.0779 → 0.0197 | 0.0972 → 0.0257 |
| Halo update p50 | 0.3105 → 0.2504 | 0.4246 → 0.3616 |
| Worker process p95 | 1.1610 → 0.8985 | 1.9655 → 1.5363 |
| Edit-to-ack p99 | 12.2065 → 4.7234 | 7.7770 → 8.5132 |
| Direct incremental p95 in sweep | 0.4537 → 0.4514 | 0.7144 → 0.9532 |
| Representative transport-only p95 | 0.4830 → 0.4551 | 0.3356 → 0.6250 |

Full-rebuild p95 was 40.645 ms on Pacific and 17.712 ms on Sierra in the historical
oracle. It is compute-only and prepared once, not an end-to-end worker baseline.
The final sweep's observed one-minute load averages ranged from 15.6 to 24.7.

Worker processing p95 improved about 22% on both DEMs, but **Sierra end-to-end p99
still increased** in this comparison. The original #559 regression was again not
reproduced: Sierra's before-#559 median run p99 was 21.255 ms versus 7.777 ms on
master. No tail-latency fix or default scheduling policy is claimed.

To examine the tail without subtracting unrelated percentiles, the summary
records the actual event at each run's p99 rank. Queue delay accounts for 77.7%
of summed Sierra p99-event latency on master and 79.5% on the candidate. None of
these selected worker-processing intervals overlapped a recorded worker GC event.
This does not rule out main-thread GC, earlier worker GC, transport or OS stalls;
queue delay also includes intentional bounded waits and prior requests. The
transport-only control remains sensitive to scheduling and uses a representative
reply size, not every edit's exact payload.

The direct segment of the broad sweep is mixed, so a separate warmed alternating
probe applies one complete warmup replay before each measured replay, using the
same historical full-rebuild oracle and precomputed immutable source arrays.
Only the updater is timed; the broad sweep also packs the resident source array
inside its direct-update interval. Eight runs per DEM/revision (32 total)
verified every warmup and measured snapshot. Median run direct p95 was
1.195 → 0.910 ms on Pacific and 0.454 → 0.421 ms on Sierra. These observations
support a reduction in steady-state work, while the broad sweep shows why cold
runs and scheduling tails must remain visible. The exact-frame fast path avoids
computing a tolerance when both frame origins are equal; differing origins still
receive the original tolerance check.

Next measurement: repeat on a quiet dedicated host and in browser workers with
real arrival traces, particularly Sierra transfer mode. Keep the raw per-request
samples and compare paired trials before changing dispatch policy. Further
allocation reduction should target the remaining sort/reference-array work;
returned buffers must remain independently owned.

## Reproduce

```sh
# Historical regression attempt, alternating baseline/candidate order.
TERRAIN_LAYOUT_COPIES=2 TERRAIN_TAIL_REPEATS=2 \
  TERRAIN_TAIL_REFS=aeb20e6e,4f523e14 \
  node scripts/benchmark-terrain-worker-tail.mjs > /tmp/reproduction.json

# Unprofiled candidate comparison, with every configuration qualified.
TERRAIN_LAYOUT_COPIES=2 TERRAIN_TAIL_REPEATS=2 \
  TERRAIN_TAIL_REFS=aeb20e6e,4f523e14,working-tree \
  node scripts/benchmark-terrain-worker-tail.mjs > /tmp/candidate.json

# Separate diagnostics. Do not use these timings as latency evidence.
TERRAIN_LAYOUT_COPIES=2 TERRAIN_TAIL_REPEATS=2 \
  TERRAIN_TAIL_REFS=4f523e14,working-tree TERRAIN_PROFILE=1 \
  TERRAIN_BURSTS=1 TERRAIN_POLICY=single \
  node scripts/benchmark-terrain-worker-tail.mjs > /tmp/profile.json
```

Run `TERRAIN_LAYOUT_COPIES=2 node scripts/benchmark-terrain-direct-edits.mjs`
for the warmed direct probe, redirecting its output to `/tmp/direct.json`. Generate the checked-in summary shape with
`node scripts/summarize-terrain-worker-tail.mjs /tmp/candidate.json /tmp/profile.json /tmp/direct.json`.
The summary retains per-trial percentiles, p99-event attribution, memory counters
and leading sampled allocation stacks, plus hashes of the raw reports.

`TERRAIN_DEMS` can select `pacific` or `sierra-nodata`; `TERRAIN_CHECKPOINT` writes
completed trials after each qualification. Raw JSON includes per-request samples
and full inspector profiles. Keep those artifacts for detailed investigation;
summary reports omit the large raw traces.
