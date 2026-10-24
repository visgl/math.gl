# MapEngine

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

Compile a `MapDescription` into spherical chart projection, layout, picking, and optional hinge motion. Import from `@math.gl/geospatial/discontinuous`. For a complete rendering workflow, see the [MapEngine guide](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/map-engine.md). The API is experimental and may change before stabilization.

## MapDescription and MapDefinition[​](#mapdescription-and-mapdefinition "Direct link to MapDescription and MapDefinition")

From v5.0 · Experimental

```
type MapDescription = {

  version: 1;

  id: string;

  title?: string;

  radius?: number; // default 1; finite and positive

  attribution?: readonly string[];

  definition: MapDefinition;

};
```

Descriptions are plain data. Construction takes a deeply frozen snapshot and rejects functions, class instances, and nonfinite numbers. `id` is a nonempty application identifier, not a topology compatibility key. `radius` scales all output axes and placements, including custom-chart frames. Inputs always use spherical degrees; the radius does not specify an ellipsoid or a CRS.

| `definition.type`                   | Additional fields and defaults                                                                                                                                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `healpix`                           | Spherical H=4, K=3; `centralMeridian: 0`; 8 computational charts, not rHEALPix                                                                                                                                                                                       |
| `gingery`                           | `centralMeridian: 0`, `lobes: 6` (integer 3–24), `coreAngle: 30` (strictly between 0° and 90°)                                                                                                                                                                       |
| `interrupted`                       | Required `projection` and `lobes: {north, south}`; optional `centralMeridian: 0`; see below                                                                                                                                                                          |
| `mercator`                          | `centralMeridian: 0`, `maxLatitude: 85.0511287798066`; limit strictly between 0° and 90°                                                                                                                                                                             |
| `goode`                             | Goode land-oriented homolosine cuts: two northern and four southern lobes                                                                                                                                                                                            |
| `interrupted-sinusoidal`            | Independent six-lobe sinusoidal arrangement                                                                                                                                                                                                                          |
| `interrupted-mollweide`             | Same independent cuts, Mollweide formula                                                                                                                                                                                                                             |
| `interrupted-homolosine`            | Same independent cuts, homolosine formula; differs from `goode`                                                                                                                                                                                                      |
| `albers-usa`                        | `includeTerritories: false`; true adds PR, VI, GU, MP, AS to Alaska/Hawaii                                                                                                                                                                                           |
| `gray-fuller`                       | Exact Gray–Fuller on the AirOcean net; 24 panels                                                                                                                                                                                                                     |
| `petroff`                           | `centralMeridian: 0`; polar equal-area square, 8 charts                                                                                                                                                                                                              |
| `isea`                              | Spherical Snyder equal-area icosahedron; vertex at north pole, 20 faces                                                                                                                                                                                              |
| `dsea`                              | Spherical Snyder equal-area dodecahedron; vertex at north pole, 12 faces                                                                                                                                                                                             |
| `air-ocean`                         | 24-panel radial/gnomonic map; not Gray-Fuller                                                                                                                                                                                                                        |
| `myriahedral`                       | [Myriahedral options](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/myriahedral.md): `preset`, `columns`, `solid`, `subdivisions`, `mesh`, `centralMeridian`, `landSampleStep`; use top-level radius and runtime callbacks |
| `peirce-quincuncial`                | `centralMeridian: 0`; equatorial Peirce square-world layout, 8 computational charts                                                                                                                                                                                  |
| `berghaus`                          | `centralMeridian: 0`, `lobes: 5`; integer lobes from 3–24, two charts per lobe                                                                                                                                                                                       |
| `guyou`                             | `centralMeridian: 0`; two joined conformal hemisphere squares, 8 computational charts                                                                                                                                                                                |
| `gringorten-quincuncial`            | `centralMeridian: 0`; equal-area quincuncial in equatorial aspect, 8 charts                                                                                                                                                                                          |
| `butterfly`                         | Octahedral gnomonic butterfly, 8 faces                                                                                                                                                                                                                               |
| `collignon-butterfly`               | Collignon octahedral butterfly, 8 faces                                                                                                                                                                                                                              |
| `waterman`                          | Waterman W5 butterfly: 8 hexagons and 24 corner triangles                                                                                                                                                                                                            |
| `goode-ocean`                       | Ocean-oriented homolosine lobes, central meridian −160°, no duplicate extensions                                                                                                                                                                                     |
| `interrupted-boggs`                 | Boggs eumorphic with land-oriented equatorial interruptions                                                                                                                                                                                                          |
| `interrupted-sinu-mollweide`        | Sinu-Mollweide formula with land-oriented equatorial cuts; not D3's oblique five-lobe layout                                                                                                                                                                         |
| `interrupted-quartic-authalic`      | Paired hemispheric lobes, central meridian −20°                                                                                                                                                                                                                      |
| `interrupted-mollweide-hemispheres` | Paired Mollweide hemispheres, central meridian −20°                                                                                                                                                                                                                  |
| `custom`                            | `charts: readonly MapChartDescription[]`                                                                                                                                                                                                                             |

Mercator is spherical, not ellipsoidal Mercator. It clips lines and polygons to the finite latitude band after antimeridian/chart splitting. Coordinates at the poles are outside coverage. Goode uses seven convex computational charts: the broad Eurasian lobe has an extra continuous join. This is not a claim of bitwise agreement with another cartographic implementation.

### Gray–Fuller, Petroff, and Snyder maps[​](#grayfuller-petroff-and-snyder-maps "Direct link to Gray–Fuller, Petroff, and Snyder maps")

From v5.0 · Experimental

```
const map = new MapEngine({

  version: 1,

  id: 'snyder-earth',

  definition: {type: 'isea'}, // also 'dsea', 'gray-fuller', or 'petroff'

  radius: 1

});

const hit = map.projectPoint([-74, 41]);

const inverse = hit && map.unprojectPoint(hit.position, hit.regionId);
```

`gray-fuller` uses Robert W. Gray's exact equations for Fuller's triangular faces, including the original face frame for split panels. It shares AirOcean's 24-panel topology and geographic orientation with `air-ocean`, whose face mapping remains gnomonic. Gray–Fuller is **not equal-area**. “Exact” identifies the mathematical projection, not exact arithmetic: inversion uses a bounded monotone angle solve. Output uses the raw Gray–Fuller scale times `radius`, with the first face's center at the origin; D3's display rotation and translation differ.

`petroff` implements Matthew A. Petroff's 2021 square equal-area projection in its published polar aspect. The north pole maps to the center and the south pole to four corners. Output occupies `[-radius, radius]²`, so its area scale relative to a unit sphere is `radius² / π`. `centralMeridian` rotates longitude only. Forward and inverse use the author's closed-form equations, with stable Cartesian expressions and explicit limits at section vertices and poles.

`isea` and `dsea` apply Snyder's equal-area construction to an icosahedron and dodecahedron respectively. Both use 120 right spherical subtriangles internally, but expose one chart per face; their continuous internal subdivisions do not multiply clipping work. Each net's planar area is `4π × radius²`. The net tables follow PROJ's Snyder strip (ISEA) and two-row pentagonal (DSEA) layouts. Both math.gl presets place vertex zero at the north pole. This differs from PROJ's **default geographic aspects**, and output starts at the root-face center with a local face orientation. They are spherical maps, not ellipsoidal CRS operations, DGGS cell indexers, or arbitrary-net builders. Inversion uses a bounded monotone spherical-area solve followed by an analytic radial inverse.

All four definitions use the existing `MapEngine` layout, fitting, mesh, picking, and transition pipeline. They are static maps: transitions to other layouts go through the globe; they do not supply hinge animation. At cuts and repeated pole images, preserve `regionId` when selecting an inverse candidate. Ice Age Explorer includes all four in its projection selector and uses the same worker-based mesh preparation and globe transitions as its other discontinuous maps.

Mathematical references: [Gray (1995)](https://github.com/d3/d3-geo-polygon/blob/main/src/grayfuller.js), [Petroff's paper and public-domain supplement](https://doi.org/10.5281/zenodo.4661351), [Snyder / PROJ's polyhedral documentation](https://proj.org/en/stable/operations/projections/polyhedral.html), and [BRSR's vector formulation](https://brsr.github.io/2021/08/31/snyder-equal-area.html). The [package notices](https://github.com/visgl/math.gl/blob/master/modules/geospatial/THIRD-PARTY-NOTICES.md) record source adaptations and licenses. No Nico Belmonte application code is used.

### HEALPix, Gingery, and configurable interruptions[​](#healpix-gingery-and-configurable-interruptions "Direct link to HEALPix, Gingery, and configurable interruptions")

From v5.0 · Experimental

`healpix` combines a cylindrical equal-area equatorial band with four Collignon polar lobes in each hemisphere. Its formula changes at ±asin(2/3), approximately ±41.81°. Output uses the spherical HEALPix equations in radians times `radius`, not D3's normalized display scale. It is a projection, not a HEALPix cell indexer. The polar rearrangement of rHEALPix is not implemented.

`gingery` preserves an azimuthal-equidistant central cap and opens the rest of the sphere into star lobes. `coreAngle` is the cap's angular radius in degrees; `radius` still means the output scale. The implementation uses bounded numerical arc-length solves, so it is more expensive than HEALPix. Its default aspect is equatorial, unlike D3's default oblique view.

```
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

Each lobe is `[west, center, east]` in degrees relative to `centralMeridian`. Each hemisphere must partition `[-180, 180]` in west-to-east order, without gaps or overlaps. Centers must lie within the lobe and be at most 180° from either edge. Supported `projection` values are `sinusoidal`, `mollweide`, `homolosine`, `boggs`, `sinu-mollweide`, and `quartic-authalic`. Interruptions begin at the equator. Wide lobes are subdivided into convex charts with continuous internal joins; chart count need not equal lobe count. These options do not implement oblique aspects or cuts beginning at arbitrary latitudes.

All three definitions support the usual seam-aware geometry, fitting, picking, and transitions through the globe; none supplies hinge motion. At a cut, use a region ID to choose a side. Seam endpoints identify where a join becomes a cut.

References: [Calabretta's HEALPix equations](https://arxiv.org/abs/astro-ph/0412607), [PROJ's HEALPix documentation](https://proj.org/en/stable/operations/projections/healpix.html), and [D3's Gingery implementation](https://github.com/d3/d3-geo-projection/blob/v4.0.0/src/gingery.js). Gingery's arc-length construction is adapted under ISC; chart assembly and bounded inverse handling use math.gl's existing pipeline. See the package's third-party notices.

### Quincuncial and star definitions[​](#quincuncial-and-star-definitions "Direct link to Quincuncial and star definitions")

From v5.0 · Experimental

```
const peirce = new MapEngine({

  version: 1, id: 'peirce', definition: {type: 'peirce-quincuncial'}

});

const star = new MapEngine({

  version: 1, id: 'star', radius: 1,

  definition: {type: 'berghaus', lobes: 5, centralMeridian: -30}

});
```

Both cover the sphere, have cuts, and expose the standard point/line/polygon, fitting, picking and globe-frame methods. Neither has hinge motion. Units scale with `radius`; no ellipsoidal datum is implied. The center is latitude zero at `centralMeridian` (degrees, default zero); Peirce does not use D3's default polar rotation. Berghaus lobe tips are distinct images of the same antipodal point. Use region IDs to select a side at a cut. Boundary picking may return multiple candidates; blank space outside the map returns none.

Peirce has four conformal branch points on the hemisphere boundary; finite limits are used there, but derivatives are singular. Adaptive line sampling approximates curved projected edges; adjust sampling tolerance for output size. Input polygons still require an open-hemisphere source chart. See the [interactive comparison and support table](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md#supported-map-families).

### Additional segmented and interrupted definitions[​](#additional-segmented-and-interrupted-definitions "Direct link to Additional segmented and interrupted definitions")

From v5.0 · Experimental

All presets in the table use the same `projectPoint`, `projectLine`, `projectPolygon`, `fit`, picking, and globe-transition pipeline. Select them in Ice Age Explorer's global projection control. These static maps do not have hinge motion. Square maps expose `centralMeridian`; the other new presets use fixed cuts and aspects. `radius` belongs to `MapDescription` and scales the whole map.

The paired hemispheric maps touch at a point on the equator but share no full continuous edge: `disjoint` is true under the engine's join-graph definition. Butterfly faces share edges along a tree; their other edges are cuts. Computational chart boundaries are not all visible seams.

Sinu-Mollweide here uses the published formula in equatorial aspect with six land-oriented lobes. It does **not** reproduce D3's oblique five-lobe layout with cuts starting at 35° north and 10° south. Small-circle interruption boundaries, arbitrary lobe configuration, and general aspect rotation remain future work. Ocean Goode uses the six standard ocean-oriented lobes without duplicated extension regions. Polyhedral presets use a root-face origin and a fixed −30° planar orientation; use `fit()` instead of assuming D3 screen coordinates.

See [references and implementation credits](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md#references-and-implementation-credits) for formulas, source provenance, and licensing.

## MapChartDescription[​](#mapchartdescription "Direct link to MapChartDescription")

From v5.0 · Experimental

`Omit<MapRegion, 'project' | 'unproject'> & {projection: string}`. Each custom chart has a unique `id`, convex spherical `boundary`, strictly interior `interior` point, projection binding key, optional affine `placement`, and optional `layout` metadata. See [MapRegion](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md) for the geometric constraints. Bindings return unit-radius local coordinates. Placements and optional frames use unit-radius map coordinates; the engine scales them by the description's radius. Callback inverses must return spherical degrees or `null`. Inset metadata does not alter geographic membership.

## Constructor and MapEngineOptions[​](#constructor-and-mapengineoptions "Direct link to Constructor and MapEngineOptions")

From v5.0 · Experimental

```
const map = new MapEngine(description, {

  sampling: {maxAngularStep: 2, tolerance: 1e-4},

  // Optional runtime dependencies:

  // projections: {localProjection: {project, unproject}},

  // isLand: position => boolean,

  // edgeWeight: (edge, presetWeight) => number

});
```

`projections` resolves custom chart keys to stable forward/inverse callbacks. `isLand` is required for the sealine/coastline presets. `edgeWeight` overrides retained-join weights. `sampling` supplies defaults for geometry and cached layout measurement; method options override individual defaults. Tolerance is in placed map units, not pixels. Invalid definitions and missing bindings throw. Construction does not perform network requests or allocate a renderer.

## Properties and MapCapabilities[​](#properties-and-mapcapabilities "Direct link to Properties and MapCapabilities")

From v5.0 · Experimental

| Property                 | Meaning                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ |
| `description`            | Frozen input snapshot                                                          |
| `regions`                | Compiled `MapRegion` array with explicit placements                            |
| `seams`                  | Shared edges classified as `join`, `cut`, or `boundary`                        |
| `capabilities.hasCuts`   | At least one sampled shared edge is a cut                                      |
| `capabilities.disjoint`  | More than one component in the continuous-join graph                           |
| `capabilities.hasInsets` | At least one region has inset metadata                                         |
| `capabilities.hinged`    | A rigid hinge layout is available                                              |
| `capabilities.globe`     | Always true for this spherical engine                                          |
| `motion`                 | `MyriahedralLayout` for a hinged map; otherwise undefined. Treat as read-only. |

Seam classification samples endpoints and midpoints. It is metadata, not a proof of continuity, absence of overlap, or custom-callback validity. Do not use `disjoint` as a substitute for clipping. All geometry is split by chart, including at joins. `motion.evaluate()` and `evaluate({type: 'hinge', …})` already include the description radius.

Segmentation and disconnection are different properties. Peirce's joined charts form a filled square with cuts on the perimeter; Berghaus's lobes remain joined to the center while cuts open between their outer edges. Both have cuts without being disjoint or hinged. Albers USA has detached components. See [segmented, connected, or detached maps](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md#segmented-connected-or-detached).

## Static geometry methods[​](#static-geometry-methods "Direct link to Static geometry methods")

From v5.0 · Experimental

| Method                             | Returns                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `findRegions(lonLat)`              | Boundary-inclusive region IDs in definition order                  |
| `projectPoint(lonLat, regionId?)`  | `{regionId, position: [x, y]}` or `null` outside coverage          |
| `unprojectPoint(xy, regionId?)`    | All valid `{regionId, position: [longitude, latitude]}` candidates |
| `projectLine(points, sampling?)`   | Chart-local `MapLine[]`                                            |
| `projectPolygon(rings, sampling?)` | Chart-local `MapPolygon[]`, with holes retained                    |

These use the [static map geometry contract](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md): degrees in, placed map units out, source coordinates preserved, minor great-circle input edges, and hemisphere-bounded polygon inputs. The first containing chart owns a point unless a region is specified. Unknown region IDs throw in these methods. Inverse gaps return `[]`, not a sentinel coordinate. Map geometry is Y-up.

## getLayout(), fit(), and pick()[​](#getlayout-fit-and-pick "Direct link to getLayout(), fit(), and pick()")

From v5.0 · Experimental

`getLayout(): MapLayout` lazily caches boundary sampling, approximate bounds, outlines, labels, frames, placements and stable draw order. `fit(options)` takes `MapViewportOptions` (`width`, `height`, optional `padding`, `flipY`) and returns the [fitted layout](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md), including pixel-space `project`/`unproject` functions and region metadata. Default `flipY: true` gives top-left screen coordinates. Fitting is uniform and preserves inset scale ratios.

`pick(viewport, pixel)` returns inverse candidates with `layer`, topmost first. Pass a viewport fitted by this engine and undo any extra camera transform on the pixel first. Picking applies geographic coverage, not renderer depth/occlusion. It is for the static map; use ray intersections and retained source coordinates for a posed 3D surface.

## getSamplingRegions(viewport)[​](#getsamplingregionsviewport "Direct link to getSamplingRegions(viewport)")

From v5.0 · Experimental

Returns fitted regions augmented with:

* `boundary`: the chart's spherical computational boundary in degrees.
* `pixelsPerMapUnit`: the fitted uniform scale.
* `getPixelScale(lonLat)`: approximate `[longitudeScale, latitudeScale]` in pixels per coordinate radian, using a one-sided difference within the named region; returns `null` outside coverage or when no finite estimate is available.

Use these to select raster tiles separately for each inset. Scale varies inside a chart; these are local estimates, not a conservative LOD bound or a tile zoom. Mercator computational boundaries reach the poles, but visible coverage is limited by `maxLatitude`. The renderer owns tile matrices, caching, clipping, resolution budgets, and any additional camera zoom.

## evaluate(state) and MapState[​](#evaluatestate-and-mapstate "Direct link to evaluate(state) and MapState")

From v5.0 · Experimental

```
type MapState =

  | {type: 'map' | 'globe'}

  | {type: 'hinge'; amount: number};
```

Default state is `{type: 'map'}`. A frame exposes `projectPoint`, `projectLine`, `projectPolygon` with the same geographic arguments as the static methods but 3D output coordinates (`MapPosition3D = [number, number, number]`). It also has `projectPlacedPoint(xy, regionId)` for geometry already clipped into that region. That method does not re-clip map/hinge points; the caller must retain a valid region ID with each vertex. Unknown IDs return `null` for map/hinge frames. Globe conversion uses inverse projection and therefore rejects unknown IDs and returns `null` outside coverage. All frame geometry preserves source coordinates.

| State   | Coordinates                                                                               |
| ------- | ----------------------------------------------------------------------------------------- |
| `map`   | Static `[x, y, 0]`                                                                        |
| `globe` | Origin-centered sphere of the description radius; +X = (0°,0°), +Y = (90°,0°), +Z = north |
| `hinge` | Root-panel frame; amount 0 = closed polyhedron, amount 1 = flat net                       |

Only hinged maps accept a hinge state; amount must be finite and in `[0,1]`. Evaluate once per frame and reuse its transforms. Flat-to-posed panel transforms are affine; they preserve rigid panel lengths. A faceted sphere requires an additional deformation/alignment step to match the smooth globe. Frame geometry keeps the static map's coverage and splits. Camera fitting, clipping against a view frustum, lighting, occlusion, and 3D picking are renderer responsibilities.

## planTransitionTo(target) and MapTransitionPlan[​](#plantransitiontotarget-and-maptransitionplan "Direct link to planTransitionTo(target) and MapTransitionPlan")

From v5.0 · Experimental

Returns `{strategy, reason, resplit, coverage, sourceHinge, targetHinge}`. The same engine yields `direct`, `resplit: false`, `coverage: 'preserve'`. Different engines yield `via-globe`, `resplit: true`, `coverage: 'fade-unmatched'`. Hinge flags identify endpoints with rigid motion. Neither matching IDs nor matching JSON establishes callback/topology equivalence.

The plan does not execute transitions, match vertex arrays, or promise an overlap-free morph. Use geographic coordinates to rebuild destination geometry; fade differing coverage. Direct transitions between distinct but compatible engines, custom reference surfaces, and automatic topology correspondence are future extensions.
