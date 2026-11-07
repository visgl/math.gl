# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Regenerate with pyproj==3.6.1 / PROJ 9.3.0; network is disabled."""
import json
import math
from pathlib import Path
import pyproj
assert pyproj.__version__ == '3.6.1' and pyproj.proj_version_str == '9.3.0'
pyproj.network.set_network_enabled(False)
result = {'oracle': 'pyproj 3.6.1 / PROJ 9.3.0; always_xy; network disabled', 'cases': []}
for name, crs, bounds, angle, center in [
    ('antarctica', 'EPSG:3031', [-4000000, -4000000, 4000000, 4000000], 0, [0, 0]),
    ('rotated-polar', 'EPSG:3031', [-4000000, -4000000, 4000000, 4000000], .4, [0, 0]),
    ('utm60', 'EPSG:32660', [400000, 0, 900000, 1000000], 0, [0, 0]),
    ('fiji', 'EPSG:4326', [-35, -20, 35, 20], math.pi / 6, [180, -15])
]:
    transformer = pyproj.Transformer.from_crs(crs, 'EPSG:4326', always_xy=True)
    points = []
    for u in [.03, .2, .4, .5, .6, .8, .97]:
        for v in [.03, .2, .4, .5, .6, .8, .97]:
            x = bounds[0] + u * (bounds[2] - bounds[0])
            y = bounds[1] + v * (bounds[3] - bounds[1])
            xy = [math.cos(angle)*x-math.sin(angle)*y+center[0], math.sin(angle)*x+math.cos(angle)*y+center[1]]
            points.append({'pixel': [u*256, v*256], 'coordinate': xy, 'geographic': list(transformer.transform(*xy, errcheck=True))})
    result['cases'].append({'id': name, 'crs': crs, 'points': points})
Path(__file__).with_name('reference.json').write_text(json.dumps(result, indent=2) + '\n')
