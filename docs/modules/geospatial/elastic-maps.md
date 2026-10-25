# Elastic maps

<p class="badges"><img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" /> <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" /></p>

In this module, **Elastic** refers to Justin Kunimune's named family of numerical
world maps. More generally, a mesh-defined projection stores a geographic-to-planar
coordinate field whose deformation controls distortion. The term does not mean
that every animated or deformable map uses the Elastic format.

Elastic maps describe the Earth's surface with optimized coordinate grids rather
than a single analytic projection formula. They distribute distortion by deforming
those grids, with independently defined cuts. Compare Justin Kunimune's three
published maps below, or morph to a sinusoidal map. Choose a direct morph or a route
through the globe. Hover after the animation to recover geographic coordinates, including beside cuts.

import Example from '@site/src/components/elastic-maps';

<Example />

## How they work

Each section contains a regular longitude/latitude grid of projected coordinates.
The runtime uses bilinear interpolation within that grid. A separate geographic
boundary determines which section owns a point: the interpolation grids themselves
overlap, so their extents cannot be used as coverage masks. A boundary can enclose
a concave region or select its complement. Undefined grid nodes remain undefined;
the runtime does not bridge them or extrapolate across cuts.

This is a different construction from myriahedral unfolding. A myriahedral map
moves rigid faces about hinges. An Elastic map deforms its coordinate mesh. It has
no hinge pose, and the library does not run the optimization that created the data.
MapEngine can place the same source geometry on a globe, or prepare correspondence
for a direct morph between supported maps.

## Use the same rendering pipeline

```typescript
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import {elasticII} from '@math.gl/geospatial/elastic';

const map = new MapEngine({
  version: 1,
  id: 'elastic-II',
  definition: {type: 'elastic', data: elasticII}
});
const viewport = map.fit({width: 960, height: 600, padding: 20});
const point = map.projectPoint([-74, 40.7]);
const pixel = point && viewport.project(point.position);
const candidates = pixel ? map.pick(viewport, pixel) : [];
```

The optional `elastic` entrypoint exports `elasticI`, `elasticII`, and `elasticIII`.
Applications that only import `discontinuous` do not include these coordinate tables.
No network fetch is performed by MapEngine. Pass the selected data explicitly, or
load and parse a published text file with `parseElasticMap`.

Project lines and polygons through MapEngine before rendering. Results retain
source coordinates and region IDs. Concave section boundaries, polygon holes, and
antimeridian crossings are clipped before output interpolation. Regions subdivide
sections into geographic charts; do not infer actual coverage from a region's
convex envelope. Use `getLayout()`, `projectPolygon()`, and `pick()`.

## Morphing between maps

A direct morph needs more than two arrays of projected vertices. Different maps
cut the same coastline at different places. `createTransitionTo()` clips each
feature against both maps, retains the geographic correspondence, and prepares
two endpoint positions for each resulting vertex. Prepare once when the selection
changes; evaluate those arrays during animation.

```typescript
const transition = source.createTransitionTo(target); // strategy: 'auto'
const coastline = transition.prepareLine(longitudeLatitudePositions);
const land = transition.preparePolygon([outerRing, ...holes]);

// Called by the renderer's animation loop, with eased progress in [0, 1]:
const lineParts = coastline.evaluate(progress);
const polygonParts = land.evaluate(progress);
// Each part has 3D coordinates and opacity. Render each part separately.
```

Automatic direct morphing supports the three Elastic presets, other Elastic data
with complete, non-overlapping defined grid coverage, and a small set of finite global formulas:
sinusoidal, Mollweide, and Robinson. Other pairs
use the globe route. Explicit `strategy: 'direct'` rejects unsupported coverage;
`strategy: 'via-globe'` always takes the globe route.

The globe route moves source geometry onto the sphere, crossfades source and
destination coverage there, then flattens destination geometry. This allows a
world map to transition to regional insets without inventing correspondence for
areas absent from one endpoint. It uses the larger endpoint radius. It does not
animate physical hinges; use the hinge pose API for that.

Direct interpolation can temporarily fold, overlap, or stretch parts. It does
not preserve equal area, conformality, or the optimization objective between
endpoints. The method is sampled rather than an exact topological construction.
Renderers own time, easing, camera fitting, depth sorting, and picking during
motion. This example pauses coordinate picking during motion and honors reduced
motion preferences. Its globe view is an orthographic illustration with both
hemispheres visible; Ice Age Explorer provides the textured 3D globe presentation.

See [MapEngine transition methods](./projection/api-reference/map-engine.md#createtransitiontotarget-options)
for the supported strategies and frame contract. The existing conservative
`planTransitionTo()` continues to recommend a globe route for different engines;
`createTransitionTo()` opts into preparing direct correspondence when supported.

## Accuracy and limits

- Output coordinates are table kilometers divided by `data.radius` (6371 in the
  presets), then multiplied by the requested map radius. This is a normalization
  convention, not a new geodetic datum or a claim of exact equal-area preservation.
- Bilinear interpolation reproduces the tabulated model. It does not reproduce the
  author's optional Hermite interpolation or an unsampled optimization surface.
- Geographic input edges remain minor great-circle arcs. They are approximated in
  longitude/latitude charts to a 0.00001-degree midpoint chord criterion before
  clipping against the published straight longitude/latitude boundaries. Boolean
  operands are rounded to 10⁻¹⁰ degrees to stabilize coincident chart edges;
  transition polygon intersections use 10⁻⁹ degrees. Output
  subdivision uses the requested angular step and map-space tolerance. These are
  sampling criteria, not certified global error bounds.
- Inverse picking searches forward-grid cells and solves their bilinear equations.
  It validates coverage and forward residuals rather than trusting the approximate
  inverse hints in the published files. Gaps return no candidates; overlapping
  sections can return more than one. Singular grid cells can have ambiguous inverses.
- The importer supports the published text format, not HDF5. Custom datasets must
  use the same regular global grid convention. Runtime optimization, smooth spline
  interpolation, and arbitrary unstructured meshes are not included.
- Sampling work is bounded. Invalid data or requests that exceed the subdivision
  limit fail explicitly. The API remains experimental.

## References and attribution

The maps and data are by **Justin Kunimune**. Read his
[Introducing the Elastic projections](https://kunimune.blog/2023/12/29/introducing-the-elastic-projections/)
and the [data format and reference implementations](https://github.com/jkunimune/elastik).
The bundled tables are pinned to upstream revision
`88808a7c0fe92b42d6e5f903549cd7cfcbd26f3b`, released under the
[Unlicense](https://github.com/jkunimune/elastik/blob/88808a7c0fe92b42d6e5f903549cd7cfcbd26f3b/license.md).
Their original precision and license notice are retained. The math.gl runtime is
an independent implementation of the documented format.

Kunimune's earlier [Danseiji paper (free preprint)](https://kunimune.blog/wp-content/uploads/2019/11/danseiji-paper-preprint.pdf)
provides background on optimizing mesh-defined projections. Danseiji's distinct
unstructured mesh format is not supported by this importer.
Coastlines in this example come from Natural Earth, in the public domain.

See the [Elastic API reference](./projection/api-reference/elastic.md),
[MapEngine reference](./projection/api-reference/map-engine.md), and
[rendering guide](./projection/developer-guide/map-engine.md).
