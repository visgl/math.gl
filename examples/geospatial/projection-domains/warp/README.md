# Qualified raster preparation recipe

This example-owned recipe extends the projection-domain showcase with actual ellipsoidal
EPSG:3031 source grids, rotated Antarctic and Fiji grids, UTM 60, complete world coverage,
interrupted native charts, orthographic and tilted-perspective horizons. It introduces no
published API or external-engine dependency.

`fixtures.mjs` declares continuous processing charts and source pixel-to-CRS affine mappings.
These are fixture-specific conservative source-coverage extents inside valid projection domains,
not a method for inferring arbitrary domains from CRS rendering bounds. The interrupted adapter
reuses native map regions and chart-specific inverses; it does not invent a spherical clipper.
The EPSG:3031 square contains the pole. The full-world rectangle includes both poles.

`prepareInverse` triangulates each explicit domain, refines target triangles against inverse
error measured in **source texels**, and clips the resulting source-pixel triangles to the
image footprint. Clipping uses affine UV constraints in each triangle's barycentric parameter space;
math.gl's `interpolatePackedAttributes` carries target positions through those cuts. This preserves
nonzero target area when UVs collapse to a point or line at the pole. Chart IDs and source row IDs remain explicit. Seam vertices in
different charts are never welded. Source-grid refinement remains demonstrated by the sibling
`raster-mesh-preparation` example, where error is measured in output-coordinate units.

`refineWarp` is an example-owned evaluation state machine. Each yield is a packed XY sample
frontier. The synchronous driver evaluates it pointwise; asynchronous engines can supply a batch
without changing the refinement algorithm or putting Promises into a CRS converter. Shared indexed
edges split conformingly. Edge quarter/midpoint and interior probes test interpolation error.
Vertex, triangle, depth and cumulative sample budgets reject the entire operation on exhaustion.
Invalid samples also reject; there is no successful partially omitted mesh.

## Qualification and limits

Run `yarn workspace math.gl-projection-domains test`. The tests use independent, pinned
pyproj 3.6.1 / PROJ 9.3.0 reference samples, with networking disabled. Regenerate `reference.json`
using `generate-reference.py` in that environment. References record source pixels, affine source
coordinates, geographic results, and CRS identity. No oracle dependency ships with math.gl.

Tests check source coverage at the reference points, post-clipping interpolation at different
barycentric probes, horizon visibility, holes, chart/source identity, conformity and failure budgets.
The selected fixtures pass a one-texel inverse error threshold at these probes. This is sampled
qualification, not a continuous guarantee or a claim about every projection/source combination.

A triangle is excluded from error refinement only when all its vertices and edge/interior probes
lie beyond the same source-image edge. That is a sampled exclusion policy: pathological transforms
could enter the image between probes. Source coverage tests qualify this choice for these fixtures;
arbitrary engines need a conservative coverage bound or additional sampling. Domain outlines are
sampled polygons too. The horizon is sampled at 128 angles slightly inside the exact tangent, so
its boundary error is separate from texture interpolation error. No automatic domain discovery,
grid loading, datum operation selection or arbitrary topology repair is provided.

Unsupported combinations fail explicitly. In particular, the interrupted fixture currently uses
polar source pixels, whose value is continuous at the pole; a longitude-based world texture has
an additional singular parameterization there. Dynamic centers are restricted to the documented
southern fixture domain. `inspectWarp` supplies additional post-clipping evidence; it does not
turn the sampled criterion into a mathematical certificate.

## Asynchronous frontiers and proj-wasm

`prepareInverseAsync(chart, evaluate, options)` uses the same refinement state machine.
The evaluator receives packed target XY and returns packed source-pixel XY. `batchSize` bounds
individual calls; the cumulative sample budget bounds the complete job. Inputs are snapshotted,
results are validated, and AbortSignal is checked before and after every awaited call. Cancellation
cannot interrupt a native PROJ call already in progress, but it prevents partial/stale publication.

The sibling `proj-wasm-crs/raster-example.mjs` runs a real PROJ operation for the source-grid
conversion throughout adaptive refinement, then transfers the resulting mesh into an owned math.gl
task worker. Node and Chromium exercise the same path, including buffer detachment and identity.
Native charts supply target inverse branches; proj-wasm supplies WGS84-to-source conversion.
This hybrid is intentional: an external point transformer does not infer interrupted chart cuts.
One normalized operation is reused and disposed before the application-owned WASM pool shuts down.

Compare actual samples and qualified error, not exact triangulation across different engines:
roundoff at clipping boundaries can change triangle counts without changing supported coverage.
Changing engine/version, operation, resource revisions, chart/domain, source grid/data or sampling
policy invalidates derived meshes. Use `getCRSExecutionKey` only as the execution part of a complete
application cache key; absent execution provenance must not be treated as a reusable backend key.
