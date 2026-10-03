# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original synthetic test grid encoder; numeric oracle is native PROJ, not math.gl.
import hashlib
import json
import struct
from pathlib import Path
import pyproj
from pyproj.enums import TransformDirection
assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
root = Path(__file__).resolve().parent.parent / 'test' / 'fixtures'
source = root / 'deformation-cases.json'
inputs = json.loads(source.read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
grid = root / inputs['model']['file']
# Original, tiny three-band Float32 TIFF encoder. No upstream code/data copied.
def encode_velocity_grid(geometry):
    width, height = geometry['size']
    west, south = geometry['origin']
    dx, dy = geometry['step']
    pack = lambda fmt, *args: struct.pack('<' + fmt, *args)
    metadata = '<GDALMetadata><Item name="TYPE">VELOCITY</Item>'
    for sample, name in enumerate(['east_velocity', 'north_velocity', 'up_velocity']):
        metadata += f'<Item name="DESCRIPTION" sample="{sample}" role="description">{name}</Item>'
        metadata += f'<Item name="UNITTYPE" sample="{sample}" role="unittype">millimetres per year</Item>'
    metadata = (metadata + '</GDALMetadata>\0').encode()
    keys = [1, 1, 0, 4, 1024, 0, 1, 2, 1025, 0, 1, 2, 2048, 0, 1, 4258, 2054, 0, 1, 9102]
    values = []
    for row in reversed(range(height)):
        for col in range(width):
            values.extend([-12 + 0.3 * col + 0.5 * row, 2 - 0.2 * col + 0.7 * row, 3 + 2 * row - 0.1 * col])
    pixels = pack('f' * len(values), *values)
    tags = [(256, 4, 1, pack('I', width)), (257, 4, 1, pack('I', height)),
            (258, 3, 3, pack('HHH', 32, 32, 32)), (259, 3, 1, pack('H', 1)),
            (262, 3, 1, pack('H', 1)), (273, 4, 1, bytes(4)), (277, 3, 1, pack('H', 3)),
            (278, 4, 1, pack('I', height)), (279, 4, 1, pack('I', len(pixels))),
            (284, 3, 1, pack('H', 1)), (338, 3, 2, pack('HH', 0, 0)),
            (339, 3, 3, pack('HHH', 3, 3, 3)), (33550, 12, 3, pack('ddd', dx, dy, 0)),
            (33922, 12, 6, pack('dddddd', 0, 0, 0, west, south + (height - 1) * dy, 0)),
            (34735, 3, len(keys), pack('H' * len(keys), *keys)), (42112, 2, len(metadata), metadata)]
    tags.sort()
    start = 8 + 2 + 12 * len(tags) + 4
    payload, entries = bytearray(), []
    for tag, kind, count, value in tags:
        if len(value) > 4:
            pointer = start + len(payload)
            payload.extend(value)
            if len(payload) % 2:
                payload.append(0)
            value = pack('I', pointer)
        entries.append([tag, pack('HHI', tag, kind, count), value.ljust(4, b'\0')])
    pointer = start + len(payload)
    for entry in entries:
        if entry[0] == 273:
            entry[2] = pack('I', pointer)
    return b'II' + pack('HI', 42, 8) + pack('H', len(tags)) + b''.join(e[1] + e[2] for e in entries) + bytes(4) + payload + pixels
grid.parent.mkdir(exist_ok=True)
grid.write_bytes(encode_velocity_grid(inputs['model']['grid']))
reference = dict(pyproj=pyproj.__version__, proj=pyproj.proj_version_str,
                 source=source.name, sourceSHA256=sha(source.read_bytes()),
                 generatorSHA256=sha(Path(__file__).read_bytes()),
                 gridSHA256=sha(grid.read_bytes()), cases=[])
cart = pyproj.Transformer.from_pipeline('+proj=cart +ellps=GRS80')
reference['inverseOracle'] = 'Fixed-point inversion of native PROJ forward, ECEF residual <= 1e-8 metre; legacy PROJ inverse retained separately'
def solve(transform, point):
    guess = list(point)
    for iteration in range(32):
        mapped = transform.transform(*guess, errcheck=True)
        candidate = [point[i] - (mapped[i] - guess[i]) for i in range(3)]
        if max(abs(candidate[i] - guess[i]) for i in range(3)) <= 1e-8:
            return candidate
        guess = candidate
    raise RuntimeError('Independent forward-oracle inverse did not converge')
for case in inputs['cases']:
    step = next(s for s in case['steps'] if s['type'] == 'deformation')
    rows = []
    for location, epoch in zip(case['points'], case['epochs']):
        dt = step['targetEpoch'] - (epoch if step['sourceEpoch'] == 'coordinate' else step['sourceEpoch'])
        operation = f"+step {'+inv ' if step.get('inverse') else ''}+proj=deformation +ellps=GRS80 +grids={grid} +dt={dt}"
        if case['input']['space'] == 'geographic':
            operation = '+step +proj=cart +ellps=GRS80 ' + operation + ' +step +inv +proj=cart +ellps=GRS80'
            point = location
        else:
            point = list(cart.transform(*location[:3], errcheck=True)) + location[3:]
        transform = pyproj.Transformer.from_pipeline('+proj=pipeline ' + operation)
        # PROJ t and math.gl M are distinct. This operation uses explicit dt only.
        forward = list(transform.transform(*point[:3], errcheck=True)) + point[3:]
        inverse = list(transform.transform(*forward[:3], direction=TransformDirection.INVERSE, errcheck=True)) + point[3:]
        native_forward, native_inverse = forward, inverse
        deformation = pyproj.Transformer.from_pipeline(f'+proj=deformation +ellps=GRS80 +grids={grid} +dt={dt}')
        geographic = case['input']['space'] == 'geographic'
        def apply(value, reverse):
            xyz = list(cart.transform(*value[:3], errcheck=True)) if geographic else value[:3]
            result = solve(deformation, xyz) if reverse else list(deformation.transform(*xyz, errcheck=True))
            if geographic:
                result = list(cart.transform(*result, direction=TransformDirection.INVERSE, errcheck=True))
            return result + value[3:]
        forward = apply(point, bool(step.get('inverse')))
        inverse = apply(forward, not bool(step.get('inverse')))
        rows.append(dict(input=point, epoch=epoch, forward=forward, inverse=inverse,
                         projForward=native_forward, projInverse=native_inverse))
    reference['cases'].append(dict(id=case['id'], results=rows))
(root / 'deformation-reference.json').write_text(json.dumps(reference, indent=2) + '\n')
print('Generated', len(reference['cases']), 'deformation configurations')
