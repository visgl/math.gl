#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original seeded validation tooling for the proj4js-inspired projection API.
"""Generate independent samples using pinned pyproj 3.7.2 / PROJ 9.5.1, offline.

Half the seeded probes are uniform, half approach a domain edge logarithmically.
Never discard oracle errors or derive expectations from math.gl or proj4js.
"""
import hashlib
import json
from pathlib import Path
import pyproj

ROOT = Path(__file__).resolve().parents[1] / 'test' / 'fixtures'
assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
assert pyproj.database.get_database_metadata('EPSG.VERSION') == 'v11.022'
pyproj.network.set_network_enabled(False)
source = ROOT / 'accuracy-cases.json'
inputs = json.loads(source.read_text())
state = inputs['seed']


def random():
    global state
    state = (1664525 * state + 1013904223) & 0xffffffff
    return state / 4294967296


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


cases = []
for fixture in inputs['cases']:
    b = fixture['bounds']
    west, east, south, north = [b[k] for k in ['west', 'east', 'south', 'north']]
    # Exact corners, edge midpoints, centre and explicitly authored regressions.
    points = [[x, y] for x in [west, (west + east) / 2, east]
              for y in [south, (south + north) / 2, north]] + fixture['probes']
    for index in range(inputs['randomPoints']):
        u, v = random(), random()
        if index % 2:
            edge = index % 8 // 2
            distance = 10 ** (-2 - 8 * random())
            if edge == 0: u = distance
            elif edge == 1: u = 1 - distance
            elif edge == 2: v = distance
            else: v = 1 - distance
        points.append([west + (east - west) * u, south + (north - south) * v])
    transformer = pyproj.Transformer.from_pipeline(
        '+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step ' + fixture['oracle'])
    results = []
    for point in points:
        forward = list(transformer.transform(*point, errcheck=True))
        inverse = list(transformer.transform(*forward, direction=pyproj.enums.TransformDirection.INVERSE, errcheck=True))
        results.append({'input': point, 'forward': forward, 'inverse': inverse})
    cases.append({'id': fixture['id'], 'results': results})
report = {'pyproj': pyproj.__version__, 'proj': pyproj.proj_version_str,
          'epsgVersion': 'v11.022', 'source': source.name, 'sourceSHA256': sha(source),
          'generatorSHA256': sha(Path(__file__)), 'cases': cases}
(ROOT / 'accuracy-reference.json').write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
print(len(cases), 'domains;', sum(len(c['results']) for c in cases), 'independent points')
