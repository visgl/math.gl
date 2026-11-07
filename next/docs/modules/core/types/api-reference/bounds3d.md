# Bounds3D

![From v4.1](https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square)

`Bounds3D` describes an axis-aligned 3D extent as `[[minX, minY, minZ], [maxX, maxY, maxZ]]`.

```
import type {Bounds3D} from '@math.gl/core';



const bounds: Bounds3D = [[0, 0, 0], [10, 20, 30]];
```

## Definition[​](#definition "Direct link to Definition")

```
type Bounds3D = [[number, number, number], [number, number, number]];
```

The first tuple is the minimum corner and the second is the maximum. The type carries no coordinate-system metadata and performs no runtime validation. See [Bounds](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/bounds.md) for shared conventions and query functions.
