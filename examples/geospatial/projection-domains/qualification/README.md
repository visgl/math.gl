# Portable raster qualification corpus

`corpus.json` is a versioned data-only contract for downstream engine/layer tests. The general
projection interface is projection-engine agnostic; adapters should evaluate the same coordinate
samples with their chosen backend, not replace the expected values with that backend's output.

Each case gives its authority identifier, executable PROJ definition, raster dimensions and affine
mapping `[x0, dx/du, dx/dv, y0, dy/du, dy/dv]`. Pixel coordinates address **edges**; centers add 0.5.
Coordinate units follow the source definition; geographic references are longitude/latitude degrees.
The four raster corners give the affine footprint. A longitude comparison at an exact pole is
undefined: compare latitude and the source-coordinate result instead. Elsewhere compare longitude
modulo 360. Consumers must retain separate seam/chart vertices when preparing meshes.

Cases include EPSG:3031 and a rotated Antarctic grid, EPSG:3413, shifted-meridian EPSG:3832,
rotated Fiji and adjacent EPSG:32660 tiles. `adjacency` names physically identical source edges
and independent geographic samples. This establishes common edge input; it does not by itself
prove that a downstream mesher avoids cracks, covers the interior or respects texture tolerances.
Use these inputs alongside coverage and post-clipping probes in the existing warp qualification.

Regenerate with `pyproj==3.6.1` and PROJ 9.3.0 by running `generate.py`. Networking is disabled.
The generator uses authority definitions independently of math.gl's implementation. Python and
PROJ are offline development oracles, not published runtime dependencies.

The `raster` entry references the existing bundled NASA Blue Marble JPEG with a checksum,
georeferencing and provenance path. Copy the referenced image and credit when extracting this
corpus. It is a small real geographic overview, not native polar satellite imagery, a COG, or
independent proof of the image's positional accuracy. Do not treat the resampled lab visualization
as an oracle for the same projection implementation.

[Feedback: fixture contributions and division of responsibility](https://github.com/mdsumner/sidebyside/blob/main/article/2026-10-13_custom-projections-deckgl.md#what-we-did-instead-and-why-it-matters-here).

## Native polar diagnostic raster

`native-polar.json` contains two adjacent, independently generated EPSG:3031
point-sampled RGBA tiles (33×65 nodes each). The west tile's last column and east
tile's first column share both native coordinates and samples. Affines map node
indices, not pixel edges: the combined 65×65 nodes span ±4,000 km. The pole is
inside the grid, with alpha-zero nodata within 500 km. Values are coordinate ramps
and a checker pattern, not measured elevation or observed imagery.

Regenerate with `python3 generate-native-polar.py` (standard library only). The
fixture is MIT-licensed, carries per-tile SHA-256 hashes and has no remote fetch.
`lab/native-polar.mjs` assembles the shared nodes and resamples at source-pixel
centers using nearest-neighbor sampling, preserving nodata. The optional lab
control displays it without changing mesh geometry. Tests check hashes, shared
samples/coordinates, native-source alignment, UV sampling of valid and nodata
regions and unchanged geometry when switching textures.

This fixture complements independent PROJ coordinate references; synthetic raster
values themselves are not a geodetic accuracy oracle. Real observational COG
loading, overview selection and mask-aware filtering remain downstream concerns.
