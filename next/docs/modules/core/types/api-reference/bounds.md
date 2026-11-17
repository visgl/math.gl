# Bounds

![From v4.1](https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square)

`Bounds` is a type-only union of [Bounds2D](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/bounds2d.md) and [Bounds3D](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/bounds3d.md). Each uses `[minimum, maximum]` coordinates.

```
import type {Bounds} from '@math.gl/core';



const bounds: Bounds = [[0, 0], [10, 20]];
```

## Definition[​](#definition "Direct link to Definition")

```
type Bounds =

  | [[number, number], [number, number]]

  | [[number, number, number], [number, number, number]];
```

Type declarations do not validate coordinate order, finiteness, units, or the reference system at runtime. Axis-aligned bounds operations are documented under [geometric queries](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/extended-queries.md#bounds).
