# Terrain boundary qualification

This is qualification tooling, not a new meshing API. The browser-safe helpers and
compressed reference artifacts live alongside the terrain example, outside published
`modules/*` packages. No R, GDAL, cdtr or additional JavaScript runtime dependency is
introduced into math.gl.

## Reproduce

1. Check out `mdsumner/trianglewins` at
   `d0767a5ef5f8e6281d39d89a98593589e25ca248` in a disposable directory.
2. Install R with `terra`, `jsonlite` and `cpp11`, and install `hypertidy/cdtr` at
   `141fe36c084a6954f9bd05594ac809c1fbc8a302`. The artifact manifest records the
   versions actually used, including GDAL. The original DEM resampling versions are
   separately recorded in each source fixture's metadata.
3. From the study checkout run `sh survey/dev-drafts/mathgl-terrain/fetch-fixtures.sh`
   and `npm install --prefix survey/dev-drafts/mathgl-terrain --ignore-scripts`.
   This installs the study's pinned Delatin 0.2.0, not a math.gl dependency.
4. From math.gl run
   `python3 test/terrain-boundaries/regenerate.py STUDY_CHECKOUT RAW_OUTPUT_DIRECTORY`.
   This adds full-precision JSON exports to the study scripts without changing their
   refinement or preprocessing. It executes the upstream study, including its CSV
   comparisons; it can take several minutes. The study checkout is disposable because
   the two R drivers are rewritten. No R tools are needed for ordinary verification.
5. Run `node test/terrain-boundaries/pack.mjs RAW_OUTPUT_DIRECTORY`, then
   `node --test test/terrain-boundaries/*.test.mjs` and
   `node scripts/qualify-terrain-boundaries.mjs`.

The packer uses the repository's streaming DEM fixtures. Their complete file hashes
must match the pinned source revision recorded in the manifest. Artifact hashes cover
compressed full-precision JSON; the browser viewer's Float32 buffers are not used.
The last command bundles **this checkout's source**, measures regular, MARTINI and
Delatin alongside cdtr references, and writes `results.json`. It fails on unexpected
errors; nodata rejection is reported separately rather than assigned zero error.

## What is measured

All comparisons use unit source-sample XY and source-height Z. This removes map
projection scale from topology comparisons; horizontal lengths/areas are sample-grid
units, not ground metres. Original cell registration and projected coordinates remain
in the manifest. Adaptive builders' actual fallback tessellators are reported.

- Nodal max/RMS on the study's admission mask, and separately on all valid nodes.
- Surface max/RMS on a 4× lattice: analytical cliff or bilinear DEM, plus a separate
  regular `00-11` triangulated reference. These are **sampled estimates**, not
  continuous error certificates. Bilinear probes require all four valid corners.
- Supplied linear XYZ boundary height error: clip each segment against mesh triangles
  and evaluate both interval ends. Include the worst error from overlapping faces.
  Uncovered intervals are reported independently; an entirely uncovered measurement
  has `null` error, never a fabricated zero.
- Unique triangles whose interiors contain positive-length pieces of boundary.
  Vertex touches and coincident mesh edges are excluded. This geometric crossing
  count differs from the upstream land/sea vertex-classification count.
- Domain coverage using 4× cell-center quadrature: missing, excess and overlapping
  area estimates. This is not an exact polygon-coverage certificate. Tests independently
  check nodal coverage, edge incidence, supplied constraints and Sierra's exact summed
  triangle area, as well as sampled coverage against the supplied outline.

The Pacific outline follows the upstream scenario: height-positive regions, components
larger than 25 cells, filled enclosed water, one-cell simplification, clipping to the
sample domain, and 0 m coast constraints. Tile-edge constraints retain interpolated
heights. The 103 samples on the simplified coastline are excluded from the study mask.
This derived outline is **not an authoritative geographic coastline**. Equal nodal
errors under different masks or equal triangle counts across different domains are
not evidence of equal accuracy or efficiency.

The Sierra reference uses cells with **four valid corners**, while current math.gl
regular meshing retains **each valid triangle**. Both domains are reported; the
upstream label “math.gl regular mesh” therefore does not describe our current builder.
No missing sample is filled and no existing meshing behavior is changed.

## Attribution

Based on Michael Sumner's [breakline study](https://mdsumner.github.io/trianglewins/dev-drafts/mathgl-breaklines/)
and [roadmap comment](https://github.com/visgl/math.gl/issues/341#issuecomment-6807738999).
The study repository declares MIT, copyright 2026 trianglewins authors. Its cdtr
reference backend incorporates CDT and robust geometric predicates; their source
licenses remain in the pinned reference-tool repository. No backend source is shipped
in math.gl.

DEM data: Mapzen / AWS Terrain Tiles, with 3DEP, SRTM and GMTED2010 courtesy USGS;
ETOPO1 courtesy DOC/NOAA/NESDIS/NCEI. Source URLs and SHA-256 values are retained in
the manifest. Sierra's nodata mask is manufactured, not an observed data-quality map.

## Follow-up criteria

A future constrained mesher must preserve input segments and their height authority,
represent off-grid vertices and edge provenance, specify domains and nodata policies,
and pass these independent diagnostics at every supported tolerance. Nodal tolerances
must not be advertised as continuous bounds. Constrained meshing, hydrologic inference,
vector coastline sourcing and full-surface certificates remain separate work.

## Independently discovered Sierra counterexample

The regenerated Sierra references reproduce the published triangle counts but **do
not pass independent nodal tolerance qualification**. At 10 and 20 m, the largest
observed error is 778.455 m at sample (95, 135): source height 2788 m, mesh height
2009.545 m. The offending probe is on a triangle edge. Interior-only probes meet
the requested tolerance, which can conceal the discrepancy when polygon rasterization
omits edge samples. The upstream refinement code sets missing rasterized errors to
zero; this is a plausible explanation, not a proven diagnosis of every discrepancy.

These artifacts are intentionally retained as labeled counterexamples. CI verifies
that independent measurement detects the edge error, instead of weakening the requested
tolerance or treating the upstream CSV as an oracle. Their planar domain coverage and
constraint geometry still provide useful evidence for adaptive nodata meshing. The
original supplied XYZ outline and independently measured source-node elevations are
reported separately: geometric preservation alone does not establish height fidelity.
