# G11: Optional Earth models

This is a proposed feature design, not a delivered API or a parity claim. Keep
model evaluation separate from ellipsoid geometry and from coordinate/datum
operations. A WGS84 position identifies where to evaluate a field; it does not
supply a gravity or magnetic model.

## Existing foundation

`@math.gl/earth/geoid` already provides `Geoid`, PGM decoding, application-supplied
decoded grids, bilinear/cubic interpolation and optional EGM96 assets. Its
`getHeight(latitude, longitude)` returns geoid undulation N in metres above
WGS84. Height conversion uses h = H + N. Preserve and extend this implementation;
do not introduce a second geoid engine in geospatial. Its source already retains
GeographicLib MIT attribution. Surface normals and nearest-ellipsoid projections
are geometry operations; neither computes the local plumb direction.

## Recommended delivery sequence

| Increment | Proposed optional entry / API sketch | New capability | Dependencies and gates |
| --- | --- | --- | --- |
| G11a: Normal gravity | `@math.gl/earth/normal-gravity`: immutable `NormalGravity({semiMajorAxis, flattening, gravitationalParameter, angularVelocity})`; `surfaceGravity(latitude)`, `evaluate(latitude, longitude, height)`, `evaluateCartesian(x, y, z)` | Reference-ellipsoid potential and gravity; no external coefficients. Explicit WGS84/GRS80 factories if their constants are pinned. | Small original numeric implementation; independently evaluated equator/pole, nonrotating sphere GM/r², finite-difference potential gradients, native GeographicLib controls. Declare supported shapes/heights before implementation. |
| G11b: Geoid ergonomics | Extend existing geoid with immutable model metadata, explicit height-conversion helpers and optionally gradient evaluation | Discoverable datum/resolution/interpolation/error information; geoid slope rather than only interpolated height. | Preserve current grids and interpolation semantics; qualify derivatives independently, including poles/dateline. Surface-height samples alone are insufficient to claim gravity-vector accuracy. |
| G11c: Harmonic gravity | `@math.gl/earth/gravity`: `GravityModel.fromCoefficients(metadata, coefficients)`; `potential(...)`, `gravity(...)`, later `disturbance(...)` / `geoidHeight(...)` | Spatial gravitational field, effective gravity and eventually plumb-line deviation/geoid synthesis. | Shared, independently qualified spherical-harmonic evaluator; normalization/phase, reference radius, GM, rotation, reference potential and tide-system contracts. Degree/order truncation and stable polar derivatives; bounded coefficient/working memory. |
| G11d: Magnetic field | `@math.gl/earth/magnetic`: `MagneticModel.fromCoefficients(...)`; `evaluate(latitude, longitude, height, decimalYear)` | Field vector, secular change, declination, inclination, horizontal/total intensity. | Reuse harmonic primitives after qualification, not gravity coefficients. Explicit epoch/validity interval and ellipsoid; named ENU outputs in nT and nT/year. Declination is undefined when horizontal intensity vanishes. |

The names above are design sketches. Initial normal-gravity outputs should name
**gravitational** versus **effective** potential/acceleration explicitly: effective
gravity includes centrifugal acceleration. Choose and document potential sign,
Cartesian axes, local component order and units (m²/s², m/s²); never overload a
bare `Vector3` with an unstated frame. A physical normal-gravity model also needs
GM and rotation: radii alone do not determine it. Normal gravity models an ideal
rotating reference body, not terrain, local anomalies or time-varying tides.

For geoid helpers, make the height direction explicit, e.g.
`ellipsoidHeight = orthometricToEllipsoidHeight(H, lat, lon, geoid)`. Do not call
all mean-sea-level or national vertical datums interchangeable. Grid interpolation
error, model uncertainty, datum mismatch and binary64 evaluation error are
separate quantities. Published grid interpolation estimates are not a universal
accuracy promise for observed heights.

## Coefficients, loading and licenses

No automatic downloads, package dependency or bundled global harmonic dataset is
required. Start with caller-supplied validated coefficient arrays. Any future
loader should consume bytes separately from evaluation; applications decide
fetch/filesystem/cache policy. Snapshot metadata and coefficients, or explicitly
transfer ownership. Validate layout, finite values, degree/order, normalization,
model identifiers, units, epoch, height range and resource limits before setup.

Record source URL/version, hash, license, attribution, tide system and reference
constants in each model manifest. Software SPDX credits do not cover dataset
redistribution. Add packaged license notices for derived algorithms and audit
each dataset separately before shipping it. Do not use a current model name as
an alias for an unversioned remote asset. A magnetic date outside the model's
validity interval should fail by default; extrapolation, if offered, must be an
explicit separate policy. These are numerical/model APIs, not navigation-grade
certification or a space-weather prediction service.

Normal gravity is the smallest independent feature and can ship without a data
format decision. Harmonic gravity/magnetism are larger projects: stabilize scaled
associated-Legendre evaluation and derivatives first, then model loaders and
repeated-latitude/bulk optimization only with a measured consumer. Qualify original
analytic coefficients (monopole, dipole, axisymmetric terms), independent
high-precision synthesis and pinned native outputs. Set physical error and bundle
budgets per degree/height/domain before fixes, and run stored controls in Node and
supported browsers. Never load models through an ordinary geospatial import.

## What omission costs

Without G11a we cannot supply latitude/height-dependent reference gravity for
simulation or a reference gravity potential. Existing height conversion still
works. Without G11c we cannot evaluate full harmonic gravity, anomalies or an
accurate plumb vector from coefficient models; interpolating a geoid is not a
replacement. Without G11d we cannot provide model-based compass declination or
geomagnetic overlays. Existing coordinate, projection, geodesic and renderer
geometry remains usable without any of these optional models.

## Upstream scope references

- [GeographicLib NormalGravity API](https://github.com/geographiclib/geographiclib/blob/r2.7/include/GeographicLib/NormalGravity.hpp)
- [GeographicLib GravityModel API](https://github.com/geographiclib/geographiclib/blob/r2.7/include/GeographicLib/GravityModel.hpp)
- [GeographicLib MagneticModel API](https://github.com/geographiclib/geographiclib/blob/r2.7/include/GeographicLib/MagneticModel.hpp)
- [GeographicLib geoid data, height relations and interpolation limits](https://geographiclib.sourceforge.io/C++/doc/geoid.html)

These describe the comparator family, not APIs already implemented in math.gl.
