# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

"""Regenerate the independent DEM oracle. Requires rasterio==1.4.3 (GDAL 3.9.3).
GDALDEMProcessing is called through its C API; no math.gl implementation is used.
Pass --gdal-library for installations without rasterio's macOS bundled dylib.
"""
import argparse
import ctypes as C
import hashlib
import json
from pathlib import Path
import tempfile
import numpy as np
import rasterio
from affine import Affine
from rasterio.warp import calculate_default_transform, reproject, Resampling

parser = argparse.ArgumentParser()
parser.add_argument('--gdal-library')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
folder = root / 'modules/geospatial/test/terrain/fixtures'
source = folder / 'n43.dt0'
assert hashlib.sha256(source.read_bytes()).hexdigest() == '6fb965d94585ecb391f4b4194edd7bd9aad58c725e2cdbb376fd6f7c69688338', 'Unexpected source DEM'
assert rasterio.__gdal_version__ == '3.9.3', 'Pinned oracle requires GDAL 3.9.3'
library = args.gdal_library or str(next((Path(rasterio.__file__).parent / '.dylibs').glob('libgdal.*.dylib')))
gdal = C.CDLL(library)
gdal.GDALAllRegister()
gdal.GDALOpen.argtypes = [C.c_char_p, C.c_int]
gdal.GDALOpen.restype = C.c_void_p
gdal.GDALClose.argtypes = [C.c_void_p]
gdal.GDALDEMProcessingOptionsNew.argtypes = [C.POINTER(C.c_char_p), C.c_void_p]
gdal.GDALDEMProcessingOptionsNew.restype = C.c_void_p
gdal.GDALDEMProcessingOptionsFree.argtypes = [C.c_void_p]
gdal.GDALDEMProcessing.argtypes = [C.c_char_p, C.c_void_p, C.c_char_p, C.c_char_p, C.c_void_p, C.POINTER(C.c_int)]
gdal.GDALDEMProcessing.restype = C.c_void_p

def values(array, nodata):
    return [None if float(v) == nodata else float(v) for v in array.flat]

with rasterio.open(source) as src, tempfile.TemporaryDirectory() as tmp:
    transform, width, height = calculate_default_transform(src.crs, 'EPSG:32617', src.width, src.height, *src.bounds, dst_width=33, dst_height=33)
    # Square metric cells match GDAL 3.9 aspect's raster-axis convention.
    # This crops the projected bounding box along its longer dimension.
    resolution = min(abs(transform.a), abs(transform.e))
    transform = Affine(resolution, 0, transform.c, 0, -resolution, transform.f)
    terrain = np.full((height, width), -32767, dtype='float64')
    reproject(src.read(1), terrain, src_transform=src.transform, src_crs=src.crs, src_nodata=src.nodata, dst_transform=transform, dst_crs='EPSG:32617', dst_nodata=-32767, resampling=Resampling.nearest)
    # Nearest reprojection preserves the original integer elevations. Both
    # implementations receive identical heights without Float32 stencil cancellation.
    terrain = terrain.astype('int16')
    # Keep the real reprojection footprint and add one declared missing sample to exercise stencil masks.
    terrain[16, 16] = -32767
    input_path = str(Path(tmp) / 'projected.tif')
    with rasterio.open(input_path, 'w', driver='GTiff', width=width, height=height, count=1, dtype='int16', crs='EPSG:32617', transform=transform, nodata=-32767) as dst:
        dst.write(terrain, 1)
    dataset = gdal.GDALOpen(input_path.encode(), 0)
    assert dataset
    references = {}
    for algorithm in ['Horn', 'ZevenbergenThorne']:
        references[algorithm] = {}
        for product in ['slope', 'aspect']:
            options = ['-of', 'GTiff', '-alg', algorithm]
            if product == 'slope': options += ['-s', '1']
            argv = (C.c_char_p * (len(options) + 1))(*[v.encode() for v in options], None)
            opts = gdal.GDALDEMProcessingOptionsNew(argv, None)
            usage = C.c_int()
            output = str(Path(tmp) / f'{algorithm}-{product}.tif')
            result = gdal.GDALDEMProcessing(output.encode(), dataset, product.encode(), None, opts, C.byref(usage))
            assert result and not usage.value
            gdal.GDALClose(result)
            gdal.GDALDEMProcessingOptionsFree(opts)
            with rasterio.open(output) as raster:
                references[algorithm][product] = values(raster.read(1), raster.nodata)
    gdal.GDALClose(dataset)
    fixture = {'source': 'OSGeo/gdal@739fcf03bfcc075e300dbd45743187b380a17cdc/autotest/gdrivers/data/n43.dt0', 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'gdalVersion': rasterio.__gdal_version__, 'rasterioVersion': rasterio.__version__, 'crs': 'EPSG:32617', 'width': width, 'height': height, 'origin': [transform.c, transform.f], 'columnStep': [transform.a, transform.d], 'rowStep': [transform.b, transform.e], 'registration': 'cell', 'heightReference': 'unknown', 'heights': values(terrain, -32767), 'references': references}
    (folder / 'n43-reference.json').write_text(json.dumps(fixture, separators=(',', ':'), allow_nan=False) + '\n')
print('Generated independent GDAL slope/aspect oracle from pinned DTED DEM.')
