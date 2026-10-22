# Myriahedral projection API

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

Build a spherical panel mesh, select its retained hinges, and project geographic geometry into the resulting flat net. The same layout drives optional unfolding. There is no renderer, image download, DOM dependency, or bundled land dataset in this API. See [background and credits](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/myriahedral-projections.md) and the [interactive example](https://visgl.github.io/math.gl/next/docs/modules/geospatial/myriahedral-maps.md).

```
import {createMyriahedralMap} from '@math.gl/geospatial/discontinuous';



const map = createMyriahedralMap({preset: 'polyconic', columns: 48});

const point = map.projectPoint([-73.98, 40.75]);

const candidates = map.unprojectPoint(point!.position); // may contain several panels

const lineParts = map.projectLine([[-80, 30], [-40, 50]]);

const polygonParts = map.projectPolygon([

  [[-80, 20], [-40, 20], [-40, 50], [-80, 50]]

]);

const panels = map.layout.evaluate(0.5); // halfway unfolded, XYZ per face vertex
```

Render each line/polygon part independently. Results carry `regionId` and `sourceCoordinates`. Panel `i` is named `panel-i` in the static map and is index `i` in the animation. Use `unprojectPoint(xy, regionId)` when a renderer already knows the picked panel. Otherwise retain all inverse candidates: gaps return an empty array; overlaps and seams can return multiple coordinates.

## createMyriahedralMap(options)[​](#createmyriahedralmapoptions "Direct link to createMyriahedralMap(options)")

From v5.0 · Experimental

Returns a `MyriahedralMap`, a subclass of [DiscontinuousMap](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md). It supports the same point, line, polygon, seam, layout-fitting, and inverse APIs, and exposes its `layout`. `new MyriahedralMap(options)` is equivalent.

| Option            | Default         | Meaning                                                                               |
| ----------------- | --------------- | ------------------------------------------------------------------------------------- |
| `preset`          | `'cylindric'`   | Cut strategy listed below                                                             |
| `columns`         | `48`            | Graticule resolution: multiple of four from 12 through 96; half as many latitude rows |
| `solid`           | `'icosahedron'` | Polyhedral base: tetrahedron, cube, octahedron, dodecahedron, or icosahedron          |
| `subdivisions`    | `1`             | Polyhedral refinement levels, 0–3; zero preserves original polygonal faces            |
| `centralMeridian` | `20`            | Longitude in degrees for the root and secondary join preference                       |
| `radius`          | `1`             | Positive linear scale of map and animated coordinates                                 |
| `isLand`          | absent          | Callback `([longitude, latitude]) => boolean`; required for sealine/coastline         |
| `landSampleStep`  | `0.25`          | Maximum angular sampling interval in degrees, from 0.05 through 10                    |
| `mesh`            | generated       | Custom unit-sphere mesh; overrides mesh generation                                    |
| `edgeWeight`      | absent          | `(edge, presetWeight) => number`; replaces the retained-join weight                   |

Unknown presets, invalid resolutions, nonfinite weights, and malformed meshes throw. `columns` applies to generated graticules; `solid` and `subdivisions` apply to generated polyhedra. `radius` sets output units, not an ellipsoid or CRS.

## Presets[​](#presets "Direct link to Presets")

`MYRIAHEDRAL_PRESETS` is the readonly list of supported strategy names. These are independent discrete layouts, not implementations of similarly named analytic projections or reproductions of Nico Belmonte's exact cuts.

| Preset        | Retained connections                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `polyconic`   | Latitude strips with joins concentrated near a central meridian                                         |
| `cylindric`   | Longitude strips connected through an open equatorial chain                                             |
| `azimuthal`   | Longitude strips joined near the north polar cap                                                        |
| `hemispheres` | Two polar strip systems, connected by one equatorial hinge on a graticule                               |
| `sealine`     | Graticule joins prefer sampled land, preserving an equatorial chain                                     |
| `coastline`   | Graticule joins prefer sampled ocean, preserving an equatorial chain                                    |
| `polyhedral`  | Regular solid or recursively refined triangular mesh; land preference when supplied, then shorter joins |

For example, a geography-aware subdivided icosahedron:

```
const map = createMyriahedralMap({

  preset: 'polyhedral',

  solid: 'icosahedron',

  subdivisions: 2,

  isLand: ([longitude, latitude]) => landMask.contains(longitude, latitude)

});
```

`landMask` is application-owned. The example uses public-domain Natural Earth polygons. A finer mask can preserve small islands better, at higher sampling cost. Callbacks run synchronously during construction; retain/reuse the map rather than rebuilding it each frame. No geography callback is needed for geometric presets.

## createMyriahedralLayout(options)[​](#createmyriahedrallayoutoptions "Direct link to createMyriahedralLayout(options)")

From v5.0 · Experimental

Build only the mesh and unfolding when static geometry projection is unnecessary. The options match `createMyriahedralMap`. The result contains:

* `mesh`: original unit-sphere vertices and outward-wound panel index lists.
* `edges`: endpoint indices, adjacent panel indices, retained-join weights, and `hinge` flags.
* `panels`, `tree`, `targetAngles`, `rootTransform`: hinge-tree data and root frame.
* `evaluate(amount)`: new XYZ arrays for each panel, with `amount` in `[0, 1]`.
* `overlaps`: positive-area convex face-pair overlaps in the final net.
* `preset`, `radius`, and optional `cutLandRadians`: sampled total angular land length across cuts.

The globe pose (`0`) is expressed in the root panel's frame, not its original Earth-centered orientation. At `1`, all panels lie in the XY plane. Mesh vertices remain unit length; `evaluate` and the static map apply `radius`. The low-level hinge tree and root transform operate on the unit mesh. Treat returned layout data as read-only; change options by creating another layout. Motion collisions are not checked. `cutLandRadians * earthRadius` estimates a physical length; it is not a coastline intersection measurement.

## Custom meshes and weights[​](#custom-meshes-and-weights "Direct link to Custom meshes and weights")

`MyriahedralMesh` contains `vertices: [number, number, number][]` and `faces: number[][]`. Every vertex must be on the unit sphere, and each face must be planar, convex, and outward-wound, with nondegenerate minor-great-circle edges. The mesh must be connected and closed, with exactly two faces per edge; the construction limit is 20,000 panels. Input arrays are copied. The caller is responsible for supplying a spherical covering without duplicate or overlapping geographic panels. Root selection can reorder faces; use returned indices.

`edgeWeight` receives vertex/panel indices, midpoint longitude/latitude, `arcLength` in radians, and `landFraction` when `isLand` was supplied. Return a finite number: a maximum spanning tree retains stronger edges, with deterministic input-order tie breaking. Overriding weights can remove a preset's backbone and seam preferences. Custom meshes and weights enable other independently generated families; this release does not generate coastline-distance-field meshes or the full Archimedean-solid catalog.

## Accuracy and cost[​](#accuracy-and-cost "Direct link to Accuracy and cost")

Each panel uses radial/gnomonic projection. Panel motion preserves planar lengths and angles, but mapping the sphere onto finite facets introduces distortion: this is neither an exact equal-area nor a conformal projection. Smaller facets reduce local approximation error while increasing the number of interruptions.

Seam handling uses minor great-circle source edges, including the edges between equal-latitude graticule vertices. It does not interpret those edges as constant latitude curves. Densify a parallel before passing it as a line if needed.

Trees guarantee connected rigid panels, not continent connectivity or a nonoverlapping net. Inverse lookup deliberately reports all candidates. Point lookup and geometry clipping currently scan panels; large datasets should cache layouts and partition work rather than reconstruct maps for every feature.
