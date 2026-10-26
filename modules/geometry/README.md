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

Related CPU geometry modules are available from subpaths: `@math.gl/geometry/utils`,
`@math.gl/geometry/curves`, `@math.gl/geometry/polygon`, `@math.gl/geometry/culling`, and
`@math.gl/geometry/spatial-index`. These APIs are implemented in this package. Polygon processing includes general tessellation
and mesh refinement, with Mercator clipping helpers. Globe mesh subdivision is available from
`@math.gl/geospatial/globe`.

The experimental `HingeTree` evaluates rigid panels connected by hinges. See the
[HingeTree API](https://math.gl/docs/modules/geometry/api-reference/hinge-tree) and
[unfolding polyhedra example](https://github.com/visgl/math.gl/tree/master/examples/unfolding-polyhedron).

## Sources and credits

See [the packaged source and license index](./THIRD-PARTY-NOTICES.md) and
[math.gl references and credits](https://math.gl/docs/references-and-credits).
