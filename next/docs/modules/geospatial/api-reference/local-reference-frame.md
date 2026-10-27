# LocalReferenceFrame

A reusable rigid frame at a fixed Cartesian origin on a sphere or oblate spheroid. The class snapshots its origin, signed axes, and geodetic basis. It does not retain mutable ellipsoid state, infer a CRS, or convert datums. Available from `@math.gl/geospatial` and the package root.

```
import {Vector3} from '@math.gl/core';

import {Ellipsoid, LocalReferenceFrame} from '@math.gl/geospatial';



const origin = Ellipsoid.WGS84.cartographicToCartesian([-122.4, 37.8, 100]);

const frame = new LocalReferenceFrame(origin);

const world = frame.localToFixedPoint([20, 10, 2]);

const local = frame.fixedToLocalPoint(world);

const velocity = frame.localToFixedVector([0, 10, 0]);

const reusable = new Vector3();

frame.fixedToLocalVector(velocity, reusable);
```

## Construction and coordinates[​](#construction-and-coordinates "Direct link to Construction and coordinates")

`new LocalReferenceFrame(origin, {ellipsoid?, axes?})`

* `origin`: three finite fixed Cartesian coordinates, in the ellipsoid axes' units (metres for WGS84).
* `ellipsoid`: defaults to `Ellipsoid.WGS84`. Requires finite positive sphere/oblate axes with X = Y ≥ Z.
* `axes`: three distinct signed geographic axes in right-handed order, default `['east', 'north', 'up']`. For north/east/down use `['north', 'east', 'down']`.

The basis follows the origin's **geodetic** longitude and latitude, including elevated origins. The zero center and interior points with no unique geodetic inverse are rejected with `RangeError`. At exact poles the longitude convention of `Ellipsoid.cartesianToCartographic` applies; for positive zero X/Y, east is +Y, north is -X at the north pole and +X at the south pole. No frame can provide a continuous geographic heading at a pole. Triaxial/prolate ellipsoids are deliberately unsupported.

## Points, vectors and matrices[​](#points-vectors-and-matrices "Direct link to Points, vectors and matrices")

| Method                                | Operation                                           |
| ------------------------------------- | --------------------------------------------------- |
| `localToFixedPoint(point, result?)`   | Rotate local XYZ and add fixed origin.              |
| `fixedToLocalPoint(point, result?)`   | Subtract fixed origin, then apply inverse rotation. |
| `localToFixedVector(vector, result?)` | Rotate without translation.                         |
| `fixedToLocalVector(vector, result?)` | Apply inverse rotation without translation.         |

Inputs accept numeric arrays and typed arrays of length three. Optional results are `Vector3` instances; input and output may be the same vector. Successful methods return the supplied result or allocate a new vector. Invalid/nonfinite inputs and arithmetic overflow throw `RangeError` before changing the supplied vector. Vector units are retained, including metres/second.

`localToFixedMatrix` and `fixedToLocalMatrix` return independent column-major `Matrix4` copies. Mutating them cannot change the frame. For small fixed-space offsets, prefer `fixedToLocalPoint`, which subtracts the origin before rotating. Neither a local frame nor JavaScript binary64 can recover detail already lost in a float32 position buffer.

## Geographic poses[​](#geographic-poses "Direct link to Geographic poses")

```
const attitude = {heading: Math.PI / 2, pitch: 0, roll: 0};

const pose = frame.headingPitchRollToFixedFrame(attitude);

const rotation = frame.headingPitchRollQuaternion(attitude);

const extracted = frame.fixedFrameToHeadingPitchRoll(pose);
```

All three angles are **radians**, independent of the degrees used by `Ellipsoid` cartographic APIs. The model-to-fixed pose is:

`localToFixed × Rz(-heading) × Ry(-pitch) × Rx(roll)`

Zero attitude aligns model XYZ with the selected local XYZ. In the default ENU frame, model +X points east at zero heading, south at heading +π/2, and up at pitch +π/2. Positive roll rotates model +Y toward local +Z. This convention follows Cesium-style local XYZ composition; it is not a compass convention where heading zero necessarily means model-forward points north. Adapt a model's forward/up axes explicitly, or select NED axes as appropriate.

* `headingPitchRollToFixedFrame(attitude, result?: Matrix4)` returns an affine pose with unit scale.
* `headingPitchRollQuaternion(attitude, result?: Quaternion)` returns a normalized fixed-frame orientation in `[x, y, z, w]` order; it contains no translation.
* `fixedFrameToHeadingPitchRoll(pose)` accepts a finite 16-component affine matrix whose rotation is right-handed and orthonormal within `1e-6`. Translation is ignored. Scale, reflection and shear outside that tolerance are rejected.

Extraction canonicalizes pitch to \[-π/2, π/2]. Within `1e-12` of a gimbal lock measured by the first column's horizontal length, roll is set to zero and the remaining rotation is assigned to heading. Equivalent angle triples and equivalent quaternion signs are normal. These methods do not promise continuous angles over time.

## Velocity-aligned orientation[​](#velocity-aligned-orientation "Direct link to Velocity-aligned orientation")

`velocityQuaternion(fixedVelocity, result?: Quaternion)` returns an orientation with model +X along normalized fixed-space velocity. Model +Z is the normalized projection of geodetic up perpendicular to velocity. The remaining axis completes a right-handed basis. Geographic up is used even when this frame's selected axes are NED.

The method returns `undefined`, leaving a supplied quaternion unchanged, for zero velocity, unrepresentable speed, or nearly vertical motion (sine of the angle to up below `1e-12`). Invalid coordinates throw `RangeError`. The operation is stateless: applications must decide whether to hold the previous attitude, switch reference directions, or interpolate across singularities. It is not an inertial-to-fixed state-vector conversion and adds no rotating-frame velocity term.

See the [C8 qualification and G7 baselines](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/local-frame-qualification.md) for independent/native controls, numerical budgets, remaining domains and measured-cost methodology.

## Packed points and vectors[​](#packed-points-and-vectors "Direct link to Packed points and vectors")

`localToFixedPointsFlat`, `fixedToLocalPointsFlat`, `localToFixedVectorsFlat` and `fixedToLocalVectorsFlat` accept packed XYZ numeric arrays. Point methods include the cached origin translation; vector methods rotate only. The result is a `Float64Array` of the same length. Pass a caller-owned result to reuse storage:

```
const xyz = new Float64Array([1, 2, 3, 4, 5, 6]);

const fixed = frame.localToFixedPointsFlat(xyz);

frame.fixedToLocalPointsFlat(fixed, fixed); // exact in-place storage
```

Input length must be a multiple of three, and supplied output must be Float64 storage with exactly the same length. Empty input is valid. Exact input/output identity is supported; other overlapping buffer views are rejected. Disjoint views of one buffer are supported. Invalid inputs or an unrepresentable result throw `RangeError` before any caller-owned output is changed, including when a later record fails. Extreme finite coordinates retain the scalar scaled fallback. Inputs may use Float32 storage, but its prior quantization cannot be recovered.

The packed path hoists the cached matrix coefficients and creates no per-point vectors. This is not a universal zero-allocation or throughput guarantee. See the [qualification and benchmark profile](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/local-frame-qualification.md).
