# @math.gl/geometry

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->SphereGeometry<!-- -->…

⛶⛶ Explore fullscreen

The `@math.gl/geometry` module provides renderer-independent CPU mesh data and primitive tessellators. Built-in box, capsule, cylinder, plane and sphere dimensions follow the glTF 2.1 [draft shape proposal](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes). Cube, cone, truncated-cone and icosphere convenience classes are adapted from the corresponding luma.gl primitives.

All generated meshes use `triangle-list` topology and expose `POSITION`, `NORMAL` and `TEXCOORD_0` typed-array attributes. Index buffers automatically use 32-bit values when a mesh has more than 65,535 vertices.

The root entry point also exports mesh utilities, curves, polygon operations, analytic queries, and spatial indexes. Their reference pages are grouped by topic in the sidebar. `@math.gl/geometry/culling` is also available as a dedicated entry point for bounding volumes and queries.

Optional `@math.gl/geometry/lighting` and `@math.gl/geometry/color` subpaths provide renderer-independent photometric and color LUT calculations. See the [lighting and color guide](https://visgl.github.io/math.gl/next/docs/modules/geometry/lighting.md). These CPU graphics utilities return numbers and typed arrays; file parsing remains in loaders.gl.

## Usage[​](#usage "Direct link to Usage")

```
import {SphereGeometry} from '@math.gl/geometry';



const geometry = new SphereGeometry({radius: 1});

const positions = geometry.attributes.POSITION.value;

const indices = geometry.indices?.value;
```

Pass these CPU buffers to the renderer of your choice. The module does not create GPU resources.

## Features[​](#features "Direct link to Features")

| Feature                                         | Support | Notes                                                                                                                                                                                                          |
| ----------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive mesh tessellation                     | ✅      | [Boxes, capsules, cylinders, planes, spheres and convenience shapes](#api) produce renderer-independent indexed buffers.                                                                                       |
| Parametric surfaces, lathes and tori            | ✅      | [ParametricGeometry, TorusGeometry and LatheGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/parametric.md) sample explicit surface functions.                  |
| Normals, UVs and index-width selection          | ✅      | Primitive POSITION/NORMAL/TEXCOORD\_0 attributes and automatic Uint32 promotion for large meshes.                                                                                                              |
| Projected bounds                                | ✅      | [Sample edges and interiors](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils/api-reference/project-bounds.md) with an explicit approximate/conservative qualification.           |
| Mesh processing                                 | ✅      | [Transform, merge, and weld indexed meshes](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils.md).                                                                                 |
| Curve evaluation                                | ✅      | [Sample Cartesian curves and compute transport frames](https://visgl.github.io/math.gl/next/docs/modules/geometry/curves.md).                                                                     |
| Rigid articulated panel forests                 | ✅      | Experimental [HingeTree](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/hinge-tree.md) evaluates hinge transforms with reusable matrix output.                          |
| Analytic queries                                | ✅      | [Bounding volumes, rays, and shapes](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling.md) for Euclidean containment and intersection.                                           |
| Polygon processing                              | ✅      | [Clip, triangulate, and subdivide polygons](https://visgl.github.io/math.gl/next/docs/modules/geometry/polygon.md).                                                                               |
| Spatial indexing                                | ✅      | [BoxIndex, PointIndex, and TriangleBVH](https://visgl.github.io/math.gl/next/docs/modules/geometry/spatial-index.md) accelerate repeated queries.                                                 |
| General solid modeling and manifold repair      | ❌      | No public 3D Boolean solid, arbitrary remeshing, or general manifold-repair engine.                                                                                                                            |
| Deformable or constrained rigid-body simulation | ❌      | HingeTree has no closed-loop constraints, collisions, forces, or bending solver.                                                                                                                               |
| Photometry and color LUTs                       | ✅      | Optional [lighting and color utilities](https://visgl.github.io/math.gl/next/docs/modules/geometry/lighting.md) sample angular intensity, integrate luminous flux and transform RGB/RGBA buffers. |
| GPU resource allocation and rendering           | ❌      | The module supplies CPU data; GPU buffers, materials, draw calls, and device lifetime belong to rendering libraries.                                                                                           |

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/geometry
```

## API[​](#api "Direct link to API")

* `Geometry` stores CPU attributes, optional indices, topology and draw count.
* `unpackIndexedGeometry()` expands an indexed mesh into non-indexed attributes.
* `BoxGeometry`, `CapsuleGeometry`, `CylinderGeometry`, `PlaneGeometry`, `SphereGeometry` implement the glTF shape conventions.
* `CubeGeometry`, `ConeGeometry`, `TruncatedConeGeometry`, `IcoSphereGeometry` provide additional common tessellators.
* `PrismGeometry` provides closed flat-sided polygons, including hexagonal prisms; `RingGeometry` provides solid annuli and capped ring segments.

An infinite glTF plane cannot be tessellated, so `PlaneGeometry` requires finite `sizeX` and `sizeZ` values. Use `PlaneShape` from `@math.gl/geometry/culling` when infinite or partially infinite analytic planes are required.

## Primitive reference[​](#primitive-reference "Direct link to Primitive reference")

* [BoxGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/box-geometry.md)
* [CubeGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/cube-geometry.md)
* [CapsuleGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/capsule-geometry.md)
* [CylinderGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/cylinder-geometry.md)
* [ConeGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/cone-geometry.md)
* [TruncatedConeGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/truncated-cone-geometry.md)
* [PlaneGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/plane-geometry.md)
* [SphereGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/sphere-geometry.md)
* [IcoSphereGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/ico-sphere-geometry.md)
* [PrismGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/prism-geometry.md)
* [RingGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/ring-geometry.md)
* [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/geometry.md)

## Parametric surfaces[​](#parametric-surfaces "Direct link to Parametric surfaces")

[ParametricGeometry, TorusGeometry, and LatheGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/parametric.md) provide sampled surface generators from the root entry point, with an interactive gallery.

The experimental `HingeTree` evaluates rigid panels connected by hinges. See the [HingeTree API](https://math.gl/docs/modules/geometry/api-reference/hinge-tree) and [unfolding polyhedra example](https://github.com/visgl/math.gl/tree/master/examples/geometry/unfolding-polyhedron).
