# GeoArrow DataFrame with deck.gl

Run `yarn workspace math.gl-geoarrow-dataframe start` from the repository root.
The map draws a deterministic 20,000-row GeoArrow point table using deck.gl
binary position attributes. Change the minimum score, switch processing APIs,
or click a point to see its stable ID. The elapsed time shown is for CPU
processing, including filtering and radius projection.

## Bundle measurement

Run `yarn workspace math.gl-geoarrow-dataframe measure`. The script bundles
the same browser app three times with esbuild and production minification.
The SQL-only and DataFrame-only builds each import just their corresponding
processor. The combined build imports both. All three use identical data and
rendering code.

| Build | Workspace math.gl bytes | Total JavaScript bytes |
| --- | ---: | ---: |
| SQL only | 381,042 | 1,558,301 |
| DataFrame only | 365,031 | 1,553,240 |
| Combined | 395,417 | 1,583,903 |

For each workspace math.gl source file, the smaller byte contribution across
the two standalone builds counts toward shared bytes, and the larger toward
the union. The resulting **88.7% overlap** is 1.3 percentage points short of
90%. Of the DataFrame-only workspace math.gl bytes, **96.1%** are shared with
SQL. Adding DataFrame to the SQL app adds **14,375 workspace math.gl bytes**.

The percentages estimate source-module overlap from esbuild's emitted-byte
attribution. They vary with tree shaking and minification. The math.gl totals
cover this workspace's sources. The total JavaScript column also includes
deck.gl, Arrow, and third-party dependencies.
