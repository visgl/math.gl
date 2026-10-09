# PlaneGeometry

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->PlaneGeometry<!-- -->…

⛶⛶ Explore fullscreen

A finite plane in XZ, with its front face and normal pointing +Y. Positive finite `sizeX` and `sizeZ` are required. `nx` and `nz` control subdivisions, both defaulting to `1`.

```
import {PlaneGeometry} from '@math.gl/geometry';



const geometry = new PlaneGeometry({sizeX: 2, sizeZ: 2, nx: 6, nz: 6});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose `POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices. See [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/geometry.md) for the mesh container API.
