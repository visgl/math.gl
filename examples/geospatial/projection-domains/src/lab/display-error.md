# Common display-space qualification

**Compare display error** in the raster lab measures both strategies using the
same independent barycentric probes after clipping. For a triangle sample, it
interpolates UVs, projects that source location back to the target plane, and
compares it with the interpolated target position in affine display pixels.
A separate inverse check measures source-texel distortion. Both gates must pass.

The source-grid mesher uses the public subdivision `errorMetric` callback with
anisotropic display scales. The inverse mesher retains source-texel refinement;
a bounded outer qualification loop halves its internal tolerance until both gates
pass. The strategies need not share internal units or produce identical meshes.
Preparation timing includes retries and validation. Invalid samples, empty meshes
and exhausted retry budgets reject instead of publishing an inaccurate result.

The UI runs at scales [180,90] and [360,180] pixels per target unit. These recorded
affine cameras are independent of subsequent interactive pan/zoom. The reference
conversions come from the native fixture chart, while preparation keeps the
projection-engine agnostic adapter contract. This is not an independent PROJ
accuracy oracle, perspective-camera support, or a continuous error certificate.
Async-only engines without source-grid preparation cannot run this paired mode.
Existing strategy-specific comparisons and texture criteria remain available.

[Feedback section 3](https://github.com/mdsumner/sidebyside/blob/main/article/2026-10-13_custom-projections-deckgl.md#3-refinement-error-belongs-in-the-output-space).
