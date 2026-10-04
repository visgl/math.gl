# Ellipsoid convergence

The first step shares geometry and establishes conversion baselines between
`@math.gl/geospatial` and `@math.gl/projection`. Qualified sphere/oblate conversion kernels now share a small optional numeric leaf;
three-radius and interior geospatial behavior remain separate.

## Shared scope and boundaries

| Concern | Geospatial | Projection | Convergence scope |
| --- | --- | --- | --- |
| Shape | Three independent radii, including triaxial/prolate ellipsoids | Sphere or oblate spheroid; equatorial/polar axes and derived eccentricity | Share the sphere/oblate geometry contract only |
| Longitude/latitude/height ↔ Cartesian XYZ | Shared spheroid conversions; surface-normal/Newton for remaining shapes/interior | Shared geocentric equations, bounded Hannover and exterior fallback | Shared forward and qualified surface/exterior inverse |
| Angular units | Degrees by default; global `_cartographicRadians` can select radians | CRS units normalized explicitly; `cart` stages use radians | Preserve each public boundary |
| Undefined center | Returns `undefined` | Throws | Keep distinct adapters around any common kernel |
| Exact polar longitude | `atan2` of the Cartesian normal; signed zero can yield 180° | Canonical zero in the polar branch | Document/qualify the convention; do not equate undefined longitude |
| Surface normals, tangent planes, scaled space, local frames | Public geometry APIs | Internal ENU basis for deformation | Continue as separate capabilities |
| Datums, grids, Helmert transforms and epochs | Not supplied by the Ellipsoid class | Explicit CRS/pipeline operations | Shape adapters cannot infer these semantics |

## Geometry adapters: implemented preparation

- `SpheroidParameters` is a shared type-only contract in `@math.gl/types`, re-exported
  by core, geospatial and projection. It contains finite positive equatorial/polar
  axes in metres, with `semiMinorAxis <= semiMajorAxis`.
- `Ellipsoid.fromSpheroid()` consumes a geometry snapshot, including the structural
  shape returned by `normalizeCRS().ellipsoid`. Derived fields are not imported.
- `Ellipsoid.toSpheroid()` returns a new frozen geometry snapshot and rejects lossy
  conversion of triaxial/prolate/degenerate shapes. The existing constructor is unchanged.
- Projection's internal ellipsoid type extends the shared axis contract. Its
  normalization and conversion arithmetic were unchanged during preparation.
- Cross-module tests cover WGS84, GRS80, Airy, International and a sphere; both
  hemispheres, antimeridian, exact/near poles, negative heights and orbital heights.
  Existing pinned PROJ cart fixtures and authored cardinal/spherical anchors qualify
  both implementations independently; agreement alone is not an accuracy claim.
- Tests preserve caller-owned and aliased outputs, Float32/Float64 batch behavior,
  views/tails, M, global radians configuration, center rejection and polar conventions.
- Packed ESM/CommonJS consumers and strict TypeScript declarations verify the public
  adapter contract without workspace aliases. Projection's production dependencies
  do not acquire geospatial; it is a test-only dependency.

The sampled Earth-scale domain uses 10 μm Cartesian/height and 1e-9 degree angular
comparison tolerances, including ±89.999999° after the numerical follow-up below.
Float32 batch quantization is qualified separately. These are regression tolerances,
not a bound on arbitrary eccentricities, deep interior coordinates, extreme finite
radii or the whole mathematical domain.

## Numerical boundaries: implemented follow-up

- Geospatial derives latitude with `atan2(normal.z, hypot(normal.x, normal.y))` to
  retain near-pole angular precision. The existing three-radius surface kernel,
  degree/radian boundary and exact-pole longitude convention remain separate.
- Surface inversion validates numeric inputs before debug vectors, stops after at
  most 64 Newton updates and returns `undefined` on non-finite intermediates,
  singular updates or exhausted iteration. Caller outputs remain untouched on
  those failures. Center-neighborhood radial fallback remains an approximation;
  it is not equivalent to projection's geodetic inverse.
- Two temporary inverse arrays are removed. Numeric output commits snapshot
  ordinates before invoking application setters, so recursive output writes cannot
  replace later values with shared scratch contents.
- Projection uses the analytic spherical inverse rather than an eccentricity
  iteration/polar threshold when eccentricity is zero. Nonzero near-center/near-axis
  vectors retain their directions; exact poles retain canonical zero longitude.
  Center and overflowing Cartesian radius fail before output commit. The oblate
  Hannover iteration and its 30-update bound remain intact.
- Authored sphere/cardinal/normal anchors qualify flattened, prolate and triaxial
  geometry, finite failure recovery, aliasing, preserved M and recursive outputs.
  No external code or model data is added; existing SPDX attribution stays attached
  to each CesiumJS/proj4js-derived file.
- A paired diagnostic covers WGS84, a sphere and a 2:1 flattened spheroid in regional
  and near-pole domains, both directions, reusable scalar outputs and projection
  flat buffers. It records all-coordinate analytic checks, source/workload hashes,
  sampled allocations, raw timing and spread/aggregate warnings. See
  [the benchmark report](../docs/modules/projection/benchmarks.md#spheroid-numerical-boundaries).

The candidate meets the tighter near-pole regression allowance but does not establish
universal inverse accuracy or a speedup. Input generation/setup/loading are outside
timing; shared-kernel setup and broader singular-domain qualification remain future
work. A dedicated source guard rejects successful coordinate allocations in the five
modified numeric functions while allowing owned default results and failure errors.

## Shared spheroid conversion kernels: qualified domain implemented

The optional `@math.gl/core/spheroid` entry has no runtime imports and is absent
from the core root graph. Projection imports only that numeric leaf; it does not
acquire geospatial classes, tangent planes or culling. No production dependency is
added. It exports numeric forward/inverse functions with caller-owned point
outputs and explicit radians/distance units, without CRS/model/global state.

Sphere/oblate forward arithmetic is shared. Geospatial uses the shared inverse
only on the qualified surface/exterior domain (with a rounding allowance at the
surface), preserving its representability limits, signed-zero polar longitude and
undefined-output convention. Three-radius/prolate and interior geometry retain the
Cesium surface kernel, 64-update bound and near-center radial approximation.
Projection retains its ordinary Hannover interior branch, near-axis canonical
longitude and thrown-error convention. A new safeguarded exterior solve supports
very flat shapes; it does not solve non-unique interior representations. Shared
inverse work is bounded by 30 Hannover plus at most 96 fallback updates. Failures
leave coordinate outputs untouched.

Independent unit-normal support anchors cover axes of 10 units and Earth size,
b/a from 1 to 0.000001, surface/orbital offsets and near/exact poles. Ordinary
interior normal offsets and ambiguous deep-interior behavior are tested separately.
The plugin/pipeline preserve the normalized polar axis rather than losing digits
by reconstructing it from eccentricity. Existing aliasing, radians/global state,
Float32/64 views, M, failure recovery and recursive setters remain qualified.

Geospatial reuses one private plain scratch point; projection writes directly to
its existing owned point. Shape snapshots are prepared once per ellipsoid. Numeric outputs are
captured before public setters execute, so reentrant output writes cannot corrupt
later ordinates. The leaf uses caller-owned point storage and no internal scratch.
The source guard covers 11 leaf/adapter/commit functions. Runtime boxing and
collected allocations remain separately sampled, not inferred from source alone.

Paired measurements now include complete public construction, reusable scalar
outputs, flat buffers, allocations and selective source graphs. See the
[shared conversion report](../docs/modules/projection/benchmarks.md#shared-spheroid-conversions).
The existing proj4js equations retain their SPDX attribution and full packaged MIT
notice in core; no Cesium code is moved/relicensed and no new upstream code/data
is introduced. Kernel sharing is scoped consolidation, not a general speed claim.

Further sharing requires independently reviewed behavior for broader interior
ambiguities, unusual axes/flattening and any proposed local-frame contracts.

Optional local-frame convergence and celestial frame/time-scale work are later
scopes. No third-party model data, new projection kernels or acceleration backend
is introduced by this preparation PR.
