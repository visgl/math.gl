# @math.gl/geometry

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->SphereGeometry<!-- -->…

⛶⛶ Explore fullscreen

The `@math.gl/geometry` module provides renderer-independent CPU mesh data and primitive tessellators. Built-in box, capsule, cylinder, plane and sphere dimensions follow the glTF 2.1 [draft shape proposal](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes). Cube, cone, truncated-cone and icosphere convenience classes are adapted from the corresponding luma.gl primitives.

All generated meshes use `triangle-list` topology and expose `POSITION`, `NORMAL` and `TEXCOORD_0` typed-array attributes. Index buffers automatically use 32-bit values when a mesh has more than 65,535 vertices.

The geometry group also provides `@math.gl/geometry`, `/curves`, `/polygon`, `/culling`, and `/spatial-index` subpaths. The polygon module combines general tessellation and mesh refinement with geographic helpers such as Mercator clipping and globe subdivision.

## Feature support[​](#feature-support "Direct link to Feature support")

CPU geometry capabilities, from primitive meshes to processing and spatial queries.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature                                         | math.gl support    | Notes                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive mesh tessellation                     | ✅ Implemented     | [Boxes, capsules, cylinders, planes, spheres and convenience shapes](#api) produce renderer-independent indexed buffers.                                                                                                                                                                                                                                  |
| Parametric surfaces, lathes and tori            | ✅ Implemented     | [ParametricGeometry, TorusGeometry and LatheGeometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/parametric.md) sample explicit surface functions.                                                                                                                                                             |
| Normals, UVs and index-width selection          | ✅ Implemented     | Primitive POSITION/NORMAL/TEXCOORD\_0 attributes and automatic Uint32 promotion for large meshes.                                                                                                                                                                                                                                                         |
| Mesh processing and curve evaluation            | ✅ Implemented     | [Transform/merge/weld utilities](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils.md) and [Cartesian curves](https://visgl.github.io/math.gl/next/docs/modules/geometry/curves.md) are exposed by the geometry group.                                                                                           |
| Rigid articulated panel forests                 | ✅ Implemented     | Experimental [HingeTree](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/hinge-tree.md) evaluates hinge transforms with reusable matrix output.                                                                                                                                                                     |
| Analytic queries and spatial indexes            | ✅ Implemented     | [Culling](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling.md), [polygon operations](https://visgl.github.io/math.gl/next/docs/modules/geometry/polygon.md), and [static BVHs](https://visgl.github.io/math.gl/next/docs/modules/geometry/spatial-index.md); each has separate numerical limits. |
| General solid modeling and manifold repair      | ❌ Not implemented | No public 3D Boolean solid, arbitrary remeshing, or general manifold-repair engine.                                                                                                                                                                                                                                                                       |
| Deformable or constrained rigid-body simulation | ❌ Not implemented | HingeTree has no closed-loop constraints, collisions, forces, or bending solver.                                                                                                                                                                                                                                                                          |
| GPU resource allocation and rendering           | ❌ Not implemented | The module supplies CPU data; GPU buffers, materials, draw calls, and device lifetime belong to rendering libraries.                                                                                                                                                                                                                                      |

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/geometry
```

## Usage[​](#usage "Direct link to Usage")

```
import {SphereGeometry} from '@math.gl/geometry';



const geometry = new SphereGeometry({radius: 1});

const positions = geometry.attributes.POSITION.value;

const indices = geometry.indices?.value;
```

Pass these CPU buffers to the renderer of your choice. The module does not create GPU resources.

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

The optional [`@math.gl/geometry`](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/parametric.md) subpath provides torus, lathe and sampled surface generators, with an interactive gallery.

The experimental `HingeTree` evaluates rigid panels connected by hinges. See the [HingeTree API](https://math.gl/docs/modules/geometry/api-reference/hinge-tree) and [unfolding polyhedra example](https://github.com/visgl/math.gl/tree/master/examples/geometry/unfolding-polyhedron).
