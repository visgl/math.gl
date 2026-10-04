# Projection allocation audit

The October 2026 audit reads every TypeScript runtime source in `modules/projection/src`
(223 files), then reviews coordinate dispatch, all named algorithms and their numerical
helpers, grid readers/samplers, datum/height/epoch operations and lazy loading. Allocation
reduction is valuable even when throughput differences are within measurement noise:
small objects increase allocation traffic and the work required of the garbage collector.

## Findings and changes

| Area | Previous allocation | Current behavior |
| --- | --- | --- |
| Horizontal NTv2 and GeoTIFF loading | One two-number array per node, plus the containing node array | One owned, interleaved Float64Array per subgrid; 16 bytes per node |
| Ellipsoidal AEQD / Vincenty | One result object per forward/inverse coordinate, including nonconvergence results | Helper writes into the caller's working point; azimuth/distance are read before final XY is committed |
| Robinson | One result object in each direction, plus an inverse Newton callback capturing coefficients/target | Reuses the caller's point and passes coefficients/target directly to Newton iteration |
| Oblique Mercator | One result object in each direction | Reuses the caller's point after input-dependent arithmetic finishes |
| QSC | Coordinate result and boxed area objects in each direction | Caller-owned point plus local numeric coordinates and area; all six face equations retained |
| Tilted perspective | One temporary inverse coordinate object | Two local numbers, preserving the original branch/equation order |
| Static Helmert bulk direction | Mutable point fields per record in general dispatch | Numeric locals for a single active static stage; no point writes or coordinate objects in the loop |
| Kinematic Helmert bulk direction | Mutable point fields and per-record matrix reads in general dispatch | Numeric locals for a single active rate stage; constant epochs prepare once, mixed epochs share owned scalar coefficients; no coordinate objects in the loop |
| Horizontal-grid tuple API | A working point and returned pair per call | One private point per prepared grid, reset on each call; returned pairs remain owned results |
| Scalar/bulk engine/plugin/pipeline dispatch | A working point on each call; a typed stack on each pipeline call that uses stacks | One owned point per instance/adapter, shared between scalar and general bulk calls, plus a lazily cached pipeline stack; nested hooks use independent fallback storage |

Mutable built-in projection hooks now have no explicit successful per-coordinate
object/array/function creation in the audited numerical paths. Datum conversion,
vertical/velocity samplers, exact/kinematic Helmert and deformation already use mutable
points, local numbers or prepared coefficients. This does not prove zero allocation in
an optimizing JavaScript engine: number boxing, iterator handling, built-ins and custom
implementations need separate heap profiling.

## Allocations deliberately retained

- Optional `OperationCatalog` snapshots selection metadata during construction and
  prepares request metadata during `select` / `inspect`. Diagnostic arrays are owned
  results. Select once before a batch; this metadata API adds no allocations to
  coordinate execution loops.

- `project` / `unproject` return a new coordinate array. Ordinary engine, plugin and
  pipeline scalar calls reuse owned scratch; recursive hooks receive independent working
  points/stacks, released in `finally` even when input getters or callbacks throw. Internal
  geocentric tuple adapters still construct a working point and returned tuple; built-in
  bulk paths use their mutable variants. `projectToSync` / `unprojectToSync` avoid public
  result arrays by borrowing caller-owned storage, with explicit capacity, alias and
  Float32 overflow checks. `*To` is synchronous for eager lists; deferred lists still
  snapshot input and create promises even after preloading.
- Ordinary `projectFlat` / `unprojectFlat` calls borrow the same instance point/stack
  lease used by scalar calls. Pipeline stacks allocate on first use and remain cached;
  recursive calls allocate independent fallback storage. Unit/axis-only pipelines use
  local numeric coordinates and a construction-time instruction buffer. Other fused flat
  adapters likewise retain completed-record commits and Float32 overflow rules.
- Legacy custom plugins/grids can allocate array results inside a bulk operation.
  Implement `forwardInPlace` / `inverseInPlace` or `shiftInPlace` to avoid that fallback;
  velocity models receive an explicit output point. User hooks control their own allocations.
- CRS parsing, option snapshots, plugin factories, lazy imports/promises, constant tables
  and grid preparation allocate at setup/loading time. Lazy scalar calls snapshot input
  before awaiting loading. These allocations protect isolation and are outside point loops.
- Failure reporting constructs errors and sometimes diagnostic arrays. It is excluded
  from successful-coordinate checks.

## Repeat the audit

```sh
node modules/projection/scripts/audit-allocations.mjs --check --output /tmp/projection-allocations.json
```

The TypeScript AST inventory records every object/array/regexp literal, `new`, closure
and common allocating method, with file/line and enclosing scopes. The CI check rejects
explicit allocations in numerical kernels/helpers, mutable equation callbacks, selected
coordinate dispatch/samplers, reusable-output validation/commit helpers and bulk record loops, including the numeric
unit/axis and direct static/kinematic Helmert runners. The grid tuple
adapter permits its owned result array but rejects other explicit allocations. Reviewed setup exceptions cover
coefficient builders, Oblique Mercator type selection and Robinson's module-level table
rounding. The guard is intentionally a source regression check, not a complete static
call graph or an allocation profiler. Review inventory entries outside its checked scopes
when adding new helpers or APIs.

Independent PROJ anchors, scalar/flat differential checks and Node/Chromium tests cover
the five modified algorithms. Dense analytic cross-term grids additionally exercise node
orientation, rectangular row strides, edges, nodata and owned input snapshots. Owned scalar outputs remain independently allocated, and Z/M preservation and partial batch failure contracts
remain unchanged. Guarded scalar scratch adds about 0.1–0.2 KiB gzip to selected
bundles. Static/initial allowances increase where exceeded; the all-root gzip allowance
also restores rounding headroom. Deferred budgets stay unchanged.
See the module benchmark documentation for reproducible paired timing
and retained-grid-memory measurements; no noisy speed threshold is enforced in CI.
