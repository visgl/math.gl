# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Regenerate with independent pyproj / PROJ; no PROJ runtime dependency ships."""
import json
import pyproj
assert pyproj.__version__ == "3.7.2"
pyproj.network.set_network_enabled(False)
from pathlib import Path
cases = []
for lon, lat, alpha in [(180, -17, 35), (170, -25, -20), (-60, 35, 60)]:
    definition = f'+proj=omerc +lat_0={lat} +lonc={lon} +alpha={alpha} +gamma=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
    points = [[lon - 10, lat - 5], [lon + 10, lat + 5], [lon, lat]]
    projection = pyproj.Proj(definition)
    output = [list(projection(*point, errcheck=True)) for point in points]
    cases.append(dict(center=[lon, lat], alpha=alpha, points=points, projected=output))
Path(__file__).with_name('reference.json').write_text(json.dumps({'generator': f'pyproj {pyproj.__version__} / PROJ {pyproj.proj_version_str}; offline', 'cases': cases}, indent=2)+'\n')
