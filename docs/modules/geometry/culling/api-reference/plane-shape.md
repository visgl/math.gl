# PlaneShape

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

A surface in the local XZ plane facing +Y. The negative-Y half-space is inside.

## Usage

```typescript
import {PlaneShape} from '@math.gl/geometry/culling';

const shape = new PlaneShape({sizeX: 4, sizeZ: 3});
```

## Constructor

#### `new PlaneShape(options?)`

| Option | Default | Description |
| --- | --- | --- |
| `sizeX` | `undefined` | Optional finite positive width along X. |
| `sizeZ` | `undefined` | Optional finite positive width along Z. |
| `matrix` | identity | Optional invertible affine local-to-world matrix. |

The dimensions restrict ray hits on the surface, not the inside half-space. Omitted dimensions are unbounded. `getAxisAlignedBoundingBox()` and `getBoundingSphere()` return `undefined`, even when both surface dimensions are finite.

## Queries

Implements the [Shape interface](./shapes.md), including containment, distance, ray and plane intersection, transforms, cloning, and enclosing bounds.

Dimensions and defaults align with the glTF 2.1 [draft shape specification](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).
