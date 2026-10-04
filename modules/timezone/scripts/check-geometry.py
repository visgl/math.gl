# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Validate committed GeoJSON/GeoParquet assets and package exports."""
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq
from shapely import from_wkb
from shapely.geometry import Point, shape

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
manifest = json.loads((DATA / 'manifest.json').read_text())
package = json.loads((ROOT / 'package.json').read_text())
reference_ids = None
for level in ['low', 'hi']:
    collection = json.loads((DATA / f'timezone-geometry-{level}.json').read_text())
    assert collection['type'] == 'FeatureCollection'
    features = collection['features']
    ids = [feature['properties']['tzid'] for feature in features]
    assert len(ids) == len(set(ids)) == manifest['levels'][level]['features']
    if reference_ids is not None:
        assert ids == reference_ids
    reference_ids = ids
    geometries = []
    for feature in features:
        assert set(feature['properties']) == {'tzid'}
        assert feature['geometry']['type'] == 'MultiPolygon'
        geometry = shape(feature['geometry'])
        assert geometry.is_valid and not geometry.is_empty, feature['properties']['tzid']
        west, south, east, north = geometry.bounds
        assert -180 <= west <= east <= 180 and -90 <= south <= north <= 90
        geometries.append(geometry)
    table = pq.read_table(DATA / f'timezone-geometry-{level}.parquet')
    assert table.column_names == ['tzid', 'geometry']
    assert table.column('tzid').to_pylist() == ids
    geo = json.loads(table.schema.metadata[b'geo'])
    assert geo['version'] == '1.1.0' and geo['primary_column'] == 'geometry'
    assert geo['columns']['geometry']['encoding'] == 'WKB'
    assert geo['columns']['geometry']['geometry_types'] == ['MultiPolygon']
    for original, encoded in zip(geometries, table.column('geometry').to_pylist()):
        assert original.equals_exact(from_wkb(encoded), 0)
    for tzid, point in [('America/New_York', (-74.006, 40.7128)),
                        ('Europe/London', (-0.1276, 51.5072)),
                        ('Asia/Tokyo', (139.6917, 35.6895)),
                        ('Etc/GMT+10', (-150, 0))]:
        assert geometries[ids.index(tzid)].covers(Point(point)), (level, tzid)
    for extension in ['json', 'parquet']:
        name = f'timezone-geometry-{level}.{extension}'
        assert package['exports'][f'./{name}'] == f'./data/{name}'
        assert hashlib.sha256((DATA / name).read_bytes()).hexdigest() == manifest['levels'][level]['sha256'][name]
    print(f'{level}: {len(ids)} valid geometries, matching GeoParquet, exports and checksums')
