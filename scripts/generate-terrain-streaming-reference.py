# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Generate 257x257 regional streaming inputs from pinned raw terrain tiles.
Requires rasterio==1.4.3 / GDAL 3.9.3; no math.gl code is used.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
import rasterio
from rasterio.enums import Resampling
from affine import Affine

assert rasterio.__version__ == '1.4.3' and rasterio.__gdal_version__ == '3.9.3'
folder = Path(__file__).resolve().parent.parent / 'modules/geospatial/test/terrain/fixtures'
hashes = {'sierra': 'cd6bb97ac25bda1c1b4f45bba3d0f9931fef2c805d85caa5a1c0a7f2f19a5a14', 'pacific': '6fd1a4d21ee745862bb4cc630612716c8d67f457fced523093e7b744dbd0f816'}
for name in ['sierra', 'pacific', 'sierra-nodata']:
    source_name = name.split('-')[0]
    source = folder / (source_name + '.tif')
    assert hashlib.sha256(source.read_bytes()).hexdigest() == hashes[source_name]
    with rasterio.open(source) as src:
        data = src.read(1, out_shape=(257, 257), masked=True, resampling=Resampling.nearest).astype('float64')
        transform = src.transform * Affine.scale(src.width / 257, src.height / 257)
        values = data.filled(np.nan)
        mask = 'original source validity'
        if name.endswith('-nodata'):
            values[96:161, 96:161] = np.nan
            values[::16, ::8] = np.nan
            mask += '; manufactured rows/columns 96:161 and every 16th row/8th column'
        record = {'source': 'https://s3.amazonaws.com/elevation-tiles-prod/geotiff/8/' + ('43' if source_name == 'sierra' else '40') + '/98.tif', 'sha256': hashes[source_name], 'gdalVersion': rasterio.__gdal_version__, 'rasterioVersion': rasterio.__version__, 'width': 257, 'height': 257, 'crs': 'EPSG:3857', 'registration': 'cell', 'heightReference': 'unknown', 'origin': [transform.c, transform.f], 'columnStep': [transform.a, transform.d], 'rowStep': [transform.b, transform.e], 'mask': mask, 'heights': [float(v) if np.isfinite(v) else None for v in values.flat]}
        (folder / (name + '-streaming.json')).write_text(json.dumps(record, separators=(',', ':'), allow_nan=False) + '\n')
        print('Generated', name, '257x257 streaming input')
