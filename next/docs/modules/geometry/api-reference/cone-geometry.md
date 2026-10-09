# ConeGeometry

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->ConeGeometry<!-- -->…

⛶⛶ Explore fullscreen

A cone with a zero-radius top and its point at +Y by default. `radius` defaults to `0.5`, `height` to `1`, `topCap` to `false` and `bottomCap` to `true`. `nradial` and `nvertical` default to `10` and `1`. `verticalAxis` may be x, y or z (default y).

```
import {ConeGeometry} from '@math.gl/geometry';



const geometry = new ConeGeometry({height: 1.5, radius: 0.6});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose `POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices. See [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/geometry.md) for the mesh container API.
