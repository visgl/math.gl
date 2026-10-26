# Normal gravity

Normal gravity is the smooth reference gravity of an ideal rotating ellipsoid.
It varies with latitude and height. It is useful for simulation, reference-field
comparisons and geodetic calculations without downloading an Earth gravity model.
It does not include terrain, measured anomalies, tides or magnetic fields.

```ts
import {NormalGravity} from '@math.gl/earth/normal-gravity';
const earth = NormalGravity.WGS84();
const g = earth.surfaceGravity(45); // positive down, m/s²
const field = earth.evaluate(45, 10, 1000); // latitude, longitude degrees; height metres
const [east, north, up] = field.localAcceleration;
const potential = field.potential; // m²/s², including centrifugal potential
```

This optional entry has no runtime imports, coefficient assets, filesystem/network
access or dependencies. It does not initialize the geoid, timezone or astronomy
modules. Existing `@math.gl/earth/geoid` remains the height-conversion foundation;
normal gravity does not convert between ellipsoidal and orthometric heights.

## Construction and domain

`new NormalGravity({semiMajorAxis, flattening, gravitationalParameter, angularVelocity})`
requires all four finite constants: a in metres, f dimensionless, GM in m³/s² and
rotation rate in radians/second. Radii alone do not determine gravity. Supported
constants are `1 ≤ a ≤ 1e9`, `0 ≤ f ≤ 0.02`, `1 ≤ GM ≤ 1e25`, nonnegative rotation,
and `ω²a³/GM ≤ 0.1`. The sphere is the continuous zero-flattening limit. Prolate
and highly flattened bodies are outside this implementation profile. The constants
and model are immutable snapshots; each evaluation returns caller-owned records
and vectors. No named model is loaded from an unversioned service.

`NormalGravity.WGS84()` pins a = 6378137, f = 1/298.257223563,
GM = 3.986004418e14 and ω = 7.292115e-5. `surfacePotential` is the constant effective
normal potential on that reference ellipsoid. A custom model describes a reference
field, not a claim to match an observed planetary mass distribution.

`evaluate(latitude, longitude, height = 0)` accepts degrees in ±90/±180 and
ellipsoidal height from zero through 100a. `evaluateCartesian(x, y, z)` accepts
Earth-centred, Earth-fixed metres on or outside the ellipsoid and within radius
101a. A 16-epsilon surface residual allowance accommodates binary64 forward
conversion; it is not an interior solver. Unsupported/nonfinite inputs throw
`RangeError`. No truncated height expansion is used.

## Potential, acceleration and frames

Both methods return:

| Field | Meaning / units |
| --- | --- |
| `gravitationalPotential` | Positive reference gravitational potential V, m²/s². |
| `centrifugalPotential` | Φ = ω²(X² + Y²)/2, m²/s². |
| `potential` | Effective potential U = V + Φ, m²/s². |
| `gravitationalAcceleration` | ECEF XYZ gradient of V, m/s². |
| `centrifugalAcceleration` | ECEF `[ω²X, ω²Y, 0]`, m/s². |
| `acceleration` | Effective ECEF gradient of U, m/s². |

`evaluate` additionally returns `localAcceleration` in **east, north, up** order.
East is analytically zero for this axisymmetric field. Up is normally negative
near the surface; north is generally nonzero away from the level ellipsoid.
`surfaceGravity(latitude)` returns the positive downward surface magnitude.

The positive-potential convention gives inward acceleration as its gradient;
do not apply an additional minus sign. ECEF +Z is the north rotation axis and +X
passes through longitude zero. At a pole, supplied longitude selects the local
horizontal basis; the Cartesian field remains unique. Far from Earth the
centrifugal term can dominate in this rotating frame. For inertial attraction use
`gravitationalAcceleration`, not the effective field. This API does not perform
inertial-frame/velocity transformations or simulate Coriolis acceleration.

## Algorithm and independent qualification

An original oblate confocal-coordinate evaluator computes the reference potential
and analytic gradient. A 25-term convergent series evaluates the small elliptic
q ratio without cancellation, including the exact sphere limit. Degree trigonometry
uses quadrant reduction and exact cardinal axes. It is a bounded numerical
implementation of the standard normal potential, not a full gravity-model port.
The scientific formulation credits GeographicLib 2.7; the owning module packages
its MIT notice and source SPDX acknowledgements.

720 pinned C++ GeographicLib 2.7 controls cover WGS84, GRS80 geometric constants,
spheres with/without rotation, f = 0.02, tiny flattening, poles, multiple longitudes
and heights through 100a. A separate 110-digit Decimal potential evaluator uses
direct high-precision arctangents and finite-difference gradients at 36 original
Cartesian inputs. It does not reuse production gradient equations or binary64
q-series helpers. Analytic GM/r and GM/r² sphere checks and constant surface
potential/north-component checks complement native comparisons.

Acceleration errors are bounded by `3e-13 × GM/a²`; gravitational-potential error
by `4e-15 × GM/a`. Effective-potential error uses
`4e-15 × max(GM/a, |U|)` because the centrifugal potential can exceed GM/a at large
heights. This retains ordinary ground-level scales without requiring sub-ULP
agreement for large rotating-frame potentials. For WGS84 the acceleration ceiling
is approximately 3e-12 m/s². These are sampled evaluation-error gates, not model
uncertainty or arbitrary-constant certification. Stored provenance-checked controls
run in Node and three browsers; native compilation remains an offline tool.

Full harmonic gravity/anomalies, geoid synthesis and magnetic models require
separate coefficients and model/datum/epoch contracts. None is implied by this
reference field.

## Sources

- [GeographicLib 2.7 NormalGravity API](https://github.com/geographiclib/geographiclib/blob/r2.7/include/GeographicLib/NormalGravity.hpp)
- [GeographicLib reference gravity constants and component conventions](https://geographiclib.sourceforge.io/html/Gravity.1.html)
