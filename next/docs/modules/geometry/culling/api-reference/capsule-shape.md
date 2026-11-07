# CapsuleShape

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

The convex hull of two spheres centered at `[0, -height / 2, 0]` and `[0, height / 2, 0]`.

## Usage[​](#usage "Direct link to Usage")

```
import {CapsuleShape} from '@math.gl/geometry/culling';



const shape = new CapsuleShape({height: 2, radiusBottom: 0.5, radiusTop: 0.5});
```

## Constructor[​](#constructor "Direct link to Constructor")

#### `new CapsuleShape(options?)`[​](#new-capsuleshapeoptions "Direct link to new-capsuleshapeoptions")

| Option         | Default  | Description                                               |
| -------------- | -------- | --------------------------------------------------------- |
| `height`       | `1`      | Distance between the sphere centers; finite and positive. |
| `radiusBottom` | `0.5`    | Lower sphere radius; finite and nonnegative.              |
| `radiusTop`    | `0.5`    | Upper sphere radius; finite and nonnegative.              |
| `matrix`       | identity | Optional invertible affine local-to-world matrix.         |

The height excludes the rounded caps. At least one radius must be positive. Unequal radii produce a tapered capsule.

## Queries[​](#queries "Direct link to Queries")

Implements the [Shape interface](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/shapes.md), including containment, distance, ray and plane intersection, transforms, cloning, and enclosing bounds.

Dimensions and defaults align with the glTF 2.1 [draft shape specification](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).
