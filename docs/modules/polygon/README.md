# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.2-blue.svg?style=flat-square" alt="From v3.2" />
</p>

`@math.gl/polygon` clips and splits polygons and polylines, computes winding and area, and adaptively subdivides geometry through coordinate transforms. Use it to prepare geometry before triangulation or rendering.


import Example from '@site/src/components/polygon-playground';

## Polygon playground

<Example inline />

[Open the interactive example](/examples/polygon-playground).

## Installation

```bash
npm install @math.gl/polygon
```

## Usage

```js
import {earcut} from '@math.gl/polygon';

const positions = [0, 0, 1, 0, 1, 1, 0, 1];
const indices = earcut(positions, [], 2); // Two triangles
```

## Projection-aware subdivision

`subdividePolyline` subdivides source edges through a supplied coordinate transform using a tolerance in target units. It returns source and target coordinates plus edge attribution for interpolating other data. See the [API reference](./api-reference/subdivide-polyline.md) for domains, limits, accuracy, and polygon-ring usage.

`subdivideTriangleMesh` refines indexed triangle meshes with shared-edge conformity and interpolation weights for UVs and other vertex attributes. It supports filled polygons after triangulation and textured bitmap meshes. See the [mesh API reference](./api-reference/subdivide-triangle-mesh.md).

[subdivideGlobeMesh](./api-reference/subdivide-globe-mesh.md) prepares a globe mesh while preserving attribute provenance. See [polygon utilities](./api-reference/polygon-utils.md) for winding and area conventions, and [earcut](./api-reference/earcut.md) for triangulation input and hole offsets.

## Attribution

The `earcut` implementation derives from Mapbox's earcut library under the ISC license. Source headers and distributed notices retain the applicable attribution.
