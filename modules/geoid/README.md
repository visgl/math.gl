# @math.gl/geoid

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module contains support for non-ellipsoidal surface using earth gravity models.

For documentation please visit the [website](https://math.gl).

Use `createGeoidFromGrid({width, height, values, offset, scale, cubic})` to create
a geoid from a complete decoded `Uint16Array` grid, including Parquet's
`raw_value` column. The array must retain GeographicLib row/column order.
Decode files in the application; this API requires no Arrow or Parquet dependency.
See the [grid factory documentation](../../docs/modules/geoid/api-reference/create-geoid-from-grid.md).

## Optional EGM96 grids

Import `@math.gl/geoid/geoid-egm96-low.pgm` (1° preview, 130 KB) or
`@math.gl/geoid/geoid-egm96-hi.pgm` (15′ original, 2.08 MB) as an asset URL, fetch
the bytes, and pass them to `parsePGM(bytes, {cubic: true})`. In Node, resolve the
asset with `import.meta.resolve` and read it using `node:fs/promises`.

`getHeight(latitude, longitude)` returns geoid height N above WGS84 in meters:
h = H + N. Use the original grid for height conversion; the preview is downsampled
for visualization. See [data provenance and licensing](data/README.md).
