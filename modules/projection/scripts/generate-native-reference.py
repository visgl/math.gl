#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# Copyright (c) vis.gl contributors
# Original test tooling for the proj4js-inspired API; no proj4js numeric output is used.
"""Regenerate offline reference coordinates with pyproj 3.7.2 / PROJ 9.5.1.

Install pyproj==3.7.2 in a separate virtual environment. Neither Python nor PROJ is
needed by CI or the package. See test/fixtures/README.md for provenance and limits.
Unexpected oracle failures abort generation; never derive expected values from math.gl.
"""
import hashlib
import json
from pathlib import Path

import pyproj

ROOT = Path(__file__).resolve().parents[1] / 'test' / 'fixtures'
assert pyproj.__version__ == '3.7.2', 'Use the pinned pyproj version'
assert pyproj.proj_version_str == '9.5.1', 'Use the pinned native PROJ version'
assert pyproj.database.get_database_metadata('EPSG.VERSION') == 'v11.022', 'Use the pinned EPSG database'
pyproj.network.set_network_enabled(False)


def read_json(name):
    return json.loads((ROOT / name).read_text())


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pipeline(operation):
    return pyproj.Transformer.from_pipeline(
        '+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad '
        '+step ' + operation
    )


def samples(transformer, points):
    rows = []
    for point in points:
        forward = list(transformer.transform(*point, errcheck=True))
        inverse = list(transformer.transform(
            *forward, direction=pyproj.enums.TransformDirection.INVERSE, errcheck=True
        ))
        rows.append({'input': point, 'forward': forward, 'inverse': inverse})
    return rows


def write_reference(name, source, cases):
    value = {
        'pyproj': pyproj.__version__, 'proj': pyproj.proj_version_str,
        'epsgVersion': pyproj.database.get_database_metadata('EPSG.VERSION'),
        'source': source, 'sourceSHA256': sha256(ROOT / source),
        'generatorSHA256': sha256(Path(__file__)), 'cases': cases
    }
    (ROOT / name).write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')
    print(name, len(cases), 'configurations', sum(len(c['results']) for c in cases), 'points')


cases = []
for case in read_json('native-proj-cases.json')['cases']:
    operation = case['oracle']
    if '+proj=longlat ' in operation:
        operation += ' +step +proj=unitconvert +xy_in=rad +xy_out=deg'
    # A pipeline prevents pyproj CRS serialization from rewriting spherical TM to UTM.
    results = samples(pipeline(operation), case['points'])
    cases.append({'id': case['id'], 'results': results})
write_reference('native-proj-reference.json', 'native-proj-cases.json', cases)

cases = []
for grid in read_json('real-grid-cases.json')['grids']:
    path = ROOT / 'real-grids' / grid['file']
    assert sha256(path) == grid['sha256'], 'Grid bytes differ from the pinned source'
    operation = '+proj=hgridshift +grids=' + str(path)
    operation += ' +step +proj=unitconvert +xy_in=rad +xy_out=deg'
    transformer = pipeline(operation)
    results = samples(transformer, grid['points'])
    boundary_inverse = [
        {'input': point, 'inverse': list(transformer.transform(
            *point, direction=pyproj.enums.TransformDirection.INVERSE, errcheck=True
        ))} for point in grid['inverseBoundaryPoints']
    ]
    cases.append({'id': grid['id'], 'gridSHA256': grid['sha256'],
                  'results': results, 'boundaryInverse': boundary_inverse})
write_reference('real-grid-reference.json', 'real-grid-cases.json', cases)

# EPSG definitions exercise the shared CRS readers; only the conversion from the
# CRS's own geodetic base is selected, so this is not an implicit datum operation.
cases = []
for case in read_json('structured-proj-cases.json')['cases']:
    crs = pyproj.CRS.from_epsg(case['epsg'])
    transformer = pyproj.Transformer.from_crs(crs.geodetic_crs, crs, always_xy=True)
    cases.append({'id': case['id'], 'projjson': crs.to_json_dict(),
                  'wkt2': crs.to_wkt('WKT2_2019'), 'wkt1': crs.to_wkt('WKT1_GDAL'),
                  'esri': crs.to_wkt('WKT1_ESRI'),
                  'results': samples(transformer, case['points'])})
write_reference('structured-proj-reference.json', 'structured-proj-cases.json', cases)

cases = []
for case in read_json('datum-proj-cases.json')['cases']:
    transformer = pyproj.Transformer.from_pipeline('+proj=pipeline +step ' + case['pipeline'])
    cases.append({'id': case['id'], 'results': samples(transformer, case['points'])})
write_reference('datum-proj-reference.json', 'datum-proj-cases.json', cases)
