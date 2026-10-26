#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Audit unchanged native PROJ definitions, including rejected pole probes.

Run with pyproj==3.7.2 (PROJ 9.5.1). Network grids are disabled. Expectations
come exclusively from PROJ, including independent inverse evaluations.
"""
import hashlib
import json
import math
from pathlib import Path
import pyproj

ROOT = Path(__file__).resolve().parents[1] / 'test' / 'fixtures'
assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
source = ROOT / 'native-proj-cases.json'
cases = []
inputs = json.loads(source.read_text())['cases']
inputs += [
    {'id': 'ortho-issue-269', 'definition': '+proj=ortho +ellps=WGS84 +lat_0=-42 +lon_0=147', 'points': [[90, 30]]},
    {'id': 'ortho-scale', 'definition': '+proj=ortho +ellps=WGS84 +lat_0=42 +k_0=0.9 +x_0=123 +y_0=-456', 'points': [[30, 30], [0, 42], [-30, 60]]}
]
for origin in [-90, -42, 0, 42, 90]:
    for shape in ['+ellps=WGS84', '+R=6371000']:
        definition = f'+proj=ortho {shape} +lat_0={origin} +lon_0=10 +x_0=123 +y_0=-456'
        inputs.append({'id': f'ortho-audit-{origin}-{shape[1:]}', 'definition': definition,
                       'points': [[10 + d, lat] for d in [-89, -60, -30, 0, 30, 60, 89]
                                  for lat in [-90, -89.999999, -89.99, -60, -30, 0, 30, 60, 89.99, 89.999999, 90]]})
for case in inputs:
    definition = case['definition']
    algorithm = definition.split('+proj=')[1].split()[0]
    if algorithm in ['longlat', 'geocent', 'ob_tran']:
        continue
    operation = definition.replace('+proj=equi ', '+proj=eqc ').replace(' +iterations=1', '')
    if algorithm in ['utm', 'etmerc', 'eqdc', 'stere']:
        operation = case['oracle']
    transformer = pyproj.Transformer.from_pipeline(
        '+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step ' + operation)
    # Retain regional controls, then exact and near poles on three meridians.
    center = case['points'][0][0]
    points = [p[:2] for p in case['points']]
    points += [[lon, lat] for lon in [center - 30, center, center + 30]
               for lat in [-90, -89.999999, -89.99, 89.99, 89.999999, 90]]
    points = [list(p) for p in dict.fromkeys(tuple(p) for p in points) if abs(p[0]) <= 180]
    results = []
    for point in points:
        row = {'input': point}
        try:
            row['forward'] = list(transformer.transform(*point, errcheck=True))
            if not all(math.isfinite(v) for v in row['forward']):
                del row['forward']
                row['forwardRejected'] = True
        except pyproj.exceptions.ProjError:
            row['forwardRejected'] = True
        if 'forward' in row:
            try:
                row['inverse'] = list(transformer.transform(
                    *row['forward'], direction=pyproj.enums.TransformDirection.INVERSE, errcheck=True))
                if not all(math.isfinite(v) for v in row['inverse']):
                    del row['inverse']
                    row['inverseRejected'] = True
            except pyproj.exceptions.ProjError:
                row['inverseRejected'] = True
        results.append(row)
    cases.append({'id': case['id'], 'definition': definition, 'oracle': operation, 'results': results})

report = {'pyproj': pyproj.__version__, 'proj': pyproj.proj_version_str,
          'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'generatorSHA256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'cases': cases}
# Keep each probe on one line so the independent corpus remains reviewable.
header = {key: value for key, value in report.items() if key != 'cases'}
blocks = []
for case in cases:
    metadata = {key: value for key, value in case.items() if key != 'results'}
    prefix = json.dumps(metadata, indent=2, allow_nan=False)[:-2]
    rows = ',\n'.join('    ' + json.dumps(row, allow_nan=False) for row in case['results'])
    blocks.append('\n'.join('    ' + line for line in (prefix + ',\n  "results": [\n' + rows + '\n  ]\n}').splitlines()))
text = json.dumps(header, indent=2)[:-2] + ',\n  "cases": [\n' + ',\n'.join(blocks) + '\n  ]\n}\n'
(ROOT / 'pole-audit-reference.json').write_text(text)
print(len(cases), 'configurations;', sum(len(c['results']) for c in cases), 'probes')
