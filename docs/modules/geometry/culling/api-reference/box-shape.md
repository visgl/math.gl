# BoxShape

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

A box centered at the origin, with faces aligned to the local axes.

## Usage

```typescript
import {BoxShape} from '@math.gl/geometry/culling';

const shape = new BoxShape({size: [2, 1, 3]});
```

## Constructor

#### `new BoxShape(options?)`

| Option | Default | Description |
| --- | --- | --- |
| `size` | `[1, 1, 1]` | Full X, Y, and Z lengths; each must be finite and positive. |
| `matrix` | identity | Optional invertible affine local-to-world matrix. |

## Queries

Implements the [Shape interface](./shapes.md), including containment, distance, ray and plane intersection, transforms, cloning, and enclosing bounds.

Dimensions and defaults align with the glTF 2.1 [draft shape specification](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).
