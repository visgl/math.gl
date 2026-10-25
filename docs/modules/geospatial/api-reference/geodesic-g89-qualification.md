# G8/G9 geodesic qualification

This feature increment supplies two optional APIs:
[elliptic revolution geodesics](./ellipsoid-geodesic-exact.md) and
[triaxial surface coordinates/direct trajectories](./triaxial-geometry.md).
It preserves the existing series solver and all pre-existing numerical, coverage,
allocation, bundle and performance gates.

## Matrix and budgets

The same 2,105-row entry runs in Node, Chromium, Firefox and WebKit:

| Family | Rows | Evidence |
| --- | ---: | --- |
| Revolution distance-direct | 420 | Pinned GeographicLib 2.7 GeodesicExact, including deterministic scattered routes |
| Revolution arc-direct | 140 | Native Exact lines, including backward and multi-circuit paths |
| Revolution inverse | 532 | Native Exact, exact/near antipodes, poles, short/dateline routes and scattered endpoints; 12 declared near-equatorial rows use independent elliptic series and retain native diagnostics |
| Surface area | 28 | Pinned native Exact |
| Triaxial coordinates/directions | 432 | Native Cartesian3 geodetic/parametric/geocentric surface inputs |
| Triaxial trajectories | 540 | Native Geodesic3/GeodesicLine3 Jacobi solution, distinct from production Cartesian ODE |
| Independent elliptic/principal-plane quarters | 11 | 150-digit Decimal binomial elliptic-quarter series; revolution distances and triaxial endpoints/tangents |
| Joachimsthal conservation | 1 | Six signed trajectory samples; invariant not enforced by production |
| Independent sphere trajectory | 1 | Great-circle identities |

Revolution shapes sample `b/a = 0.25, 0.5, 0.8, 1, 1.25, 2, 4`; axes span
ordinary, Earth-sized and extreme magnitudes within the declared bounds.
Triaxial controls include spheres, oblate/prolate equal-axis limits, `(3,2,1)`,
`(4,2,1)` and a nearly spherical unequal-axis shape at three magnitudes. Independent
principal-plane controls also exercise differently ordered axes.

| Metric | Ceiling |
| --- | --- |
| Revolution distance / reduced length, divided by equatorial radius | `4e-13` |
| Geodesic scales | `4e-13` |
| Ordinary endpoint latitude/longitude | `2e-10` degrees |
| Ordinary bearing / auxiliary arc | `1e-9` degrees |
| Short-inverse bearing displacement, divided by equatorial radius | `4e-13` |
| Area divided by squared equatorial radius | `2e-12` |
| Triaxial position norm divided by maximum radius | `2e-12` |
| Tangent-vector chord (angular equivalent) | `1e-9 × π/180` |
| Surface residual, unit speed, relative Joachimsthal drift | `2e-12` |

A bearing for a nearly coincident pair is ill-conditioned. Below normalized
length `1e-7`, the matrix uses bearing-induced displacement rather than pretending
that an absolute bearing difference has the same physical meaning as on a long
route. Coincident bearings are conventions. Ordinary angles keep their own gate.
Native longitude labels at an exact pole are distinguished from the Cartesian-only
canonical pole convention. Multiple shortest paths at a cut locus do not establish
route uniqueness.

## Independent reference and pinned-native limitation

Stored native controls pin the GeographicLib **r2.7** archive SHA, original API
caller, binary64 configuration and generator. The native caller runs offline;
ordinary CI never builds or downloads GeographicLib. Original inputs are generated
locally, not copied from upstream test suites.

In 12 prolate inverse rows starting on the equator and ending at latitude
`0.00001°`, longitude `179.999°`, the raw native Exact inverse loses distance,
auxiliary-arc or scale accuracy even though its bearing appears accurate. Those
raw answers are retained as diagnostics. An independent 150-digit reference
expands the elliptic integrals into convergent binomial/geometric series and
solves the near-equatorial boundary condition; it does not call native code or
production quadrature. Production refines direct endpoint residuals using the
Jacobi derivatives. The independent reference gates all fields at the same
budgets; the raw native disagreement is not an accuracy allowance.

The quarter-ellipse controls use a separate complete-elliptic binomial series.
Sphere identities and principal-plane geodesics are independent mathematics.
GeographicLib Jacobi trajectories are algorithmically distinct from production's
Cartesian initial-value integration. Native controls supplement these checks;
they are not a proof for every finite input.

## Packaging and reproducibility

Both new entries have packaged ESM/CJS runtime and strict consumer-type checks.
They do not enter existing root/ellipsoid imports. New-feature ceilings,
established separately, are 35,000 minified / 14,000 gzip bytes for
`geodesic-exact`, and 12,000 / 4,500 for `triaxial`. Existing ceilings are unchanged.
The triaxial entry must not retain the vendored series engine; neither entry may
pull in projection, discontinuous-map or polygon-clipping engines.

```sh
python3 modules/geospatial/scripts/generate-g89-reference.py --check
python3 modules/geospatial/scripts/generate-g89-independent.py --check
node modules/geospatial/scripts/qualify-g89.mjs --output /tmp/g89-node.json
node modules/geospatial/scripts/qualify-g89.mjs --browser firefox --output /tmp/g89-firefox.json
node modules/geospatial/scripts/check-g89-package.mjs
```

To regenerate native controls, supply the already downloaded pinned archive:

```sh
python3 modules/geospatial/scripts/build-g89-native.py \
  --archive /path/to/geographiclib-r2.7.tar.gz --output /tmp/g89-native
python3 modules/geospatial/scripts/generate-g89-reference.py --native /tmp/g89-native
```

The reports retain runtime versions, provenance, per-field errors, budgets and
native diagnostics. The declared limits, omitted Exact edge area and omitted
global triaxial inverse are part of the public contracts. Arbitrary flattening,
arbitrarily long trajectories, conformal charts and uniform sampling remain
outside this increment. No new dependency, native runtime or coefficient dataset
is added. GeographicLib-derived formulae retain SPDX/MIT credits in source and the
owning module's packaged licenses.
