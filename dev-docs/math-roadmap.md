# Core math and geometry roadmap

Baseline: master at `f5eebb26f`, reviewed November 6, 2026. This is a proposed
implementation sequence, not a release commitment. Existing functionality is counted
across classes, functional exports, and geometry query kernels.

## Implementation status

Tranches 1–5 are implemented in the current change, pending PR review and merge.
The baseline below records what already existed before that change.

| Tranche | Implementation |
| --- | --- |
| 1 | Shared validated affine decomposition, signed reflection scale, correct column normalization and enclosing AABB transforms. Singular/sheared/projective decomposition is rejected. |
| 2 | Bounds set operations and sphere overlap; explicit NO/ZO and reversed-depth projections; inward frustum extraction with infinite far planes. |
| 3 | Shared vector helpers and class wrappers, scalar helpers reused by sun code, and quaternion rotate-towards. |
| 4 | Ray convenience queries, barycentric/attribute helpers, triangle area/normal/facing/containment, triangle–box overlap and plane–segment intersection. |
| 5 | SampleTrack with discrete/linear/cubic/Bézier modes, adaptive curve sampling and closed-path parallel-transport frames. |

Deliberate contracts: quaternion cubic interpolation is normalized component Hermite,
not squad; adaptive sampling reports sampled chord error, not a certified global
bound. Array-based triangle/segment kernels remain the public representation rather
than adding duplicate wrapper classes. Proper-Euler/cylindrical conveniences and
seeded random remain optional consumer-driven follow-ups, as scoped in tranche 3.
Tranche 6 remains unimplemented.

## Already available

- Core root exports include `mat3`, `mat4`, `quat`, `vec2`, `vec3`, `vec4`
  namespaces and individually named operations. Normal matrices, transform
  composition, NO/ZO depth projections, quaternion angular distance, shortest-arc
  rotations, and vector Bézier/Hermite/spherical interpolation already exist.
- `@math.gl/geometry` and its `/culling` entry export ray–bounds and ray–triangle
  tests, closest points on triangles, segment–segment and segment–triangle closest
  pairs. Triangle ray hits include barycentric coordinates.
- `@math.gl/geometry` provides line, Bézier, Hermite and Catmull–Rom curves, tangent
  evaluation and sampled arc-length mapping. These are not future modules.
- Bounding spheres already support union and expansion. Oriented boxes, analytic
  shapes, rotated 2D rectangle overlap and static spatial indexes also exist.

The [functional math guide](../docs/modules/core/developer-guide/functional-math.md)
addresses discovery and current import paths. Remaining work follows below.

## Tranche 1 — Transform correctness

Priority: highest. Owners: core transforms and geometry bounds.

- Correct `mat4Decompose` and `mat4GetRotation` for rotated nonuniform scales;
  preserve reflection signs and define singular/zero-scale outcomes. Review class
  extraction methods against the same contract. State what happens for shear.
- Correct `AxisAlignedBoundingBox.transform`: transforming only minimum and maximum
  corners does not enclose rotated geometry. Rebuild bounds from all eight corners
  or use the equivalent center/absolute-linear-matrix extent calculation. Update
  all cached fields consistently; translation must not affect half extents.
- Add regression coverage for reflection, rotation plus nonuniform scale, singular
  inputs, translation, shear and round trips. General projective matrices require
  an explicit supported-domain decision rather than an implicit affine assumption.

Acceptance: affine bounds enclose every transformed corner; supported decompositions
recompose within a stated tolerance; unsupported cases have deterministic behavior.

## Tranche 2 — Bounds and camera math

Depends on tranche 1 for bounds invariants.

- Add reusable 2D/3D bounds containment, overlap, union/intersection, expansion and
  point-clamping operations. Reuse existing `Bounds2D`/`Bounds3D` types and define
  empty versus zero-size bounds rather than introducing duplicate storage types.
- Complete sphere–sphere and box–sphere query conveniences where no equivalent
  public kernel exists; reuse current shape and spatial-index implementations.
- Extract inward-facing frustum planes from a view-projection matrix with explicit
  [-1, 1] versus [0, 1] depth conventions, and support perspective and orthographic
  matrices. Define behavior for infinite far planes.
- Add explicit reversed-depth projection support together with matching frustum
  extraction. Existing NO/ZO projection functions cover depth ranges already.

Acceptance: boundary/touching/empty-volume tests and near/far plane checks for each
supported projection convention; agreement between frustum classification and
homogeneous clip inequalities.

## Tranche 3 — Vector and scalar conveniences

Can proceed independently after the API conventions are agreed.

- Vector projection onto a vector or plane, reflection, length setting/clamping and
  Manhattan distance. Define zero-length and non-unit-normal behavior.
- Scalar inverse lerp, range mapping, damping, smoothstep/smootherstep and ping-pong.
  Reuse private helpers where contracts agree; specify degenerate intervals and
  whether out-of-range inputs clamp or extrapolate.
- Quaternion rotate-towards convenience built on angular distance and slerp. Consider
  proper-Euler conversion and cylindrical coordinates if callers justify them.
- Add class wrappers only where they improve discoverability; keep formulas shared
  with functional operations and document units, mutation and allocation.

Acceptance: endpoint, zero/degenerate, aliasing and unit tests; damping is consistent
across time-step subdivisions within tolerance. Seeded random is a separate optional
addition requiring a reproducibility contract.

## Tranche 4 — Complete geometric queries

Build on the existing triangle and segment kernels, not a replacement query layer.

- Ray evaluation, point projection/distance, segment distance and affine transform
  conveniences. Specify ray parameter versus world-distance semantics.
- Standalone barycentric coordinates and attribute interpolation for arbitrary
  triangle points, plus area, facing and containment helpers. Reuse the existing
  closest-point and ray-hit barycentric math.
- Triangle–box overlap and plane–segment intersection; define coplanar, degenerate,
  tangent and endpoint behavior before choosing public signatures.
- Decide whether lightweight Triangle/LineSegment wrappers add value after the
  array-based kernels are complete. Avoid requiring renderer-owned objects.

Acceptance: analytic fixtures, degeneracies, boundary cases and scale-sensitive
checks; public documentation identifies numerical limits without claiming exact
predicates or watertight intersections.

## Tranche 5 — Sample tracks and curve extensions

Existing parametric curves and arc-length lookup remain the foundation.

- Timestamped scalar/vector/quaternion track evaluation with discrete, linear and
  cubic interpolation, interval lookup, reusable outputs and boundary policies.
- Optional Bézier time/value tangent tracks with monotonic-time validation and
  explicit inversion behavior.
- Adaptive curve sampling and parallel-transport frames for paths and swept
  geometry; define repeated-point, zero-tangent and closed-loop behavior.

Acceptance: irregular timestamps, endpoints, duplicate-time policy, quaternion sign
continuity and sequential/random access tests; curve sampling exposes an accuracy
budget and frame tests cover closed paths.

## Tranche 6 — Optional domain extensions

Require concrete consumers and package-scope decisions before implementation.

- Spherical-harmonic evaluation and irradiance helpers.
- Color-space math, separately from renderer color-management policy.
- A public 2x2 matrix API if existing 3x3/array operations do not meet caller needs.

Acceptance: a documented use case, stable numerical conventions, independent
reference fixtures and a clear dependency/bundle-size budget for each addition.
