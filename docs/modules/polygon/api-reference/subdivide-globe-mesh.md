{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# subdivideGlobeMesh

Refines an already triangulated geographic mesh onto a sphere or oblate spheroid.
This composes the existing shared-edge-conforming subdivision engine with the
shared spheroid conversion kernel; it does not introduce a second tessellator.

```js
import {subdivideGlobeMesh} from '@math.gl/polygon';

const mesh = subdivideGlobeMesh({
  // Dateline coordinates are unwrapped; the intended span is 20°, not 340°.
  positions: [170, -20, 190, -20, 190, 20, 170, 20],
  indices: [0, 1, 2, 0, 2, 3]
}, {
  tolerance: 1000, // sampled Cartesian error in meters
  semiMajorAxis: 6378137,
  semiMinorAxis: 6356752.314245,
  maxDepth: 10,
  maxVertices: 65536,
  maxTriangles: 131072
});
```

## Inputs and options

`positions` and `indices` follow [subdivideTriangleMesh](./subdivide-triangle-mesh.md).
`size` is 2 (longitude/latitude, default) or 3 (longitude/latitude/height). Angles are
degrees; heights use the same units as axes. Latitude must be in `[-90, 90]`.
Longitudes may be unwrapped beyond `[-180, 180]`, but each triangle must span no more
than 180°. Split/unwrap seams first; a 170° to -170° edge is rejected rather than
silently creating the wrong mesh. Triangulate holes and clip invalid domains before
calling. This adapter does not repair triangulation or convert arbitrary GeoJSON.

`semiMajorAxis` defaults to 6371000; `semiMinorAxis` defaults to the major axis.
Both must be finite and positive, with minor no greater than major. Tolerance is
positive finite sampled Cartesian error in axis units. Optional `maxEdgeLength` is
in **source coordinate units**, mixing degrees and height when size is 3; avoid that
option for mixed-unit meshes unless a meaningful source-space bound is chosen.

Depth, vertex and triangle limits retain the existing engine's global contracts.
Exhausting a limit throws `RangeError` rather than return a partial or unqualified
mesh. Invalid geometry, axes, latitude or unsplit longitude span also throw.

## Output and attribute preservation

The result contains Float64 Cartesian ECEF positions (X longitude 0, Y longitude
90, Z north), Uint32 triangle indices, refined source positions and original vertex/
triangle provenance. The output is **not deck.gl common space**. Apply the consumer's
frame conversion when rendering. Input arrays are not mutated.

Use `sourceVertexIndices` and `sourceVertexWeights` to interpolate UVs, colors and
other vertex attributes. Duplicate input vertices at attribute seams. Existing hole
boundaries and winding are retained in source space; source triangles are never
created across a hole. Shared edges refine conformingly without introducing
T-junctions. Outline geometry remains separate (use `subdividePolyline` with the
same transform); subdivision does not manufacture an outline from fill triangles.

Error checks sample edges and face interiors; they are not a certified continuous
error bound or a screen-pixel guarantee. Rendering front/back classification, depth
occlusion and imagery-request policy remain in the layer/viewport owner.

## Provenance

The adapter is original MIT TypeScript with SPDX comments. It reuses math.gl's
subdivision engine and optional spheroid kernel, retaining their own attribution.
[Kepler #3548](https://github.com/keplergl/kepler.gl/pull/3548) is closed/unmerged
research and provided motivation only; no proposed implementation code was copied.
See the [globe example](https://github.com/visgl/math.gl/tree/master/examples/globe-primitives)
for a non-Kepler consumer combining mesh geometry with occlusion and horizon bounds.
