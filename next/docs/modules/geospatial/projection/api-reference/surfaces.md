# Prepared surfaces and transitions 🧪

These experimental APIs are available from `@math.gl/geospatial/projection`. They have no DOM, deck.gl, texture-loading, or animation-clock dependency.

| Operation                         | Responsibility                                                            |
| --------------------------------- | ------------------------------------------------------------------------- |
| `MapEngine.prepareFeatures`       | Clip vector features and retain their provenance                          |
| `MapEngine.prepareSurface`        | Sample chart-clipped geographic rasters and retain chart IDs              |
| `prepareProjectionSurface`        | Sample an ordinary CRS projection inside an explicit geographic rectangle |
| `prepareMapTransitionMesh[Async]` | Prepare screen-space correspondence for renderer-supplied endpoints       |

## Chart-clipped raster surfaces[​](#chart-clipped-raster-surfaces "Direct link to Chart-clipped raster surfaces")

`map.prepareSurface(options?)` samples each chart separately through the map's existing geographic coverage and projection. Triangles never join vertices from different charts. Continuous vertices share indices within one chart and UV bank. Child inset frames reserve their parent chart's placed rectangle. The sampler omits parent samples inside those frames so mainland imagery cannot cover insets. `map.projectSurfacePoint(position, regionId?)` exposes the same presentation rule for renderer-supplied transition endpoints. It returns the ordinary projected point or `null`; `projectPoint` retains its geographic coverage behavior.

`options` accepts:

| Option              | Meaning                                                                                                              | Default                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `maxAngularStep`    | Positive sampling step in degrees, at most 180°; one value or `[longitudeStep, latitudeStep]`                        | `0.5`                  |
| `textureBounds`     | Geographic raster bounds `[west, south, east, north]`, in degrees; west < east, south < north, longitude span ≤ 360° | `[-180, -90, 180, 90]` |
| `textureProjection` | Latitude-to-V mapping: `geographic` or spherical `mercator`                                                          | `geographic`           |
| `maxVertices`       | Integer work/output budget, from 3 to 2³²−1                                                                          | `1000000`              |
| `maxEdgeLength`     | Optional positive discontinuity guard in output coordinate units                                                     | no guard               |

Mercator raster bounds must stay strictly between ±90°. A patch outside the map's coverage returns an empty mesh. Invalid bounds/options and exhausted vertex budgets reject with `RangeError`; no partial mesh is returned.

The `MapSurfaceMesh` result contains:

| Field         | Meaning                                                           |
| ------------- | ----------------------------------------------------------------- |
| `positions`   | XYZ triples in placed map units, with Z=0, as `Float64Array`      |
| `texCoords`   | UV pairs, as `Float32Array`; V=0 at the raster's north edge       |
| `partIds`     | Chart index into `map.regions`, per vertex, as `Float32Array`     |
| `indices`     | Triangle vertex indices, as `Uint32Array`                         |
| `vertexCount` | Number of indices, for draw calls                                 |
| `bounds`      | Placed XY bounds of emitted vertices, or `null` for an empty mesh |

Whole-world geographic UVs retain a continuous longitude bank and may exceed U=1 near the antimeridian. Renderers must wrap longitude when sampling whole-world imagery. A bounded tile uses its declared raster bounds. Political boundaries are independent of chart coverage and remain an application mask. Sampling is a geographic approximation, not a pixel-error certificate: lower the angular step to match the display scale. Boundary cells with out-of-coverage vertices are omitted; thin features below the sampling step may not be represented.

`MapEngine` projection is spherical. These surfaces preserve its declared chart model; they do not add ellipsoidal or datum transformations.

## Ordinary CRS surfaces[​](#ordinary-crs-surfaces "Direct link to Ordinary CRS surfaces")

`prepareProjectionSurface(projection, options)` uses the same bounded sampler. `projection` supplies `project([longitude, latitude])`; it must accept the declared geographic degree inputs. `options.extent` is the required geographic validity rectangle, with the same range rules as raster bounds. `options.scale` is a positive output-coordinate multiplier (default 1). All raster options above apply; `maxEdgeLength` uses scaled output units.

Undefined, throwing, or nonfinite projection samples are excluded. This does not discover a projection's domain, infer cuts, or replace chart clipping. Use `MapEngine.prepareSurface` for multi-chart and inset maps.

```
import {MapEngine, prepareProjectionSurface, projectionEngine} from '@math.gl/geospatial/projection';



const usa = new MapEngine({version: 1, id: 'usa', definition: {type: 'albers-usa'}});

const mesh = usa.prepareSurface({maxAngularStep: 0.25});



const projection = projectionEngine.createProjection({from: 'WGS84', to: '+proj=eqearth +datum=WGS84 +units=m'});

const world = prepareProjectionSurface(projection, {extent: [-180, -90, 180, 90], maxAngularStep: 1});
```

## Transition buffers[​](#transition-buffers "Direct link to Transition buffers")

`prepareMapTransitionMesh(source, target, options?)` and `prepareMapTransitionMeshAsync(source, target, options?)` are exported from `@math.gl/geospatial/discontinuous`. These complement `MapTransition`'s line and polygon preparation with reusable, indexed surface buffers for a renderer. They have no deck.gl, DOM, imagery, or animation-clock dependency.

Each endpoint is a function `(longitude, latitude, sector?) => point | null`. Coordinates are degrees; `sector` identifies the geographic cell's longitude bank so an adapter can distinguish opposite sides of a wrap seam. Return `{position: [x, y, z], inside, part?, seam?, front?, cutPosition?}`:

* `position` uses a common screen space at both endpoints, in pixels around the viewport center, with depth in `z`.
* `inside: false` or `null` excludes a sample from that endpoint's coverage.
* `part` identifies an independently placed cut piece; `seam` distinguishes duplicated banks within one piece. IDs are opaque strings or numbers; types and tuple boundaries remain distinct even when IDs contain separators. Different pieces and seam banks never share triangles.
* `front: false` excludes a sample from visible-curvature refinement and rigid motion fitting. The renderer still owns back-face and depth handling.
* `cutPosition` optionally supplies coordinates for discontinuity checks. Set `endpoint.maxEdgeLength` in those units; the default is no length guard.

Endpoint functions can also carry `width` and `height` (defaults 1000 × 800). A repeated-world adapter supplies `worldWidth` in pixels and `wrapCopies` (integer world offsets); repeated cut coordinates use 360-degree offsets. If both endpoints supply an empty list, the builders return empty typed buffers without sampling the endpoints. Omitted lists default to world zero.

`options.error` is a positive pixel tolerance (default `0.6`). It bounds curvature probes and stops further subdivision once each visible cut bank is subpixel. `options.maxDepth` is an integer from 0 to 12 (default 7), per initial two-degree geographic cell. Exhausting this depth can leave larger approximation errors at high zoom; it is a work limit, not an accuracy guarantee. `options.maxVertices` (default 1,000,000, minimum 3) and `options.maxTriangles` (default 2,000,000, minimum 1) are positive integer budgets across repeated world copies. Invalid budgets and exhausted limits reject with `RangeError` instead of returning partial buffers.

The result contains `positions` (`Float64Array`), `destination`, `texCoords`, `lifetime`, `pieceCenters`, `pieceAngles` (`Float32Array`), `indices` (`Uint32Array`), and `vertexCount` (index count). Geographic UVs are `[(longitude + 180) / 360, (90 - latitude) / 180]`. `lifetime` stores source/target coverage flags per vertex; unmatched patches retain their geometry so a renderer can fade them rather than stretch them to a point. Piece centers and angles separate planar rigid motion from the remaining deformation. Centers are `[fromX, fromY, toX, toY]`; angles are radians in the input screen coordinate frame. For progress `t`, evaluate XY as `mix(R(angle*t)*(from.xy-centerFrom), to.xy-centerTo, t) + mix(centerFrom, centerTo, t)` and Z as `mix(from.z, to.z, t)`. The rotation uses the ordinary 2D rotation matrix; callers choose their screen frame consistently at both endpoints.

The asynchronous form returns identical buffers, yielding to host tasks during recursive refinement, motion fitting, and buffer packing. It accepts `options.signal` (a native AbortSignal or structural `throwIfAborted()` guard) for cancellation and rejects with the signal's abort reason instead of returning a partial mesh. Prepare once and update a GPU progress uniform during animation. Start the renderer's clock after the first actual draw so initial shader compilation and buffer uploads do not consume the visible transition.

This is sampled geographic correspondence for rendering. It does not certify that intermediate surfaces are free of folds or overlaps, and it does not replace `MapTransition`'s conservative strategy selection for feature geometry.
