# Ellipsoid accuracy and interior boundaries

Longitude, latitude and ellipsoidal height describe a position along a surface
normal. For positions on or outside a convex ellipsoid, the nearest surface point
is unique. Deep inside an ellipsoid, several normal representations can describe
the same Cartesian position. A converged inverse is not necessarily the nearest
representation, and a nearest representation can itself become non-unique.

math.gl selects the nearest surface-normal representation for sphere/oblate cartographic inversion, including unique deep interiors. The shared numeric helper is used by projection and geospatial. Prolate/triaxial cartographic inversion and the separate geospatial surface-projection method retain their own algorithms.

## What is qualified

The corpus contains **198 exact stored binary64 inputs and 466 path checks**. **434 checks enforce accuracy**: 134 sphere/oblate inputs through each of the numeric leaf, projection engine and geospatial, plus 32 moderate prolate/triaxial geospatial inputs. The remaining 32 deep prolate/triaxial probes retain diagnostic error and rejection reports. Diagnostic matches do not promote support.

The sphere/oblate inputs cover Earth-like, 2:1, 10:1 and 1,000,000:1 axes at two scales; shallow/deep offsets in both hemispheres; near-pole/equator normals; and both sides of the equatorial cusp. The allowance is `1e-9` degrees of unit-normal angular difference and `max(1e-12, max(radii) * 2e-12)` height in axis units, about 13 micrometres at Earth scale. These are sampled regression limits, not universal bounds.

Float64 flat views, M preservation, aliased/separate failure outputs, recursive setters, analytic poles and extreme axis magnitudes have additional checks. Float32 tests qualify storage ownership and rounding separately.

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

## Nearest-normal and ambiguity policy

For an oblate spheroid, nonzero polar coordinates admit a unique nearest normal. Interior inversion solves a monotone multiplier equation on its positive-definite interval with at most **128 safeguarded Newton/bisection updates**. It uses the shifted variable `(lambda + b²) / a²` so the short-axis singularity is not formed by subtracting nearly equal numbers. Compensated horizontal-radius and squared-axis arithmetic protect the near-cusp, very thin cases.

On the equatorial plane, points inside `p < a * (1 - (b/a)²)` have two equally near normals in opposite hemispheres. The inverse rejects instead of choosing a hemisphere or the more distant equatorial stationary normal. The cusp itself and points beyond it use the equatorial solution. The center rejects. Exact poles use an analytic branch; projection retains its documented near-axis longitude convention, while geospatial preserves signed-zero pole longitude.

A rejected numeric leaf returns `false`, geospatial returns `undefined`, and projection throws. Existing outputs and the failed flat record remain untouched; completed preceding records remain committed. Sphere conversion is analytic. Exterior conversion keeps the bounded Hannover path and safeguarded exterior fallback.

`Ellipsoid.scaleToGeodeticSurface` remains a separate three-radius algorithm. Its near-center radial approximation and 64-update limit are preserved. Its output is not a nearest-normal accuracy certificate. Prolate/triaxial cartographic conversions retain this algorithm and their existing diagnostic limitations.

Positive finite axes alone do not guarantee representable squared ratios or geometry intermediates. Underflowing non-cardinal ratios reject; exact-pole analytic cases remain separately covered. Geospatial retains its finite derived-geometry magnitude limits. Nearly singular binary64 inputs outside the qualified samples can still fail bounded convergence.


## Reproduce

Run the original Decimal generator with `--check`, then `node modules/projection/scripts/qualify-interiors.mjs`. Add `--browser chromium`, `--browser firefox` or `--browser webkit` to run the same rows in each browser. See the stored [qualification report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/interior-normal-node.json).
