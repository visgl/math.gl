# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Pack the corrected PaleoMIST 1-degree minimal MIS 3 reconstruction."""
import argparse, gzip, hashlib, json
from pathlib import Path
import netCDF4
import numpy as np
SHA = 'ab6f74541339f5be44dd630dfb9c41189a6c1dfaf58fce6fc3c356430b539037'
p = argparse.ArgumentParser()
p.add_argument('source', type=Path)
p.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'data')
a = p.parse_args()
assert hashlib.sha256(a.source.read_bytes()).hexdigest() == SHA
with netCDF4.Dataset(a.source) as n:
    ages = -np.asarray(n['time'][:])/1000
    assert np.array_equal(ages, np.arange(80,-.1,-2.5))
    assert np.array_equal(n['lon'][:], np.arange(-180,181))
    assert np.array_equal(n['lat'][:], np.arange(-90,91))
    ice = np.asarray(n['ice_thickness'][:])
    bed = np.asarray(n['base_topography'][:])
    assert np.isfinite(ice).all() and np.isfinite(bed).all()
    assert ice.min() > -0.1 and ice.max() < 65535
    assert bed.min() > -32768 and bed.max() < 32767
    # Small negative interpolation artifacts are zero ice. Drop the repeated seam column.
    ice = np.maximum(0, ice[:,:,:360])
    bed = bed[:,:,:360]
    lat = np.arange(-90,91)
    area = 6371.0088**2 * np.deg2rad(1) * (np.sin(np.deg2rad(np.minimum(90,lat+.5))) - np.sin(np.deg2rad(np.maximum(-90,lat-.5))))
    areas = ((ice>10)*area[None,:,None]).sum(axis=(1,2))
    volumes = (ice*area[None,:,None]/1000).sum(axis=(1,2))
    packed = gzip.compress(np.rint(bed).astype('<i2').tobytes() + np.rint(ice).astype('<u2').tobytes(), compresslevel=9, mtime=0)
    manifest = dict(width=360,height=181,ages=np.abs(ages).tolist(),longitudeMin=-180,latitudeMin=-90,spacingDegrees=1,areaKm2=areas.tolist(),volumeKm3=volumes.tolist(),assetSha256=hashlib.sha256(packed).hexdigest(),source=dict(title='PaleoMIST 1.0, corrected April 2021 geographical grids, minimal MIS 3 scenario',url='https://doi.pangaea.de/10.1594/PANGAEA.905800',archiveUrl='https://hs.pangaea.de/Maps/Global_Ice_Sheets/Gowan_ice_reconstruction.zip',archiveEntry='ice_reconstruction/global_grid/reconstruction_1_degree.nc',sha256=SHA,license='CC-BY-4.0',study='https://doi.org/10.1038/s41467-021-21469-w'))
    a.output.mkdir(parents=True,exist_ok=True)
    (a.output/'global.bin.gz').write_bytes(packed)
    (a.output/'global-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(len(packed),areas.max(),volumes.max())
