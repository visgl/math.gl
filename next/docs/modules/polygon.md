# Overview

![From v3.2](https://img.shields.io/badge/From-v3.2-blue.svg?style=flat-square)

`@math.gl/polygon` clips and splits polygons and polylines, computes winding and area, and adaptively subdivides geometry through coordinate transforms. Use it to prepare geometry before triangulation or rendering.

<!-- -->

## Polygon playground[​](#polygon-playground "Direct link to Polygon playground")

Loading <!-- -->Polygon playground<!-- -->…

⛶⛶ Explore fullscreen

[Open the interactive example](https://visgl.github.io/math.gl/next/examples/polygon-playground).

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/polygon
```

## Usage[​](#usage "Direct link to Usage")

```
import {earcut} from '@math.gl/polygon';



const positions = [0, 0, 1, 0, 1, 1, 0, 1];

const indices = earcut(positions, [], 2); // Two triangles
```

## Projection-aware subdivision[​](#projection-aware-subdivision "Direct link to Projection-aware subdivision")

`subdividePolyline` subdivides source edges through a supplied coordinate transform using a tolerance in target units. It returns source and target coordinates plus edge attribution for interpolating other data. See the [API reference](https://visgl.github.io/math.gl/next/docs/modules/polygon/api-reference/subdivide-polyline.md) for domains, limits, accuracy, and polygon-ring usage.

`subdivideTriangleMesh` refines indexed triangle meshes with shared-edge conformity and interpolation weights for UVs and other vertex attributes. It supports filled polygons after triangulation and textured bitmap meshes. See the [mesh API reference](https://visgl.github.io/math.gl/next/docs/modules/polygon/api-reference/subdivide-triangle-mesh.md).

[subdivideGlobeMesh](https://visgl.github.io/math.gl/next/docs/modules/polygon/api-reference/subdivide-globe-mesh.md) prepares a globe mesh while preserving attribute provenance. See [polygon utilities](https://visgl.github.io/math.gl/next/docs/modules/polygon/api-reference/polygon-utils.md) for winding and area conventions, and [earcut](https://visgl.github.io/math.gl/next/docs/modules/polygon/api-reference/earcut.md) for triangulation input and hole offsets.

## Attribution[​](#attribution "Direct link to Attribution")

The `earcut` implementation derives from Mapbox's earcut library under the ISC license. Source headers and distributed notices retain the applicable attribution.
