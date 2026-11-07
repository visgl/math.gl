# Bounds2D

<p class="badges"><img src="https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square" alt="From v4.1" /></p>

`Bounds2D` describes an axis-aligned 2D extent as `[[minX, minY], [maxX, maxY]]`.

```typescript
import type {Bounds2D} from '@math.gl/core';

const bounds: Bounds2D = [[0, 0], [10, 20]];
```

## Definition

```typescript
type Bounds2D = [[number, number], [number, number]];
```

The first tuple is the minimum corner and the second is the maximum. The type carries no coordinate-system metadata and performs no runtime validation. See [Bounds](./bounds.md) for shared conventions and query functions.
