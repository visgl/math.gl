# CubeGeometry

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->CubeGeometry<!-- -->…

⛶⛶ Explore fullscreen

An equal-sided box centered at the origin. `size` is a positive total side length (default `1`).

```
import {CubeGeometry} from '@math.gl/geometry';



const geometry = new CubeGeometry({size: 1});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose `POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices. See [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/geometry.md) for the mesh container API.
