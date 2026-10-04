# @math.gl/polygon

[math.gl](https://math.gl/docs) is a suite of math modules for 3D applications.

This module contains utilities that work with polylines and polygons.

For documentation please visit the [website](https://math.gl).

## Projection-aware subdivision

`subdividePolyline` subdivides source edges through a supplied coordinate transform using a tolerance in target units. It returns source and target coordinates plus edge attribution for interpolating other data. See the [API reference](https://math.gl/docs/modules/polygon/api-reference/subdivide-polyline) for domains, limits, accuracy, and polygon-ring usage.

`subdivideTriangleMesh` refines indexed triangle meshes with shared-edge conformity and interpolation weights for UVs and other vertex attributes. It supports filled polygons after triangulation and textured bitmap meshes. See the [mesh API reference](https://math.gl/docs/modules/polygon/api-reference/subdivide-triangle-mesh).

`subdivideGlobeMesh` adapts the mesh engine to geographic sphere/oblate geometry,
with explicit error/work limits, longitude seam checks and attribute provenance.
See the [globe mesh API](https://math.gl/docs/modules/polygon/api-reference/subdivide-globe-mesh).
