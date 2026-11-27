#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Independent offline geodesic references from pinned native PROJ, not GeographicLib JS."""
import json
from pathlib import Path
import pyproj
assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
cases = []
for a, b in [(6378137, 6356752.314245179), (6371000, 6371000)]:
    geod = pyproj.Geod(a=a, b=b)
    for lat1, lon1, lat2, lon2 in [(0,0,0,0),(0,0,0,180),(0,0,0.00001,179.99999),(90,0,-89.9,100),(-90,20,89.9,-100),(40,-75,35,140),(89.999999,179,-30,-179),(-60,-170,70,175),(40,10,41,11)]:
        azi1, back, distance = geod.inv(lon1, lat1, lon2, lat2)
        cases.append(dict(axes=dict(semiMajorAxis=a,semiMinorAxis=b),start=[lat1,lon1],end=[lat2,lon2],azimuth=azi1,distance=distance))
out = Path(__file__).resolve().parents[2] / 'test/ellipsoid/geodesic-reference.json'
out.write_text(json.dumps(dict(oracle='pyproj 3.7.2 / PROJ 9.5.1 (offline)',cases=cases),indent=2)+'\n')
