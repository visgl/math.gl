# Ellipsoid convergence

The first step shares geometry and establishes conversion baselines between
`@math.gl/geospatial` and `@math.gl/projection`. The conversion kernels remain
separate until their numerical and ownership contracts are qualified together.

## Shared scope and boundaries

| Concern | Geospatial | Projection | Convergence scope |
| --- | --- | --- | --- |
| Shape | Three independent radii, including triaxial/prolate ellipsoids | Sphere or oblate spheroid; equatorial/polar axes and derived eccentricity | Share the sphere/oblate geometry contract only |
| Longitude/latitude/height ↔ Cartesian XYZ | Surface-normal construction and Newton surface projection | Geocentric equations and bounded Hannover iteration | Qualify the common spheroid domain before sharing kernels |
| Angular units | Degrees by default; global `_cartographicRadians` can select radians | CRS units normalized explicitly; `cart` stages use radians | Preserve each public boundary |
| Undefined center | Returns `undefined` | Throws | Keep distinct adapters around any common kernel |
| Exact polar longitude | `atan2` of the Cartesian normal; signed zero can yield 180° | Canonical zero in the polar branch | Document/qualify the convention; do not equate undefined longitude |
| Surface normals, tangent planes, scaled space, local frames | Public geometry APIs | Internal ENU basis for deformation | Continue as separate capabilities |
| Datums, grids, Helmert transforms and epochs | Not supplied by the Ellipsoid class | Explicit CRS/pipeline operations | Shape adapters cannot infer these semantics |

## Preparation: implemented in this PR

- `SpheroidParameters` is a shared type-only contract in `@math.gl/types`, re-exported
  by core, geospatial and projection. It contains finite positive equatorial/polar
  axes in metres, with `semiMinorAxis <= semiMajorAxis`.
- `Ellipsoid.fromSpheroid()` consumes a geometry snapshot, including the structural
  shape returned by `normalizeCRS().ellipsoid`. Derived fields are not imported.
- `Ellipsoid.toSpheroid()` returns a new frozen geometry snapshot and rejects lossy
  conversion of triaxial/prolate/degenerate shapes. The existing constructor is unchanged.
- Projection's internal ellipsoid type extends the shared axis contract. Its
  normalization and conversion arithmetic are unchanged.
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

## Follow-up: shared spheroid conversion kernels

Before moving arithmetic into a common dependency:

1. Expand independent references to deep-interior and center-neighborhood cases,
   extreme flattening, near-axis branches, non-finite inputs and overflow. Specify
   which cases are supported and bounded convergence/rejection behavior.
2. Preserve the triaxial geospatial surface kernel and current public center/pole,
   units, aliasing and output contracts. Keep CRS execution and model selection out
   of geometry helpers.
3. Measure setup, scalar-to-output and typed-array paths together. A common kernel
   must not introduce per-coordinate objects/arrays or application callback hazards.
4. Compare selective bundle costs. Place numeric spheroid helpers in a small leaf
   dependency; importing projection should not pull in the geospatial class,
   tangent planes or culling. Decide placement from measured dependency impact.
5. Preserve existing CesiumJS and proj4js provenance on any moved/adapted source.
   Independently authored adapters/tests do not change the original kernel terms.

Optional local-frame convergence and celestial frame/time-scale work are later
scopes. No third-party model data, new projection kernels or acceleration backend
is introduced by this preparation PR.
