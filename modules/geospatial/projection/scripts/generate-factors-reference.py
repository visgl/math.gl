#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original independent factor configurations; only numeric PROJ output is retained.
"""Pinned offline PROJ cartographic factors and analytic derivative expectations."""
import argparse
import hashlib
import json
from pathlib import Path
import pyproj

assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
FIELDS = dict(meridionalScale='meridional_scale', parallelScale='parallel_scale',
              arealScale='areal_scale', meridianConvergence='meridian_convergence',
              meridianParallelAngle='meridian_parallel_angle', angularDistortion='angular_distortion',
              maximumScale='tissot_semimajor', minimumScale='tissot_semiminor',
              dxDLongitude='dx_dlam', dxDLatitude='dx_dphi', dyDLongitude='dy_dlam', dyDLatitude='dy_dphi')
CONFIGS = [
    '+proj=merc +ellps=WGS84 +k_0=0.97 +x_0=100 +y_0=200',
    '+proj=merc +R=6371000',
    '+proj=eqc +R=6371000 +lat_ts=30',
    '+proj=cea +ellps=WGS84 +lat_ts=30',
    '+proj=utm +zone=31 +ellps=WGS84',
    '+proj=tmerc +ellps=WGS84 +lon_0=3 +k_0=0.9996',
    '+proj=etmerc +ellps=WGS84 +lon_0=3 +k_0=0.9996',
    '+proj=lcc +ellps=WGS84 +lat_1=30 +lat_2=60',
    '+proj=aea +ellps=WGS84 +lat_1=30 +lat_2=60',
    '+proj=eqdc +ellps=WGS84 +lat_1=30 +lat_2=60',
    '+proj=stere +ellps=WGS84 +lat_0=90',
    '+proj=laea +ellps=WGS84 +lat_0=40',
    '+proj=aeqd +ellps=WGS84 +lat_0=90',
    '+proj=aeqd +ellps=WGS84 +lat_0=-90',
    '+proj=aeqd +ellps=WGS84 +lat_0=40',
    '+proj=eqearth +ellps=WGS84',
    '+proj=sinu +ellps=WGS84',
    '+proj=moll +R=6371000',
]

def generate():
    rows = []
    for definition in CONFIGS:
        projection = pyproj.Proj(definition)
        a = projection.crs.ellipsoid.semi_major_metre
        results = []
        for longitude in [-3, 0, 3, 6, 9]:
            for latitude in [-60, -20, 20, 40, 60]:
                f = projection.get_factors(longitude, latitude, errcheck=True)
                values = {name: getattr(f, field) for name, field in FIELDS.items()}
                for name in values:
                    if name.startswith(('dxD', 'dyD')): values[name] *= a
                    elif name in ['meridianConvergence', 'meridianParallelAngle', 'angularDistortion']:
                        values[name] *= 3.141592653589793 / 180
                results.append(dict(input=[longitude, latitude], factors=values))
        rows.append(dict(definition=definition, results=results))
    return dict(provenance=dict(pyproj=pyproj.__version__, proj=pyproj.proj_version_str,
                  generatorSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  method='Original configurations; offline PROJ get_factors. Jacobians converted to metres/radian, angles to radians. No implementation code or model data copied.'), cases=rows)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    target = Path(__file__).resolve().parents[1] / 'test/fixtures/factors-reference.json'
    text = json.dumps(generate(), indent=2, allow_nan=False) + '\n'
    if args.check:
        assert target.read_text() == text, 'Regenerate factors reference'
    else:
        target.write_text(text)
    print('450 independent factors, PROJ 9.5.1')
