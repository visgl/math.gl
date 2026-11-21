# BoxGeometry

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->BoxGeometry<!-- -->…

⛶⛶ Explore fullscreen

A box centered at the origin. `size` specifies positive total X, Y and Z lengths (default `[1, 1, 1]`).

```
import {BoxGeometry} from '@math.gl/geometry/primitives';



const geometry = new BoxGeometry({size: [1.5, 1, 0.75]});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose `POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices. See [Geometry](https://visgl.github.io/math.gl/docs/modules/geometry/api-reference/primitives.md) for the mesh container API.
