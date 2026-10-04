{/* SPDX-License-Identifier: MIT */}

# getStarfieldRotation

Returns the full rotation for orienting a celestial star-field cubemap at a location and
UTC time. A single vector cannot specify the cubemap's roll; a rotation matrix can.

```typescript
import {getStarfieldRotation} from '@math.gl/sun';

const rotation = getStarfieldRotation(Date.now(), 37.7749, -122.4194);
// Upload as a column-major mat3 with transpose=false.
// Rotate equatorial sky geometry into the local sky using rotation.
```

## Parameters

`getStarfieldRotation(timestamp, latitude, longitude, options?)`

- `timestamp`: `Date` or milliseconds since Unix epoch.
- `latitude`: Degrees north, in `[-90, 90]`.
- `longitude`: Finite degrees east; wraps modulo 360°.
- `options.epoch`: `'J2000'` (default) or `'date'`. J2000 inputs receive IAU 1976 precession
  to the mean equator and equinox of date. Use `'date'` if the input coordinates already
  refer to the mean equatorial frame of the current date.

Invalid inputs throw `RangeError`.

## Matrix and cube conventions

The result is a nine-element, column-major `number[]`, compatible with `Matrix3` and
WebGL `uniformMatrix3fv`. It transforms **outward equatorial directions to outward local
sky directions**:

| Equatorial cube axis | Definition |
| --- | --- |
| +X | Right ascension 0h, declination 0° |
| +Y | Right ascension 6h, declination 0° |
| +Z | North celestial pole, declination +90° |

Output axes are **+X east, +Y north, +Z up**. This is a right-handed frame. At northern
latitudes the mean pole of date lies north at elevation equal to latitude. Cubemaps with
other face conventions, handedness, or vertical axes need an additional fixed asset
rotation. The API does not infer a cubemap's axes from its pixels.

When sampling a fixed equatorial cubemap using a local view direction, use the **transpose**
of the returned matrix (its inverse):

```glsl
// localViewDirection points outward, in east/north/up coordinates.
vec3 equatorialDirection = transpose(starfieldRotation) * localViewDirection;
vec3 stars = texture(starfieldCube, equatorialDirection).rgb;
```

In GLSL ES 1.00, transpose the matrix on the CPU before uploading it. The cubemap sampler
still receives its own declared axis convention. This matrix carries both daily rotation
and the observer's latitude tilt, rather than merely pointing the cube toward Polaris.
It does not hide below-horizon stars or reduce star brightness in daylight; those belong
in the renderer. Moon/sun light directions point inward; negate them before using them as
outward sky directions.

## Model, accuracy and provenance

Mean sidereal time follows the USNO approximation, using UTC as an approximation to UT1
and TT. J2000 input directions receive IAU 1976 precession before the equatorial-to-local
rotation. Nutation, annual aberration, proper motion, atmospheric refraction, polar motion,
and precise astronomical timescale conversion are omitted. The method is intended for
visualization near modern dates (approximately 1900–2100), not precision astrometry.

This is original MIT-licensed code, independently implemented from mathematical equations.
Its SPDX header identifies vis.gl contributors and references the equations; **no SOFA or
other reference implementation code was copied**.

- [USNO, Computing Approximate Sidereal Time](https://aa.usno.navy.mil/faq/GAST).
- [University of Tokyo S2E, Celestial Rotation and IAU 1976 precession equations](https://www.space.t.u-tokyo.ac.jp/s2e-documents/Specifications/Environment/Spec_CelestialRotation.html).
- [ESA Navipedia, ECEF and ENU coordinate transformations](https://gssc.esa.int/navipedia/index.php/Transformations_between_ECEF_and_ENU_coordinates).
