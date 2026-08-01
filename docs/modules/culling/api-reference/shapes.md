# glTF Shapes

`@math.gl/culling` provides `BoxShape`, `CapsuleShape`, `CylinderShape`, `PlaneShape` and
`SphereShape`. Constructor dimensions and defaults match the glTF 2.1
[draft shape proposal](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).

Each shape provides:

- `containsPoint(point)` and `distanceTo(point)`
- `intersectPlane(plane)` for direct use as a `CullingVolume` bounding volume
- `intersectRay(ray)`, returning the nearest non-negative hit with point, normal and entering state
- `transform(matrix)` for invertible affine transforms
- `getAxisAlignedBoundingBox()` and `getBoundingSphere()` conservative enclosures

Containment, support mapping, plane classification and ray intersection account for arbitrary
invertible affine transforms. Distance is exact for rigid and uniform-scale transforms and is an
estimate for non-uniform scale or shear.

`PlaneShape` faces +Y in local space and treats the negative-Y half-space as inside. Its `sizeX` and
`sizeZ` restrict ray hits on the surface, but its inside half-space remains unbounded. Consequently
it returns `undefined` for finite enclosing bounds.
