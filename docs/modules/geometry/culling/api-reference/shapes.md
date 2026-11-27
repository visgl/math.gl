# Shape

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

`Shape` is the shared interface for analytic containment, ray intersection, and bounding-volume queries. Import it as a type from `@math.gl/geometry` or `@math.gl/geometry/culling`. The existing name `ImplicitShape` remains available.

```typescript
import type {Shape} from '@math.gl/geometry/culling';
import {BoxShape} from '@math.gl/geometry/culling';

const shape: Shape = new BoxShape({size: [2, 1, 3]});
shape.containsPoint([0, 0, 0]); // true
```

## Implementations

| Shape | Local geometry |
| --- | --- |
| [BoxShape](./box-shape.md) | Box centered at the origin. |
| [CapsuleShape](./capsule-shape.md) | Convex hull of two spheres on the Y axis. |
| [CylinderShape](./cylinder-shape.md) | Capped cylinder or cone along the Y axis. |
| [PlaneShape](./plane-shape.md) | Surface facing +Y, with the negative-Y half-space inside. |
| [SphereShape](./sphere-shape.md) | Sphere centered at the origin. |

## Fields

- `type`: `'box'`, `'capsule'`, `'cylinder'`, `'plane'`, or `'sphere'`.
- `matrix`: the local-to-world `Matrix4`. Use `transform()` to update it so the inverse stays synchronized.

## Methods

#### `containsPoint(point)`

Returns whether a world-space point is inside the shape, including its boundary.

#### `distanceTo(point)`

Returns zero inside the shape and distance outside it. Exact for rigid and uniform-scale transforms; an estimate for non-uniform scale or shear.

#### `distanceSquaredTo(point)`

Returns the square of `distanceTo(point)` with the same accuracy limits.

#### `intersectPlane(plane)`

Returns `'inside'`, `'outside'`, or `'intersecting'`. Shapes can be used directly as `CullingVolume` bounding volumes.

#### `intersectRay(ray)`

Returns the nearest nonnegative hit as `{distance, point, normal, entering}`, or `undefined`. `point` and `normal` are world-space vectors. With the `Ray` class's normalized direction, `distance` is a world-space distance.

#### `transform(matrix)`

Applies an invertible affine transform in place and returns the shape. Containment, plane classification, and ray intersection account for non-uniform scale and shear.

#### `getAxisAlignedBoundingBox()`

Returns a conservative world-space `AxisAlignedBoundingBox`, or `undefined` for an unbounded plane half-space.

#### `getBoundingSphere()`

Returns a conservative world-space `BoundingSphere`, or `undefined` for an unbounded plane half-space.

#### `clone()`

Returns an independent shape with the same dimensions and transform.

#### `equals(shape)`

Returns whether the shape type, dimensions, and transform match.
