# SphericalCoordinates

![From v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

Stores `radius`, `phi`, and `theta`, with angle and geographic convenience accessors. Angles in the primary fields are radians. This class retains legacy conversion conventions; see the conversion limitation below before using it for coordinate exchange.

## Construction[​](#construction "Direct link to Construction")

```
import {SphericalCoordinates} from '@math.gl/core';



const spherical = new SphericalCoordinates({radius: 2, phi: Math.PI / 2, theta: 0});
```

The constructor accepts `phi`, `theta`, `radius`, `bearing`, `pitch`, `altitude`, and `radiusScale`. Defaults are `phi = 0`, `theta = 0`, and `radius = 1`. `bearing` and `pitch` are degree-based aliases. It does not accept `longitude` or `latitude` constructor options.

## Primary methods[​](#primary-methods "Direct link to Primary methods")

| Method                    | Behavior                                                                        |
| ------------------------- | ------------------------------------------------------------------------------- |
| `set(radius, phi, theta)` | Set the three fields and validate                                               |
| `clone()`                 | Create a copy of the three primary fields                                       |
| `copy(other)`             | Copy radius and angles into the receiver                                        |
| `equals(other)`           | Compare radius and angles with the configured epsilon                           |
| `makeSafe()`              | Clamp phi away from 0 and π                                                     |
| `check()`                 | Require finite angles and a positive radius; throws independently of debug mode |

`clone()` and `copy()` do not copy `radiusScale`. Set it explicitly when preserving a custom geographic scale.

## Vector conversions[​](#vector-conversions "Direct link to Vector conversions")

`fromVector3(vector)` reads a structural `Vector3Like` value:

```
radius = hypot(x, y, z)

theta = atan2(x, y)

phi = acos(clamp(z / radius, -1, 1))
```

The zero vector fails the positive-radius check. `toVector3(result?)` writes to a supplied array, typed array, or core vector, and otherwise allocates a plain array:

```
x = radius * sin(theta) * sin(phi)

y = -radius * sin(theta) * cos(phi)

z = radius * cos(theta)
```

These legacy formulas are not a general inverse pair. For example, `[0, 1, 0]` converts back to `[0, 0, 1]`. Do not rely on round trips or assume a standard spherical-axis convention. Use explicit conversion equations matching your application's convention when that is required.

## Degree-based accessors[​](#degree-based-accessors "Direct link to Degree-based accessors")

`bearing` reads `180 - degrees(phi)` and `pitch` reads `degrees(theta)`; both are writable. Read-only `longitude`/`lng` return `degrees(phi)`, while `latitude`/`lat` return `degrees(theta)`.

`fromLngLatZ([longitude, latitude, height])` sets `phi` from latitude, `theta` from longitude, and `radius = 1 + height / radiusScale`. The read-only `z` accessor returns `(radius - 1) * radiusScale`; the default scale is 6,371,000. These geographic aliases also use legacy conventions and are not inverse longitude/latitude accessors.

Use [geospatial](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md) for ellipsoidal coordinates and [projection](https://visgl.github.io/math.gl/next/docs/modules/projection.md) for CRS conversion.
