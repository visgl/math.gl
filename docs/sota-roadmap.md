# SOTA roadmap

This is the library-wide roadmap for math.gl v5 and subsequent work. It follows six
tranches: consolidation and baselines, numerical robustness, WebGPU projection
conventions, efficient bulk operations, global geospatial correctness, and measured
acceleration. SOTA means progress demonstrated within documented accuracy and
performance domains; no universal speed or accuracy ranking is claimed.

The [projection module roadmap](./modules/proj4/roadmap.md#remaining-performance-and-geodetic-roadmap)
provides finer-grained implementation tranches. Its numbered 8–14 tranches are
module milestones, not replacements for the six library-wide priorities below.

## 1. Consolidate v5 and establish correctness/performance baselines

Milestones: review public entry points, ownership and compatibility contracts;
qualify packed ESM/CommonJS/type consumers; record reproducible correctness,
throughput, allocation, startup and bundle-size baselines for representative modules.
Document alpha API changes and the intended v5 supported profile.

Acceptance: each public package has a documented support boundary and a repeatable
validation command. Baselines record workloads, versions, platform, samples and
numerical tolerances. Correctness and reviewed bundle budgets gate changes; shared
runner timings are evidence with variability, rather than universal speed guarantees.

Projection progress: tranches 8–12B3 provide an implemented measurement and correctness
foundation. Maintain it through tranche 14 as new operations are added. Their completion
does not imply that every math.gl package has completed this library-wide tranche.

## 2. Improve numerical robustness

Milestones: audit conditioning, singular and degenerate inputs, inversion and error
handling in core math, geometry and geospatial operations. Expand independently
computed references and publish errors over bounded domains. Preserve existing
mutation and failure contracts when refining algorithms.

Acceptance: report forward/inverse error and worst inputs against independent
references, including boundary and degenerate cases. Round trips supplement the
oracle; they do not prove accuracy. Document precision limits and rejected domains.

Projection milestones: completed tranche 11 and the declared 12B3 pipeline profile, with
continued parameter/singularity qualification in 14.

## 3. Add WebGPU-compatible projection conventions

Milestones: explicit graphics projection depth conventions for perspective,
orthographic and off-center matrices; evaluate reversed depth and infinite far
planes with compatible projection/unprojection and culling behavior. Document matrix
layout, handedness, clip versus framebuffer coordinates, and interoperation with
rendering libraries. Preserve the existing WebGL defaults.

Acceptance: analytic near/far and frustum-boundary cases, independently checked
matrix results, and tests covering project/unproject and culling for each supported
convention. WebGPU uses normalized device depth from 0 to 1; follow the
[WebGPU coordinate-system specification](https://gpuweb.github.io/gpuweb/#coordinate-systems).

These are CPU-side matrix/API conventions. Optional geospatial GPU execution in
projection tranche 13D is a separate acceleration investigation.

## 4. Expand allocation-efficient bulk operations

Milestones: reusable output storage and Float32/Float64 buffer operations for selected
core transforms, projection and geometry workloads. Define strides, offsets, aliasing,
ownership and failure behavior before adding APIs. Reuse the bulk paths in existing
geometry/GeoArrow integrations where they fit.

Acceptance: scalar/bulk equivalence with precision-aware tolerances; validation for
views, interleaved records, preserved trailing ordinates, overlapping buffers and
partial failures. Record allocation, throughput and bundle cost on representative
small and large workloads before and after each change.

Projection milestones: completed tranche 10 and planned 13A, including the general
pipeline, projected-to-projected transformations, grids/datums and XYZM workloads.

## 5. Strengthen global geospatial correctness

Milestones: expand antimeridian, polar, global extent and coordinate-order coverage;
qualify ellipsoid, datum, height and grid behavior with licensed independent data.
Add explicit modern geodetic operations and supported CRS combinations where the
math can be executed and independently checked.

Acceptance: representative hemispheres, wrap boundaries, poles, grid edges and
height/axis cases pass documented forward/inverse budgets. Unknown CRS metadata,
missing resources and unsupported transformations fail explicitly. Epochs are supplied
separately from M; model accuracy and numerical interpolation accuracy are distinct.

Projection milestones: landed 12B3, 12C1 pending in
[PR #172](https://github.com/visgl/math.gl/pull/172), planned 12C2 and 12D, and
continued qualification in 14. Tranche
12E may select from a bounded, optional operation catalogue with visible provenance;
it does not introduce an unrestricted EPSG/GIS engine.

## 6. Pursue acceleration only when measurements justify it

Milestones: profile JavaScript first, then evaluate optional Wasm/SIMD kernels,
workers and rendering-oriented GPU paths for workloads with demonstrated potential.
Keep preparation, asynchronous execution and buffer ownership explicit.

Acceptance: compare complete operations including startup, compilation, copying,
transfers and any readback. Publish crossover sizes, platform/device information,
accuracy envelopes, memory and optional bundle cost. Retain the ordinary JavaScript
API and fallback. An experiment may conclude that no acceleration should ship.

Projection milestones: 13A establishes the next profile; 13B–13D evaluate optional
execution paths, with tranche 14 maintaining independent qualification.

## Sequence and scope

Establish tranche 1 baselines first. Numerical robustness in 2 and geospatial
qualification in 5 accompany all changes. Graphics conventions in 3 and bulk work
in 4 can progress independently once their contracts and baselines exist. Pursue 6
only after profiling identifies a worthwhile target.

math.gl remains a focused graphics, geometry and geospatial math library. This plan
excludes BLAS replacements, tensor frameworks, general GIS engines, full spatial
query/analysis platforms and a bundled unrestricted CRS/operation database. Loading,
rendering, data-service orchestration and grid/model distribution remain the
responsibility of applications and their chosen integrations. New readers, catalogues
and execution backends should remain optional and respect package boundaries.
