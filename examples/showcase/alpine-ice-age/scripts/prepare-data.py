# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Prepare a compact, attributed display asset from the published NetCDF simulation."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import netCDF4
import numpy as np
from pyproj import Transformer

SOURCE_URL = 'https://zenodo.org/records/7802275/files/alpcyc.2km.epic.pp.ex.1ka.nc'
SOURCE_MD5 = '0b59b7c26bb8d1b1797c9414638a2f32'
parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'data')
args = parser.parse_args()
source_bytes = args.source.read_bytes()
assert hashlib.md5(source_bytes).hexdigest() == SOURCE_MD5, 'Published source checksum mismatch'
with netCDF4.Dataset(args.source) as source:
    ages = np.abs(np.asarray(source['age'][:], dtype=float))
    assert np.all(np.diff(ages) == -1) and ages[-1] == 0
    ice = np.asarray(source['thk'][:].filled(0))
    bed = np.asarray(source['topg'][-1].filled(0))
    assert np.all(np.isfinite(ice)) and ice.min() >= 0 and ice.max() <= 65535
    assert np.all(np.isfinite(bed)) and bed.min() >= -32768 and bed.max() <= 32767
    # Sample alternate nodes, retaining original measured values (no invented margins).
    display_ice = np.rint(ice[:, ::2, ::2]).astype('<u2')
    display_bed = np.rint(bed[::2, ::2]).astype('<i2')
    y, x = np.asarray(source['y'][:]), np.asarray(source['x'][:])
    proj = source['mapping'].proj4
    transform = Transformer.from_crs('EPSG:4326', proj, always_xy=True)
    places = []
    for name, lon, lat in [('Geneva', 6.1432, 46.2044), ('Lyon', 4.8357, 45.7640), ('Bern', 7.4474, 46.9480), ('Zürich', 8.5417, 47.3769), ('Innsbruck', 11.4041, 47.2692), ('Turin', 7.6869, 45.0703), ('Milan', 9.19, 45.4642), ('Salzburg', 13.055, 47.8095), ('Rhône', 7.15, 46.25), ('Rhine', 9.45, 46.75)]:
        px, py = transform.transform(lon, lat)
        ix, iy = np.argmin(abs(x-px)), np.argmin(abs(y-py))
        places.append(dict(name=name, x=(px-(x[0]+x[-1])/2)/1000, y=(py-(y[0]+y[-1])/2)/1000, elevation=float(bed[iy, ix])))
    manifest = dict(width=display_bed.shape[1], height=display_bed.shape[0], spacingKm=4,
        ages=ages.tolist(), areaKm2=((ice > 10).sum(axis=(1, 2)) * 4).tolist(),
        volumeKm3=(ice.sum(axis=(1, 2), dtype=np.float64) * .004).tolist(), places=places,
        source=dict(url=SOURCE_URL, md5=SOURCE_MD5, sha256=hashlib.sha256(source_bytes).hexdigest(),
            doi='10.5281/zenodo.7802275', paper='10.5194/tc-12-3265-2018', author='Julien Seguinot and colleagues',
            license='CC-BY-4.0', model='PISM · EPICA forcing · palaeo-precipitation reduction', resolutionKm=2),
        display=dict(resolutionKm=4, thicknessUnit='metres', thicknessEncoding='uint16 little-endian',
            bedEncoding='int16 little-endian', bedAgeKa=0, interpolation='linear between 1 ka snapshots',
            areaThresholdMetres=10, terrain='Present-day model bedrock held fixed; isostatic bed changes are not animated'))
    args.output.mkdir(parents=True, exist_ok=True)
    raw = display_bed.tobytes() + display_ice.tobytes()
    packed = gzip.compress(raw, compresslevel=9, mtime=0)
    (args.output / 'alpine.bin.gz').write_bytes(packed)
    manifest['assetSha256'] = hashlib.sha256(packed).hexdigest()
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(f'{len(ages)} snapshots, {display_bed.shape}, {len(packed):,} packed bytes')
