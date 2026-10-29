# Preparing raster meshes for projection

Applications can compose math.gl's existing geometry and projection interfaces to prepare raster
meshes with UVs and feature identity. The [runnable example](https://github.com/visgl/math.gl/tree/master/examples/geospatial/raster-mesh-preparation)
uses native projections; the same preparation function accepts an external engine's **synchronous**
transform after its asynchronous initialization. No projection engine is imported by the recipe's
geometry helper. The general projection interface is **projection-engine agnostic**. For an async-only engine,
use the [adaptive asynchronous inverse recipe](https://github.com/visgl/math.gl/tree/master/examples/geospatial/projection-domains/warp#asynchronous-frontiers-and-proj-wasm):
refinement requests new sample batches as needed. A one-time preprocessing pass is insufficient
when refinement introduces new vertices. The [real proj-wasm integration](https://github.com/visgl/math.gl/tree/master/examples/geospatial/proj-wasm-crs)
reuses an operation across those frontiers without changing synchronous converter semantics.

Explore the [four-engine raster lab](https://visgl.github.io/math.gl/next/examples/raster-projection-lab)
and [external-engine adapters](https://visgl.github.io/math.gl/next/examples/external-projection-engines).
Changing projection parameters creates a new operation and can invalidate domains and meshes;
the current rebuild example does not promise continuous frame-rate or automatic geometry reuse.

## Preparation order

1. Define the source raster grid and its UVs in its own CRS. Resolve source coverage, singularities
   and cuts into continuous source patches **before** refinement. Duplicate vertices at attribute
   or projection seams. Do not interpolate longitude through a pole or across a wrapped seam.
2. Call `subdivideTriangleMesh` for each patch with its selected chart transform. Convert a pixel
   tolerance into target units using the intended view scale. Null/nonfinite samples and exhausted
   limits reject the patch; never filter failed vertices out of existing triangles.
3. Convert the explicit target domain's outer rings and holes into disjoint triangles using `earcut`.
   Pass those convex regions to `clipTriangleMesh`, with periodic metadata when coordinates have
   already been unwrapped into a continuous target interval.
4. Apply `interpolatePackedAttributes` first using subdivision provenance, then clipping provenance.
   The example keeps source coordinates and UVs in float64 through both stages and retains a flat
   source-row attribute. Compose triangle identity through both stages too. Quantize only at upload.
5. Render the resulting indexed positions and UVs. Do not weld coincident vertices: periodic copies
   and different source patches can occupy the same position with different attributes.

`prepare.mjs` is deliberately example code. Its domain topology and source-patch assumptions are
explicit; it is not a general topology repair or reprojection API. For native discontinuous maps,
use the existing `MapEngine`/map chart boundaries and clipping rather than introducing a competing
spherical clipper. For arbitrary external projections, the backend must supply cuts and domain geometry.

## Fixtures and what they verify

| Fixture | Source preparation | Checks |
| --- | --- | --- |
| Pole-containing raster | Stereographic XY square containing the north pole, projected to polar orthographic | Finite geometry, sampled error and source UVs through the pole |
| Rotated raster | The same raster's affine grid rotated in source XY | Source interpolation and UV provenance independent of grid orientation |
| UTM zone 60 | UTM XY grid crossing longitude 180°, target longitudes explicitly unwrapped around that meridian | Two periodic copies, preserved row IDs and UVs |
| Full world | Four source longitude strips, separate seam vertices | Full 360×180 target area, no duplicate seam area |
| Interrupted sinusoidal | Native chart meridian cuts, per-chart transform and sampled target outline | No cross-chart triangles; six chart patches retain original world-raster UVs |
| Domain hole | Planar raster clipped to an outer ring with an interior hole | Hole remains empty and total area is conserved |

The interrupted fixture stops at ±80°; pole behavior is tested separately with the projected polar
source grid. Its meridian cuts are specific to the native sinusoidal charts. Spherical great-circle
clipping and straight raster-grid edges have different semantics; do not substitute one silently.
Domain curves are sampled polygons, not exact boundaries. Rendering bounds are never treated as a
validity domain. Unknown domains must remain unknown rather than becoming a bounding rectangle.

## Source-grid versus target-grid meshing

This example refines a **source grid**: UVs are affine in source coordinates and target positions are
approximated by triangles. That preserves the source texture mapping, but requires source cuts and
finite transform samples. Target clipping after refinement cannot repair a source triangle that crossed
an invalid projection region before refinement.

An alternative is to build a **target grid**, clip it to a target domain, then inverse-transform each
vertex to the source raster to obtain UVs. This can simplify pole-containing coverage, but requires a
well-defined inverse, per-chart choices for interrupted maps, source-coverage checks, and refinement
against inverse/texture error. Forward geometric tolerance alone does not bound inverse UV error.

The library subdivision tolerance is sampled target error, not a universal mathematical bound. This
example additionally checks triangle centroids after clipping for these fixtures; it does not certify
all possible transforms. Sampling scale is explicitly supplied and the canvas fits results separately.
For a real camera, include camera/view policy and texture-error criteria in the sampling decision.
Rebuild on changed projection parameters, domain sampling, data, UVs or view tolerance. A backend
execution key alone is insufficient to identify a derived raster mesh.

## Qualified inverse-mesh recipe

The [projection-domain preparation recipe](https://github.com/visgl/math.gl/tree/master/examples/geospatial/projection-domains/warp)
adds actual EPSG:3031 pole-containing and rotated source grids, Fiji/UTM seam crossings, native
interrupted charts, and orthographic/tilted-perspective horizons. Target triangles refine against
source-texel interpolation error before image-footprint clipping. Source IDs and chart ownership
survive preparation. Independent PROJ reference points test coverage; different post-clipping
probes test texture error. Invalid samples and exhausted budgets reject the operation rather than
silently producing a partial mesh. This remains a qualified example recipe with explicit sampled
coverage and boundary assumptions, not generic raster reprojection support.
