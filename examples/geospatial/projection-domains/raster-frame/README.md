# Raster coordinate frame conformance

The example composes existing math.gl `Matrix3` and `createSpatialReference` APIs.
It adds no public exports, format parsers, or mandatory external projection engine.

`affine: [a,b,c,d,tx,ty]` maps a grid column/row to stored CRS components:
`u = a*column + c*row + tx`, `v = b*column + d*row + ty`.
`axisOrder: [0,1]` retains these components; `[1,0]` swaps them into XY.
The declaration describes stored arrays, not authoritative CRS wire-axis rules.

Area-registered samples use index + 0.5 and have explicit cell coverage [0,width] ×
[0,height]. Point-registered samples use their integer node indices and have no
inferred cell coverage. `sampleBounds` is the transformed sample-envelope polygon,
not an axis-aligned extent. Dimensions include the actual valid samples, not padded
storage chunks. Native units remain metadata; a separate converter changes CRS.

Fixtures include large native origins, unequal X/Y spacing, a negative row axis,
rotation/shear and stored northing/easting order. Golden sample coordinates are
hand-computed independently of Matrix3. Round trips include fractional/outside-grid
queries. Singular, ill-conditioned and nonfinite declarations reject. Per-level
frames must be supplied explicitly; the recipe never infers multiscale geometry
from an OME scale, array shape or chunk dimensions.

The separate website page has the usual collapsible infobox and picking. Build the
Projection domains workspace to run `dist/raster-frame.html` standalone. This is
mathematical conformance, not a CF/OME/GDAL compatibility claim. Format interpretation
and metadata precedence stay with [loaders.gl#4344](https://github.com/visgl/loaders.gl/pull/4344).
