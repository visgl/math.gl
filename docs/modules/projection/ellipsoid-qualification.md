# Ellipsoid accuracy and interior boundaries

Longitude, latitude and ellipsoidal height describe a position along a surface
normal. For positions on or outside a convex ellipsoid, the nearest surface point
is unique. Deep inside an ellipsoid, several normal representations can describe
the same Cartesian position. A converged inverse is not necessarily the nearest
representation, and a nearest representation can itself become non-unique.

math.gl qualifies selected inputs against independent references. This page
separates those accuracy checks from compatibility and failure checks. It does
not extend the supported domain of the projection engine or replace geospatial's
retained interior algorithm.

## What is qualified

| Inputs                                                  | Qualification                                                                   | Boundary                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Sphere and oblate surface/exterior                      | Independent surface-normal anchors, including `b/a = 0.000001`                  | Sampled axes and offsets; no universal error bound                                                                    |
| Ordinary oblate interiors                               | Independent nearest-normal references for Earth-like and 2:1 axes at two scales | Selected normal offsets, not arbitrary interior positions                                                             |
| Flattened, prolate and triaxial interiors in geospatial | Independent nearest-normal references for selected moderate offsets             | These use the retained geospatial algorithm; prolate/triaxial shapes are not supported by the two-axis projection API |
| Deep interiors and near the equatorial cusp             | Errors and rejection outcomes recorded separately                               | These probes are diagnostic, not promoted to an accuracy guarantee                                                    |
| Very flat non-cardinal interiors                        | Projection rejection and untouched-output checks                                | The exterior fallback does not support these inputs                                                                   |
| Extreme finite axes and underflowing axis ratios        | Analytic references and explicit failure checks                                 | Finite positive axes alone do not guarantee representable intermediates                                               |

The additional corpus contains **198 Cartesian inputs** and **466 path checks**:
geospatial for every input, plus the numeric leaf and projection engine for the
sphere/oblate subset. **144 checks enforce accuracy**. The remaining **322 probes**
record limitations and enforce finite results or untouched outputs on rejection.
A passing bounded-behavior check is not a passing accuracy check.

The accuracy checks allow a unit-normal angular difference of `1e-9` degrees and
height error of `max(1e-12, max(radii) * 2e-12)` in axis units: about 13 micrometres
at Earth scale. Comparing normals avoids assigning significance to longitude at
the poles. Additional analytic cases exercise very small/large radii, Float64
flat views and M preservation; Float32 failure cases qualify record ownership,
not this double-precision accuracy allowance.

## Independent references

The original fixture generator uses Python's standard-library `Decimal`, with
110 decimal digits and 320 bisection updates. It imports no math.gl, CesiumJS,
proj4js or PROJ conversion code and adds no external model data.

For radii `r_i` and a stored Cartesian point `p_i`, it solves:

```text
sum((r_i * p_i / (r_i² + lambda))²) = 1
q_i = r_i² * p_i / (r_i² + lambda)
lambda > -min(r_i²)
```

The unit normal is the normalized vector `q_i / r_i²`; signed height is the
multiplier times the length of that vector. The reference checks a surface
residual below `1e-60`. The multiplier bound makes the constrained squared-distance
quadratic positive definite, certifying the unique nearest footpoint for these
samples. Each sample has a nonzero coordinate along a shortest axis, so the
monotone root exists in this interval.

References are recomputed from the **exact stored binary64 input** after fixture
construction. This matters near singular regions: rounding an ideal input can
change its normal substantially. Angles are derived from the reference normal
when comparing results, rather than from a production inverse.

## Why deep interiors remain separate

For an oblate ellipsoid with axes `a = 1`, `b = 0.5`, the equatorial cusp is at
`x = (a² - b²) / a = 0.75`. At `[0.5, 0, 0]`, an equatorial normal and two
symmetric off-equatorial normals all reconstruct the point. The latter two are
equally nearest; the retained projection cardinal branch selects the equatorial
representation. Round-trip agreement alone cannot establish nearest-normal accuracy.

The corpus includes points on either side of the cusp with `z = ±1e-12`. Their
nearest normal is unique, yet existing algorithms can reject the point or select
a different normal branch. Consequently, the boundary is not simply “ambiguous
points are unsupported”: some uniquely defined nearest solutions remain outside
our qualified interior domain.

Geospatial uses a radial approximation when its squared scaled norm is below
`centerToleranceSquared` (currently `0.1`). On a non-spherical ellipsoid that
radial point is generally not the normal footpoint. Outside that region, its
bounded Newton iteration can still fail or choose another branch. A defined
`cartesianToCartographic()` result is not a general guarantee of nearest-normal
accuracy for deep interior positions.

The ordinary projection inverse retains its bounded Hannover iteration. The
very-flat path (`eccentricitySquared >= 0.9`) uses a surface/exterior solve;
non-cardinal interior inputs normally reject. Exact poles have an analytic branch,
and projection's historical near-axis convention remains separate.

## Finite values and failure behavior

The numeric leaf returns `false`, projection throws, and geospatial returns
`undefined` on their respective unsupported inputs. Existing caller outputs stay
unchanged on conversion failure. Flat projection processing commits completed
records; it leaves the failing record and later records untouched. A failed call
does not prevent later supported calls from succeeding.

The APIs have different representability limits. For example, the analytic sphere
leaf accepts selected interior coordinates with radii `1e-160` and `1e160`, while
geospatial rejects those cases because its derived geometry/interior intermediates
are not representable. Debug validation rejects their construction; with debug
validation disabled, the retained interior inverse returns `undefined`. For an oblate ratio `b/a = 1e-170`, the squared ratio underflows;
the non-cardinal exterior leaf solve rejects even though both axes are finite.
The exact pole remains analytically representable. These examples are boundaries,
not recommended CRS geometries.

## Retained diagnostic results

CI checks the independent corpus in Chromium, Firefox and WebKit. The checked-in Node
report records every path, reference error and rejection. In the
current corpus, the 118 unqualified geospatial probes include 25 reference matches,
89 results outside the tolerance, and four rejections. The projection adapter and
numeric leaf each have 102 unqualified probes: 15 reference matches and 87
rejections. Matches in this diagnostic subset do not establish broader support.

Reproduce the references and report from the repository root:

```sh
python3 modules/projection/scripts/generate-interior-reference.py --check
node modules/projection/scripts/qualify-interiors.mjs --output /tmp/interior-qualification.json
yarn exec vitest run --project node modules/projection/test/lib/interior-qualification.spec.ts
node modules/projection/scripts/qualify-interiors.mjs --browser firefox --output /tmp/interior-firefox.json
```

See the [reference fixture](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/interior-reference.json)
and [qualification report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/interior-normal-node.json).
The generator, references and qualification code are original math.gl work with
MIT SPDX headers. Existing CesiumJS/proj4js attribution is unchanged. No production
conversion algorithm or coordinate allocation is introduced by this qualification.

Further inverse consolidation requires a deliberate branch-selection contract,
a safeguarded interior solver, and independent qualification of that solver.
Local frames and acceleration remain separate work.
