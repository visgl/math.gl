# Local-frame qualification and GeographicLib benchmark baselines

The C8 increment qualifies a bounded profile of `LocalReferenceFrame`, poses,
velocity orientation and `EllipsoidTangentPlane`. G7 establishes reproducible
benchmark baselines before designing more bulk or output-buffer APIs. It adds no
runtime dependency, native installation or mandatory model download.

## Numerical evidence

The same 2,450-row matrix runs in Node, Chromium, Firefox and WebKit:

| Family | Rows | Reference |
| --- | ---: | --- |
| Frames, points/vectors, poses and velocity orientation | 405 | 135 exact-input, 180-digit Decimal controls × ENU, NED and west/up/north frames; both cartographic unit configurations checked in each row |
| Tangent anchors, bases, projection and radial/normal lifts | 30 | Independent Decimal constrained footpoints, support geometry and line/quadric intersections |
| Local Cartesian coordinates | 50 | Stored pinned GeographicLib C++ 2.7 controls, binary64 input/output |
| Near-silhouette line intersections | 1,485 | Exact rational discriminant signs and independent 220-digit Decimal roots, with 999 public API checks |
| Packed point/vector transforms | 405 | Original Decimal frame controls × three axis selections; four directions/kinds and exact in-place outputs |
| Numerical boundary regressions | 3 | Analytic sphere contacts/radial rays and independently scaled rigid rotations |
| G7 solver baseline outputs | 72 | Pinned C++ 2.7 geodesic series and Exact rhumb API controls |

Independent controls use the stored binary64 Cartesian inputs, not idealized
pre-rounding coordinates. A monotone Decimal surface equation selects the unique
nearest normal; Decimal linear algebra and Taylor sine/cosine construct expected
frames and poses. Tests do not derive their expected values from production
round trips. Native comparisons share algorithm families and supplement these
independent controls.

Frame shapes include a unit sphere, WGS84 and a 0.5 polar/equatorial ratio at
ordinary, `1e-60` and `1e60` axis scales. Origins cover both poles, approaches to
both poles, a dateline approach, ordinary directions and heights of -0.05, 0 and
0.25 times the largest axis. Local frames retain their sphere/oblate restriction;
tangent controls additionally cover a three-radius `(3,2,1)` ellipsoid.

| Metric | Budget |
| --- | --- |
| Frame/pose/quaternion rotation entries | `1e-9 × π/180` |
| Cartesian/tangent coordinates normalized by the largest axis | `2e-12` |
| Native LocalCartesian error normalized by the equatorial axis | `5e-14` |
| Native geodesic/rhumb distance and reduced length | `4e-13 × equatorial axis` |
| Geodesic scales | `4e-13` |
| Native ordinary endpoint coordinates / rhumb bearing | `2e-10` degrees |
| Native geodesic bearing / arc | `1e-9` degrees |
| Setup surface area divided by squared equatorial axis | `2e-12` |

The existing P0, G3–G6, allocation, coverage and bundle gates remain unchanged.
A separate packaged C8 guard checks ESM/CJS/root exports, strict consumer types,
ownership and selective dependencies. Relative to pinned master `b9db6472`, only
the two affected C8 classes have a reviewed numerical-fix allowance of 2,000
minified / 1,000 gzip bytes; unrelated Ellipsoid/geodesic imports keep their
existing limits and dependency boundaries.

## Accuracy fixes

- Frame methods retain their ordinary subtract-first computation for small local
  offsets. A scaled fallback handles intermediate overflow when the final rigid
  transform components are finite; genuine output overflow still fails before
  writing the caller's result.
- Radial tangent-plane lifting scales the homogeneous point and axes before
  normalization. A huge finite local coordinate on a tiny ellipsoid can therefore
  produce its representable surface point instead of failing on an overflowing
  intermediate ratio.
- Spherical normal lifting uses compensated, power-of-two-scaled square
  differences. A one-ulp miss is rejected rather than promoted to contact, while
  a unique grazing root retains its coordinate accuracy. Near-contact forward
  projection compensates dot products to avoid creating an artificial miss from
  an otherwise representable contact.

## Conventions and remaining domains

`LocalReferenceFrame` follows the geodetic normal, including elevated origins.
The legacy `Ellipsoid.localFrameToFixedFrame` uses the Cartesian ellipsoid-gradient
convention at elevated origins. Those are different contracts; comparing them as
identical frames would be incorrect.

C++ `LocalCartesian` retains the longitude supplied to its geodetic-origin
constructor even at a pole. An XYZ-only local frame cannot recover that meridian.
The math.gl Cartesian inverse convention determines its exact-pole frame instead.
Pole bases have independent controls; native comparisons use unique non-polar
origins and exclude thin/ambiguous-interior cases that do not share that contract.

This matrix is not arbitrary finite-input certification. Near-silhouette normal
lifts now use exact dyadic coefficients and a high-precision integer square root
instead of promoting small negative discriminants to contact. The 1,485 controls
extend the original sphere/oblate/three-radius grid with `(2,2,3)` prolate
geometry at `1e-60`, ordinary and `1e60` scales; this is a sampled grid rather
than every shape/scale combination. Their mathematical line is defined by the stored binary64 anchor/basis and
local coordinates; exact rational signs and independent Decimal roots qualify that
kernel. The 999 public checks cover exact axial silhouettes and off-axis cases
away from the one-ulp uncertainty of constructing a rounded basis. Basis creation
has the separate existing angular budget; these tests do not promise identical
hit/miss decisions for ill-conditioned constructor inputs across runtimes.
Spheres retain their orthonormal circle convention, including exact contacts.
The rare exact fallback allocates and is slower than ordinary normal lifts.
Mutable legacy tangent bases,
unbounded flattening/scales, temporal attitude continuity and renderer float32
reconstruction remain outside this profile. No allocation-free pose or universal
performance claim follows from reusable output arguments.

## Reproducing qualification

From the repository root:

```sh
python3 modules/geospatial/scripts/generate-c8-reference.py --check
python3 modules/geospatial/scripts/generate-c8-contact-reference.py --check
python3 modules/geospatial/scripts/generate-g7-reference.py --check
node modules/geospatial/scripts/qualify-c8.mjs --output /tmp/c8-g7-node.json
node modules/geospatial/scripts/qualify-c8.mjs --browser firefox --output /tmp/c8-g7-firefox.json
yarn check:c8-package
```

The C8 check regenerates the independent Decimal controls. Native controls are
stored and provenance-checked; ordinary CI never builds or downloads PROJ or
GeographicLib. Reports retain runtime versions, source/bundle fingerprints,
per-row errors and budgets.

## G7 benchmark scope

The [recorded Node/native baseline](https://github.com/visgl/math.gl/blob/master/modules/geospatial/test/qualification/c8-g7-node.json)
contains 20 operation groups, 11 rotated samples with a 16 ms minimum aggregate
window, and sampled heap estimates. It pins the measured implementation commit,
Node/V8, CPU, compiler, native driver and workload. This shared-host observation
flags high spread in some frame/tangent measurements; use its raw samples and flags rather than inferring speedups from
individual ratios. It is an initial diagnostic baseline, not a quiet-host release
performance claim.

`benchmark:g7` compares identical current workloads against historical and
candidate math.gl source/export maps and their explicit `sideEffects` contracts.
The resolver preserves that metadata for virtual historical modules; otherwise
unrelated baseline code can be retained and distort selective bundle comparisons. It separates solver/frame setup, direct
calls that include line setup, reused geodesic/rhumb lines, caller-owned versus
allocated frame outputs, poses, velocity orientation and tangent operations.
Both revisions must pass the ordinary overlapping C8 profile and the same native
G7 output budgets before timing. An optional native executable must itself pass
all 72 stored field-by-field controls via `--evaluate` before any timing; matching
metadata and finite checksums alone do not establish accuracy. Newly fixed boundary cases gate the candidate;
the benchmark does not compare valid results against baseline failures.

Samples rotate implementation order, adapt aggregate duration, preserve raw
measurements and flag limited windows/spread. Inputs, prepared lines and reusable
buffers are outside operation timing. Optional heap sampling runs after all
operation timing; it estimates allocations and cannot prove zero allocation.

```sh
node modules/geospatial/scripts/benchmark-g7.mjs \
  --baseline-ref b9db6472 --points 1000 --samples 7 --min-sample-ms 4 \
  --allocations --output /tmp/g7-node.json
```

For an offline same-host C++ comparison, provide the already downloaded, pinned
GeographicLib r2.7 archive:

```sh
python3 modules/geospatial/scripts/build-g7-native.py \
  --archive /path/to/geographiclib-r2.7.tar.gz --output /tmp/g7-native
node modules/geospatial/scripts/benchmark-g7.mjs \
  --baseline-ref b9db6472 --native /tmp/g7-native \
  --points 1000 --samples 7 --min-sample-ms 4 --allocations --output /tmp/g7-native-node.json
```

The original C++ caller uses binary64, `-O2` and no LTO. Geodesics request the same
non-area outputs on both sides; rhumbs use the native Exact implementation.
Native process startup, I/O and preparation are excluded by its internal timer.
Native processes warm per sample while JS shares a process, so cross-language
ratios remain diagnostic. Native allocation counts are not claimed. Frame/pose
jobs have historical math.gl baselines, not a purported native pose equivalent.

CI uses a short informational smoke profile, with no speed threshold or native
compilation. Longer quiet-host measurements, browser throughput, broader shapes
and new bulk API designs remain G7 follow-up work. Prefer measured consumer needs
over adding speculative signatures.

The numerical helpers, inputs, oracle and benchmark callers are original MIT
math.gl work. Retained Cesium Apache-2.0/MIT and GeographicLib MIT SPDX notices and
packaged licenses remain with their implementations; no upstream source is
vendored by this increment.

## G7 packed-frame follow-up

The four packed frame methods retain the scalar point/vector distinction,
independent physical-error budgets, snapshots and extreme-coordinate fallback.
They validate the complete input and preflight extreme batches before writing,
so invalid records and true overflow fail atomically even with in-place output.
The ordinary path hoists matrix coefficients and reuses caller Float64 storage;
its implementation creates no per-point vectors.

`benchmark-frame-batches.mjs` compares historical and current scalar loops using
reused vectors against current packed output on identical inputs. It retains
wall time and process CPU time, rotated raw samples, spread flags and optional
heap estimates. Adaptive CPU windows prevent scheduling pauses from shortening
work; process CPU time includes runtime/background work and is diagnostic rather
than wall throughput. No new speed gate or native/browser bulk comparison is
claimed. Setups and all independent accuracy checks occur outside timing.

```sh
node modules/geospatial/scripts/benchmark-frame-batches.mjs \
  --baseline-ref 00dd3e4b --points 4096 --samples 11 --min-cpu-ms 8 \
  --allocations --output /tmp/frame-batches-node.json
```

The [recorded packed-frame baseline](https://github.com/visgl/math.gl/blob/master/modules/geospatial/test/qualification/frame-batches-node.json)
pins the measured source and runtime and exposes noisy samples. Interpret its
ratios only for that workload and environment. Existing numerical, bundle,
allocation, coverage and performance thresholds remain unchanged.

In the recorded 4,096-point workload, packed median process CPU time is about
17–21% of the current scalar loops with reused vectors. Three operation groups
have noisy wall measurements, and one current scalar CPU group is flagged for
spread. These observations justify the bounded packed API but do not establish a
quiet-host release speedup or a zero-allocation guarantee.
