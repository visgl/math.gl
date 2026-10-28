# Geometry streams and task workers

`streamGeoArrow` and `tessellateGeoArrowStream` are named exports from
`@math.gl/geospatial/geoarrow` and the geospatial root. They bridge native GeoArrow buffers to
caller-supplied geometry engines without adding a D3, PROJ, or Arrow runtime dependency.

## Stream native geometry

`streamGeoArrow(column, sink, options)` emits synchronous `point(x, y)`, `lineStart`, `lineEnd`,
`polygonStart` and `polygonEnd` events. The sink is structurally compatible with D3's stream
interface. Coordinates are read from physical arrays; complete GeoJSON rows are not materialized.
Native XY points, lines, polygons, multipart geometries, mixed columns and collections are
supported, including sliced/chunked, separated and interleaved layouts. Null rows emit no geometry.
Polygon rings omit their repeated closing coordinate, following the D3 convention.

This initial contract rejects Z/M dimensions, serialized geometry and boxes. Decode or convert
those explicitly. Input winding, CRS units and planar/spherical edge semantics are not changed.
D3 expects longitude/latitude degrees and its spherical ring convention; a point converter is
not a geometry stream. Native `MapEngine` spherical clipping remains a separate supported path.

Options include `sourceRowOffset`, `onRowStart`, `onRowEnd` and the existing GeoArrow `limits`.
Row callbacks include null rows and surround all events for a collection or multipart row.
Sink errors propagate; a caller-owned sink may retain partial events after an exception.

## Clip, then tessellate

```ts
import {tessellateGeoArrowStream} from '@math.gl/geospatial/geoarrow';
import {geoOrthographic} from 'd3-geo'; // optional application dependency

const projection = geoOrthographic().rotate([-20, 30]);
const mesh = tessellateGeoArrowStream(column, {
  createStream: sink => projection.stream(sink),
  maxVertices: 65536,
  maxTriangles: 131072
});
```

The transform must emit finite **planar** simple rings whose interiors are disjoint or nested,
and flush each source row synchronously. The sink classifies nested rings as holes and separate
rings as disconnected exteriors, then triangulates. It does not repair self-intersections or
perform its own spherical clipping. Interrupted D3 projections need clipping-aware factories
such as those from `d3-geo-polygon`; point projection alone does not cut internal lobe boundaries.

The returned `positions` are Float64 XY, `indices` are Uint32, `polygonStarts` contains vertex
offsets with a terminal sentinel, `polygonSourceRows` identifies each polygon, and
`sourceRowIndices` identifies each vertex. Clipping can increase the polygon count while keeping
several parts associated with one input row. Z/M and arbitrary vertex attributes are not silently
interpolated. Points and standalone lines are ignored by this polygon tessellator.

`maxVertices` counts polygon coordinates emitted by the transform, including discarded rings;
`maxTriangles` limits output triangles. `maxRingComparisons` (default 1,000,000) bounds containment
classification attempts. Exhaustion throws with no partial mesh. Source row IDs must fit Uint32.
Bounded input does not imply bounded resampling output, so use both input `limits` and these output
limits. This is a synchronous operation and should run in a worker for expensive datasets.

## Reuse the task runtime

The [runnable worker example](https://github.com/visgl/math.gl/tree/master/examples/geospatial/geoarrow-stream-worker)
uses `runTask` and `createWorker` from `@math.gl/core/tasks`. It sends a plain geometry column and a
projection factory name, creates the D3 stream inside the worker, and returns transferable typed
arrays. It demonstrates antimeridian splitting, holes, null rows, source identity and hemisphere
clipping. The same processor runs locally for parity tests.

```ts
const mesh = await runTask(geometryTask, {
  column,
  projection: 'equirectangular'
}, {execution: 'worker', inputOwnership: 'transfer'});
```

Transferring input detaches its buffers; build fresh input or retain a separate copy before another
request. Copy/shared ownership and cancellation use the existing task API. A synchronous transform
cannot receive cooperative cancellation while it blocks the worker's event loop; use termination
or batch work at row boundaries with asynchronous yields. Do not send functions or live projection
objects in task requests. The example uses the existing `loadWorker` factory for module workers;
it does not require changes to the worker runtime.

External WASM engines can be initialized in a persistent worker resource and use asynchronous
batch transforms. They can use the same task transport, but must provide their own geometry
clipping/topology stage; scalar or batch point conversion is not a replacement for a stream.
See the existing [proj-wasm example](https://github.com/visgl/math.gl/tree/master/examples/geospatial/proj-wasm-crs).
No Promise-returning converter is adapted into the synchronous CRS descriptor contract.

For deck.gl, use the returned polygon offsets, positions and indices as binary attributes under
a Cartesian view, and map picking results through `polygonSourceRows`. Apply projection only once.
See [deck.gl's integration example](https://github.com/visgl/deck.gl/pull/10966) for rendering details.
