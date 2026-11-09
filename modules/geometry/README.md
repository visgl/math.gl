# @math.gl/geometry

CPU-side geometry primitives and tessellation for 3D applications. The built-in box, capsule,
cylinder, plane and sphere follow the glTF 2.1 draft shape dimensions and coordinate conventions.
Infinite and partially infinite planes are represented analytically by `PlaneShape` in
`@math.gl/geometry/culling`; `PlaneGeometry` requires finite `sizeX` and `sizeZ` values.

```ts
import {CapsuleGeometry} from '@math.gl/geometry';

const capsule = new CapsuleGeometry({height: 2, radiusBottom: 0.5, radiusTop: 0.25});
```

Every generated mesh uses `triangle-list` topology and the glTF attribute semantics `POSITION`,
`NORMAL` and `TEXCOORD_0`. This package contains no GPU or renderer abstractions.

Related CPU geometry modules are available from subpaths: `@math.gl/geometry`,
`@math.gl/geometry`, `@math.gl/geometry`, `@math.gl/geometry/culling`, and
`@math.gl/geometry`. These APIs are implemented in this package. Polygon processing includes general tessellation
and mesh refinement, with Mercator clipping helpers. Globe mesh subdivision is available from
`@math.gl/geospatial`.

The experimental `HingeTree` evaluates rigid panels connected by hinges. See the
[HingeTree API](https://math.gl/docs/modules/geometry/api-reference/hinge-tree) and
[unfolding polyhedra example](https://github.com/visgl/math.gl/tree/master/examples/geometry/unfolding-polyhedron).

Optional `@math.gl/geometry/lighting` and `@math.gl/geometry/color` subpaths provide renderer-independent photometric and color LUT calculations. See the [lighting and color guide](https://math.gl/docs/modules/geometry/lighting). These CPU graphics utilities return numbers and typed arrays; file parsing remains in loaders.gl.

`projectBounds` samples a prepared nonlinear transform over a finite box. Its result distinguishes approximate fitting from an enclosure conditional on caller-qualified Lipschitz bounds. See the [API reference](https://math.gl/docs/modules/geometry/utils/api-reference/project-bounds).
Generate detached float64 UVs for CPU positions with `projectTextureCoordinates`, an explicit image rectangle and a prepared synchronous transform. It does not infer projection seams, clip domains or allocate GPU resources. See the [API reference](https://math.gl/docs/modules/geometry/utils/api-reference/project-texture-coordinates).

## Sources and credits

See [the packaged source and license index](./THIRD-PARTY-NOTICES.md) and
[math.gl references and credits](https://math.gl/docs/references-and-credits).

## Culling

This module contains classes for bounding boxes, view frustum intersections and analytic shapes.

The `BoxShape`, `CapsuleShape`, `CylinderShape`, `PlaneShape` and `SphereShape` classes follow the
glTF 2.1 draft shape conventions. They support point containment and distance, plane/frustum
classification, ray intersections, affine transforms and conservative enclosing bounds. Shape
distance is exact under rigid or uniform-scale transforms and estimated under non-uniform scale or
shear. `PlaneShape` represents an unbounded half-space and therefore has no finite bounding box or
bounding sphere.

## Curves

Renderer-independent 2D and 3D Euclidean curves: lines, quadratic and cubic Bézier curves,
cubic Hermite curves, and open or closed Catmull–Rom splines. Includes analytic derivatives,
unit tangents, flat Float64 sampling, and reusable approximate arc-length tables.

```ts
import {CubicBezierCurve, CurveArcLength} from '@math.gl/geometry';

const curve = new CubicBezierCurve([0, 0, 0], [1, 2, 0], [3, 2, 1], [4, 0, 1]);
const point = curve.getPoint(0.5);
const tangent = curve.getTangent(0.5);
const traversal = new CurveArcLength(curve);
const positions = traversal.getSpacedPoints(100); // 101 xyz vertices
const output = new Float64Array(3);
traversal.getPointAt(0.25, output); // reuse a buffer during animation
```

Control points are copied at construction. Parameters are in [0, 1]; coordinates use the
caller's Cartesian units. Longitude/latitude inputs are treated as a plane, not geodesics.


See the [module documentation](https://math.gl/docs/modules/curves) for the API and numerical limits.

## Polygon

This module contains utilities that work with polylines and polygons.

### Projection-aware subdivision

`subdividePolyline` subdivides source edges through a supplied coordinate transform using a tolerance in target units. It returns source and target coordinates plus edge attribution for interpolating other data. See the [API reference](https://math.gl/docs/modules/geometry/polygon/api-reference/subdivide-polyline) for domains, limits, accuracy, and polygon-ring usage.

`subdivideTriangleMesh` refines indexed triangle meshes with shared-edge conformity and interpolation weights for UVs and other vertex attributes. It supports filled polygons after triangulation and textured bitmap meshes. See the [mesh API reference](https://math.gl/docs/modules/geometry/polygon/api-reference/subdivide-triangle-mesh).

## Spatial index

Experimental static 2D/3D box and point indexes and a triangle BVH. Queries return original
input row or triangle indices. Intended as a reusable mathematical foundation for loaders and
applications, with geometry refinement left to adapters. See the module docs for limits.

## Utils

This module contains dependency-light utilities for typed-array geometry, primitive iteration,
vertex normals, packed colors, and compressed attributes.
