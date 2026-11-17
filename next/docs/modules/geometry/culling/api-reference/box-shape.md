# BoxShape

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

A box centered at the origin, with faces aligned to the local axes.

## Usage[​](#usage "Direct link to Usage")

```
import {BoxShape} from '@math.gl/geometry/culling';



const shape = new BoxShape({size: [2, 1, 3]});
```

## Constructor[​](#constructor "Direct link to Constructor")

#### `new BoxShape(options?)`[​](#new-boxshapeoptions "Direct link to new-boxshapeoptions")

| Option   | Default     | Description                                                 |
| -------- | ----------- | ----------------------------------------------------------- |
| `size`   | `[1, 1, 1]` | Full X, Y, and Z lengths; each must be finite and positive. |
| `matrix` | identity    | Optional invertible affine local-to-world matrix.           |

## Queries[​](#queries "Direct link to Queries")

Implements the [Shape interface](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/shapes.md), including containment, distance, ray and plane intersection, transforms, cloning, and enclosing bounds.

Dimensions and defaults align with the glTF 2.1 [draft shape specification](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).
