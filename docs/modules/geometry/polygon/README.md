# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.2-blue.svg?style=flat-square" alt="From v3.2" />
</p>

`@math.gl/geometry` clips and splits polygons and polylines, computes winding and area, and adaptively subdivides geometry through coordinate transforms. Use it to prepare geometry before triangulation or rendering.


import Example from '@site/src/components/polygon-playground';

## Feature support

Capabilities for preparing polygons, polylines, and meshes before rendering.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature | math.gl support | Notes |
| --- | --- | --- |
| Winding, signed area and ring traversal | ✅ Implemented | [Polygon utilities](./api-reference/polygon-utils.md) define planar winding and area conventions. |
| Polygon triangulation with holes | ✅ Implemented | [earcut](./api-reference/earcut.md) consumes flat positions and explicit hole offsets. |
| Polyline/polygon clipping and grid cuts | ✅ Implemented | [Clipping](./api-reference/clip-polygon.md) and grid/Mercator helpers split geometry at supported boundaries. |
| Projection-aware edge subdivision | ✅ Implemented | [subdividePolyline](./api-reference/subdivide-polyline.md) uses target-space tolerances and retains original-edge attribution. |
| Conforming triangle-mesh refinement | ✅ Implemented | [subdivideTriangleMesh](./api-reference/subdivide-triangle-mesh.md) shares edge subdivisions and returns interpolation provenance. |
| Projected triangle-mesh clipping | ✅ Implemented | [clipTriangleMesh](./api-reference/clip-triangle-mesh.md) supports disjoint convex target-plane regions, periodic copies and original-vertex weights; prepare geographic topology separately. |
| Certified continuous projection-error bounds | ❌ Not implemented | Adaptive sampling tests an approximation criterion; it does not prove a global continuous maximum error. |
| General Boolean topology and invalid-ring repair | ❌ Not implemented | Clipping/triangulation do not supply a full union/difference/topology-repair engine for arbitrary malformed polygons. |
| Global geodesic and spherical polygon topology | ◐ Partial | Use the separate [geospatial seam/atlas APIs](../../geospatial/api-reference/geographic-seams.md) for their explicit edge models and supported domains. |

## Polygon playground

<Example inline />

[Open the interactive example](/examples/polygon-playground).

## Installation

```bash
npm install @math.gl/geometry
```

## Usage

```js
import {earcut} from '@math.gl/geometry';

const positions = [0, 0, 1, 0, 1, 1, 0, 1];
const indices = earcut(positions, [], 2); // Two triangles
```

## Projection-aware subdivision

`subdividePolyline` subdivides source edges through a supplied coordinate transform using a tolerance in target units. It returns source and target coordinates plus edge attribution for interpolating other data. See the [API reference](./api-reference/subdivide-polyline.md) for domains, limits, accuracy, and polygon-ring usage.

`subdivideTriangleMesh` refines indexed triangle meshes with shared-edge conformity and interpolation weights for UVs and other vertex attributes. It supports filled polygons after triangulation and textured bitmap meshes. See the [mesh API reference](./api-reference/subdivide-triangle-mesh.md).

See [polygon utilities](./api-reference/polygon-utils.md) for winding and area conventions, and [earcut](./api-reference/earcut.md) for triangulation input and hole offsets.

## Attribution

The `earcut` implementation derives from Mapbox's earcut library under the ISC license. Source headers and distributed notices retain the applicable attribution.

`clipTriangleMesh` clips prepared target-plane triangles to disjoint convex regions, including
periodic copies, and preserves original-vertex weights for UV and other attribute interpolation.
Concave domains and holes can be supplied as triangulated regions. See the
[clipping API reference](./api-reference/clip-triangle-mesh.md).
