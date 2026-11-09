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

## Mountain, coastal/bathymetric and nodata-heavy qualification

`sierra.tif` and `pacific.tif` are pinned Mapzen / AWS Terrain Tiles accessed
2026-11-09 from the [AWS open-data terrain registry](https://registry.opendata.aws/terrain-tiles/):

- [Sierra Nevada, 8/43/98](https://s3.amazonaws.com/elevation-tiles-prod/geotiff/8/43/98.tif), SHA-256 `cd6bb97ac25bda1c1b4f45bba3d0f9931fef2c805d85caa5a1c0a7f2f19a5a14`.
- [Northern California/Pacific coast, 8/40/98](https://s3.amazonaws.com/elevation-tiles-prod/geotiff/8/40/98.tif), SHA-256 `6fd1a4d21ee745862bb4cc630612716c8d67f457fced523093e7b744dbd0f816`.

Mapzen / AWS Terrain Tiles. United States 3DEP and global GMTED2010 and SRTM
terrain data courtesy of the U.S. Geological Survey. Global ETOPO1 terrain data:
DOC/NOAA/NESDIS/NCEI, National Centers for Environmental Information, NESDIS,
NOAA, U.S. Department of Commerce. These U.S. Government source materials are
public domain; see the [provider attribution and redistribution notes](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
No endorsement is implied. These fixtures are for numerical qualification, not navigation.

The raw tiles are retained unchanged. The `*-reference.json` derivatives resample
nearest-neighbor to 33×33 EPSG:3857 cell-registered grids and quantize to Int16
before independent GDAL 3.9.3 Horn/Zevenbergen–Thorne slope/aspect processing.
This qualifies the declared **projected metric** frame, not ground-distance or
vertical-datum accuracy. Height reference remains unknown. One center nodata sample
is declared in each; `sierra-nodata` additionally masks rows 8–24/columns 12–19 and
samples at every fifth row/third column. These masks are manufactured stress cases,
not missing data claimed in the original source.

Regenerate using rasterio 1.4.3 / GDAL 3.9.3:

```sh
python scripts/generate-terrain-regional-reference.py --fixture sierra
python scripts/generate-terrain-regional-reference.py --fixture pacific
python scripts/generate-terrain-regional-reference.py --fixture sierra-nodata
```

The generator verifies raw hashes and records all oracle values. Browser/Node tests
require no downloads or GDAL installation. Example assets are copies of the Sierra
and Pacific reference JSON; update those copies when regenerating the fixtures.
`node scripts/qualify-terrain-regional.mjs` runs isolated mesh cases and reports
warm timing, exact output buffer bytes, sampled JS allocations and OS peak RSS.
It distinguishes full regular meshes from complete 9×9 adaptive crops. Nodal error
and process-level memory observations are not continuous error certificates or
regional-scale throughput guarantees.

## Regional streaming inputs

The `sierra-streaming.json`, `pacific-streaming.json` and `sierra-nodata-streaming.json`
inputs retain 257×257 nearest-neighbor samples from the same hash-pinned raw TIFFs.
Regenerate with rasterio 1.4.3 / GDAL 3.9.3:

```sh
python scripts/generate-terrain-streaming-reference.py
```

The transform is scaled to the sampled raster extent, using EPSG:3857 projected
metric units and cell registration. The nodata-heavy variant declares a manufactured
65×65 central hole and periodic missing points (every 16th row/8th column); the two
unmasked variants retain raw-source validity. Provider credits and public-domain
source notes above apply. These larger inputs are streaming workload data; independent
GDAL derivative accuracy oracles remain the separate 33×33 reference fixtures.

`node scripts/qualify-terrain-streaming.mjs` exercises both derivative methods through
32 deterministic arrivals, edits, eviction and restoration steps over sixteen 65×65
patches. Samples are interpreted as vertices at their original cell-center coordinates.
Every persistent node/count is compared to a fresh flat hierarchy, and four retained
snapshots are hashed to detect mutation. Timings exclude the full-rebuild oracles and
snapshot hashing; memory reports include their process cost. No missing data is filled.
