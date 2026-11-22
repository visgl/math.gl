# GeoArrow DataFrame with deck.gl

Run `yarn workspace math.gl-geoarrow-dataframe start` from the repository root.
The map draws a deterministic 20,000-row GeoArrow point table using deck.gl
binary position attributes. The input points are stored in EPSG:3857 meters
on both sides of the antimeridian. The app uses `GeoDataFrame.toCRS` once to
prepare EPSG:4326 coordinates for deck.gl and shows the reprojection time. Pan or zoom
to update the viewport, change the minimum score, switch processing APIs,
or click a point to see its stable ID. The DataFrame processor reuses cached
geometry envelopes across viewport changes. The SQL processor tests the same
point bounds with a longitude predicate. The elapsed time shown is for CPU
processing, including viewport and score filtering and radius projection.

## Bundle measurement

Run `yarn workspace math.gl-geoarrow-dataframe measure`. The script bundles
the same browser app three times with esbuild and production minification.
The SQL and DataFrame variants each use a single viewport and attribute
processor. The combined build includes both. All three builds share projected
input, DataFrame reprojection at ingestion, and deck.gl rendering code.

| Build | Workspace math.gl bytes | Total JavaScript bytes |
| --- | ---: | ---: |
| SQL processor | 413,938 | 1,603,249 |
| DataFrame processor | 380,591 | 1,569,613 |
| Combined | 413,938 | 1,603,439 |

For each workspace math.gl source file, the smaller byte contribution across
the two standalone builds counts toward shared bytes, and the larger toward
the union. The resulting **91.9% overlap** exceeds 90% for this workload. With
DataFrame already used at ingestion, adding the DataFrame processing mode
adds **0 workspace math.gl bytes** and 190 bytes of total JavaScript.

The percentages estimate source-module overlap from esbuild's emitted-byte
attribution. They vary with tree shaking and minification. The math.gl totals
cover this workspace's sources. The total JavaScript column also includes
deck.gl, Arrow, and third-party dependencies.
