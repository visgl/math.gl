# Browser-worker terrain edit arrivals

## Decision

Keep scheduling caller-controlled. The browser measurements do not support a
universal default change. Opportunistic batching lowers Sierra's median run p99
in the frame-work workload, but individual repeats and Pacific workloads disagree.
A 2 ms bounded wait consistently has worse median tails in that workload. It is
not a 2 ms end-to-end latency cap: timer delivery, dispatch backlog, worker messages
and main-thread work all contribute.

This tranche adds the missing real-browser experiment, not another runtime
optimization justified by a favorable isolated run. Runtime exports, dependencies,
worker ownership semantics and meshing behavior are unchanged.

## Method

The harness uses Chromium module workers through the public `TaskRunner` transport
and initialized `TerrainResidencyTask`. It uses the same pinned Pacific and Sierra
DEM fixtures and sparse edge/interior/nodata edits as the earlier worker replays.
Each dataset has 320 resident tiles: four translated copies of the 80-tile mixed
coarse/fine layout. This scales residency; it is not four independent DEM regions.

Each trial has 128 edits and one of two explicitly **synthetic** arrival traces:

- Brush cadence: four edits per 60 Hz frame, with an 80 ms pause halfway through.
- Streaming cadence: eight edits spaced 0.35 ms apart every 33 ms, with a 75 ms
  pause after each group of 32 edits.

These model interaction and streaming cadence, not captured user sessions or a
spatially continuous brush stroke. Independent browser timers deliver actual
arrivals. An optional animation-frame loop does 3 ms of CPU work per frame to
model main-thread contention. It does not render a scene or exercise GPU code.
The control sets that work to zero; it does not remove OS or other browser work.

For each DEM/trace, four repeats rotate and reverse the six combinations of copy
or transfer and single, opportunistic or 2 ms bounded-wait dispatch. Batches are
capped at eight, never contain future arrivals, and have one revisioned request
in flight. Each trial initializes a fresh worker, warms it with 16 edits, resets
source tiles and obtains a baseline snapshot. This is a modest warmup, not proof
of steady-state JIT behavior. Dataset/trace blocks and the two frame-work settings
run sequentially; only policy/ownership variants are interleaved within blocks.

The full-rebuild oracle is prepared separately for every edit prefix before the
browser trials. Every committed changed-tile set, removed-key list and reconstructed
snapshot is checked exactly against the corresponding full rebuild. All policies
must deliver the identical ordered edit stream. Oracle checks and Playwright JSON
serialization happen outside measured dispatch/acknowledgment intervals.

The report retains p50/p95/p99 and the actual p99 edit's components:

1. Scheduled-to-observed arrival delay, including timer delivery and main-thread
   availability. Browser timers can deliver slightly early after delay rounding.
2. Observed-arrival-to-send queue delay, including intentional waiting and backlog.
3. Send-to-worker-entry inbound time, including task protocol, serialization and
   scheduling; this is not pure transport time.
4. Worker entry-to-exit time, with apply/halo/delta/process stage percentiles.
5. Worker-exit-to-main-ack outbound time, also including protocol and scheduling.

The components belong to the **same edit**, rather than subtracting unrelated
percentiles. Browser clocks are quantized; tiny negative cross-context intervals
are retained instead of clamped. Worker interval distributions in `metrics` are
edit-weighted; `stages` distributions are per request. No browser allocation or GC
attribution is claimed. Per-run p99 is nearest rank (the second-slowest of 128
edits), and medians of four run percentiles are descriptive, not confidence bounds.

## Results

See the [machine-readable trial summaries](./browser-worker-arrivals-2026-11-15.json)
for all repeats, stage timings, p99 witnesses, source hashes and raw-report hashes.

The 3 ms frame-work sweep completed 96 trials, all with exact full-rebuild parity.
Chromium 151.0.7922.34, Node 24.5.0, Apple M2, 8 logical CPUs; runtime base
`09e237eadc39cdb37b7daa70b111758fa51ca3eb`. One-minute host load was 5.57 at
start and 6.27 at finish. This was not an isolated machine.

Median of four run p99 values, in milliseconds (scheduled arrival to ack):

| DEM | Arrival | Ownership | Single | Opportunistic | Bounded wait |
| --- | --- | --- | ---: | ---: | ---: |
| pacific | brush | copy | 5.167 | 4.200 | 9.300 |
| pacific | brush | transfer | 5.617 | 6.783 | 8.500 |
| pacific | streaming | copy | 5.175 | 5.700 | 10.750 |
| pacific | streaming | transfer | 7.600 | 5.300 | 10.850 |
| sierra-nodata | brush | copy | 4.700 | 3.950 | 8.367 |
| sierra-nodata | brush | transfer | 5.183 | 3.950 | 9.217 |
| sierra-nodata | streaming | copy | 5.575 | 5.250 | 11.825 |
| sierra-nodata | streaming | transfer | 6.925 | 5.825 | 12.675 |

Sierra transfer brush favors opportunistic batching in three of four paired repeats;
streaming favors it in two, ties in one, and regresses in one. Pacific transfer
brush regresses in three of four repeats. This is insufficient evidence for a
global default change. No runtime scheduling change is included.

The zero-frame-work control also completed 96 trials with full parity. Its
shared-host load rose sharply (one-minute load observed at 65.90 during the run).
Do not interpret differences between these sequential sweeps as the causal cost
of frame work. The control is retained to expose variability, not discarded as an
unfavorable result. Within-control median run p99 values follow:

| DEM | Arrival | Ownership | Single | Opportunistic | Bounded wait |
| --- | --- | --- | ---: | ---: | ---: |
| pacific | brush | copy | 4.133 | 4.767 | 8.650 |
| pacific | brush | transfer | 5.917 | 4.150 | 8.683 |
| pacific | streaming | copy | 4.675 | 3.250 | 11.300 |
| pacific | streaming | transfer | 3.775 | 3.850 | 10.725 |
| sierra-nodata | brush | copy | 3.433 | 2.817 | 8.333 |
| sierra-nodata | brush | transfer | 3.183 | 3.100 | 7.833 |
| sierra-nodata | streaming | copy | 6.400 | 5.950 | 9.550 |
| sierra-nodata | streaming | transfer | 4.325 | 5.200 | 10.400 |

## Reproduction and follow-up

```sh
node --test scripts/terrain-browser/*.test.mjs
TERRAIN_REPEATS=4 TERRAIN_LAYOUT_COPIES=2 \
  node scripts/benchmark-terrain-browser-arrivals.mjs > /tmp/browser-frame.json
TERRAIN_REPEATS=4 TERRAIN_LAYOUT_COPIES=2 TERRAIN_FRAME_WORK_MS=0 \
  node scripts/benchmark-terrain-browser-arrivals.mjs > /tmp/browser-control.json
node scripts/summarize-terrain-browser-arrivals.mjs \
  /tmp/browser-frame.json /tmp/browser-control.json > /tmp/browser-summary.json
```

Install the repository dependencies and Playwright Chromium first. The harness
serves only its generated modules on an ephemeral loopback port. It fails on
worker errors, revision mismatches, page errors or any parity mismatch. Replay
timeouts terminate the trial instead of silently dropping outstanding edits.

The checked-in summaries retain every trial and its p99 witness. Raw per-edit
samples remain in the generated reports; their hashes identify the summarized
inputs. The later control report also includes response buffer bytes and a trace
hash, added after the first sweep. This metadata-only addition does not change
the timed replay. Response bytes exclude protocol metadata and internal copies.

Next, repeat on an isolated host and replace synthetic cadence with anonymized
consumer arrival traces. Require paired improvements across Sierra ownership and
arrival cases, report Pacific regressions, and keep exact full-rebuild parity
before changing a caller scheduling default. Browser-specific message scheduling
should remain separate from terrain math; these benchmark helpers and fixtures
are not published runtime imports.
