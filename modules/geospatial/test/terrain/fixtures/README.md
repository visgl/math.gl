{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# Independent DEM qualification fixture

`n43.dt0` is the unmodified 121 × 121 DTED elevation sample from
[GDAL's test corpus at commit 739fcf03bfcc075e300dbd45743187b380a17cdc](https://github.com/OSGeo/gdal/blob/739fcf03bfcc075e300dbd45743187b380a17cdc/autotest/gdrivers/data/n43.dt0).
The source covers 79–80°W, 43–44°N, with elevations 75–460 meters. Its vertical
reference is deliberately left unknown in these tests.

SHA-256: `6fb965d94585ecb391f4b4194edd7bd9aad58c725e2cdbb376fd6f7c69688338`.

GDAL's [test-data availability statement](https://github.com/OSGeo/gdal/blob/739fcf03bfcc075e300dbd45743187b380a17cdc/autotest/README.md#notes-about-availability-of-gdal-sample-and-test-data)
identifies the corpus as public, freely redistributable geodata. The file is retained
with this provenance rather than relabeled as math.gl-authored data. Test fixtures
are not part of the geospatial runtime package.

`n43-reference.json` is generated independently of math.gl by
`scripts/generate-terrain-dem-reference.py`, using rasterio 1.4.3 / GDAL 3.9.3.
Generation verifies the source hash. It reprojects nearest-neighbor to a 33 × 33
square-cell UTM 17N grid, cropping the longer projected bounding-box dimension.
Nearest resampling retains the original integer elevations. A declared missing
sample at row/column 16 supplements missing pixels along the reprojected footprint.
No terrain filling or vertical datum conversion is performed.

The oracle calls GDALDEMProcessing through the GDAL C API for Horn and
Zevenbergen–Thorne slope and aspect, without edge extrapolation. Square metric cells
match GDAL 3.9's raster-axis aspect convention. Identical Int16 input avoids GDAL's
Float32 input/stencil cancellation becoming an untracked error source.

Tests compare every output validity flag, slope in degrees (2e-6° absolute tolerance),
and circular downhill aspect (4e-5° tolerance). These allow Float32 reference output
rounding and transcendental arithmetic, not changes in nodata policy. The same DEM
also exercises adaptive mesh nodal errors using an exhaustive barycentric oracle,
and same-level tile seams. These are sample-error checks, not continuous-surface
error certificates. This low-relief regional fixture does not qualify mountainous,
coastal, bathymetric or global terrain performance.

Regenerate in a temporary Python environment:

```sh
python3 -m venv /tmp/terrain-gdal
/tmp/terrain-gdal/bin/pip install rasterio==1.4.3
/tmp/terrain-gdal/bin/python scripts/generate-terrain-dem-reference.py
```

The default library discovery supports the macOS rasterio wheel. On other systems,
pass `--gdal-library /absolute/path/to/the/same/libgdal` and use GDAL 3.9.3.
Normal Node/browser tests read the committed JSON and need no Python or GDAL install.
