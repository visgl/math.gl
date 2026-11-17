# Bounds2D

![From v4.1](https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square)

`Bounds2D` describes an axis-aligned 2D extent as `[[minX, minY], [maxX, maxY]]`.

```
import type {Bounds2D} from '@math.gl/core';



const bounds: Bounds2D = [[0, 0], [10, 20]];
```

## Definition[​](#definition "Direct link to Definition")

```
type Bounds2D = [[number, number], [number, number]];
```

The first tuple is the minimum corner and the second is the maximum. The type carries no coordinate-system metadata and performs no runtime validation. See [Bounds](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/bounds.md) for shared conventions and query functions.
