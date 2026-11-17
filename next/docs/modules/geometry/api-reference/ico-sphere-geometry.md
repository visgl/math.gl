# IcoSphereGeometry

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->IcoSphereGeometry<!-- -->…

⛶⛶ Explore fullscreen

A sphere built by subdividing an icosahedron. Positive `radius` defaults to `0.5`, and non-negative integer `iterations` defaults to `0`. Each iteration subdivides each triangle into four.

```
import {IcoSphereGeometry} from '@math.gl/geometry';



const geometry = new IcoSphereGeometry({radius: 0.75, iterations: 2});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose `POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices. See [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/geometry.md) for the mesh container API.
