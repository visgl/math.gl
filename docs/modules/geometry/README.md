# @math.gl/geometry

The `@math.gl/geometry` module provides renderer-independent CPU mesh data and primitive
tessellators. Built-in box, capsule, cylinder, plane and sphere dimensions follow the glTF 2.1
[draft shape proposal](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes).
Cube, cone, truncated-cone and icosphere convenience classes are adapted from the corresponding
luma.gl primitives.

All generated meshes use `triangle-list` topology and expose `POSITION`, `NORMAL` and
`TEXCOORD_0` typed-array attributes. Index buffers automatically use 32-bit values when a mesh has
more than 65,535 vertices.

## API

- `Geometry` stores CPU attributes, optional indices, topology and draw count.
- `unpackIndexedGeometry()` expands an indexed mesh into non-indexed attributes.
- `BoxGeometry`, `CapsuleGeometry`, `CylinderGeometry`, `PlaneGeometry`, `SphereGeometry` implement
  the glTF shape conventions.
- `CubeGeometry`, `ConeGeometry`, `TruncatedConeGeometry`, `IcoSphereGeometry` provide additional
  common tessellators.

An infinite glTF plane cannot be tessellated, so `PlaneGeometry` requires finite `sizeX` and `sizeZ`
values. Use `PlaneShape` from `@math.gl/culling` when infinite or partially infinite analytic
planes are required.
