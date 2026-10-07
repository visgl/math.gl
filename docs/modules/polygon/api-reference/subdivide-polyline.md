# subdividePolyline

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

Subdivides straight source-coordinate edges until sampled error after a supplied transform is within a tolerance. Use it to approximate curved projected paths and polygon boundaries before rendering or triangulation.

```ts
import {subdividePolyline} from '@math.gl/polygon';

const result = subdividePolyline([0, 0, 1, 0], {
  transform: ([x, y]) => [x, y + x * x],
  tolerance: 0.001
});

// result.positions contains the transformed, subdivided path.
// result.sourcePositions contains the corresponding source coordinates.
```

The transform can wrap a CRS converter. The utility does not interpret CRS identifiers, choose a projection, or require a projection library. An application can scale projection output into its rendering coordinate space before returning it. `tolerance` then uses those same units. A renderer can derive that tolerance from the camera and desired visual quality.

For example, a polar CRS converter supplied by `@math.gl/projection` can be used without adding a dependency to the polygon utility:

```ts
import {Projection} from '@math.gl/projection';

const projection = new Projection({
  from: 'WGS84',
  to: '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=0 +datum=WGS84 +units=m'
});
const polarEdge = subdividePolyline([-45, 80, 45, 80], {
  transform: position => projection.project(Array.from(position)),
  tolerance: 100 // target coordinates are meters
});
```

## Parameters

`subdividePolyline(positions, options)` accepts a flat array or typed array of source positions. XY and XYZ inputs are supported. Empty input returns empty buffers; singleton input is transformed once. Input arrays and buffers remain unchanged.

| Option | Default | Description |
| --- | --- | --- |
| `transform` | Required | `(position: readonly number[]) => ArrayLike<number> \| null`. Maps source coordinates to target coordinates. Must return exactly `targetSize` finite components. Each invocation receives a fresh source array. Must be deterministic. |
| `tolerance` | Required | Positive, finite maximum sampled Euclidean deviation in target units. All target components participate. |
| `size` | `2` | Source vertex dimension: `2` or `3`. |
| `targetSize` | `size` | Target vertex dimension: `2` or `3`. |
| `maxSegmentLength` | `Infinity` | Positive maximum Euclidean leaf-edge length in source units. Useful to force sampling even where error probes could miss curvature. All source components participate; callers must choose compatible axis units. |
| `maxDepth` | `16` | Maximum bisection depth per input edge, from `0` through `30`. |
| `maxVertices` | `65536` | Maximum vertex count across the complete output, including original vertices. Positive integer no greater than `2^32 - 1`. |

## Result and attribution

The result contains:

- `positions: Float64Array`: flat transformed coordinates.
- `sourcePositions: Float64Array`: flat source coordinates at the same vertices.
- `segmentIndices: Uint32Array`: input edge index for each output vertex. Edge `i` connects source vertices `i` and `i + 1`.
- `segmentFractions: Float64Array`: interpolation fraction along the attributed input edge.

Original shared endpoints are emitted once and attributed to the preceding edge with fraction `1`. The first vertex uses edge `0` and fraction `0`; a singleton also uses these values. Fractions allow an application to interpolate colors, elevations, timestamps, or other data from the edge's original endpoints.

## Subdivision and accuracy

Each edge checks the source positions at fractions `1/4`, `1/2`, and `3/4`. For each probe, the utility measures the distance between the transformed probe and linear interpolation of the transformed endpoints **at the same fraction**. An edge is bisected if any probe exceeds `tolerance` or the source edge exceeds `maxSegmentLength`.

This criterion also subdivides a straight target edge whose transform has nonlinear speed. It preserves the source parameterization used for interpolating other attributes. It is a sampled criterion, not a mathematical bound for arbitrary transforms. Highly oscillatory transforms can pass the probes while deviating elsewhere; use an appropriate source-length limit when the transform requires it.

All source components interpolate linearly, including Z. Longitude/latitude inputs therefore describe straight edges in longitude/latitude coordinates. They do not acquire geodesic semantics. Convert or densify geodesic paths using the intended edge model before calling.

## Domains, seams and rings

Split geometry at projection seams and clip it to a valid domain before calling. A callback returning `null`, returning nonfinite coordinates, or throwing is an error. This utility does not infer clipping or wrapping policy. A discontinuity may exhaust the limits, and passing the probes does not prove that a discontinuity is absent.

Limits produce `RangeError` instead of returning incomplete geometry. Transform exceptions propagate unchanged. No partial result is returned. Invalid options, lengths, and source coordinates also produce `RangeError`.

For a polygon, process the exterior and each hole as separate, explicitly closed polylines. Closure is preserved when the closing vertex is supplied. Rebuild hole offsets from the new vertex counts before passing the transformed rings to [earcut](./earcut.md). Subdivision approximates boundaries; it does not repair self-intersections, split seams, triangulate the interior, or adapt triangle interiors to a nonlinear projection.

GPU buffers, layer updates, screen-space tolerance selection, and clipping policy remain the caller's responsibility.

For filled polygons and bitmaps that need interior deformation, use [subdivideTriangleMesh](./subdivide-triangle-mesh.md) after source-space triangulation.
