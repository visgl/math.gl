# SphereGeometry

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->SphereGeometry<!-- -->…

⛶⛶ Explore fullscreen

A latitude/longitude sphere centered at the origin. Positive `radius` defaults to `0.5`. `nlat` and `nlong` default to `10` and control latitude and longitude segments.

```
import {SphereGeometry} from '@math.gl/geometry';



const geometry = new SphereGeometry({radius: 0.75, nlat: 16, nlong: 24});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose `POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices. See [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/geometry.md) for the mesh container API.
