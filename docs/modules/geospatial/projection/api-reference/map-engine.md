# MapEngine

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Compile a `MapDescription` into spherical chart projection, layout, picking, and
optional hinge motion. Import from `@math.gl/geospatial/discontinuous`.
For a complete rendering workflow, see the [MapEngine guide](../developer-guide/map-engine.md).
The API is experimental and may change before stabilization.

## MapDescription and MapDefinition

<span class="badge">From v5.0 · Experimental</span>

```typescript
type MapDescription = {
  version: 1;
  id: string;
  title?: string;
  radius?: number; // default 1; finite and positive
  attribution?: readonly string[];
  definition: MapDefinition;
};
```

Descriptions are plain data. Construction takes a deeply frozen snapshot and
rejects functions, class instances, and nonfinite numbers. `id` is a nonempty
application identifier, not a topology compatibility key. `radius` scales all
output axes and placements, including custom-chart frames. Inputs always use
spherical degrees; the radius does not specify an ellipsoid or a CRS.

| `definition.type` | Additional fields and defaults |
| --- | --- |
| `healpix` | Spherical H=4, K=3; `centralMeridian: 0`; 8 computational charts, not rHEALPix |
| `gingery` | `centralMeridian: 0`, `lobes: 6` (integer 3–24), `coreAngle: 30` (strictly between 0° and 90°) |
| `interrupted` | Required `projection` and `lobes: {north, south}`; optional `centralMeridian: 0`, `latitudes: {north: 0, south: 0}`; see below |
| `projection` | Required `projection`: a `MapProjection` from `MAP_PROJECTIONS`; [named projection catalog](../../discontinuous/projection-catalog.md), with preset geographic aspects and regional coverage |
| `regional` | Required `projection`; optional formula-specific fields documented in the [regional API](../../discontinuous/projection-catalog.md#regional-api) |
| `world` | `projection`: a `WorldProjection` name from `WORLD_PROJECTIONS`; `parameters`: optional formula-specific values; `centralMeridian: 0`. See [world maps](../../discontinuous/README.md#world-maps). |
| `mercator` | `centralMeridian: 0`, `maxLatitude: 85.0511287798066`; limit strictly between 0° and 90° |
| `goode` | Goode land-oriented homolosine cuts: two northern and four southern lobes |
| `interrupted-sinusoidal` | Independent six-lobe sinusoidal arrangement |
| `interrupted-mollweide` | Same independent cuts, Mollweide formula |
| `interrupted-homolosine` | Same independent cuts, homolosine formula; differs from `goode` |
| `albers-usa` | `includeTerritories: false`; true adds PR, VI, GU, MP, AS to Alaska/Hawaii |
| `gray-fuller` | Exact Gray–Fuller on the AirOcean net; 24 panels |
| `petroff` | `centralMeridian: 0`; polar equal-area square, 8 charts |
| `isea` | Spherical Snyder equal-area icosahedron; vertex at north pole, 20 faces |
| `dsea` | Spherical Snyder equal-area dodecahedron; vertex at north pole, 12 faces |
| `air-ocean` | 24-panel radial/gnomonic map; not Gray-Fuller |
| `myriahedral` | [Myriahedral options](../../discontinuous/myriahedral.md): `preset`, `columns`, `solid`, `subdivisions`, `mesh`, `centralMeridian`, `landSampleStep`; use top-level radius and runtime callbacks |
| `peirce-quincuncial` | `centralMeridian: 0`; equatorial Peirce square-world layout, 8 computational charts |
| `berghaus` | `centralMeridian: 0`, `lobes: 5`; integer lobes from 3–24, two charts per lobe |
| `guyou` | `centralMeridian: 0`; two joined conformal hemisphere squares, 8 computational charts |
| `gringorten-quincuncial` | `centralMeridian: 0`; equal-area quincuncial in equatorial aspect, 8 charts |
| `butterfly` | Octahedral gnomonic butterfly, 8 faces |
| `collignon-butterfly` | Collignon octahedral butterfly, 8 faces |
| `waterman` | Waterman W5 butterfly: 8 hexagons and 24 corner triangles |
| `goode-ocean` | Ocean-oriented homolosine lobes, central meridian −160°, no duplicate extensions |
| `interrupted-boggs` | Boggs eumorphic with land-oriented equatorial interruptions |
| `interrupted-sinu-mollweide` | Sinu-Mollweide formula with land-oriented equatorial cuts; not D3's oblique five-lobe layout |
| `interrupted-quartic-authalic` | Paired hemispheric lobes, central meridian −20° |
| `interrupted-mollweide-hemispheres` | Paired Mollweide hemispheres, central meridian −20° |
| `custom` | `charts: readonly MapChartDescription[]` |

Mercator is spherical, not ellipsoidal Mercator. It clips lines and polygons to
the finite latitude band after antimeridian/chart splitting. Coordinates at
the poles are outside coverage. Goode uses seven convex computational charts:
the broad Eurasian lobe has an extra continuous join. This is not a claim of
bitwise agreement with another cartographic implementation.

### Gray–Fuller, Petroff, and Snyder maps

<span class="badge">From v5.0 · Experimental</span>

```typescript
const map = new MapEngine({
  version: 1,
  id: 'snyder-earth',
  definition: {type: 'isea'}, // also 'dsea', 'gray-fuller', or 'petroff'
  radius: 1
});
const hit = map.projectPoint([-74, 41]);
const inverse = hit && map.unprojectPoint(hit.position, hit.regionId);
```

`gray-fuller` uses Robert W. Gray's exact equations for Fuller's triangular
faces, including the original face frame for split panels. It shares AirOcean's
24-panel topology and geographic orientation with `air-ocean`, whose face
mapping remains gnomonic. Gray–Fuller is **not equal-area**. “Exact” identifies
the mathematical projection, not exact arithmetic: inversion uses a bounded
monotone angle solve. Output uses the raw Gray–Fuller scale times `radius`, with
the first face's center at the origin; D3's display rotation and translation differ.

`petroff` implements Matthew A. Petroff's 2021 square equal-area projection in
its published polar aspect. The north pole maps to the center and the south pole
to four corners. Output occupies `[-radius, radius]²`, so its area scale relative
to a unit sphere is `radius² / π`. `centralMeridian` rotates longitude only.
Forward and inverse use the author's closed-form equations, with stable
Cartesian expressions and explicit limits at section vertices and poles.

`isea` and `dsea` apply Snyder's equal-area construction to an icosahedron and
dodecahedron respectively. Both use 120 right spherical subtriangles internally,
but expose one chart per face; their continuous internal subdivisions do not
multiply clipping work. Each net's planar area is `4π × radius²`. The net tables
follow PROJ's Snyder strip (ISEA) and two-row pentagonal (DSEA) layouts. Both
math.gl presets place vertex zero at the north pole. This differs from PROJ's
**default geographic aspects**, and output starts at the root-face center with a
local face orientation. They are spherical maps, not ellipsoidal CRS operations,
DGGS cell indexers, or arbitrary-net builders. Inversion uses a bounded monotone
spherical-area solve followed by an analytic radial inverse.

All four definitions use the existing `MapEngine` layout, fitting, mesh, picking,
and transition pipeline. They are static maps: transitions to other layouts go
through the globe; they do not supply hinge animation. At cuts and repeated pole
images, preserve `regionId` when selecting an inverse candidate. Ice Age Explorer
includes all four in its projection selector and uses the same worker-based mesh
preparation and globe transitions as its other discontinuous maps.

Mathematical references: [Gray (1995)](https://github.com/d3/d3-geo-polygon/blob/main/src/grayfuller.js),
[Petroff's paper and public-domain supplement](https://doi.org/10.5281/zenodo.4661351),
[Snyder / PROJ's polyhedral documentation](https://proj.org/en/stable/operations/projections/polyhedral.html),
and [BRSR's vector formulation](https://brsr.github.io/2021/08/31/snyder-equal-area.html).
The [package notices](https://github.com/visgl/math.gl/blob/master/modules/geospatial/THIRD-PARTY-NOTICES.md)
record source adaptations and licenses. No Nico Belmonte application code is used.

### HEALPix, Gingery, and configurable interruptions

<span class="badge">From v5.0 · Experimental</span>

`healpix` combines a cylindrical equal-area equatorial band with four Collignon
polar lobes in each hemisphere. Its formula changes at ±asin(2/3), approximately
±41.81°. Output uses the spherical HEALPix equations in radians times `radius`,
not D3's normalized display scale. It is a projection, not a HEALPix cell indexer.
The polar rearrangement of rHEALPix is not implemented.

`gingery` preserves an azimuthal-equidistant central cap and opens the rest of
the sphere into star lobes. `coreAngle` is the cap's angular radius in degrees;
`radius` still means the output scale. The implementation uses bounded numerical
arc-length solves, so it is more expensive than HEALPix. Its default aspect is
equatorial, unlike D3's default oblique view.

```typescript
const map = new MapEngine({
  version: 1, id: 'custom-interruptions',
  definition: {
    type: 'interrupted', projection: 'sinusoidal', centralMeridian: 20,
    lobes: {
      north: [[-180, -90, 0], [0, 90, 180]],
      south: [[-180, -120, -60], [-60, 60, 180]]
    }
  }
});
```

Each lobe is `[west, center, east]` in degrees relative to `centralMeridian`.
Each hemisphere must partition `[-180, 180]` in west-to-east order, without gaps
or overlaps. Centers must lie within the lobe and be at most 180° from either
edge. Supported `projection` values are `sinusoidal`, `mollweide`, `homolosine`,
`boggs`, `sinu-mollweide`, and `quartic-authalic`. Interruptions begin at the
optional `latitudes.north` and `latitudes.south` (both default 0°); north must be
in [0, 90), south in (−90, 0]. Wide lobes are subdivided into convex charts with
continuous internal joins. The catalog supplies D3's native oblique Sinu-Mollweide
preset; arbitrary per-lobe latitudes and arbitrary oblique rotations are not options.

All three definitions support the usual seam-aware geometry, fitting, picking,
and transitions through the globe; none supplies hinge motion. At a cut, use a
region ID to choose a side. Seam endpoints identify where a join becomes a cut.

References: [Calabretta's HEALPix equations](https://arxiv.org/abs/astro-ph/0412607),
[PROJ's HEALPix documentation](https://proj.org/en/stable/operations/projections/healpix.html),
and [D3's Gingery implementation](https://github.com/d3/d3-geo-projection/blob/v4.0.0/src/gingery.js).
Gingery's arc-length construction is adapted under ISC; chart assembly and
bounded inverse handling use math.gl's existing pipeline. See the package's
third-party notices.

### Quincuncial and star definitions

<span class="badge">From v5.0 · Experimental</span>

```typescript
const peirce = new MapEngine({
  version: 1, id: 'peirce', definition: {type: 'peirce-quincuncial'}
});
const star = new MapEngine({
  version: 1, id: 'star', radius: 1,
  definition: {type: 'berghaus', lobes: 5, centralMeridian: -30}
});
```

Both cover the sphere, have cuts, and expose the standard point/line/polygon,
fitting, picking and globe-frame methods. Neither has hinge motion. Units scale
with `radius`; no ellipsoidal datum is implied. The center is latitude zero at
`centralMeridian` (degrees, default zero); Peirce does not use D3's default polar
rotation. Berghaus lobe tips are distinct images of the same antipodal point.
Use region IDs to select a side at a cut. Boundary picking may return multiple
candidates; blank space outside the map returns none.

Peirce has four conformal branch points on the hemisphere boundary; finite
limits are used there, but derivatives are singular. Adaptive line sampling
approximates curved projected edges; adjust sampling tolerance for output size.
Input polygons still require an open-hemisphere source chart. See the
[interactive comparison and support table](../developer-guide/discontinuous-projections.md#supported-map-families).

### Additional segmented and interrupted definitions

<span class="badge">From v5.0 · Experimental</span>

All presets in the table use the same `projectPoint`, `projectLine`,
`projectPolygon`, `fit`, picking, and globe-transition pipeline. Select them in
Ice Age Explorer's global projection control. These static maps do not have
hinge motion. Square maps expose `centralMeridian`; the other new presets use
fixed cuts and aspects. `radius` belongs to `MapDescription` and scales the whole map.

The paired hemispheric maps touch at a point on the equator but share no full
continuous edge: `disjoint` is true under the engine's join-graph definition.
Butterfly faces share edges along a tree; their other edges are cuts. Computational
chart boundaries are not all visible seams.

Sinu-Mollweide here uses the published formula in equatorial aspect with six
land-oriented lobes. It does **not** reproduce D3's oblique five-lobe layout with
cuts starting at 35° north and 10° south. Small-circle interruption boundaries,
arbitrary lobe configuration, and general aspect rotation remain future work.
Ocean Goode uses the six standard ocean-oriented lobes without duplicated
extension regions. Polyhedral presets use a root-face origin and a fixed −30°
planar orientation; use `fit()` instead of assuming D3 screen coordinates.

See [references and implementation credits](../developer-guide/discontinuous-projections.md#references-and-implementation-credits)
for formulas, source provenance, and licensing.

## MapChartDescription

<span class="badge">From v5.0 · Experimental</span>

`Omit<MapRegion, 'project' | 'unproject'> & {projection: string}`.
Each custom chart has a unique `id`, convex spherical `boundary`, strictly
interior `interior` point, projection binding key, optional affine `placement`,
and optional `layout` metadata. See [MapRegion](../../discontinuous/README.md) for the geometric
constraints. Bindings return unit-radius local coordinates. Placements and
optional frames use unit-radius map coordinates; the engine scales them by
the description's radius. Callback inverses must return spherical degrees or
`null`. Inset metadata does not alter geographic membership.

## Constructor and MapEngineOptions

<span class="badge">From v5.0 · Experimental</span>

```typescript
const map = new MapEngine(description, {
  sampling: {maxAngularStep: 2, tolerance: 1e-4},
  // Optional runtime dependencies:
  // projections: {localProjection: {project, unproject}},
  // isLand: position => boolean,
  // edgeWeight: (edge, presetWeight) => number
});
```

`projections` resolves custom chart keys to stable forward/inverse callbacks.
`isLand` is required for the sealine/coastline presets. `edgeWeight` overrides
retained-join weights. `sampling` supplies defaults for geometry and cached
layout measurement; method options override individual defaults. Tolerance is
in placed map units, not pixels. Invalid definitions and missing bindings throw.
Construction does not perform network requests or allocate a renderer.

## Properties and MapCapabilities

<span class="badge">From v5.0 · Experimental</span>

| Property | Meaning |
| --- | --- |
| `description` | Frozen input snapshot |
| `regions` | Compiled `MapRegion` array with explicit placements |
| `seams` | Shared edges classified as `join`, `cut`, or `boundary` |
| `capabilities.hasCuts` | At least one sampled shared edge is a cut |
| `capabilities.disjoint` | More than one component in the continuous-join graph |
| `capabilities.hasInsets` | At least one region has inset metadata |
| `capabilities.hinged` | A rigid hinge layout is available |
| `capabilities.globe` | Always true for this spherical engine |
| `motion` | `MyriahedralLayout` for a hinged map; otherwise undefined. Treat as read-only. |

Seam classification samples endpoints and midpoints. It is metadata, not a
proof of continuity, absence of overlap, or custom-callback validity. Do not
use `disjoint` as a substitute for clipping. All geometry is split by chart,
including at joins. `motion.evaluate()` and `evaluate({type: 'hinge', …})`
already include the description radius.

Segmentation and disconnection are different properties. Peirce's joined charts
form a filled square with cuts on the perimeter; Berghaus's lobes remain joined
to the center while cuts open between their outer edges. Both have cuts without
being disjoint or hinged. Albers USA has detached components. See
[segmented, connected, or detached maps](../developer-guide/discontinuous-projections.md#segmented-connected-or-detached).

## Static geometry methods

<span class="badge">From v5.0 · Experimental</span>

| Method | Returns |
| --- | --- |
| `findRegions(lonLat)` | Boundary-inclusive region IDs in definition order |
| `projectPoint(lonLat, regionId?)` | `{regionId, position: [x, y]}` or `null` outside coverage |
| `unprojectPoint(xy, regionId?)` | All valid `{regionId, position: [longitude, latitude]}` candidates |
| `projectLine(points, sampling?)` | Chart-local `MapLine[]` |
| `projectPolygon(rings, sampling?)` | Chart-local `MapPolygon[]`, with holes retained |

These use the [static map geometry contract](../../discontinuous/README.md): degrees in, placed
map units out, source coordinates preserved, minor great-circle input edges,
and hemisphere-bounded polygon inputs. The first containing chart owns a point
unless a region is specified. Unknown region IDs throw in these methods.
Inverse gaps return `[]`, not a sentinel coordinate. Map geometry is Y-up.

## getLayout(), fit(), and pick()

<span class="badge">From v5.0 · Experimental</span>

`getLayout(): MapLayout` lazily caches boundary sampling, approximate bounds,
outlines, labels, frames, placements and stable draw order. `fit(options)` takes
`MapViewportOptions` (`width`, `height`, optional `padding`, `flipY`) and returns
the [fitted layout](../../discontinuous/README.md), including pixel-space `project`/`unproject`
functions and region metadata. Default `flipY: true` gives top-left screen
coordinates. Fitting is uniform and preserves inset scale ratios.

`pick(viewport, pixel)` returns inverse candidates with `layer`, topmost first.
Pass a viewport fitted by this engine and undo any extra camera transform on the
pixel first. Picking applies geographic coverage, not renderer depth/occlusion.
It is for the static map; use ray intersections and retained source coordinates
for a posed 3D surface.

## getSamplingRegions(viewport)

<span class="badge">From v5.0 · Experimental</span>

Returns fitted regions augmented with:

- `boundary`: the chart's spherical computational boundary in degrees.
- `pixelsPerMapUnit`: the fitted uniform scale.
- `getPixelScale(lonLat)`: approximate `[longitudeScale, latitudeScale]` in pixels
  per coordinate radian, using a one-sided difference within the named region;
  returns `null` outside coverage or when no finite estimate is available.

Use these to select raster tiles separately for each inset. Scale varies inside
a chart; these are local estimates, not a conservative LOD bound or a tile zoom.
Mercator computational boundaries reach the poles, but visible coverage is
limited by `maxLatitude`. The renderer owns tile matrices, caching, clipping,
resolution budgets, and any additional camera zoom.

## evaluate(state) and MapState

<span class="badge">From v5.0 · Experimental</span>

```typescript
type MapState =
  | {type: 'map' | 'globe'}
  | {type: 'hinge'; amount: number};
```

Default state is `{type: 'map'}`. A frame exposes `projectPoint`, `projectLine`,
`projectPolygon` with the same geographic arguments as the static methods but
3D output coordinates (`MapPosition3D = [number, number, number]`). It also has
`projectPlacedPoint(xy, regionId)` for geometry already clipped into that region.
That method does not re-clip map/hinge points; the caller must retain a valid
region ID with each vertex. Unknown IDs return `null` for map/hinge frames.
Globe conversion uses inverse projection and therefore rejects unknown IDs and
returns `null` outside coverage. All frame geometry preserves source coordinates.

| State | Coordinates |
| --- | --- |
| `map` | Static `[x, y, 0]` |
| `globe` | Origin-centered sphere of the description radius; +X = (0°,0°), +Y = (90°,0°), +Z = north |
| `hinge` | Root-panel frame; amount 0 = closed polyhedron, amount 1 = flat net |

Only hinged maps accept a hinge state; amount must be finite and in `[0,1]`.
Evaluate once per frame and reuse its transforms. Flat-to-posed panel transforms
are affine; they preserve rigid panel lengths. A faceted sphere requires an
additional deformation/alignment step to match the smooth globe. Frame geometry
keeps the static map's coverage and splits. Camera fitting, clipping against a
view frustum, lighting, occlusion, and 3D picking are renderer responsibilities.

## planTransitionTo(target) and MapTransitionPlan

<span class="badge">From v5.0 · Experimental</span>

Returns `{strategy, reason, resplit, coverage, sourceHinge, targetHinge}`.
The same engine yields `direct`, `resplit: false`, `coverage: 'preserve'`.
Different engines yield `via-globe`, `resplit: true`,
`coverage: 'fade-unmatched'`. Hinge flags identify endpoints with rigid motion.
Neither matching IDs nor matching JSON establishes callback/topology equivalence.

The plan does not execute transitions, match vertex arrays, or promise an
overlap-free morph. Use geographic coordinates to rebuild destination geometry;
fade differing coverage. For prepared direct correspondence between supported global maps, use
`createTransitionTo()`. Custom reference surfaces remain unsupported.

### containsConvexPolygon(ring, regionId)

<span class="badge">From v5.0 · Experimental</span>

A conservative fast-path query for small convex source rings. `true` means the
ring fits one region without crossing chart or coverage boundaries. `false`
means use `projectPolygon()`; it does not imply the polygon is invisible.
This includes checking whether a cap's excluded interior lies inside the ring,
even when all original corners are visible. It does not waive the need for
appropriate mesh subdivision or curved-edge sampling. Ice Age Explorer uses it
to avoid unnecessary clipping of interior grid cells.

## Elastic sampled definitions

<span class="badge">From v5.0 · Experimental</span>

`{type: 'elastic', data}` compiles a sampled map through the same geometry, layout,
picking and globe-evaluation methods. See the [Elastic reference](./elastic.md)
for data imports, the text importer, and numerical limits.

## createTransitionTo(target, options?)

<span class="badge">From v5.0 · Experimental</span>

Returns a `MapTransition` referencing the two immutable engines. `options.strategy`
is `'auto'` (default), `'direct'`, or `'via-globe'`. `strategy` and `reason` on the
result report the selected route. Direct preparation is supported for the same
engine, complete non-overlapping Elastic coverage, and qualified full-world
projections with default parameters. These include Winkel Tripel, Natural Earth II,
Hammer, Aitoff, Robinson, Mollweide, Sinusoidal, the Eckert and Ginzburg families,
and other finite, uninterrupted world formulas.

Automatic selection retains the globe route for cut and regional maps, custom
charts, parameter overrides, and world formulas not yet qualified for direct
preparation: `gringorten`, `bertin1953`, `eisenlohr`, `nicolosi`, `polyconic`,
`sinu-mollweide`, and `rectangular-polyconic`. This conservative fallback includes
both singular formulas and layouts whose seam handling needs further qualification.
An explicitly requested unsupported direct route throws. `strategy: 'via-globe'`
always forces the globe route. Changing the central meridian or radius does not
by itself prevent direct preparation; geometry is split at both maps' chart boundaries.

Unlike the conservative `planTransitionTo()` recommendation, this method opts
into splitting geometry against both endpoint maps. It does not change the
existing plan API or make arbitrary projected vertex arrays compatible.

### MapTransition.projectPoint(position, amount)

<span class="badge">From v5.0 · Experimental</span>

Returns `[x, y, z]` or `null` where the relevant endpoint has no coverage. Direct
motion linearly interpolates the two projected positions in the plane. Globe
motion reaches the shared sphere at amount 0.4 and leaves it at 0.6; source
coverage applies before 0.5 and destination coverage afterward. Points do not
include opacity; use prepared geometry for coverage crossfades.

### MapTransition.prepareLine(positions, sampling?) / preparePolygon(rings, sampling?)

<span class="badge">From v5.0 · Experimental</span>

Accept the same geographic inputs and sampling options as MapEngine projection
methods. Return `MapTransitionGeometry` with immutable `parts`. Direct parts have
`sourceRegionId`, `targetRegionId`, `sourceCoordinates`, `from`, and `to` arrays.
Every array is a list of rings (a line uses one ring) with corresponding vertices.
Globe-route parts belong to one endpoint, identified by its region ID. Retain
these parts separately: joining them would draw across cuts. Preparation can be
expensive; cache results or prepare features cooperatively outside the frame loop.

### MapTransitionGeometry.evaluate(amount)

<span class="badge">From v5.0 · Experimental</span>

Amount must be finite in `[0, 1]`. Returns frames containing `kind`, endpoint region
IDs, `coordinates: MapPosition3D[][]`, and `opacity`. Direct frames use linear
interpolation and opacity 1. Globe frames flatten/unflatten over the outer 40%
of progress and crossfade endpoint geometry during the middle 20%. Invisible
parts are omitted. Renderers must apply opacity and own camera fitting, occlusion,
easing and animation cancellation. Evaluation creates fresh arrays, without
re-clipping geometry.

Intermediate direct shapes may overlap or invert. Endpoint edge sampling and
sampled geographic intersection approximate correspondence; they are not a certified error
bound or a fold-free parameterization. Inverse picking of intermediate geometry
is not provided. See [Elastic maps](../../elastic-maps.md) for an animated example.

## prepareFeatures(features, options?)

<span class="badge">From v5.0 · Experimental</span>

Prepares static two-dimensional features for a renderer. Accepts an array of
`MapFeature` objects with `geometry`, optional string/finite-number `id`, and
optional `properties` / `type: 'Feature'`. Geometry shapes follow GeoJSON:
Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon, and nested
GeometryCollection. Null geometries retain their feature index but emit no parts.
Pass `featureCollection.features`, not the collection itself.

Positions must be finite **longitude/latitude pairs**, with latitude in [-90, 90].
Altitude and measures are rejected rather than silently dropped. Polygon rings
may be open or repeat their first vertex, as in `projectPolygon()`. Source edges
are minor great-circle arcs. Invalid geometry throws; no partial result is returned.
Collection nesting is limited to 64 levels. Existing MapEngine input limits
also apply: polygon inputs must fit their open-hemisphere source chart. This
method does not repair invalid topology or automatically subdivide arbitrary
global GeoJSON polygons into such charts.

`MapPrepareFeaturesOptions` has `sampling?: MapSamplingOptions`, which overrides
the engine defaults, and `polygonOutlines?: boolean` (default true). Preparation
is synchronous; callers may batch features or run an engine in a worker.

Returns `PreparedMapGeometry`, a versioned, structured-cloneable object:

| Field | Meaning |
| --- | --- |
| `version` | Buffer contract version, currently 1 |
| `mapId` | Description ID for diagnostics; not a cache key or equivalence guarantee |
| `featureIds` | Input IDs or null, one per input feature; duplicate IDs are allowed |
| `regionIds` | Chart ID lookup table |
| `points` | Packed vertices, one vertex per part; ownership follows `projectPoint()` |
| `paths` | Packed line and original polygon-boundary fragments |
| `polygons` | Packed closed rings for filled polygon fragments, preserving holes |

All three batches contain `positions: Float64Array` and
`sourcePositions: Float64Array`: interleaved XY in placed map units, and matching
longitude/latitude pairs in degrees. They contain no triangle indices, Z, normals,
or application attributes. A renderer must use the map's Cartesian coordinates
without applying a second geographic projection.

Each batch's `parts` array contains `PreparedMapPart` metadata:

- `featureIndex` indexes the **input feature array**, even after clipping, splitting
  or skipping a null geometry. Use it to recover the original object for picking,
  styling and filtering; do not use the generated part index as the feature index.
- `geometryPath` lists indices through GeometryCollection `geometries` and multipart
  `coordinates`. For example `[1, 2]` identifies polygon 2 in a MultiPolygon at
  collection child 1. A simple root geometry has `[]`.
- `regionIndex` indexes `regionIds`. Retain it for chart-specific inverse picking.

Path parts also have `role: 'line' | 'polygon-outline'`, an original `ringIndex`
for polygon outlines (outer = 0), and `closed`. Cut fragments remain open. The
`pathStarts: Uint32Array` contains vertex offsets, one per part plus a terminal
sentinel. Never join successive path parts across their offsets.

Polygon `polygonStarts: Uint32Array` contains **ring** offsets, one per part plus
a sentinel. `ringStarts: Uint32Array` contains **vertex** offsets, one per ring
plus a sentinel. Ring 0 of each polygon part is the exterior; remaining rings are
holes. Offsets count vertices/rings, never float components or bytes. Multiply a
vertex offset by two to slice a position array. Empty batches have `[0]` offsets.
Projected winding may depend on chart placement; consumers must normalize winding
for their tessellator rather than assume a single global orientation.

Fills and outlines are deliberately separate. Clipping introduces artificial edges
to close filled rings. `paths` projects the original source rings instead, so it
does **not** add those artificial edges. A source edge lying on a cut remains a
real boundary and may occur in multiple chart fragments. Computational chart
joins can also split a path without creating a visual map gap.

Output arrays are newly allocated and owned by the caller. Input geometry is not
mutated; feature properties and callbacks are not copied into the output. Transfer
the typed-array buffers to a worker or renderer using `structuredClone` /
`postMessage`; transferred buffers detach at the sender. The payload is not JSON
serialization (typed arrays need an explicit encoding for JSON). Preserve the
input feature array separately. Generated part order is not a durable feature ID.

This is a static geometry contract, not a deck.gl adapter or surface tessellator.
It does not yet provide original-edge interpolation weights, dash-distance
continuity, artificial-edge masks for polygon extrusion, or interior mesh vertices
for globe/hinge poses. See the [rendering guide](../developer-guide/map-engine.md#prepare-feature-buffers-for-a-renderer).

### Optional source path provenance

`prepareFeatures(features, {provenance: {sourceSegments: true, boundaries: true,
distances: {metric: 'spherical', radius: 6371000}}})` emits optional
`paths.provenance` alongside the usual packed geometry. Omitted options allocate no
provenance output buffers. Geometry, ordering, and original feature/chart identity
are unchanged.

- `sourceSegmentIndices`, `sourceSegmentParameters`, and `sourceVertexIndices`
  address the original line or original polygon ring identified by the path part.
  Parameters are minor-great-circle arc fractions. Generated vertices use
  `0xffffffff` as their source-vertex index. At a shared source vertex retained
  once, lineage belongs to the incoming segment.
- `sourceDistances` contains cumulative source distance in meters, measured before
  chart fragmentation on the explicitly declared sphere (`distanceRadius`). It
  does not restart at cuts. This policy does not claim ellipsoidal geodesic distance.
- `startReasons` and `endReasons` identify source endpoints, coverage boundaries,
  chart cuts, and continuous chart joins for each prepared path part. Source vertex
  identity is independent of why clipping ends a fragment at that vertex.

Flags are independent. Unrequested fields are absent. Unsupported policies/backends
reject explicitly; provenance is recorded during segment clipping and sampling.
The payload is structured-cloneable. It does not prescribe interpolation of
categorical attributes, meter widths, surface normals or extrusion.

The [Projection domains example](https://visgl.github.io/math.gl/next/examples/projection-domains)
includes a path-provenance mode with distance-continuous dashes and inspectable
source lineage. Color interpolates declared source timestamps using segment/t;
dash phase uses cumulative source meters. This contract supports the requirements discussed in
[deck.gl#10922](https://github.com/visgl/deck.gl/issues/10922).

### Optional polygon-edge provenance

`prepareFeatures(features, {provenance: {polygonEdges: true}})` adds
`polygons.edgeProvenance`. The arrays align with polygon vertices: record `i`
describes the directed edge from vertex `i` to `i+1` within its ring. Repeated
closing vertices have kind `0` and no outgoing edge. Ring and polygon offsets
retain their ordinary meaning.

`kinds` uses `0` for no edge, `1` for source boundary, `2` for coverage boundary,
`3` for chart cut, and `4` for continuous chart join. `sourceRingIndices` and
`sourceSegmentIndices` address original rings and their closing segments.
`sourceParameterRanges` stores `[t0,t1]` minor-great-circle fractions for each edge;
ranges reverse when ring winding reverses. Generated edges use `0xffffffff` for
source indices and zero parameter placeholders. Consumers must check `kinds`.

Attribution happens against source and region clipping constraints before map
projection and resampling. A source boundary coincident with a cut retains its
source identity. Sampling propagates that edge identity; output winding reversal
reverses the edge records and swaps parameter endpoints. Geometry stays identical
with this option enabled. No polygon-edge arrays are emitted by default.

This option currently supports the native open-hemisphere polygon clipper. Global
spherical atlas cuts and wrappers that rebuild geometry without propagating edge
lineage reject explicitly. Ambiguous or unresolvable source constraints also reject
instead of guessing. The result identifies edges; it does not establish surface
normals, extrusion directions, or animated-mesh correspondence.

The Projection domains example includes a polygon-with-hole mode showing original
outlines and optional generated closures. It illustrates the boundary distinction
required by [deck.gl#10922](https://github.com/visgl/deck.gl/issues/10922).


Mercator path preparation now carries source lineage through its latitude-band
clipping stage. Latitude intersections are evaluated on the sampled source
minor-great-circle arc, rather than inverse-projecting a straight projected chord.
Source distances and endpoint reasons survive the additional cut. In the path
provenance example, select **Mercator latitude cuts** or **Satellite coverage cuts** to inspect the coverage ends.
Rigid spherical cap paths (including satellite coverage) also retain lineage by
attributing streamed intersections to the active sampled edge before resampling.
Mercator polygon edges, nonlinear cap paths and Elastic paths/edges still
reject provenance requests; these stages require their own attributed clipping.
