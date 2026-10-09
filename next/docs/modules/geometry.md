# @math.gl/geometry

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->SphereGeometry<!-- -->…

⛶⛶ Explore fullscreen

The `@math.gl/geometry` module provides renderer-independent CPU mesh data and primitive tessellators. Built-in box, capsule, cylinder, plane and sphere dimensions follow the glTF 2.1 [draft shape proposal](https://github.com/KhronosGroup/glTF/blob/726e078dea6b42c7ed0efb038c2f610a7cfca4c5/specification/2.1/Specification.adoc#shapes). Cube, cone, truncated-cone and icosphere convenience classes are adapted from the corresponding luma.gl primitives.

All generated meshes use `triangle-list` topology and expose `POSITION`, `NORMAL` and `TEXCOORD_0` typed-array attributes. Index buffers automatically use 32-bit values when a mesh has more than 65,535 vertices.

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

An infinite glTF plane cannot be tessellated, so `PlaneGeometry` requires finite `sizeX` and `sizeZ` values. Use `PlaneShape` from `@math.gl/culling` when infinite or partially infinite analytic planes are required.

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
* [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/geometry.md)

## Parametric surfaces[​](#parametric-surfaces "Direct link to Parametric surfaces")

The optional [`@math.gl/geometry/parametric`](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/parametric.md) subpath provides torus, lathe and sampled surface generators, with an interactive gallery.
