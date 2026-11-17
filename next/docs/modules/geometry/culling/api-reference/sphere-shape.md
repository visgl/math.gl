# SphereShape

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

A sphere centered at the local origin.

## Usage[​](#usage "Direct link to Usage")

```
import {SphereShape} from '@math.gl/geometry/culling';



const shape = new SphereShape({radius: 1});
```

## Constructor[​](#constructor "Direct link to Constructor")

#### `new SphereShape(options?)`[​](#new-sphereshapeoptions "Direct link to new-sphereshapeoptions")

| Option   | Default  | Description                                       |
| -------- | -------- | ------------------------------------------------- |
| `radius` | `0.5`    | Finite positive radius.                           |
| `matrix` | identity | Optional invertible affine local-to-world matrix. |

Non-uniform scaling produces an ellipsoid for containment and intersection queries; distance estimates retain the shared transform limitations.

## Queries[​](#queries "Direct link to Queries")

Implements the [Shape interface](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/shapes.md), including containment, distance, ray and plane intersection, transforms, cloning, and enclosing bounds.

Dimensions and defaults align with the glTF 2.1 [draft shape specification](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).
