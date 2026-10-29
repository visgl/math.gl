# Persistent target patch

The comparison reuses a 32×32-cell patch in unit-sphere orthographic coordinates [-0.25,0.25]².
Its supported Antarctic source and centers (85–90°S) keep it away from moving horizons and the
source footprint boundary. Batch evaluation checks all vertices, edge midpoints and centroids;
invalid coverage or excess source-texel interpolation error rejects the whole update. The
existing full-mesh recipe is the fallback when policy, topology or domain changes. Finite probes
remain sampled qualification rather than a certificate for arbitrary converters.

`PersistentUVLayer` retains SimpleMeshLayer's model and writes a dedicated UV buffer. The full
replacement comparator deliberately rebuilds the same target patch with the same UV error policy.
Both receive freshly evaluated UVs. Browser tests verify one persistent model, twelve replacement
models and twelve UV writes. Disposal releases the owned UV buffer. Selection changes cancel the
run and stale results cannot publish. The normal source-grid comparison is restored afterwards by
changing a selector; this mode does not silently relabel a source-grid mesh as target-grid reuse.

The projection contract is projection-engine agnostic. Batch inputs and outputs are owned arrays;
backend operation contexts are disposed each frame. Static geometry reuse does not imply reuse of
projection operations across changed parameters. Source, chart and camera policies remain part of
application identity. No new public API, renderer dependency in published modules or nested export
is introduced. The example's private luma.gl dependency is for measuring actual buffer updates.

The exported report separates operation creation, preparation, CPU upload submission and bytes.
It does not claim worker-transfer or GPU-completion timings. Main-thread orchestration is explicit;
proj-wasm may perform its own worker transport. Frame-rate guarantees and generic domain-changing
reuse remain downstream work.

[Feedback sections 3–4](https://github.com/mdsumner/sidebyside/blob/main/article/2026-10-13_custom-projections-deckgl.md#4-name-the-dynamic-case-as-a-non-goal-or-own-it).


Per-update byte counts cover geometry buffers and indices: replacement includes the normalized
normal/color attributes generated for SimpleMeshLayer, while reuse records UV writes. They exclude
initial persistent-geometry allocation, texture upload, instance attributes, uniforms and driver
allocation overhead. For the 1,089-vertex patch, each replacement submits 72,492 geometry bytes
versus an 8,712-byte UV update. CPU submission time is still not GPU completion time.

## Explicit invalidation and fallback

**Exercise reuse limits** demonstrates two accepted centers followed by one outside
the fixed patch's qualified center range. `updateOrRebuild` handles typed policy
reasons (`domain-policy`, `source-coverage`, `texture-error`) and invokes the
caller's full-mesh preparation. It does not swallow backend errors, malformed
batches, cancellation or fallback failures. A fallback result is published only
if its generation is current. The UI displays the rebuilt full mesh and exports
the reason; the fixed patch is retired, not stretched to cover the new domain.

This is an example-owned policy boundary, not an automatic cache or generalized
view-following implementation. Independent tests also exercise coverage and texture
invalidation, cancellation during fallback and propagation of backend failures.
