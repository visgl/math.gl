# Bounds

<p class="badges"><img src="https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square" alt="From v4.1" /></p>

`Bounds` is a type-only union of [Bounds2D](./bounds2d.md) and [Bounds3D](./bounds3d.md). Each uses `[minimum, maximum]` coordinates.

```typescript
import type {Bounds} from '@math.gl/core';

const bounds: Bounds = [[0, 0], [10, 20]];
```

## Definition

```typescript
type Bounds =
  | [[number, number], [number, number]]
  | [[number, number, number], [number, number, number]];
```

Type declarations do not validate coordinate order, finiteness, units, or the reference system at runtime. Axis-aligned bounds operations are documented under [geometric queries](../../../geometry/culling/api-reference/extended-queries.md#bounds).
