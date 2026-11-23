# Planar line and polygon operations

Import these functions from `@math.gl/geometry/polygon`. They operate on XY
coordinate arrays in one coordinate system.

| Function | Inputs and result |
| --- | --- |
| `mergePolylinePaths(paths)` | Joins paths at exact endpoints with two incident paths. Returns the merged paths, preserving branches and loops. |
| `segmentizePolylinePaths(paths, maxLength, maxAddedVertices, segmentFactory?)` | Splits long segments into equal-length intervals, retaining the original vertices and component boundaries. The optional factory supplies a segment length and interpolation callback for another metric. |
| `projectPointToPolyline(path, point)` | Returns the closest coordinate, distance in coordinate units, and fraction of path length. The first closest segment wins a tie. An empty path or nonfinite observation yields null. |
| `getPolygonValidityReason(polygons)` | Takes components as arrays of rings, with the exterior ring first. Returns the first XY topology diagnostic or `undefined` for valid geometry. |

`locatePointInPolygon(point, rings)` classifies points as outside (`-1`), on
the boundary (`0`), or inside (`1`). `pointOnSegment` tests incidence,
`segmentsMeet` tests crossings and contacts, and `endpointContacts` returns
the distinct endpoints shared by two segments.
