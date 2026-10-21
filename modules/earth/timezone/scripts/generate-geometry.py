# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Generate optional geometry assets. See data/README.md for prerequisites."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import urllib.request
import zipfile

import pyarrow as pa
import pyarrow.parquet as pq
from shapely import make_valid, to_wkb
from shapely.geometry import MultiPolygon, mapping, shape

VERSION = '2026d'
URL = f'https://github.com/evansiroky/timezone-boundary-builder/releases/download/{VERSION}/timezones-with-oceans.geojson.zip'
SHA256 = 'e391c92c7b90339c3afe8558082b4532b8d9afc9daad68da31f4569a1ca61034'
DATA = Path(__file__).resolve().parents[1] / 'data'


def polygons(geometry):
    if geometry.geom_type == 'Polygon':
        return [geometry]
    if hasattr(geometry, 'geoms'):
        return [polygon for part in geometry.geoms for polygon in polygons(part)]
    return []


def write_assets(level, interval, input_path):
    output = DATA / f'timezone-geometry-{level}.json'
    subprocess.run([args.mapshaper, str(input_path), '-simplify', 'dp',
                    f'interval={interval}', 'keep-shapes', '-o', 'force',
                    'format=geojson', 'precision=0.00001', str(output)], check=True)
    collection = json.loads(output.read_text())
    features = sorted(collection['features'], key=lambda feature: feature['properties']['tzid'])
    ids, geometries = [], []
    repaired = []
    for feature in features:
        tzid = feature['properties']['tzid']
        geometry = shape(feature['geometry'])
        if not geometry.is_valid:
            geometry = make_valid(geometry)
            repaired.append(tzid)
        geometry = MultiPolygon(polygons(geometry))
        assert geometry.is_valid and not geometry.is_empty, tzid
        feature['properties'] = {'tzid': tzid}
        feature['geometry'] = mapping(geometry)
        ids.append(tzid)
        geometries.append(geometry)
    assert len(ids) == len(set(ids))
    collection = {'type': 'FeatureCollection', 'features': features}
    output.write_text(json.dumps(collection, separators=(',', ':')) + '\n')
    geo = {'version': '1.1.0', 'primary_column': 'geometry', 'columns': {
        'geometry': {'encoding': 'WKB', 'geometry_types': ['MultiPolygon'],
                     'bbox': [-180, -90, 180, 90], 'edges': 'planar'}}}
    # Omitted CRS means OGC:CRS84 (longitude, latitude) in GeoParquet.
    table = pa.table({'tzid': pa.array(ids, type=pa.string()),
                      'geometry': pa.array([to_wkb(g, byte_order=1) for g in geometries], type=pa.binary())})
    table = table.replace_schema_metadata({b'geo': json.dumps(geo).encode()})
    parquet_path = output.with_suffix('.parquet')
    pq.write_table(table, parquet_path, compression='zstd', version='2.6')
    restored = pq.read_table(parquet_path)
    assert restored.column('tzid').to_pylist() == ids
    assert restored.column('geometry').to_pylist() == table.column('geometry').to_pylist()
    return {'intervalMeters': interval, 'features': len(features), 'repaired': repaired,
            'jsonBytes': output.stat().st_size,
            'jsonGzipBytes': len(gzip.compress(output.read_bytes(), mtime=0)),
            'parquetBytes': parquet_path.stat().st_size,
            'sha256': {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                       for path in [output, parquet_path]}}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, help='Use a previously downloaded upstream ZIP')
    parser.add_argument('--mapshaper', default='mapshaper')
    args = parser.parse_args()
    DATA.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as directory:
        archive = args.archive or Path(directory) / 'source.zip'
        if not args.archive:
            urllib.request.urlretrieve(URL, archive)
        assert hashlib.sha256(archive.read_bytes()).hexdigest() == SHA256, 'Unexpected source checksum'
        with zipfile.ZipFile(archive) as source:
            input_path = Path(directory) / 'source.json'
            input_path.write_bytes(source.read('combined-with-oceans.json'))
        manifest = {'source': URL, 'version': VERSION, 'sourceSha256': SHA256,
                    'license': 'ODbL-1.0', 'mapshaperVersion': '0.6.113',
                    'levels': {level: write_assets(level, interval, input_path)
                               for level, interval in [('low', 20000), ('hi', 1000)]}}
    (DATA / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest['levels'], indent=2))
