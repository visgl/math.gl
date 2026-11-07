# Bounds3D

<p class="badges"><img src="https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square" alt="From v4.1" /></p>

`Bounds3D` describes an axis-aligned 3D extent as `[[minX, minY, minZ], [maxX, maxY, maxZ]]`.

```typescript
import type {Bounds3D} from '@math.gl/core';

const bounds: Bounds3D = [[0, 0, 0], [10, 20, 30]];
```

## Definition

```typescript
type Bounds3D = [[number, number, number], [number, number, number]];
```

The first tuple is the minimum corner and the second is the maximum. The type carries no coordinate-system metadata and performs no runtime validation. See [Bounds](./bounds.md) for shared conventions and query functions.
