# Overview

## Installation

```bash
npm install @math.gl/polygon
```

## Usage

```js
import {Vector2} from '@math.gl/polygon';
```

## Attribution

The `earcut` function is a modified version of the [`earcut`](https://github.com/mapbox/earcut) library, which has a permissive [ISC License](https://github.com/mapbox/earcut/blob/master/LICENSE).

## Projection-aware subdivision

`subdividePolyline` subdivides source edges through a supplied coordinate transform using a tolerance in target units. It returns source and target coordinates plus edge attribution for interpolating other data. See the [API reference](https://math.gl/docs/modules/polygon/api-reference/subdivide-polyline) for domains, limits, accuracy, and polygon-ring usage.

`subdivideTriangleMesh` refines indexed triangle meshes with shared-edge conformity and interpolation weights for UVs and other vertex attributes. It supports filled polygons after triangulation and textured bitmap meshes. See the [mesh API reference](https://math.gl/docs/modules/polygon/api-reference/subdivide-triangle-mesh).
