# GeoArrow DataFrame with deck.gl

Run `yarn workspace math.gl-geoarrow-dataframe start` from the repository root.
The map draws a deterministic 20,000-row GeoArrow point table using deck.gl
binary position attributes. The points straddle the antimeridian. Pan or zoom
to update the viewport, change the minimum score, switch processing APIs,
or click a point to see its stable ID. The DataFrame processor reuses cached
geometry envelopes across viewport changes. The SQL processor tests the same
point bounds with a longitude predicate. The elapsed time shown is for CPU
processing, including viewport and score filtering and radius projection.

## Bundle measurement

Run `yarn workspace math.gl-geoarrow-dataframe measure`. The script bundles
the same browser app three times with esbuild and production minification.
The SQL-only and DataFrame-only builds each import just their corresponding
processor. The combined build imports both. All three use identical data and
rendering code.

| Build | Workspace math.gl bytes | Total JavaScript bytes |
| --- | ---: | ---: |
| SQL only | 384,054 | 1,561,803 |
| DataFrame only | 367,002 | 1,555,546 |
| Combined | 400,349 | 1,589,377 |

For each workspace math.gl source file, the smaller byte contribution across
the two standalone builds counts toward shared bytes, and the larger toward
the union. The resulting **87.6% overlap** is 2.4 percentage points short of
90%. Of the DataFrame-only workspace math.gl bytes, **95.6%** are shared with
SQL. Adding DataFrame to the SQL app adds **16,295 workspace math.gl bytes**.

The percentages estimate source-module overlap from esbuild's emitted-byte
attribution. They vary with tree shaking and minification. The math.gl totals
cover this workspace's sources. The total JavaScript column also includes
deck.gl, Arrow, and third-party dependencies.
