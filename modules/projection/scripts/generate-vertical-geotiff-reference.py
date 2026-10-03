# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original tiny TIFF fixture encoder and independent PROJ oracle; no upstream code/data copied.
import hashlib
import json
from pathlib import Path
import struct
import zlib

import pyproj
from pyproj.enums import TransformDirection

assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
root = Path(__file__).resolve().parent.parent / 'test' / 'fixtures'
source = root / 'vertical-geotiff-cases.json'
inputs = json.loads(source.read_text())
directory = root / 'vertical-geotiff'
directory.mkdir(exist_ok=True)
sha = lambda data: hashlib.sha256(data).hexdigest()


def encode_image(image, start, endian, last):
    width, height = image['size']
    dx, dy = image['step']
    west, south = image['origin']
    raster_type = image.get('rasterType', 2)
    half = 0.5 if raster_type == 1 else 0
    i, j = image.get('tiepointIndex', [0, 0])
    x, y = west + (i - half) * dx, south + (height - 1 + half - j) * dy
    signed = image.get('sampleType') == 'int16'
    pack = lambda fmt, *args: struct.pack(endian + fmt, *args)
    metadata = '<GDALMetadata><Item name="TYPE">VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL</Item>'
    metadata += '<Item name="DESCRIPTION" sample="0" role="description">geoid_undulation</Item>'
    metadata += '<Item name="UNITTYPE" sample="0" role="unittype">metre</Item>'
    for name, role in [('SCALE', 'scale'), ('OFFSET', 'offset')]:
        if role in image:
            metadata += f'<Item name="{name}" sample="0" role="{role}">{image[role]}</Item>'
    metadata += '</GDALMetadata>\0'
    keys = [1, 1, 0, 4, 1024, 0, 1, 2, 1025, 0, 1, raster_type,
            2048, 0, 1, 4326, 2054, 0, 1, 9102]
    values = [value for row in reversed(range(height))
              for value in image['values'][row * width:(row + 1) * width]]
    pixels = pack(('h' if signed else 'f') * len(values), *values)
    compressed = image.get('compression', False)
    if compressed:
        pixels = zlib.compress(pixels, 9)
    # (tag, TIFF field type, count, payload), all standard TIFF/GeoTIFF tags.
    tags = [(256, 4, 1, pack('I', width)), (257, 4, 1, pack('I', height)),
            (258, 3, 1, pack('H', 16 if signed else 32)),
            (259, 3, 1, pack('H', 8 if compressed else 1)), (262, 3, 1, pack('H', 1)),
            (273, 4, 1, b'\0' * 4), (277, 3, 1, pack('H', 1)),
            (278, 4, 1, pack('I', height)), (279, 4, 1, pack('I', len(pixels))),
            (284, 3, 1, pack('H', 1)), (339, 3, 1, pack('H', 2 if signed else 3)),
            (33550, 12, 3, pack('ddd', dx, dy, 0)),
            (33922, 12, 6, pack('dddddd', i, j, 0, x, y, 0)),
            (34735, 3, len(keys), pack('H' * len(keys), *keys)),
            (42112, 2, len(metadata), metadata.encode())]
    if 'noData' in image:
        nodata = (str(image['noData']) + '\0').encode()
        tags.append((42113, 2, len(nodata), nodata))
    tags.sort()
    payload_start = start + 2 + 12 * len(tags) + 4
    payload = bytearray()
    entries = []
    for tag, kind, count, value in tags:
        if len(value) > 4:
            pointer = payload_start + len(payload)
            payload.extend(value)
            if len(payload) % 2:
                payload.append(0)
            value = pack('I', pointer)
        entries.append((tag, pack('HHI', tag, kind, count), value.ljust(4, b'\0')))
    pixels_start = payload_start + len(payload)
    payload.extend(pixels)
    if len(payload) % 2:
        payload.append(0)
    end = payload_start + len(payload)
    result = pack('H', len(tags))
    for tag, header, value in entries:
        result += header + (pack('I', pixels_start) if tag == 273 else value)
    return result + pack('I', 0 if last else end) + payload


reference = dict(pyproj=pyproj.__version__, proj=pyproj.proj_version_str,
                 source=source.name, sourceSHA256=sha(source.read_bytes()),
                 generatorSHA256=sha(Path(__file__).read_bytes()), cases=[])
for case in inputs['cases']:
    little = case.get('littleEndian', True)
    endian = '<' if little else '>'
    data = (b'II' if little else b'MM') + struct.pack(endian + 'HI', 42, 8)
    for index, image in enumerate(case['images']):
        data += encode_image(image, len(data), endian, index == len(case['images']) - 1)
    path = directory / (case['id'] + '.tif')
    path.write_bytes(data)
    pipeline = ('+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad '
                f'+step +proj=vgridshift +multiplier=1 +grids={path} '
                '+step +proj=unitconvert +xy_in=rad +xy_out=deg')
    transform = pyproj.Transformer.from_pipeline(pipeline)
    rows = []
    for point in case['points']:
        forward = list(transform.transform(*point, errcheck=True))
        inverse = list(transform.transform(*forward, direction=TransformDirection.INVERSE, errcheck=True))
        rows.append(dict(input=point, forward=forward, inverse=inverse))
    reference['cases'].append(dict(id=case['id'], file='vertical-geotiff/' + path.name,
                                   sha256=sha(data), results=rows))
(root / 'vertical-geotiff-reference.json').write_text(json.dumps(reference, indent=2) + '\n')
print('Generated', len(reference['cases']), 'independent vertical GeoTIFF cases')
