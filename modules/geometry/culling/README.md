# Overview

[math.gl](https://math.gl/docs) is a suite of math modules for 3D applications.

This module contains classes for bounding boxes, view frustum intersections and analytic shapes.

The `BoxShape`, `CapsuleShape`, `CylinderShape`, `PlaneShape` and `SphereShape` classes follow the
glTF 2.1 draft shape conventions. They support point containment and distance, plane/frustum
classification, ray intersections, affine transforms and conservative enclosing bounds. Shape
distance is exact under rigid or uniform-scale transforms and estimated under non-uniform scale or
shear. `PlaneShape` represents an unbounded half-space and therefore has no finite bounding box or
bounding sphere.

For documentation please visit the [website](https://math.gl).
