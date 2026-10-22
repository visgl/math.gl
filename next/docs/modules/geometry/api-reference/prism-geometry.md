# PrismGeometry

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->PrismGeometry<!-- -->…

⛶⛶ Explore fullscreen

A closed regular polygon prism centered at the origin, with height along Y. Each side has a constant outward normal, and the top and bottom use separate flat normals. Unlike a low-resolution cylinder, its side edges remain sharp.

```
import {PrismGeometry} from '@math.gl/geometry';



const hexagon = new PrismGeometry({radius: 0.6, height: 1.5, sides: 6});
```

| Property     | Default | Meaning                                                    |
| ------------ | ------- | ---------------------------------------------------------- |
| `radius`     | `1`     | Positive distance from the axis to a polygon corner.       |
| `height`     | `1`     | Positive total height; caps lie at ±height/2.              |
| `sides`      | `6`     | Integer polygon side count, at least three.                |
| `startAngle` | `0`     | Finite angle in radians placing the first corner around Y. |

Angles begin on +X and rotate toward −Z. The mesh is indexed with `triangle-list` topology and Float32 `POSITION`, `NORMAL` and `TEXCOORD_0` attributes. It accepts `id` and caller-supplied attribute overrides like the other primitives. See [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/geometry.md) for the CPU container API.
