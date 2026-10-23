# MapEngine

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Compile a `MapDescription` into spherical chart projection, layout, picking, and
optional hinge motion. Import from `@math.gl/geospatial/discontinuous`.
For a complete rendering workflow, see the [MapEngine guide](../projection/developer-guide/map-engine.md).
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
| `mercator` | `centralMeridian: 0`, `maxLatitude: 85.0511287798066`; limit strictly between 0° and 90° |
| `goode` | Goode land-oriented homolosine cuts: two northern and four southern lobes |
| `interrupted-sinusoidal` | Independent six-lobe sinusoidal arrangement |
| `interrupted-mollweide` | Same independent cuts, Mollweide formula |
| `interrupted-homolosine` | Same independent cuts, homolosine formula; differs from `goode` |
| `albers-usa` | `includeTerritories: false`; true adds PR, VI, GU, MP, AS to Alaska/Hawaii |
| `air-ocean` | 24-panel radial/gnomonic map; not Gray-Fuller |
| `myriahedral` | [Myriahedral options](./myriahedral.md): `preset`, `columns`, `solid`, `subdivisions`, `mesh`, `centralMeridian`, `landSampleStep`; use top-level radius and runtime callbacks |
| `custom` | `charts: readonly MapChartDescription[]` |

Mercator is spherical, not ellipsoidal Mercator. It clips lines and polygons to
the finite latitude band after antimeridian/chart splitting. Coordinates at
the poles are outside coverage. Goode uses seven convex computational charts:
the broad Eurasian lobe has an extra continuous join. This is not a claim of
bitwise agreement with another cartographic implementation.

## MapChartDescription

<span class="badge">From v5.0 · Experimental</span>

`Omit<MapRegion, 'project' | 'unproject'> & {projection: string}`.
Each custom chart has a unique `id`, convex spherical `boundary`, strictly
interior `interior` point, projection binding key, optional affine `placement`,
and optional `layout` metadata. See [MapRegion](./README.md) for the geometric
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

## Static geometry methods

<span class="badge">From v5.0 · Experimental</span>

| Method | Returns |
| --- | --- |
| `findRegions(lonLat)` | Boundary-inclusive region IDs in definition order |
| `projectPoint(lonLat, regionId?)` | `{regionId, position: [x, y]}` or `null` outside coverage |
| `unprojectPoint(xy, regionId?)` | All valid `{regionId, position: [longitude, latitude]}` candidates |
| `projectLine(points, sampling?)` | Chart-local `MapLine[]` |
| `projectPolygon(rings, sampling?)` | Chart-local `MapPolygon[]`, with holes retained |

These use the [static map geometry contract](./README.md): degrees in, placed
map units out, source coordinates preserved, minor great-circle input edges,
and hemisphere-bounded polygon inputs. The first containing chart owns a point
unless a region is specified. Unknown region IDs throw in these methods.
Inverse gaps return `[]`, not a sentinel coordinate. Map geometry is Y-up.

## getLayout(), fit(), and pick()

<span class="badge">From v5.0 · Experimental</span>

`getLayout(): MapLayout` lazily caches boundary sampling, approximate bounds,
outlines, labels, frames, placements and stable draw order. `fit(options)` takes
`MapViewportOptions` (`width`, `height`, optional `padding`, `flipY`) and returns
the [fitted layout](./README.md), including pixel-space `project`/`unproject`
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
fade differing coverage. Direct transitions between distinct but compatible
engines, custom reference surfaces, and automatic topology correspondence are
future extensions.
