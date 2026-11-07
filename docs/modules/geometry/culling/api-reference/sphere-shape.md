# SphereShape

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

A sphere centered at the local origin.

## Usage

```typescript
import {SphereShape} from '@math.gl/geometry/culling';

const shape = new SphereShape({radius: 1});
```

## Constructor

#### `new SphereShape(options?)`

| Option | Default | Description |
| --- | --- | --- |
| `radius` | `0.5` | Finite positive radius. |
| `matrix` | identity | Optional invertible affine local-to-world matrix. |

Non-uniform scaling produces an ellipsoid for containment and intersection queries; distance estimates retain the shared transform limitations.

## Queries

Implements the [Shape interface](./shapes.md), including containment, distance, ray and plane intersection, transforms, cloning, and enclosing bounds.

Dimensions and defaults align with the glTF 2.1 [draft shape specification](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).
