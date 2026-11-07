# CylinderShape

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

A capped cylinder centered at the origin along the local Y axis.

## Usage

```typescript
import {CylinderShape} from '@math.gl/geometry/culling';

const shape = new CylinderShape({height: 2, radiusBottom: 1, radiusTop: 0.5});
```

## Constructor

#### `new CylinderShape(options?)`

| Option | Default | Description |
| --- | --- | --- |
| `height` | `2` | Full height between the caps; finite and positive. |
| `radiusBottom` | `0.5` | Radius at `-height / 2`; finite and nonnegative. |
| `radiusTop` | `0.5` | Radius at `height / 2`; finite and nonnegative. |
| `matrix` | identity | Optional invertible affine local-to-world matrix. |

Unequal radii produce a truncated cone. A zero radius produces a cone tip; at least one radius must be positive.

## Queries

Implements the [Shape interface](./shapes.md), including containment, distance, ray and plane intersection, transforms, cloning, and enclosing bounds.

Dimensions and defaults align with the glTF 2.1 [draft shape specification](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).
